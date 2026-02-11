import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/api/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { APP_PERMISSIONS } from '../../core/constants/permissions.constants';
import { LucideAngularModule, ShoppingCart } from 'lucide-angular';
import { OrderQueueTabsComponent } from './components/order-queue-tabs/order-queue-tabs.component';
import { OrderFiltersComponent } from './components/order-filters/order-filters.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderStatusModalComponent } from './components/order-status-modal/order-status-modal.component';

@Component({
    selector: 'app-admin-orders',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        LucideAngularModule,
        OrderQueueTabsComponent,
        OrderFiltersComponent,
        OrderListComponent,
        OrderStatusModalComponent
    ],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    readonly ShoppingCart = ShoppingCart;
    readonly PERMISSIONS = APP_PERMISSIONS;

    activeTab: 'orders' | 'delivery' = 'orders';
    orders: Order[] = [];
    isLoading = true;
    isUpdating = false;

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
    statusOptions: OrderStatus[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'];

    async ngOnInit() {
        await this.loadOrders();
    }

    async loadOrders() {
        this.isLoading = true;
        try {
            const data = await this.orderService.getOrdersByQueue(this.activeTab, this.currentPage, this.itemsPerPage);
            this.orders = this.applyClientFilters(data.items);
            this.totalItems = data.total;
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.toastService.error('Failed to load orders');
        } finally {
            this.isLoading = false;
        }
    }

    private applyClientFilters(orders: Order[]): Order[] {
        return orders.filter(order => {
            const searchLower = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                order.id.toLowerCase().includes(searchLower) ||
                order.user?.name.toLowerCase().includes(searchLower) ||
                order.user?.email.toLowerCase().includes(searchLower) ||
                order.deliveryPhone?.includes(searchLower);

            const matchesStatus = this.statusFilter === 'All' || order.status === this.statusFilter;

            let matchesDate = true;
            if (this.startDate) {
                matchesDate = matchesDate && new Date(order.createdAt) >= new Date(this.startDate);
            }
            if (this.endDate) {
                const end = new Date(this.endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && new Date(order.createdAt) <= end;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }

    async onTabChange(tab: 'orders' | 'delivery') {
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

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadOrders();
    }

    onEditOrder(order: Order) {
        if (!this.authService.hasPermission(this.PERMISSIONS.UPDATE_ORDER)) {
            this.toastService.error('You do not have permission to update orders');
            return;
        }
        this.selectedOrder = order;
        this.showStatusModal = true;
    }

    async onUpdateStatus(event: { status: OrderStatus, message: string }) {
        if (!this.selectedOrder) return;

        this.isUpdating = true;
        try {
            await this.orderService.updateOrderStatus(
                this.selectedOrder.id,
                event.status,
                event.message || undefined
            );
            this.toastService.success('Order status updated successfully');
            this.onCloseModal();
            await this.loadOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
            this.toastService.error('Failed to update order status');
        } finally {
            this.isUpdating = false;
        }
    }

    onCloseModal() {
        this.showStatusModal = false;
        this.selectedOrder = null;
    }
}
