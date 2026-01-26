import { User } from './auth.model';

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    user?: User;
    items: OrderItem[];
    totalAmount: number;
    status: 'Delivered' | 'Processing' | 'Cancelled';
    createdAt: Date;
}
