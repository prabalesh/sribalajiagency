import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

/**
 * Service for managing e-commerce orders.
 * 
 * Handles complete order lifecycle:
 * - Order creation with tax calculation (GST/CGST/SGST/IGST)
 * - Order retrieval with filtering and pagination
 * - Order status management with history tracking
 * - Queue-based order management for fulfillment workflow
 * 
 * @remarks
 * - Automatically calculates Indian GST taxes based on delivery state
 * - Maintains complete status change history with audit trail
 * - Supports both intra-state (CGST+SGST) and inter-state (IGST) taxation
 * - Provides queue-based views for order processing workflow
 * 
 * @example
 * ```typescript
 * const order = await ordersService.create(userId, createOrderDto);
 * const orders = await ordersService.findAllByUser(userId, 1, 20);
 * await ordersService.updateStatus(orderId, { status: 'Confirmed' }, adminId);
 * ```
 * 
 * TODO: Add transaction support for order creation
 * TODO: Add payment integration (Razorpay/Stripe)
 * TODO: Add inventory management/stock deduction
 * TODO: Add order cancellation workflow
 * TODO: Add refund management
 * TODO: Add order invoice generation (PDF)
 * TODO: Add email/SMS notifications for order events
 * TODO: Add order analytics and reporting
 * TODO: Add coupon/discount code support
 * TODO: Add shipping cost calculation
 * TODO: Add order tracking integration
 * TODO: Add fraud detection
 */
