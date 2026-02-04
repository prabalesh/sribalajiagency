import { Product, ProductVariant } from './product.model';

export interface CartItem {
    product: Product;
    variant?: ProductVariant;
    quantity: number;
}
