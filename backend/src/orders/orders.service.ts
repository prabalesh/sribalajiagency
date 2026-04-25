import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packaging'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

/**
 * Service for managing e-commerce orders using Drizzle ORM.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Creates a new order with tax calculation and stock deduction.
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    this.logger.log(
      `Creating order for user ${userId} with ${createOrderDto.items.length} items`,
    );

    return await this.db.transaction(async (tx) => {
      // Calculate taxes
      const taxResults = await this.calculateTax(
        createOrderDto.items,
        createOrderDto.deliveryState,
      );

      const [newOrder] = await tx
        .insert(schema.orders)
        .values({
          userId,
          totalAmount: taxResults.grandTotal.toString(),
          taxAmount: taxResults.totalTax.toString(),
          taxDetails: taxResults.breakdown,
          status: 'Pending',
          paymentMethod: createOrderDto.paymentMethod,
          deliveryAddress: createOrderDto.deliveryAddress,
          deliveryPhone: createOrderDto.deliveryPhone,
          deliveryNotes: createOrderDto.deliveryNotes,
        })
        .returning();

      for (const item of createOrderDto.items) {
        if (!item.variantId) {
          throw new BadRequestException(
            `Variant ID is required for ${item.productName}`,
          );
        }

        const variant = await tx.query.productVariants.findFirst({
          where: eq(schema.productVariants.id, item.variantId),
        });

        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found`);
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.productName}`,
          );
        }

        // Deduct stock
        await tx
          .update(schema.productVariants)
          .set({ stock: variant.stock - item.quantity })
          .where(eq(schema.productVariants.id, variant.id));

        // Create order item
        await tx.insert(schema.orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          price: item.price.toString(),
          quantity: item.quantity,
        });
      }

      // Create initial status history entry
      await tx.insert(schema.orderStatusHistory).values({
        orderId: newOrder.id,
        status: 'Pending',
        message: 'Order placed successfully',
        changedById: userId,
      });

      return await tx.query.orders.findFirst({
        where: eq(schema.orders.id, newOrder.id),
        with: {
          items: true,
          statusHistory: true,
        },
      });
    });
  }

  /**
   * Retrieves paginated orders for a user.
   */
  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ) {
    this.logger.log(
      `Finding orders for user ${userId}, page=${page}, limit=${limit}, status=${status}`,
    );

    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [eq(schema.orders.userId, userId)];
    if (status) {
      whereConditions.push(eq(schema.orders.status, status as any));
    }

    const items = await this.db.query.orders.findMany({
      where: and(...whereConditions),
      limit,
      offset,
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
        statusHistory: {
          with: {
            changedBy: true,
          },
        },
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    const totalResult = await this.db.execute(
      sql`SELECT count(*) FROM orders WHERE "userId" = ${userId}`,
    );
    const total = parseInt((totalResult.rows[0] as any).count);

    return { items, total, page, limit };
  }

  /**
   * Retrieves paginated orders for admin.
   */
  async findAll(page: number = 1, limit: number = 20) {
    this.logger.log(`Finding all orders, page=${page}, limit=${limit}`);

    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const items = await this.db.query.orders.findMany({
      limit,
      offset,
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
        statusHistory: {
          with: {
            changedBy: true,
          },
        },
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    const totalResult = await this.db.execute(sql`SELECT count(*) FROM orders`);
    const total = parseInt((totalResult.rows[0] as any).count);

    return { items, total, page, limit };
  }

  /**
   * Retrieves orders by queue type.
   */
  async getOrdersByQueue(
    queueType: 'orders' | 'delivery',
    page: number = 1,
    limit: number = 20,
  ) {
    this.logger.log(`Getting orders for queue=${queueType}`);

    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const statuses =
      queueType === 'orders'
        ? ['Pending', 'Confirmed', 'Packaging']
        : ['Dispatched'];

    const items = await this.db.query.orders.findMany({
      where: inArray(schema.orders.status, statuses as any),
      limit,
      offset,
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
        statusHistory: {
          with: {
            changedBy: true,
          },
        },
      },
      orderBy: [desc(schema.orders.createdAt)],
    });

    const totalResult = await this.db.execute(
      sql`SELECT count(*) FROM orders WHERE status IN (${sql.join(
        statuses.map((s) => sql`${s}`),
        sql`, `,
      )})`,
    );
    const total = parseInt((totalResult.rows[0] as any).count);

    return { items, total, page, limit };
  }

  /**
   * Retrieves a single order by ID.
   */
  async findOne(id: string) {
    this.logger.log(`Finding order by ID: ${id}`);
    return await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
        statusHistory: {
          with: {
            changedBy: true,
          },
        },
      },
    });
  }

  /**
   * Updates order status.
   */
  async updateStatus(
    id: string,
    updateOrderDto: UpdateOrderDto,
    userId?: string,
  ) {
    this.logger.log(`Updating order ${id} status to ${updateOrderDto.status}`);

    return await this.db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: eq(schema.orders.id, id),
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const newStatus = updateOrderDto.status || order.status;

      if (updateOrderDto.status) {
        await tx
          .update(schema.orders)
          .set({ status: newStatus })
          .where(eq(schema.orders.id, id));
      }

      await tx.insert(schema.orderStatusHistory).values({
        orderId: id,
        status: newStatus,
        message:
          updateOrderDto.message ||
          (updateOrderDto.status
            ? `Status updated to ${updateOrderDto.status}`
            : 'Order updated'),
        changedById: userId,
      });

      return await tx.query.orders.findFirst({
        where: eq(schema.orders.id, id),
        with: {
          user: true,
          items: {
            with: {
              product: true,
              variant: true,
            },
          },
          statusHistory: {
            with: {
              changedBy: true,
            },
          },
        },
      });
    });
  }

  /**
   * Retrieves status history for an order.
   */
  async getOrderHistory(orderId: string) {
    this.logger.log(`Getting history for order ${orderId}`);
    return await this.db.query.orderStatusHistory.findMany({
      where: eq(schema.orderStatusHistory.orderId, orderId),
      with: {
        changedBy: true,
      },
      orderBy: [desc(schema.orderStatusHistory.createdAt)],
    });
  }

  /**
   * Calculates taxes (placeholder logic).
   */
  async calculateTax(items: any[], state: string) {
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    return {
      subtotal,
      totalTax: 0,
      grandTotal: subtotal,
      isInterState: state.toLowerCase().trim() !== 'tamil nadu',
      breakdown: {
        cgst: 0,
        sgst: 0,
        igst: 0,
      },
    };
  }
}
