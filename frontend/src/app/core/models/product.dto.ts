export interface ProductVariantDto {
    id?: string;
    name: string;
    price: number;
    comparisonPrice?: number;
    stock?: number;
    image?: string;
    images?: string[];
    description?: string;
}

export interface CreateProductDto {
    name: string;
    description: string;
    price: number;
    comparisonPrice?: number;
    isAvailable?: boolean;
    stock?: number;
    isShowcaseOnly?: boolean;
    allowedPaymentMethods?: string[];
    gstRate?: number;
    categoryId?: string;
    brandId?: string;
    isFeatured?: boolean;
    variants?: ProductVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }
