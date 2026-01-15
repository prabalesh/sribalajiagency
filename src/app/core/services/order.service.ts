import { Injectable } from '@angular/core';
import { Order } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    // Mock Orders
    private orders: Order[] = [
        {
            id: 'ord-1001',
            userId: 'u1', // Admin User
            date: new Date('2025-12-10'),
            status: 'Delivered',
            totalAmount: 5100,
            items: [
                { productId: 'p1', productName: 'Orient Electric 1200mm', quantity: 2, price: 2500 },
                { productId: 'p2', productName: 'Philips 9W LED', quantity: 1, price: 100 }
            ]
        },
        {
            id: 'ord-1002',
            userId: 'u1',
            date: new Date('2026-01-05'),
            status: 'Processing',
            totalAmount: 3000,
            items: [
                { productId: 'p3', productName: 'Asian Paints Ace', quantity: 1, price: 3000 }
            ]
        }
    ];

    constructor() { }

    getOrdersByUserId(userId: string): Order[] {
        return this.orders.filter(o => o.userId === userId);
    }
}
