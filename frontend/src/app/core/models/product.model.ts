import { Brand } from './brand.model';
import { Category } from './category.model';

export interface ProductImage {
    id: string;
    url: string;
    isPrimary: boolean;
}

export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    comparisonPrice?: number;
    sku?: string;
    specifications?: any;
    stock: number;
    image?: string;
    images?: string[]; // Added
    description?: string;
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
    images: ProductImage[];
    variants: ProductVariant[];
    isAvailable: boolean;
    isFeatured: boolean;
    maxOrderQuantity?: number;
    isShowcaseOnly: boolean;
    allowedPaymentMethods?: string[];
    rating?: number;
    reviewCount?: number;
}
