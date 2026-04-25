import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, lte, gte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

/**
 * Service for managing discount coupons using Drizzle ORM.
 */
@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves all coupons.
   */
  async findAll() {
    this.logger.log('Finding all coupons');
    return await this.db.query.coupons.findMany();
  }

  /**
   * Retrieves a single coupon by ID.
   */
  async findOne(id: string) {
    this.logger.log(`Finding coupon by ID: ${id}`);
    const coupon = await this.db.query.coupons.findFirst({
      where: eq(schema.coupons.id, id),
    });
    if (!coupon) {
      this.logger.warn(`Coupon ${id} not found`);
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  /**
   * Validates a coupon by code and date.
   */
  async findByCode(code: string) {
    this.logger.log(`Finding coupon by code: ${code}`);
    const now = new Date();

    const coupon = await this.db.query.coupons.findFirst({
      where: and(
        eq(schema.coupons.code, code.toUpperCase()),
        eq(schema.coupons.isActive, true),
        lte(schema.coupons.startDate, now),
        gte(schema.coupons.endDate, now),
      ),
    });

    if (!coupon) {
      this.logger.warn(
        `Coupon code ${code} not found, inactive, or outside date range`,
      );
      throw new BadRequestException('Invalid or expired coupon');
    }

    return coupon;
  }

  /**
   * Creates a new coupon.
   */
  async create(data: CreateCouponDto) {
    this.logger.log(`Creating coupon: ${data.code}`);
    const code = data.code.toUpperCase();

    const existing = await this.db.query.coupons.findFirst({
      where: eq(schema.coupons.code, code),
    });

    if (existing) {
      throw new ConflictException(`Coupon code ${code} already exists`);
    }

    try {
      const [newCoupon] = await this.db
        .insert(schema.coupons)
        .values({
          ...data,
          code,
          discountValue: data.discountValue.toString(),
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        })
        .returning();

      this.logger.log(`Coupon created with ID: ${newCoupon.id}`);
      return newCoupon;
    } catch (error) {
      throw new BadRequestException('Failed to create coupon');
    }
  }

  /**
   * Updates an existing coupon.
   */
  async update(id: string, data: UpdateCouponDto) {
    this.logger.log(`Updating coupon ${id}`);

    const existing = await this.findOne(id);

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await this.db.query.coupons.findFirst({
        where: eq(schema.coupons.code, data.code.toUpperCase()),
      });
      if (duplicate) {
        throw new ConflictException(`Coupon code ${data.code} already exists`);
      }
    }

    try {
      const [updatedCoupon] = await this.db
        .update(schema.coupons)
        .set({
          ...data,
          code: data.code ? data.code.toUpperCase() : undefined,
          discountValue: data.discountValue
            ? data.discountValue.toString()
            : undefined,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        })
        .where(eq(schema.coupons.id, id))
        .returning();

      if (!updatedCoupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      this.logger.log(`Coupon ${id} updated successfully`);
      return updatedCoupon;
    } catch (error) {
      throw new BadRequestException('Failed to update coupon');
    }
  }

  /**
   * Deletes a coupon.
   */
  async delete(id: string) {
    this.logger.log(`Deleting coupon ${id}`);
    const result = await this.db
      .delete(schema.coupons)
      .where(eq(schema.coupons.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return { success: true };
  }

  /**
   * Validates a coupon and calculates discount for an order.
   */
  async validateCoupon(code: string, orderAmount: number) {
    this.logger.log(
      `Validating coupon ${code} for order amount ${orderAmount}`,
    );

    const coupon = await this.findByCode(code);

    if (orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
      );
    }

    let discount = 0;
    const discountValue = parseFloat(coupon.discountValue);

    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = discountValue;
      if (discount > orderAmount) {
        discount = orderAmount;
      }
    }

    const finalAmount = orderAmount - discount;

    return {
      coupon,
      discount: Math.round(discount),
      finalAmount: Math.round(finalAmount),
    };
  }
}
