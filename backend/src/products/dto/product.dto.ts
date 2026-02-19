import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, Min, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantDto {
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    comparisonPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    variantTypeId?: string;
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;


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
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants?: ProductVariantDto[];
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
    @IsBoolean()
    isAvailable?: boolean;


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
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants?: ProductVariantDto[];
}
