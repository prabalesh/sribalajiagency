import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/api/order.service';
import { Order, OrderStatusHistory } from '../../core/models/order.model';

@Component({
    selector: 'app-order-confirmation',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './order-confirmation.component.html',
    styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);

    order: Order | null = null;
    orderHistory: OrderStatusHistory[] = [];
    isLoading = true;

    async ngOnInit() {
        const orderId = this.route.snapshot.paramMap.get('id');
        if (orderId) {
            try {
                this.order = await this.orderService.getOrderById(orderId);
                this.orderHistory = await this.orderService.getOrderHistory(orderId);
            } catch (error) {
                console.error('Failed to load order:', error);
            } finally {
                this.isLoading = false;
            }
        }
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'Pending': 'warning',
            'Confirmed': 'info',
            'Packaging': 'info',
            'Dispatched': 'primary',
            'Delivered': 'success',
            'Cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }
}
