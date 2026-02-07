import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    comparisonPrice?: number;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsBoolean()
    isShowcaseOnly?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allowedPaymentMethods?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    gstRate?: number;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    brandId?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    // Add other fields as necessary based on entity
    @IsOptional()
    @IsArray()
    variants?: any[]; // Ideally should be a DTO too, but keeping loose for now or define CreateVariantDto
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    comparisonPrice?: number;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsBoolean()
    isShowcaseOnly?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allowedPaymentMethods?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    gstRate?: number;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    brandId?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsArray()
    variants?: any[];
}
