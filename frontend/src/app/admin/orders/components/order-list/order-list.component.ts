import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, CreditCard, IndianRupee, Eye, Edit, User, Calendar, ShoppingCart, AlertCircle, Clock, Check, Package, Truck, X } from 'lucide-angular';
import { Order } from '../../../../core/models/order.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { APP_PERMISSIONS } from '../../../../core/constants/permissions.constants';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, PaginationComponent],
    templateUrl: './order-list.component.html',
    styleUrl: './order-list.component.scss'
})
export class OrderListComponent {
    public authService = inject(AuthService);
    readonly PERMISSIONS = APP_PERMISSIONS;

    @Input({ required: true }) orders: Order[] = [];
    @Input() isLoading = false;
    @Input({ required: true }) totalItems = 0;
    @Input({ required: true }) itemsPerPage = 10;
    @Input({ required: true }) currentPage = 1;

    @Output() edit = new EventEmitter<Order>();
    @Output() pageChange = new EventEmitter<number>();

    // Icons
    readonly CreditCard = CreditCard;
    readonly IndianRupee = IndianRupee;
    readonly Eye = Eye;
    readonly Edit = Edit;
    readonly User = User;
    readonly Calendar = Calendar;
    readonly ShoppingCart = ShoppingCart;
    readonly AlertCircle = AlertCircle;
    readonly Clock = Clock;
    readonly Check = Check;
    readonly Package = Package;
    readonly Truck = Truck;
    readonly X = X;

    onEdit(order: Order) {
        this.edit.emit(order);
    }

    onPageChange(page: number) {
        this.pageChange.emit(page);
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
