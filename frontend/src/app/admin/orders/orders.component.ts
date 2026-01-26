import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/api/order.service';
import { Order } from '../../core/models/order.model';

@Component({
    selector: 'app-admin-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
    private orderService = inject(OrderService);

    orders: Order[] = [];
    statusOptions: string[] = ['Processing', 'Delivered', 'Cancelled'];

    async ngOnInit() {
        this.loadOrders();
    }

    async loadOrders() {
        this.orders = await this.orderService.getAllOrders();
    }

    async updateStatus(order: Order, event: any) {
        const newStatus = event.target.value;
        await this.orderService.updateOrderStatus(order.id, newStatus);
        order.status = newStatus;
    }
}
