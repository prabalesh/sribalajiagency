import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Custom validator to ensure end date is after start date
 */
@ValidatorConstraint({ name: 'IsAfterStartDate', async: false })
export class IsAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const object = args.object as CreateCouponDto;
    if (!object.startDate || !endDate) return false;

    const start = new Date(object.startDate);
    const end = new Date(endDate);

    return end > start;
  }

  defaultMessage(args: ValidationArguments) {
    return 'End date must be after start date';
  }
}

/**
 * Custom validator to ensure percentage discount is not more than 100
 */
@ValidatorConstraint({ name: 'IsValidDiscountValue', async: false })
export class IsValidDiscountValueConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    const object = args.object as CreateCouponDto;

    // If percentage, value should be between 0-100
    if (object.discountType === 'percentage') {
      return value > 0 && value <= 100;
    }

    // If flat, value should just be positive
    return value > 0;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateCouponDto;
    if (object.discountType === 'percentage') {
      return 'Percentage discount must be between 0 and 100';
    }
    return 'Flat discount must be greater than 0';
  }
}

/**
 * Custom validator to ensure maxDiscountAmount is only set for percentage discounts
 */
@ValidatorConstraint({ name: 'MaxDiscountOnlyForPercentage', async: false })
export class MaxDiscountOnlyForPercentageConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    const object = args.object as CreateCouponDto;

    // If maxDiscountAmount is provided, discountType must be percentage
    if (value !== undefined && value !== null) {
      return object.discountType === 'percentage';
    }

    return true;
  }

  defaultMessage() {
    return 'Maximum discount amount can only be set for percentage discounts';
  }
}

/**
 * DTO for creating a new coupon.
 *
 * Validates coupon data including discount rules, date ranges, and business logic constraints.
 *
 * @example
 * ```typescript
 * const coupon: CreateCouponDto = {
 *   name: 'Summer Sale',
 *   code: 'SUMMER2026',
 *   discountType: 'percentage',
 *   discountValue: 20,
 *   startDate: '2026-06-01T00:00:00Z',
 *   endDate: '2026-08-31T23:59:59Z',
 *   minOrderAmount: 1000,
 *   maxDiscountAmount: 500
 * };
 * ```
 *
 * TODO: Add validation for coupon code uniqueness (requires database check)
 * TODO: Add validation for maximum number of active coupons per user
 * TODO: Consider adding usage limit fields (total uses, uses per user)
 */
export class CreateCouponDto {
  /**
   * Display name of the coupon (e.g., "Summer Sale 2026")
   *
   * @example "New Year Special"
   */
  @IsString()
  @IsNotEmpty({ message: 'Coupon name is required' })
  @Length(3, 100, {
    message: 'Coupon name must be between 3 and 100 characters',
  })
  @Transform(({ value }) => value?.trim()) // Remove leading/trailing whitespace
  name: string;

  /**
   * Unique coupon code that users will enter (e.g., "SUMMER2026")
   *
   * Must be uppercase alphanumeric, 4-20 characters
   *
   * @example "SAVE20"
   */
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  @Length(4, 20, { message: 'Coupon code must be between 4 and 20 characters' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Coupon code must contain only uppercase letters and numbers',
  })
  @Transform(({ value }) => value?.trim().toUpperCase()) // Auto-uppercase and trim
  code: string;

  /**
   * Type of discount: percentage or flat amount
   *
   * @example "percentage"
   */
  @IsEnum(['percentage', 'flat'], {
    message: 'Discount type must be either "percentage" or "flat"',
  })
  discountType: 'percentage' | 'flat';

  /**
   * Discount value (percentage: 0-100, flat: any positive number)
   *
   * For percentage: represents percentage (e.g., 20 for 20% off)
   * For flat: represents amount in smallest currency unit (e.g., 500 for ₹5)
   *
   * @example 20 (for 20% off or ₹20 off)
   */
  @IsNumber({}, { message: 'Discount value must be a number' })
  @Min(0.01, { message: 'Discount value must be greater than 0' })
  @Validate(IsValidDiscountValueConstraint) // Custom validation based on discount type
  discountValue: number;

  /**
   * Start date of coupon validity (ISO 8601 format)
   *
   * @example "2026-06-01T00:00:00Z"
   */
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  startDate: string;

  /**
   * End date of coupon validity (ISO 8601 format)
   *
   * Must be after start date
   *
   * @example "2026-12-31T23:59:59Z"
   */
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  @Validate(IsAfterStartDateConstraint) // Custom validation to ensure end > start
  endDate: string;

  /**
   * Whether the coupon is currently active
   *
   * Defaults to true if not provided
   *
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  /**
   * Minimum order amount required to apply coupon (in smallest currency unit)
   *
   * Optional. If not set, coupon applies to all orders.
   *
   * @example 1000 (for ₹10 minimum order)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Minimum order amount must be a number' })
  @Min(0, { message: 'Minimum order amount cannot be negative' })
  minOrderAmount?: number;

  /**
   * Maximum discount amount (only applicable for percentage discounts)
   *
   * Caps the discount for percentage-based coupons.
   * For example: 20% off with max ₹500 discount
   *
   * @example 500 (caps discount at ₹5)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Maximum discount amount must be a number' })
  @Min(0, { message: 'Maximum discount amount cannot be negative' })
  @Validate(MaxDiscountOnlyForPercentageConstraint) // Only allow for percentage discounts
  @ValidateIf((o) => o.discountType === 'percentage') // Only validate if percentage type
  maxDiscountAmount?: number;
}
