import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CartItemDto, ValidatedCartItemDto } from './dto/cart.dto';

/**
 * Service for managing shopping carts using Drizzle ORM.
 */
@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves user's cart, creating one if it doesn't exist.
   */
  async getUserCart(userId: string) {
    this.logger.log(`Getting cart for user ${userId}`);

    const cart = await this.db.query.carts.findFirst({
      where: eq(schema.carts.userId, userId),
      with: {
        items: {
          with: {
            product: {
              with: {
                variants: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      this.logger.log(`Cart not found for user ${userId}, creating new cart`);
      const [newCart] = await this.db
        .insert(schema.carts)
        .values({ userId })
        .returning();

      return { ...newCart, items: [] };
    }

    return cart;
  }

  /**
   * Replaces all items in user's cart.
   */
  async updateUserCart(userId: string, items: CartItemDto[]) {
    this.logger.log(
      `Updating cart for user ${userId} with ${items.length} items`,
    );

    return await this.db.transaction(async (tx) => {
      const cart = await this.getUserCart(userId);

      // Remove all existing items
      await tx
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cart.id));

      // Create new items
      if (items.length > 0) {
        await tx.insert(schema.cartItems).values(
          items.map((item) => ({
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          })),
        );
      }

      return await tx.query.carts.findFirst({
        where: eq(schema.carts.id, cart.id),
        with: {
          items: {
            with: {
              product: true,
              variant: true,
            },
          },
        },
      });
    });
  }

  /**
   * Adds a new item to cart or updates quantity.
   */
  async addOrUpdateItem(userId: string, itemDto: CartItemDto) {
    this.logger.log(`Adding/updating item in cart for user ${userId}`);

    return await this.db.transaction(async (tx) => {
      const cart = await this.getUserCart(userId);

      const existingItem = await tx.query.cartItems.findFirst({
        where: and(
          eq(schema.cartItems.cartId, cart.id),
          eq(schema.cartItems.productId, itemDto.productId),
          itemDto.variantId
            ? eq(schema.cartItems.variantId, itemDto.variantId)
            : sql`${schema.cartItems.variantId} IS NULL`,
        ),
      });

      if (existingItem) {
        await tx
          .update(schema.cartItems)
          .set({ quantity: existingItem.quantity + itemDto.quantity })
          .where(eq(schema.cartItems.id, existingItem.id));
      } else {
        await tx.insert(schema.cartItems).values({
          cartId: cart.id,
          productId: itemDto.productId,
          variantId: itemDto.variantId || null,
          quantity: itemDto.quantity,
        });
      }

      return await tx.query.carts.findFirst({
        where: eq(schema.carts.id, cart.id),
        with: {
          items: {
            with: {
              product: true,
              variant: true,
            },
          },
        },
      });
    });
  }

  /**
   * Removes a specific item from the cart.
   */
  async removeItem(userId: string, productId: string, variantId?: string) {
    this.logger.log(`Removing item from cart for user ${userId}`);

    return await this.db.transaction(async (tx) => {
      const cart = await this.getUserCart(userId);

      await tx
        .delete(schema.cartItems)
        .where(
          and(
            eq(schema.cartItems.cartId, cart.id),
            eq(schema.cartItems.productId, productId),
            variantId
              ? eq(schema.cartItems.variantId, variantId)
              : sql`${schema.cartItems.variantId} IS NULL`,
          ),
        );

      return await tx.query.carts.findFirst({
        where: eq(schema.carts.id, cart.id),
        with: {
          items: {
            with: {
              product: true,
              variant: true,
            },
          },
        },
      });
    });
  }

  /**
   * Removes all items from user's cart.
   */
  async clearUserCart(userId: string) {
    this.logger.log(`Clearing cart for user ${userId}`);

    const cart = await this.getUserCart(userId);
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.cartId, cart.id));
  }

  /**
   * Validates cart items against current product data.
   */
  async validateCartItems(
    items: CartItemDto[],
  ): Promise<ValidatedCartItemDto[]> {
    this.logger.log(`Validating ${items.length} cart items`);

    if (items.length === 0) return [];

    const productIds = items.map((i) => i.productId);
    const variantIds = items
      .map((i) => i.variantId)
      .filter(Boolean) as string[];

    const products = await this.db.query.products.findMany({
      where: inArray(schema.products.id, productIds),
      with: {
        variants: true,
      },
    });

    const variants =
      variantIds.length > 0
        ? await this.db.query.productVariants.findMany({
            where: inArray(schema.productVariants.id, variantIds),
          })
        : [];

    const validated: ValidatedCartItemDto[] = [];

    for (const item of items) {
      const validatedItem = new ValidatedCartItemDto();
      validatedItem.productId = item.productId;
      validatedItem.variantId = item.variantId;
      validatedItem.quantity = item.quantity;
      validatedItem.originalQuantity = item.quantity;
      validatedItem.quantityAdjusted = false;
      validatedItem.available = true;

      const product = products.find((p) => p.id === item.productId);

      if (!product || product.deletedAt) {
        validatedItem.available = false;
        validatedItem.productName = 'Product not found';
        validatedItem.price = 0;
        validatedItem.stockAvailable = 0;
        validated.push(validatedItem);
        continue;
      }

      validatedItem.productName = product.name;

      if (product.isShowcaseOnly || !product.isAvailable) {
        validatedItem.available = false;
      }

      let variant: any = null;
      if (item.variantId) {
        variant = variants.find((v) => v.id === item.variantId);
        if (!variant || variant.deletedAt) {
          validatedItem.available = false;
          validatedItem.variantName = 'Variant not found';
        } else {
          validatedItem.variantName = variant.name;
        }
      }

      if (validatedItem.available) {
        validatedItem.price = variant
          ? parseFloat(variant.price)
          : product.variants?.[0]
            ? parseFloat(product.variants[0].price)
            : 0;

        if (variant) {
          validatedItem.stockAvailable = variant.stock;
        } else {
          validatedItem.stockAvailable =
            product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
        }

        const targetVariant = variant || product.variants?.[0];
        validatedItem.imageUrl =
          targetVariant?.image || targetVariant?.images?.[0] || undefined;

        if (item.quantity > validatedItem.stockAvailable) {
          validatedItem.quantity = validatedItem.stockAvailable;
          validatedItem.quantityAdjusted = true;
        }

        if (
          product.maxOrderQuantity &&
          item.quantity > product.maxOrderQuantity
        ) {
          const maxAllowed = Math.min(
            validatedItem.stockAvailable,
            product.maxOrderQuantity,
          );
          if (validatedItem.quantity > maxAllowed) {
            validatedItem.quantity = maxAllowed;
            validatedItem.quantityAdjusted = true;
          }
        }

        if (validatedItem.stockAvailable === 0) {
          validatedItem.available = false;
        }
      } else {
        validatedItem.price = 0;
        validatedItem.stockAvailable = 0;
      }

      validated.push(validatedItem);
    }

    return validated;
  }

  /**
   * Merges guest cart items into user's cart.
   */
  async mergeGuestCart(userId: string, guestCart: CartItemDto[]) {
    this.logger.log(`Merging guest cart for user ${userId}`);

    for (const guestItem of guestCart) {
      await this.addOrUpdateItem(userId, guestItem);
    }

    return await this.getUserCart(userId);
  }

  /**
   * Converts Cart entity to simple DTO array.
   */
  cartToDto(cart: any): CartItemDto[] {
    return cart.items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
  }
}