@Injectable()
export class OrdersService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(OrdersService.name);

    /**
     * Initializes the orders service with required dependencies
     * 
     * @param orderRepo - Repository for Order entity
     * @param orderItemRepo - Repository for OrderItem entity
     * @param statusHistoryRepo - Repository for OrderStatusHistory entity
     * @param productRepo - Repository for Product entity
     * @param categoryRepo - Repository for Category entity (used for tax calculation)
     * @param variantRepo - Repository for ProductVariant entity
     * @param dataSource - TypeORM DataSource for transaction management
     */
    constructor(
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(OrderStatusHistory)
        private statusHistoryRepo: Repository<OrderStatusHistory>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(ProductVariant)
        private variantRepo: Repository<ProductVariant>,
        private dataSource: DataSource,
    ) { }

    /**
     * Creates a new order with automatic tax calculation.
     * 
     * Process:
     * 1. Calculates GST taxes based on delivery state
     * 2. Creates order with calculated totals
     * 3. Creates order items
     * 4. Creates initial status history entry
     * 
     * @param userId - ID of the user placing the order
     * @param createOrderDto - Order creation data including items and delivery info
     * @returns Promise resolving to created Order entity with all relations
     * 
     * @example
     * ```typescript
     * const order = await ordersService.create('user_123', {
     *   items: [
     *     { productId: 'prod_1', quantity: 2, price: 1000 },
     *     { productId: 'prod_2', variantId: 'var_1', quantity: 1, price: 500 }
     *   ],
     *   deliveryState: 'Tamil Nadu',
     *   deliveryAddress: '123 Main St, Chennai',
     *   deliveryPhone: '+919876543210',
     *   paymentMethod: 'COD'
     * });
     * ```
     * 
     * FIXME: No transaction support - order creation can fail partially
     * FIXME: No stock validation - can create order for out-of-stock products
     * FIXME: No payment verification - COD/online payment not handled
     * FIXME: Race condition - concurrent orders can oversell stock
     * FIXME: No product existence validation before creating order items
     * FIXME: Price in DTO might not match actual product price (security issue)
     * 
     * TODO: Wrap entire operation in transaction (order + items + history + stock deduction)
     * TODO: Validate product/variant existence and availability
     * TODO: Verify prices match current product prices (prevent manipulation)
     * TODO: Check stock availability before order creation
     * TODO: Deduct stock quantities atomically
     * TODO: Integrate payment gateway (Razorpay/Stripe)
     * TODO: Add order number generation (human-readable format)
     * TODO: Add minimum order amount validation
     * TODO: Apply coupon/discount codes
     * TODO: Calculate and add shipping charges
     * TODO: Validate delivery address completeness
     * TODO: Emit OrderCreatedEvent for notifications
     * TODO: Send order confirmation email/SMS
     * TODO: Add order creation rate limiting per user
     * TODO: Add fraud detection checks
     * TODO: Generate and attach invoice PDF
     */
    async create(userId: string, createOrderDto: CreateOrderDto) {
        this.logger.log(`Creating order for user ${userId} with ${createOrderDto.items.length} items`);

        return await this.dataSource.transaction(async (manager) => {
            // Calculate taxes (now effectively zero)
            const taxResults = await this.calculateTax(
                createOrderDto.items.map(i => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantity
                })),
                createOrderDto.deliveryState
            );

            this.logger.debug(`Tax calculation complete: subtotal=${taxResults.subtotal}, tax=${taxResults.totalTax}`);

            const orderItems: OrderItem[] = [];

            // Process items and deduct stock
            for (const item of createOrderDto.items) {
                // Find and lock variant for update to prevent race conditions
                const variant = await manager.findOne(ProductVariant, {
                    where: { id: item.variantId },
                    lock: { mode: 'pessimistic_write' }
                });

                if (!variant) {
                    throw new BadRequestException(`Variant ${item.variantId} not found`);
                }

                if (variant.stock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${item.productName}. Available: ${variant.stock}, Requested: ${item.quantity}`);
                }

                // Deduct stock
                variant.stock -= item.quantity;
                await manager.save(ProductVariant, variant);

                // Create order item
                const orderItem = manager.create(OrderItem, {
                    product: { id: item.productId },
                    variant: { id: item.variantId },
                    productName: item.productName,
                    variantName: item.variantName,
                    price: item.price,
                    quantity: item.quantity,
                });
                orderItems.push(orderItem);
            }

            // Create order
            const order = manager.create(Order, {
                user: { id: userId },
                items: orderItems,
                totalAmount: taxResults.grandTotal,
                taxAmount: taxResults.totalTax,
                taxDetails: taxResults.breakdown,
                status: 'Pending',
                paymentMethod: createOrderDto.paymentMethod,
                deliveryAddress: createOrderDto.deliveryAddress,
                deliveryPhone: createOrderDto.deliveryPhone,
                deliveryNotes: createOrderDto.deliveryNotes,
            });

            const savedOrder = await manager.save(Order, order);
            this.logger.log(`Order created with ID: ${savedOrder.id}`);

            // Create initial status history entry
            const statusHistory = manager.create(OrderStatusHistory, {
                order: savedOrder,
                status: 'Pending',
                message: 'Order placed successfully',
                changedBy: { id: userId },
            });
            await manager.save(OrderStatusHistory, statusHistory);

            return savedOrder;
        });
    }

    /**
     * Retrieves paginated orders for a specific user.
     * 
     * Returns user's order history with optional status filtering.
     * 
     * @param userId - ID of the user
     * @param page - Page number (1-indexed, default: 1)
     * @param limit - Items per page (default: 20, max: 50)
     * @param status - Optional status filter
     * @returns Promise resolving to paginated order results
     * 
     * @example
     * ```typescript
     * // Get all orders
     * const allOrders = await ordersService.findAllByUser('user_123', 1, 20);
     * 
     * // Get only pending orders
     * const pending = await ordersService.findAllByUser('user_123', 1, 10, 'Pending');
     * ```
     * 
     * TODO: Add date range filtering
     * TODO: Add search by order number
     * TODO: Add amount range filtering
     * TODO: Cache frequently accessed orders
     * TODO: Add order count by status for UI
     * TODO: Optimize relations loading (select only needed fields)
     * TODO: Add delivery status tracking info
     * TODO: Add reorder functionality
     */
    async findAllByUser(userId: string, page: number = 1, limit: number = 20, status?: OrderStatus) {
        this.logger.log(`Finding orders for user ${userId}, page=${page}, limit=${limit}, status=${status}`);

        // Cap limit to prevent performance issues
        if (limit > 50) {
            this.logger.warn(`Limit ${limit} exceeds maximum, capping to 50`);
            limit = 50;
        }

        // TODO: Validate page and limit are positive integers
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = { user: { id: userId } };
        if (status) {
            where.status = status;
        }

        // TODO: Add query performance monitoring
        const [items, total] = await this.orderRepo.findAndCount({
            where,
            relations: ['items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        this.logger.log(`Found ${total} orders for user ${userId}`);

        // TODO: Transform response to exclude sensitive data (e.g., other users' info in statusHistory)
        return { items, total, page, limit };
    }

    /**
     * Retrieves paginated orders for admin view (all users).
     * 
     * Admin-only endpoint to view all orders across all users.
     * 
     * @param page - Page number (1-indexed, default: 1)
     * @param limit - Items per page (default: 20, max: 50)
     * @returns Promise resolving to paginated order results
     * 
     * @example
     * ```typescript
     * const orders = await ordersService.findAll(1, 20);
     * ```
     * 
     * TODO: Add filtering by user, status, date range
     * TODO: Add search by order number, user name, phone
     * TODO: Add sorting options (date, amount, status)
     * TODO: Add export functionality (CSV/Excel)
     * TODO: Add order statistics/analytics
     * TODO: Add amount range filtering
     * TODO: Cache for dashboard view
     * TODO: Optimize query performance with indexes
     */
    async findAll(page: number = 1, limit: number = 20) {
        this.logger.log(`Finding all orders, page=${page}, limit=${limit}`);

        if (limit > 50) {
            this.logger.warn(`Limit ${limit} exceeds maximum, capping to 50`);
            limit = 50;
        }

        const skip = (page - 1) * limit;

        // TODO: Add filtering capabilities
        const [items, total] = await this.orderRepo.findAndCount({
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        this.logger.log(`Found ${total} total orders`);

        // TODO: Transform to exclude sensitive user data
        return { items, total, page, limit };
    }

    /**
     * Retrieves orders by processing queue.
     * 
     * Provides queue-based views for order fulfillment workflow:
     * - 'orders' queue: Pending → Confirmed → Packaging
     * - 'delivery' queue: Dispatched orders
     * 
     * @param queueType - Type of queue ('orders' or 'delivery')
     * @param page - Page number (1-indexed, default: 1)
     * @param limit - Items per page (default: 20, max: 50)
     * @returns Promise resolving to paginated order results for the queue
     * 
     * @example
     * ```typescript
     * // Get orders queue (for packing team)
     * const packingOrders = await ordersService.getOrdersByQueue('orders', 1, 20);
     * 
     * // Get delivery queue (for delivery team)
     * const deliveries = await ordersService.getOrdersByQueue('delivery', 1, 20);
     * ```
     * 
     * TODO: Add priority sorting (urgent orders first)
     * TODO: Add estimated time for each status
     * TODO: Add real-time updates via WebSocket
     * TODO: Add assignment functionality (assign to specific staff)
     * TODO: Add SLA tracking (time in each status)
     * TODO: Add queue statistics (count per status)
     * TODO: Add filtering by delivery location for route optimization
     * TODO: Add batch processing capabilities
     */
    async getOrdersByQueue(queueType: 'orders' | 'delivery', page: number = 1, limit: number = 20) {
        this.logger.log(`Getting orders for queue=${queueType}, page=${page}, limit=${limit}`);

        if (limit > 50) {
            this.logger.warn(`Limit ${limit} exceeds maximum, capping to 50`);
            limit = 50;
        }

        const skip = (page - 1) * limit;
        let statuses: OrderStatus[];

        // Define queue statuses
        // FIXME: These should be defined as constants to avoid typos
        if (queueType === 'orders') {
            statuses = ['Pending', 'Confirmed', 'Packaging'];
        } else {
            statuses = ['Dispatched'];
        }

        // TODO: Add queue-specific sorting (e.g., delivery by location)
        const [items, total] = await this.orderRepo.findAndCount({
            where: { status: In(statuses) },
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' }, // TODO: Change to priority-based sorting
            take: limit,
            skip: skip
        });

        this.logger.log(`Found ${total} orders in ${queueType} queue`);

        return { items, total, page, limit };
    }

    /**
     * Retrieves a single order by ID with all relations.
     * 
     * @param id - Order ID
     * @returns Promise resolving to Order entity or null if not found
     * 
     * @example
     * ```typescript
     * const order = await ordersService.findOne('order_123');
     * if (!order) throw new NotFoundException('Order not found');
     * ```
     * 
     * TODO: Add caching for frequently accessed orders
     * TODO: Add authorization check (user can only view their own orders)
     * TODO: Add delivery tracking information
     * TODO: Add invoice download link
     * TODO: Add estimated delivery date
     * TODO: Transform response based on user role (hide sensitive data)
     */
    findOne(id: string) {
        this.logger.log(`Finding order by ID: ${id}`);

        // TODO: Add error handling for invalid UUID format
        return this.orderRepo.findOne({
            where: { id },
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
        });
    }

    /**
     * Updates order status and creates status history entry.
     * 
     * Tracks status changes with optional message and user attribution.
     * Creates audit trail in status history.
     * 
     * @param id - Order ID
     * @param updateOrderDto - Update data (status and/or message)
     * @param userId - Optional ID of user making the change (for audit trail)
     * @returns Promise resolving to updated Order entity
     * 
     * @example
     * ```typescript
     * // Update status
     * await ordersService.updateStatus('order_123', {
     *   status: 'Confirmed'
     * }, 'admin_456');
     * 
     * // Add message without status change
     * await ordersService.updateStatus('order_123', {
     *   message: 'Customer requested priority delivery'
     * }, 'admin_456');
     * ```
     * 
     * FIXME: No validation of status transitions (can go from Delivered back to Pending)
     * FIXME: No transaction - status update and history creation are separate operations
     * FIXME: No notification sent on status change
     * FIXME: Order might not exist - should validate before updating
     * 
     * TODO: Add status transition validation (state machine)
     * TODO: Wrap in transaction
     * TODO: Validate order exists before update
     * TODO: Emit OrderStatusChangedEvent for notifications
     * TODO: Send status update notification to customer
     * TODO: Add authorization check (only staff/admin can update)
     * TODO: Add required reason/message for certain status changes (e.g., Cancelled)
     * TODO: Add stock restoration on cancellation
     * TODO: Add delivery partner integration on dispatch
     * TODO: Generate shipping label on dispatch
     * TODO: Add estimated delivery time calculation
     * TODO: Add automatic status progression (e.g., Pending → Confirmed after payment)
     */
    async updateStatus(id: string, updateOrderDto: UpdateOrderDto, userId?: string) {
        this.logger.log(`Updating order ${id} status to ${updateOrderDto.status}`);

        // FIXME: Should validate order exists before updating
        // TODO: Add order existence check

        let currentStatus: OrderStatus | undefined;

        // Update status if provided
        // FIXME: No transaction - status update and history are separate
        if (updateOrderDto.status) {
            // TODO: Validate status transition is allowed
            await this.orderRepo.update(id, { status: updateOrderDto.status });
            currentStatus = updateOrderDto.status;

            this.logger.log(`Order ${id} status updated to ${currentStatus}`);
        } else {
            // Fetch current status if not updating
            const order = await this.orderRepo.findOne({ where: { id }, select: ['status'] });
            currentStatus = order?.status;
        }

        // Create status history entry
        const statusHistory = this.statusHistoryRepo.create({
            order: { id },
            status: currentStatus || 'Pending',
            message: updateOrderDto.message || (updateOrderDto.status ? `Status updated to ${updateOrderDto.status}` : 'Order updated'),
        });

        // Add user attribution if provided
        if (userId) {
            statusHistory.changedBy = { id: userId } as User;
        }

        await this.statusHistoryRepo.save(statusHistory);

        // TODO: Emit OrderStatusChangedEvent
        // TODO: Send notification based on status
        // TODO: If status is 'Cancelled', restore stock
        // TODO: If status is 'Dispatched', create shipping integration

        return this.findOne(id);
    }

    /**
     * Retrieves complete status history for an order.
     * 
     * Returns chronological list of all status changes with audit information.
     * 
     * @param orderId - Order ID
     * @returns Promise resolving to array of OrderStatusHistory entries
     * 
     * @example
     * ```typescript
     * const history = await ordersService.getOrderHistory('order_123');
     * // Returns: [
     * //   { status: 'Pending', message: 'Order placed', createdAt: ... },
     * //   { status: 'Confirmed', message: 'Payment verified', createdAt: ... },
     * //   ...
     * // ]
     * ```
     * 
     * TODO: Add caching for completed orders
     * TODO: Add pagination for orders with long history
     * TODO: Add filtering by status or date range
     * TODO: Add estimated time between statuses
     * TODO: Format timestamps for user timezone
     */
    async getOrderHistory(orderId: string) {
        this.logger.log(`Getting history for order ${orderId}`);

        // TODO: Validate order exists
        return this.statusHistoryRepo.find({
            where: { order: { id: orderId } },
            relations: ['changedBy'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Calculates GST taxes for order items based on delivery state.
     * 
     * Implements Indian GST taxation:
     * - Intra-state (same as store state): CGST + SGST (split 50-50)
     * - Inter-state (different from store state): IGST (full amount)
     * 
     * Tax rates are fetched from product.gstRate or product.category.gstRate (default: 18%).
     * 
     * @param items - Array of items with productId, variantId, and quantity
     * @param state - Delivery state name
     * @returns Promise resolving to tax calculation breakdown
     * 
     * @example
     * ```typescript
     * const tax = await ordersService.calculateTax([
     *   { productId: 'prod_1', quantity: 2 },
     *   { productId: 'prod_2', variantId: 'var_1', quantity: 1 }
     * ], 'Tamil Nadu');
     * 
     * // Returns: {
     * //   subtotal: 10000,
     * //   totalTax: 1800,
     * //   grandTotal: 11800,
     * //   isInterState: false,
     * //   breakdown: { cgst: 900, sgst: 900, igst: 0 }
     * // }
     * ```
     * 
     * FIXME: Store state is hardcoded - should come from config/database
     * FIXME: State comparison is case-sensitive after trim (may fail for variations)
     * FIXME: No validation that products exist - returns null in breakdown for missing products
     * FIXME: Rounding each item's tax separately can cause penny discrepancies
     * FIXME: Default GST rate of 18% might not be correct for all categories
     * 
     * TODO: Move STORE_STATE to configuration
     * TODO: Add state normalization (handle "TN", "Tamil nadu", "TAMIL NADU", etc.)
     * TODO: Validate all products exist before calculation
     * TODO: Throw error if any product not found instead of returning null
     * TODO: Add tax exemption handling (0% GST items)
     * TODO: Add reverse charge mechanism for B2B
     * TODO: Add HSN/SAC code validation
     * TODO: Optimize database queries (single query for all products/variants)
     * TODO: Cache product GST rates
     * TODO: Add tax calculation for shipping charges
     * TODO: Add cess calculation for applicable products
     * TODO: Log tax calculation details for audit
     * TODO: Add support for multiple store locations
     */
    async calculateTax(items: { productId: string, variantId?: string, quantity: number }[], state: string) {
        this.logger.debug(`Calculating tax for ${items.length} items, delivery state: ${state}`);

        let subtotal: number = 0;
        let totalTax: number = 0;

        // FIXME: Hardcoded store state - should come from config
        const STORE_STATE = 'Tamil Nadu'; // TODO: Move to ConfigService

        // FIXME: Case-sensitive comparison after trim may fail
        // TODO: Normalize state names (handle abbreviations, case variations)
        const isIntraState = state.toLowerCase().trim() === STORE_STATE.toLowerCase().trim();

        // Extract product and variant IDs
        const productIds = items.map(i => i.productId);
        const variantIds = items.map(i => i.variantId).filter(Boolean);

        // TODO: Optimize - use single query with joins instead of separate queries
        // Fetch products and variants
        const [products, variants] = await Promise.all([
            this.productRepo.find({
                where: { id: In(productIds) },
                relations: ['category', 'variants']
            }),
            variantIds.length > 0 ? this.variantRepo.find({ where: { id: In(variantIds) } }) : Promise.resolve([])
        ]);

        this.logger.debug(`Found ${products.length} products and ${variants.length} variants`);

        // Calculate tax for each item
        // FIXME: Returns null for missing products instead of throwing error
        const taxBreakdown = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                this.logger.warn(`Product ${item.productId} not found for tax calculation`);
                return null; // FIXME: Should throw error instead
            }

            // Get variant price if applicable
            const variant = item.variantId ? variants.find(v => v.id === item.variantId) : null;
            const price = variant ? +variant.price : (product.variants?.[0]?.price || 0);

            // Determine GST rate (Disabled per request)
            const rate = 0;

            // Calculate item totals
            const itemSubtotal = price * item.quantity;
            const itemTax = (itemSubtotal * rate) / 100;

            subtotal += itemSubtotal;
            totalTax += itemTax;

            return {
                productId: product.id,
                variantId: item.variantId,
                productName: product.name,
                rate,
                subtotal: itemSubtotal,
                tax: itemTax
            };
        }).filter(Boolean); // FIXME: Silently filters out null entries (missing products)

        // Build result with GST breakdown
        // FIXME: Rounding can cause discrepancies (cgst + sgst might not equal totalTax)
        const result = {
            subtotal,
            totalTax: Math.round(totalTax),
            grandTotal: Math.round(subtotal + totalTax),
            isInterState: !isIntraState,
            breakdown: {
                cgst: isIntraState ? Math.round(totalTax / 2) : 0,
                sgst: isIntraState ? Math.round(totalTax / 2) : 0,
                igst: !isIntraState ? Math.round(totalTax) : 0,
            }
        };

        this.logger.debug(`Tax calculation result: ${JSON.stringify(result)}`);

        // TODO: Add detailed breakdown per item in response
        // TODO: Log for tax audit trail
        return result;
    }
}
