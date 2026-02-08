import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/api/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { APP_PERMISSIONS } from '../../core/constants/permissions.constants';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-admin-orders',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent, RouterModule],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    public authService = inject(AuthService);

    readonly PERMISSIONS = APP_PERMISSIONS;

    activeTab: 'orders' | 'delivery' = 'orders';
    orders: Order[] = [];
    isLoading = true;

    // Filters
    searchTerm = '';
    statusFilter: OrderStatus | 'All' = 'All';
    startDate: string = '';
    endDate: string = '';

    // Pagination
    currentPage = 1;
    totalItems = 0;
    itemsPerPage = 10;

    // Status update modal
    showStatusModal = false;
    selectedOrder: Order | null = null;
    newStatus: OrderStatus | '' = '';
    statusMessage: string = '';

    statusOptions: OrderStatus[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'];

    async ngOnInit() {
        await this.loadOrders();
    }

    async loadOrders() {
        this.isLoading = true;
        try {
            const data = await this.orderService.getOrdersByQueue(this.activeTab, this.currentPage, this.itemsPerPage);
            this.orders = data.items;
            this.totalItems = data.total;
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async switchTab(tab: 'orders' | 'delivery') {
        this.activeTab = tab;
        this.resetFilters();
        await this.loadOrders();
    }

    resetFilters() {
        this.searchTerm = '';
        this.statusFilter = 'All';
        this.startDate = '';
        this.endDate = '';
        this.currentPage = 1;
    }

    // Apply filters and reload
    async applyFilters() {
        this.currentPage = 1;
        await this.loadOrders();
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadOrders();
    }

    openStatusModal(order: Order) {
        if (!this.authService.hasPermission(this.PERMISSIONS.UPDATE_ORDER)) {
            alert('You do not have permission to update orders.');
            return;
        }
        this.selectedOrder = order;
        this.newStatus = order.status;
        this.statusMessage = '';
        this.showStatusModal = true;
    }

    closeStatusModal() {
        this.showStatusModal = false;
        this.selectedOrder = null;
        this.newStatus = '';
        this.statusMessage = '';
    }

    async updateStatus() {
        if (!this.selectedOrder || !this.newStatus) return;

        try {
            await this.orderService.updateOrderStatus(
                this.selectedOrder.id,
                this.newStatus,
                this.statusMessage || undefined
            );
            this.closeStatusModal();
            await this.loadOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status');
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
