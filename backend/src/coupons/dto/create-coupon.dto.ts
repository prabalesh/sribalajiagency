import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDateString, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateCouponDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEnum(['percentage', 'flat'])
    discountType: 'percentage' | 'flat';

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minOrderAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxDiscountAmount?: number;
}
