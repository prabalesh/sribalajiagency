import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsUUID, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Basic cart item (stored in DB and localStorage)
export class CartItemDto {
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @IsOptional()
    @IsUUID()
    variantId?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantity: number;
}

// Validated cart item (returned from validation endpoint)
export class ValidatedCartItemDto extends CartItemDto {
    @IsNotEmpty()
    @IsString()
    productName: string;

    @IsOptional()
    @IsString()
    variantName?: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsNumber()
    stockAvailable: number;

    @IsNotEmpty()
    @IsBoolean()
    available: boolean;

    @IsNotEmpty()
    @IsBoolean()
    quantityAdjusted: boolean;

    @IsNotEmpty()
    @IsNumber()
    originalQuantity: number;

    @IsOptional()
    @IsString()
    imageUrl?: string;
}

// Request DTOs
export class UpdateCartDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    items: CartItemDto[];
}

export class ValidateCartDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    items: CartItemDto[];
}

export class MergeCartDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    guestCart: CartItemDto[];
}
