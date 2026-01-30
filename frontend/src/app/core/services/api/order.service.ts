import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Order, CreateOrderDto, OrderStatusHistory, OrderStatus } from '../../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private api = inject(ApiService);

    async createOrder(orderData: CreateOrderDto) {
        const res = await this.api.post<Order>('/orders', orderData);
        return res.data;
    }

    async getMyOrders(page: number = 1, limit: number = 20, status?: OrderStatus) {
        const params: any = { page, limit };
        if (status) params.status = status;
        const res = await this.api.get<{ items: Order[], total: number, page: number, limit: number }>('/orders/my', params);
        return res.data;
    }

    async getAllOrders(page: number = 1, limit: number = 20) {
        const res = await this.api.get<{ items: Order[], total: number, page: number, limit: number }>('/orders', { page, limit });
        return res.data;
    }

    async getOrdersByQueue(queueType: 'orders' | 'delivery', page: number = 1, limit: number = 20) {
        const res = await this.api.get<{ items: Order[], total: number, page: number, limit: number }>(`/orders/queue/${queueType}`, { page, limit });
        return res.data;
    }

    async getOrderById(id: string): Promise<Order> {
        const res = await this.api.get<Order>(`/orders/${id}`);
        return res.data;
    }

    async getOrderHistory(id: string) {
        const res = await this.api.get<OrderStatusHistory[]>(`/orders/${id}/history`);
        return res.data;
    }

    async updateOrderStatus(id: string, status: OrderStatus, message?: string) {
        const res = await this.api.patch<Order>(`/orders/${id}/status`, { status, message });
        return res.data;
    }
}
