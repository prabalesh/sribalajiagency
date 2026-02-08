import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartItemDto, ValidatedCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartsService {
    constructor(
        @InjectRepository(Cart)
        private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepo: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant)
        private variantRepo: Repository<ProductVariant>,
    ) { }

    // Get user's cart (create if doesn't exist)
    async getUserCart(userId: string): Promise<Cart> {
        let cart = await this.cartRepo.findOne({
            where: { userId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!cart) {
            cart = this.cartRepo.create({ userId, items: [] });
            await this.cartRepo.save(cart);
        }

        return cart;
    }

    // Update entire cart (replace all items)
    async updateUserCart(userId: string, items: CartItemDto[]): Promise<Cart> {
        const cart = await this.getUserCart(userId);

        // Remove all existing items
        if (cart.items.length > 0) {
            await this.cartItemRepo.remove(cart.items);
        }

        // Create new items
        const newItems = items.map(item => {
            const cartItem = this.cartItemRepo.create({
                cart,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
            });
            return cartItem;
        });

        cart.items = await this.cartItemRepo.save(newItems);
        return this.cartRepo.save(cart);
    }

    // Add or update a single item
    async addOrUpdateItem(userId: string, itemDto: CartItemDto): Promise<Cart> {
        const cart = await this.getUserCart(userId);

        // Check if item already exists
        const existingItem = cart.items.find(
            item => item.productId === itemDto.productId &&
                (item.variantId || null) === (itemDto.variantId || null)
        );

        if (existingItem) {
            // Update quantity (sum)
            existingItem.quantity += itemDto.quantity;
            await this.cartItemRepo.save(existingItem);
        } else {
            // Create new item
            const newItem = this.cartItemRepo.create({
                cart,
                productId: itemDto.productId,
                variantId: itemDto.variantId,
                quantity: itemDto.quantity,
            });
            await this.cartItemRepo.save(newItem);
        }

        return this.getUserCart(userId);
    }

    // Remove specific item
    async removeItem(userId: string, productId: string, variantId?: string): Promise<Cart> {
        const cart = await this.getUserCart(userId);

        const itemToRemove = cart.items.find(
            item => item.productId === productId &&
                (item.variantId || null) === (variantId || null)
        );

        if (itemToRemove) {
            await this.cartItemRepo.remove(itemToRemove);
        }

        return this.getUserCart(userId);
    }

    // Clear all items from cart
    async clearUserCart(userId: string): Promise<void> {
        const cart = await this.getUserCart(userId);

        if (cart.items.length > 0) {
            await this.cartItemRepo.remove(cart.items);
        }
    }

    // Validate cart items against database
    async validateCartItems(items: CartItemDto[]): Promise<ValidatedCartItemDto[]> {
        const validated: ValidatedCartItemDto[] = [];

        for (const item of items) {
            const validatedItem = new ValidatedCartItemDto();
            validatedItem.productId = item.productId;
            validatedItem.variantId = item.variantId;
            validatedItem.quantity = item.quantity;
            validatedItem.originalQuantity = item.quantity;
            validatedItem.quantityAdjusted = false;
            validatedItem.available = true;

            // Fetch product
            const product = await this.productRepo.findOne({
                where: { id: item.productId },
                relations: ['variants'],
            });

            if (!product) {
                validatedItem.available = false;
                validatedItem.productName = 'Product not found';
                validatedItem.price = 0;
                validatedItem.stockAvailable = 0;
                validated.push(validatedItem);
                continue;
            }

            validatedItem.productName = product.name;

            // Check if product is available
            if (product.isShowcaseOnly || !product.isAvailable) {
                validatedItem.available = false;
            }

            // Handle variant
            let variant: ProductVariant | null = null;
            if (item.variantId) {
                variant = await this.variantRepo.findOne({
                    where: { id: item.variantId },
                });

                if (!variant) {
                    validatedItem.available = false;
                    validatedItem.variantName = 'Variant not found';
                } else {
                    validatedItem.variantName = variant.name;
                }
            }

            // Determine price and stock
            if (validatedItem.available) {
                validatedItem.price = variant ? variant.price : product.price;
                validatedItem.stockAvailable = variant ? variant.stock : product.stock;

                // Get image URL (variant image or first product image)
                if (variant && variant.image) {
                    validatedItem.imageUrl = variant.image;
                } else if (variant && variant.images && variant.images.length > 0) {
                    validatedItem.imageUrl = variant.images[0];
                } else if (product.images && product.images.length > 0) {
                    validatedItem.imageUrl = product.images[0].url;
                } else {
                    validatedItem.imageUrl = undefined;
                }

                // Check and adjust quantity if exceeds stock
                if (item.quantity > validatedItem.stockAvailable) {
                    validatedItem.quantity = validatedItem.stockAvailable;
                    validatedItem.quantityAdjusted = true;
                }

                // Check max order quantity
                if (product.maxOrderQuantity && item.quantity > product.maxOrderQuantity) {
                    const maxAllowed = Math.min(validatedItem.stockAvailable, product.maxOrderQuantity);
                    if (validatedItem.quantity > maxAllowed) {
                        validatedItem.quantity = maxAllowed;
                        validatedItem.quantityAdjusted = true;
                    }
                }

                // If stock is 0, mark as unavailable
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

    // Merge guest cart with user cart
    async mergeGuestCart(userId: string, guestCart: CartItemDto[]): Promise<Cart> {
        const userCart = await this.getUserCart(userId);

        for (const guestItem of guestCart) {
            // Check if item exists in user cart
            const existingItem = userCart.items.find(
                item => item.productId === guestItem.productId &&
                    (item.variantId || null) === (guestItem.variantId || null)
            );

            if (existingItem) {
                // Sum quantities (will be validated later)
                existingItem.quantity += guestItem.quantity;
                await this.cartItemRepo.save(existingItem);
            } else {
                // Add new item
                const newItem = this.cartItemRepo.create({
                    cart: userCart,
                    productId: guestItem.productId,
                    variantId: guestItem.variantId,
                    quantity: guestItem.quantity,
                });
                await this.cartItemRepo.save(newItem);
            }
        }

        return this.getUserCart(userId);
    }

    // Convert cart to CartItemDto array (for API responses)
    cartToDto(cart: Cart): CartItemDto[] {
        return cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        }));
    }
}
