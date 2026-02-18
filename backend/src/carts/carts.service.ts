import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartItemDto, ValidatedCartItemDto } from './dto/cart.dto';

/**
 * Service for managing shopping carts.
 * 
 * Handles cart operations including:
 * - Cart creation and retrieval (auto-create if not exists)
 * - Adding/updating/removing cart items
 * - Cart validation against current product data
 * - Guest cart merging with user cart after login
 * - Stock availability checking
 * 
 * @remarks
 * - Supports both products and product variants
 * - Auto-creates cart on first access
 * - Validates quantities against stock availability
 * - Handles max order quantity limits
 * - Merges guest carts with user carts on login
 * 
 * @example
 * ```typescript
 * const cart = await cartsService.getUserCart(userId);
 * await cartsService.addOrUpdateItem(userId, {
 *   productId: 'prod_123',
 *   quantity: 2
 * });
 * const validated = await cartsService.validateCartItems(cart.items);
 * ```
 * 
 * TODO: Add cart expiration/cleanup for abandoned carts
 * TODO: Add cart total calculation with tax
 * TODO: Add coupon application
 * TODO: Add cart sharing functionality
 * TODO: Add wishlist integration
 * TODO: Add cart analytics (abandonment tracking)
 * TODO: Add saved for later functionality
 * TODO: Add cart notifications (price drops, back in stock)
 * TODO: Add cart size limits
 */
