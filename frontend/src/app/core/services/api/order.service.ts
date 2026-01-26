import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Order } from '../../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private api = inject(ApiService);

    async createOrder(items: any[]) {
        const res = await this.api.post<Order>('/orders', { items });
        return res.data;
    }

    async getMyOrders() {
        const res = await this.api.get<Order[]>('/orders/my');
        return res.data;
    }

    async getAllOrders() {
        const res = await this.api.get<Order[]>('/orders');
        return res.data;
    }

    async updateOrderStatus(id: string, status: string) {
        const res = await this.api.patch<Order>(`/orders/${id}/status`, { status });
        return res.data;
    }
}
