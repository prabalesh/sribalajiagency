import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/api/order.service';
import { Order, OrderStatusHistory } from '../../../core/models/order.model';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceComponent } from '../../../shared/components/invoice/invoice.component';
import { 
    LucideAngularModule, 
    ArrowLeft,
    Printer,
    Package,
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    ShoppingCart,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    AlertCircle,
    IndianRupee,
    Calendar
} from 'lucide-angular';

@Component({
    selector: 'app-admin-order-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, InvoiceComponent, LucideAngularModule],
    templateUrl: './order-detail.component.html',
    styleUrl: './order-detail.component.scss'
})
export class AdminOrderDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);
    private toastService = inject(ToastService);

    // Icon references
    readonly ArrowLeft = ArrowLeft;
    readonly Printer = Printer;
    readonly Package = Package;
    readonly User = User;
    readonly Mail = Mail;
    readonly Phone = Phone;
    readonly MapPin = MapPin;
    readonly FileText = FileText;
    readonly ShoppingCart = ShoppingCart;
    readonly Clock = Clock;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Truck = Truck;
    readonly AlertCircle = AlertCircle;
    readonly IndianRupee = IndianRupee;
    readonly Calendar = Calendar;

    order: Order | null = null;
    orderHistory: OrderStatusHistory[] = [];
    isLoading = true;

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            await this.loadOrder(id);
        }
    }

    async loadOrder(id: string) {
        this.isLoading = true;
        try {
            this.order = await this.orderService.getOrderById(id);
            if (this.order) {
                this.orderHistory = this.order.statusHistory || [];
                this.orderHistory.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            }
        } catch (error) {
            console.error('Failed to load order:', error);
            this.toastService.error('Failed to load order details');
        } finally {
            this.isLoading = false;
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
            'Confirmed': this.CheckCircle,
            'Packaging': this.Package,
            'Dispatched': this.Truck,
            'Delivered': this.CheckCircle,
            'Cancelled': this.XCircle
        };
        return icons[status] || this.AlertCircle;
    }

    getTruncatedId(id: string): string {
        return id.substring(0, 8);
    }

    printInvoice() {
        window.print();
    }

    getTotalItems(): number {
        if (!this.order?.items) return 0;
        return this.order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
}