@Injectable()
export class CartsService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(CartsService.name);

    /**
     * Initializes the carts service with required dependencies
     * 
     * @param cartRepo - Repository for Cart entity
     * @param cartItemRepo - Repository for CartItem entity
     * @param productRepo - Repository for Product entity
     * @param variantRepo - Repository for ProductVariant entity
     * @param dataSource - TypeORM DataSource for transaction management
     */
    constructor(
        @InjectRepository(Cart)
        private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepo: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant)
        private variantRepo: Repository<ProductVariant>,
        private dataSource: DataSource,
    ) { }

    /**
     * Retrieves user's cart, creating one if it doesn't exist.
     * 
     * Auto-creates cart with empty items array on first access.
     * 
     * @param userId - User ID
     * @returns Promise resolving to Cart entity with items and relations
     * 
     * @example
     * ```typescript
     * const cart = await cartsService.getUserCart('user_123');
     * console.log(cart.items.length); // Number of items in cart
     * ```
     * 
     * FIXME: Race condition - concurrent requests can create duplicate carts
     * FIXME: No caching - every request hits database
     * 
     * TODO: Add race condition protection (upsert pattern)
     * TODO: Add caching layer (Redis) for cart data
     * TODO: Add cart expiration timestamp
     * TODO: Add last updated timestamp
     * TODO: Return computed totals (subtotal, tax, total)
     * TODO: Add cart item count to response
     * TODO: Add validation status flag
     * TODO: Clean up old/expired carts
     */
    async getUserCart(userId: string): Promise<Cart> {
        this.logger.log(`Getting cart for user ${userId}`);

        // FIXME: Race condition - two concurrent requests can both create carts
        let cart = await this.cartRepo.findOne({
            where: { userId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!cart) {
            this.logger.log(`Cart not found for user ${userId}, creating new cart`);
            // TODO: Use upsert to prevent race condition
            cart = this.cartRepo.create({ userId, items: [] });
            await this.cartRepo.save(cart);
        }

        this.logger.debug(`Retrieved cart with ${cart.items.length} items for user ${userId}`);
        // TODO: Cache the cart
        return cart;
    }

    /**
     * Replaces all items in user's cart with new items.
     * 
     * Removes all existing items and creates new ones.
     * Used for syncing frontend cart state with backend.
     * 
     * @param userId - User ID
     * @param items - Array of cart items to set
     * @returns Promise resolving to updated Cart entity
     * 
     * @example
     * ```typescript
     * const updated = await cartsService.updateUserCart('user_123', [
     *   { productId: 'prod_1', quantity: 2 },
     *   { productId: 'prod_2', variantId: 'var_1', quantity: 1 }
     * ]);
     * ```
     * 
     * FIXME: No transaction - removal and creation are separate operations
     * FIXME: No validation that products exist
     * FIXME: No stock validation
     * FIXME: No authorization check
     * FIXME: Can set quantity to 0 or negative
     * 
     * TODO: Wrap in transaction for atomicity
     * TODO: Validate products/variants exist before saving
     * TODO: Validate stock availability
     * TODO: Add quantity validation (positive, within limits)
     * TODO: Add authorization check (user can only update their cart)
     * TODO: Clear cache after update
     * TODO: Emit CartUpdatedEvent
     * TODO: Add max cart size validation
     * TODO: Validate against max order quantities
     */
    async updateUserCart(userId: string, items: CartItemDto[]): Promise<Cart> {
        this.logger.log(`Updating cart for user ${userId} with ${items.length} items`);

        // FIXME: No transaction - not atomic
        // TODO: Wrap in transaction
        const cart = await this.getUserCart(userId);

        // Remove all existing items
        if (cart.items.length > 0) {
            this.logger.debug(`Removing ${cart.items.length} existing items`);
            await this.cartItemRepo.remove(cart.items);
        }

        // TODO: Validate products exist and are available
        // TODO: Validate stock availability
        // TODO: Validate quantities are positive

        // Create new items
        const newItems = items.map(item => {
            // FIXME: No validation of productId or variantId
            const cartItem = this.cartItemRepo.create({
                cart,
                productId: item.productId,
                variantId: item.variantId ?? undefined,
                quantity: item.quantity,
            });
            return cartItem;
        });

        cart.items = await this.cartItemRepo.save(newItems);
        const saved = await this.cartRepo.save(cart);

        this.logger.log(`Cart updated successfully for user ${userId}`);
        // TODO: Clear cache
        // TODO: Emit CartUpdatedEvent
        return saved;
    }

    /**
     * Adds a new item to cart or updates quantity if item exists.
     * 
     * If item (product + variant combo) already exists, adds to existing quantity.
     * Otherwise creates new cart item.
     * 
     * @param userId - User ID
     * @param itemDto - Cart item to add/update
     * @returns Promise resolving to updated Cart entity
     * 
     * @example
     * ```typescript
     * // Add 2 items
     * await cartsService.addOrUpdateItem('user_123', {
     *   productId: 'prod_1',
     *   quantity: 2
     * });
     * 
     * // Add 1 more (now total is 3)
     * await cartsService.addOrUpdateItem('user_123', {
     *   productId: 'prod_1',
     *   quantity: 1
     * });
     * ```
     * 
     * FIXME: No transaction - find and update are separate operations
     * FIXME: No validation that product exists
     * FIXME: No stock validation
     * FIXME: Sum can exceed stock availability
     * FIXME: Sum can exceed max order quantity
     * FIXME: Race condition - concurrent adds can create duplicates
     * 
     * TODO: Wrap in transaction with locking
     * TODO: Validate product/variant exists
     * TODO: Validate stock availability
     * TODO: Validate quantity doesn't exceed stock after sum
     * TODO: Validate quantity doesn't exceed max order quantity
     * TODO: Add race condition protection
     * TODO: Clear cache after update
     * TODO: Emit ItemAddedEvent
     * TODO: Add quantity validation (positive numbers only)
     * TODO: Add max cart size validation
     */
    async addOrUpdateItem(userId: string, itemDto: CartItemDto): Promise<Cart> {
        this.logger.log(`Adding/updating item in cart for user ${userId}: product=${itemDto.productId}, variant=${itemDto.variantId}, quantity=${itemDto.quantity}`);

        // FIXME: No transaction - race condition possible
        const cart = await this.getUserCart(userId);

        // Check if item already exists
        const existingItem = cart.items.find(
            item => item.productId === itemDto.productId &&
                (item.variantId || null) === (itemDto.variantId || null)
        );

        if (existingItem) {
            // Update quantity (sum)
            // FIXME: No validation that sum doesn't exceed stock or max order quantity
            const newQuantity = existingItem.quantity + itemDto.quantity;
            this.logger.debug(`Item exists, updating quantity from ${existingItem.quantity} to ${newQuantity}`);
            existingItem.quantity = newQuantity;
            await this.cartItemRepo.save(existingItem);
        } else {
            // Create new item
            // FIXME: No validation that product exists
            this.logger.debug('Creating new cart item');
            const newItem = this.cartItemRepo.create({
                cart,
                productId: itemDto.productId,
                variantId: itemDto.variantId ?? undefined,
                quantity: itemDto.quantity,
            });
            await this.cartItemRepo.save(newItem);
        }

        this.logger.log(`Item added/updated successfully for user ${userId}`);
        // TODO: Clear cache
        // TODO: Emit ItemAddedEvent
        return this.getUserCart(userId);
    }

    /**
     * Removes a specific item from the cart.
     * 
     * Identifies item by product ID and optional variant ID.
     * 
     * @param userId - User ID
     * @param productId - Product ID to remove
     * @param variantId - Optional variant ID
     * @returns Promise resolving to updated Cart entity
     * 
     * @example
     * ```typescript
     * // Remove product without variant
     * await cartsService.removeItem('user_123', 'prod_1');
     * 
     * // Remove specific variant
     * await cartsService.removeItem('user_123', 'prod_2', 'var_1');
     * ```
     * 
     * FIXME: No authorization check
     * FIXME: Silent success if item doesn't exist
     * 
     * TODO: Add authorization check (user can only remove from their cart)
     * TODO: Return boolean indicating if item was found and removed
     * TODO: Throw error if item not found (or add flag for behavior)
     * TODO: Clear cache after removal
     * TODO: Emit ItemRemovedEvent
     * TODO: Add audit logging
     */
    async removeItem(userId: string, productId: string, variantId?: string): Promise<Cart> {
        this.logger.log(`Removing item from cart for user ${userId}: product=${productId}, variant=${variantId}`);

        const cart = await this.getUserCart(userId);

        const itemToRemove = cart.items.find(
            item => item.productId === productId &&
                (item.variantId || null) === (variantId || null)
        );

        if (itemToRemove) {
            this.logger.debug(`Item found, removing: ${itemToRemove.id}`);
            await this.cartItemRepo.remove(itemToRemove);
        } else {
            // FIXME: Silent failure - no indication item wasn't found
            this.logger.warn(`Item not found in cart for removal: product=${productId}, variant=${variantId}`);
        }

        this.logger.log(`Item removal completed for user ${userId}`);
        // TODO: Clear cache
        // TODO: Emit ItemRemovedEvent
        return this.getUserCart(userId);
    }

    /**
     * Removes all items from user's cart.
     * 
     * @param userId - User ID
     * 
     * @example
     * ```typescript
     * await cartsService.clearUserCart('user_123');
     * ```
     * 
     * FIXME: No authorization check
     * FIXME: Doesn't delete the cart itself, just items
     * 
     * TODO: Add authorization check
     * TODO: Consider deleting cart entity as well
     * TODO: Clear cache after clearing
     * TODO: Emit CartClearedEvent
     * TODO: Add confirmation for large carts
     * TODO: Add audit logging
     * TODO: Return success indicator
     */
    async clearUserCart(userId: string): Promise<void> {
        this.logger.log(`Clearing cart for user ${userId}`);

        const cart = await this.getUserCart(userId);

        if (cart.items.length > 0) {
            this.logger.debug(`Removing ${cart.items.length} items from cart`);
            await this.cartItemRepo.remove(cart.items);
        } else {
            this.logger.debug('Cart already empty');
        }

        this.logger.log(`Cart cleared successfully for user ${userId}`);
        // TODO: Clear cache
        // TODO: Emit CartClearedEvent
    }

    /**
     * Validates cart items against current product data.
     * 
     * Checks for each item:
     * - Product exists and is available
     * - Variant exists (if specified)
     * - Stock availability
     * - Quantity limits (max order quantity)
     * - Adjusts quantities if they exceed limits
     * 
     * @param items - Array of cart items to validate
     * @returns Promise resolving to array of validated cart items with details
     * 
     * @example
     * ```typescript
     * const validated = await cartsService.validateCartItems([
     *   { productId: 'prod_1', quantity: 5 },
     *   { productId: 'prod_2', variantId: 'var_1', quantity: 10 }
     * ]);
     * 
     * validated.forEach(item => {
     *   if (!item.available) console.log(`${item.productName} unavailable`);
     *   if (item.quantityAdjusted) console.log(`Quantity adjusted from ${item.originalQuantity} to ${item.quantity}`);
     * });
     * ```
     * 
     * FIXME: N+1 query problem - fetches each product individually in loop
     * FIXME: Fetches variant separately even though product has variants relation
     * FIXME: No caching - repeated validation hits database
     * FIXME: Complex image logic could be simplified
     * FIXME: Returns 0 price for unavailable items (could be misleading)
     * 
     * TODO: Optimize to fetch all products/variants in single query
     * TODO: Add caching for product/variant data
     * TODO: Simplify image selection logic
     * TODO: Return last known price even for unavailable items
     * TODO: Add discount/sale price handling
     * TODO: Add tax calculation
     * TODO: Add estimated delivery time
     * TODO: Batch validation for better performance
     * TODO: Add validation for product changes (price, availability)
     * TODO: Return reasons for unavailability
     * TODO: Add warning for items about to go out of stock
     */
    async validateCartItems(items: CartItemDto[]): Promise<ValidatedCartItemDto[]> {
        this.logger.log(`Validating ${items.length} cart items`);

        const validated: ValidatedCartItemDto[] = [];

        // FIXME: N+1 query problem - should fetch all products in single query
        // TODO: Optimize to fetch all products at once
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
                this.logger.warn(`Product not found: ${item.productId}`);
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
                this.logger.debug(`Product unavailable: ${product.name}`);
                validatedItem.available = false;
            }

            // Handle variant
            let variant: ProductVariant | null = null;
            if (item.variantId) {
                // FIXME: Fetches variant separately even though product.variants is loaded
                // TODO: Use product.variants.find() instead of separate query
                variant = await this.variantRepo.findOne({
                    where: { id: item.variantId },
                });

                if (!variant) {
                    this.logger.warn(`Variant not found: ${item.variantId}`);
                    validatedItem.available = false;
                    validatedItem.variantName = 'Variant not found';
                } else {
                    validatedItem.variantName = variant.name;
                }
            }

            // Determine price and stock
            if (validatedItem.available) {
                validatedItem.price = variant ? variant.price : product.price;

                // Use selected variant stock, or sum of all variants if none selected
                if (variant) {
                    validatedItem.stockAvailable = variant.stock;
                } else {
                    validatedItem.stockAvailable = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                }

                // Get image URL (variant image or first product image)
                // FIXME: Complex nested conditions - could be simplified
                // TODO: Simplify image selection logic
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
                    this.logger.debug(`Quantity ${item.quantity} exceeds stock ${validatedItem.stockAvailable}, adjusting`);
                    validatedItem.quantity = validatedItem.stockAvailable;
                    validatedItem.quantityAdjusted = true;
                }

                // Check max order quantity
                if (product.maxOrderQuantity && item.quantity > product.maxOrderQuantity) {
                    const maxAllowed = Math.min(validatedItem.stockAvailable, product.maxOrderQuantity);
                    if (validatedItem.quantity > maxAllowed) {
                        this.logger.debug(`Quantity exceeds max order quantity ${product.maxOrderQuantity}, adjusting to ${maxAllowed}`);
                        validatedItem.quantity = maxAllowed;
                        validatedItem.quantityAdjusted = true;
                    }
                }

                // If stock is 0, mark as unavailable
                if (validatedItem.stockAvailable === 0) {
                    this.logger.debug(`Product out of stock: ${product.name}`);
                    validatedItem.available = false;
                }
            } else {
                // FIXME: Setting price to 0 for unavailable items might be misleading
                validatedItem.price = 0;
                validatedItem.stockAvailable = 0;
            }

            validated.push(validatedItem);
        }

        this.logger.log(`Validation complete: ${validated.filter(v => v.available).length}/${validated.length} items available`);
        return validated;
    }

    /**
     * Merges guest cart items into user's cart after login.
     * 
     * For each guest item:
     * - If item exists in user cart, adds quantities together
     * - If item doesn't exist, adds it to user cart
     * 
     * @param userId - User ID (logged in user)
     * @param guestCart - Array of guest cart items to merge
     * @returns Promise resolving to merged Cart entity
     * 
     * @example
     * ```typescript
     * // User logs in with guest cart
     * const mergedCart = await cartsService.mergeGuestCart('user_123', [
     *   { productId: 'prod_1', quantity: 2 },
     *   { productId: 'prod_2', quantity: 1 }
     * ]);
     * ```
     * 
     * FIXME: No transaction - multiple saves not atomic
     * FIXME: No validation of guest cart items
     * FIXME: Can exceed stock limits after merge
     * FIXME: Can exceed max order quantity after merge
     * FIXME: Race condition if user adds items while merge is happening
     * 
     * TODO: Wrap in transaction for atomicity
     * TODO: Validate guest cart items exist and are available
     * TODO: Validate merged quantities don't exceed stock
     * TODO: Validate merged quantities don't exceed max order quantity
     * TODO: Add race condition protection
     * TODO: Clear cache after merge
     * TODO: Emit CartMergedEvent
     * TODO: Add conflict resolution strategy (keep newer, keep larger, etc.)
     * TODO: Return merge report (items added, quantities adjusted)
     * TODO: Add max cart size validation after merge
     */
    async mergeGuestCart(userId: string, guestCart: CartItemDto[]): Promise<Cart> {
        this.logger.log(`Merging guest cart with ${guestCart.length} items into cart for user ${userId}`);

        // FIXME: No transaction - multiple saves not atomic
        // TODO: Wrap in transaction
        const userCart = await this.getUserCart(userId);

        // TODO: Validate guest cart items
        for (const guestItem of guestCart) {
            // Check if item exists in user cart
            const existingItem = userCart.items.find(
                item => item.productId === guestItem.productId &&
                    (item.variantId || null) === (guestItem.variantId || null)
            );

            if (existingItem) {
                // Sum quantities (will be validated later)
                // FIXME: Can exceed stock or max order quantity
                const newQuantity = existingItem.quantity + guestItem.quantity;
                this.logger.debug(`Merging item: existing quantity ${existingItem.quantity} + guest quantity ${guestItem.quantity} = ${newQuantity}`);
                existingItem.quantity = newQuantity;
                await this.cartItemRepo.save(existingItem);
            } else {
                // Add new item
                this.logger.debug(`Adding new item from guest cart: product=${guestItem.productId}`);
                const newItem = this.cartItemRepo.create({
                    cart: userCart,
                    productId: guestItem.productId,
                    variantId: guestItem.variantId ?? undefined,
                    quantity: guestItem.quantity,
                });
                await this.cartItemRepo.save(newItem);
            }
        }

        this.logger.log(`Guest cart merged successfully for user ${userId}`);
        // TODO: Clear cache
        // TODO: Emit CartMergedEvent
        return this.getUserCart(userId);
    }

    /**
     * Converts Cart entity to simple DTO array for API responses.
     * 
     * @param cart - Cart entity with items
     * @returns Array of CartItemDto objects
     * 
     * @example
     * ```typescript
     * const cart = await cartsService.getUserCart('user_123');
     * const dtoArray = cartsService.cartToDto(cart);
     * // Returns: [{ productId, variantId, quantity }, ...]
     * ```
     * 
     * TODO: Add total calculation to response
     * TODO: Add validation status to response
     * TODO: Include product names and images in response
     * TODO: Add computed fields (item subtotal, etc.)
     */
    cartToDto(cart: Cart): CartItemDto[] {
        this.logger.debug(`Converting cart to DTO for ${cart.items.length} items`);
        return cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        }));
    }
}
