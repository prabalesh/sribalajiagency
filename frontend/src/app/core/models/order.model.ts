import { User } from './auth.model';
import { Product } from './product.model';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Packaging' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface OrderItem {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    product?: Product;
}

export interface OrderStatusHistory {
    id: string;
    status: OrderStatus;
    message: string;
    changedBy?: User;
    createdAt: Date;
}

export interface Order {
    id: string;
    userId: string;
    user?: User;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    paymentMethod?: string;
    deliveryAddress?: string;
    deliveryPhone?: string;
    deliveryNotes?: string;
    statusHistory?: OrderStatusHistory[];
    createdAt: Date;
    updatedAt?: Date;
}

export interface CreateOrderDto {
    items: {
        productId: string;
        productName: string;
        price: number;
        quantity: number;
    }[];
    paymentMethod: string;
    deliveryAddress: string;
    deliveryPhone: string;
    deliveryNotes?: string;
}
