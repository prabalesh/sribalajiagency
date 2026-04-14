import { Brand } from './brand.model';
import { Category } from './category.model';


export interface ProductVariant {
    id: string;
    name: string;
    price: number;
    comparisonPrice?: number;
    sku?: string;
    specifications?: Record<string, string>;
    stock: number;
    image?: string;
    images?: string[];
    description?: string;
    isDefault: boolean;
    variantTypeId?: string;
    variantType?: any; // Leaving this for now as it might be a complex interface
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
