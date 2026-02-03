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
    description?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    brandId: string;
    brand?: Brand;
    categoryId: string;
    category?: Category;
    price: number;
    comparisonPrice?: number;
    images: ProductImage[];
    variants: ProductVariant[];
    isAvailable: boolean;
    isFeatured: boolean;
    stock: number;
    maxOrderQuantity?: number;
    isShowcaseOnly: boolean;
    allowedPaymentMethods?: string[];
    rating?: number;
    reviewCount?: number;
}
