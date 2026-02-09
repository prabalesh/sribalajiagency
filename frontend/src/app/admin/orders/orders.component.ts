import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/api/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { APP_PERMISSIONS } from '../../core/constants/permissions.constants';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { 
  LucideAngularModule, 
  ShoppingCart, 
  Truck, 
  Search, 
  Filter, 
  Calendar, 
  Edit, 
  Eye, 
  X,
  Check,
  Clock,
  Package,
  AlertCircle,
  User,
  Mail,
  Phone,
  IndianRupee,
  CreditCard
} from 'lucide-angular';

@Component({
    selector: 'app-admin-orders',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        PaginationComponent, 
        RouterModule,
        LucideAngularModule
    ],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    // Icon references
    readonly ShoppingCart = ShoppingCart;
    readonly Truck = Truck;
    readonly Search = Search;
    readonly Filter = Filter;
    readonly Calendar = Calendar;
    readonly Edit = Edit;
    readonly Eye = Eye;
    readonly X = X;
    readonly Check = Check;
    readonly Clock = Clock;
    readonly Package = Package;
    readonly AlertCircle = AlertCircle;
    readonly User = User;
    readonly Mail = Mail;
    readonly Phone = Phone;
    readonly IndianRupee = IndianRupee;
    readonly CreditCard = CreditCard;

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
    newStatus: OrderStatus | '' = '';
    statusMessage: string = '';

    statusOptions: OrderStatus[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'];

    get filteredOrders(): Order[] {
        return this.orders.filter(order => {
            // Search
            const searchLower = this.searchTerm.toLowerCase();
            const matchesSearch = !this.searchTerm ||
                order.id.toLowerCase().includes(searchLower) ||
                order.user?.name.toLowerCase().includes(searchLower) ||
                order.user?.email.toLowerCase().includes(searchLower) ||
                order.deliveryPhone?.includes(searchLower);

            // Status
            const matchesStatus = this.statusFilter === 'All' || order.status === this.statusFilter;

            // Date Range
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

    get paginatedOrders(): Order[] {
        return this.orders;
    }

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
            this.toastService.error('Failed to load orders');
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

    applyFilters() {
        this.currentPage = 1;
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadOrders();
    }

    openStatusModal(order: Order) {
        if (!this.authService.hasPermission(this.PERMISSIONS.UPDATE_ORDER)) {
            this.toastService.error('You do not have permission to update orders');
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
        if (!this.selectedOrder || !this.newStatus) {
            this.toastService.warning('Please select a status');
            return;
        }

        this.isUpdating = true;
        try {
            await this.orderService.updateOrderStatus(
                this.selectedOrder.id,
                this.newStatus,
                this.statusMessage || undefined
            );
            this.toastService.success('Order status updated successfully');
            this.closeStatusModal();
            await this.loadOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
            this.toastService.error('Failed to update order status');
        } finally {
            this.isUpdating = false;
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

    getStatusIcon(status: string) {
        const icons: Record<string, any> = {
            'Pending': this.Clock,
            'Confirmed': this.Check,
            'Packaging': this.Package,
            'Dispatched': this.Truck,
            'Delivered': this.Check,
            'Cancelled': this.X
        };
        return icons[status] || this.AlertCircle;
    }

    getTruncatedId(id: string): string {
        return id.substring(0, 8);
    }
}
