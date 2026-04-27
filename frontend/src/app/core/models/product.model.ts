import { Brand } from './brand.model';
import { Category } from './category.model';


export interface ProductImage {
    id?: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
    sortOrder: number;
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    comparisonPrice?: number;
    sku?: string;
    specifications?: Record<string, string>;
    stock: number;
    images?: ProductImage[]; // Structured images (replaces legacy fields)
    description?: string;
    isDefault: boolean;
    variantTypeId?: string;
    variantType?: any;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    brandId: string;
    brand?: Brand;
    categoryId: string;
    category?: Category;
    variants: ProductVariant[];
    images?: ProductImage[]; // Structured images (replaces legacy fields)
    isAvailable: boolean;
    isFeatured: boolean;
    maxOrderQuantity?: number;
    isShowcaseOnly: boolean;
    allowedPaymentMethods?: string[];
    rating?: number;
    reviewCount?: number;
    warranty?: string;
    specifications?: Record<string, string>;
}
