import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Printer, Package, MapPin, CreditCard, StickyNote, CheckCircle2, Clock, ExternalLink } from 'lucide-angular';
import { OrderService } from '../../../../core/services/api/order.service';
import { Order, OrderStatusHistory } from '../../../../core/models/order.model';
import { InvoiceComponent } from '../../../../shared/components/invoice/invoice.component';

@Component({
  selector: 'app-user-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, InvoiceComponent, LucideAngularModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class UserOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  // Lucide icons
  readonly ArrowLeft = ArrowLeft;
  readonly Printer = Printer;
  readonly Package = Package;
  readonly MapPin = MapPin;
  readonly CreditCard = CreditCard;
  readonly StickyNote = StickyNote;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly ExternalLink = ExternalLink;

  order: Order | null = null;
  orderHistory: OrderStatusHistory[] = [];
  isLoading = true;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.order = await this.orderService.getOrderById(id);

        if (this.order) {
          this.orderHistory = this.order.statusHistory || [];
          this.orderHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (error) {
        console.error('Failed to load order details:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  viewProduct(productId: string) {
    this.router.navigate(['/products/detail', productId]);
  }

  printInvoice() {
    window.print();
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

  getProgressSteps() {
    const steps = [
      { status: 'Pending', label: 'Placed', index: 1 },
      { status: 'Confirmed', label: 'Confirmed', index: 2 },
      { status: 'Packaging', label: 'Packed', index: 3 },
      { status: 'Dispatched', label: 'Shipped', index: 4 },
      { status: 'Delivered', label: 'Delivered', index: 5 }
    ];

    return steps.map(step => {
      const historyEntry = this.orderHistory.find(h => h.status === step.status);
      const isCurrent = this.order?.status === step.status;

      const orderStatusIndex = steps.findIndex(s => s.status === this.order?.status);
      const stepIndex = steps.findIndex(s => s.status === step.status);

      const completed = orderStatusIndex >= stepIndex;

      return {
        ...step,
        completed,
        active: isCurrent,
        date: historyEntry?.createdAt,
        message: historyEntry?.message
      };
    });
  }
}
