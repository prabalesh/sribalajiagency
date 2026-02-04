import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../core/services/api/order.service';
import { Order, OrderStatusHistory } from '../../../core/models/order.model';

@Component({
   selector: 'app-admin-order-detail',
   standalone: true,
   imports: [CommonModule, RouterModule],
   template: `
    <div class="admin-order-detail-page">
      @if (isLoading) {
        <div class="loading">Loading order...</div>
      } @else if (order) {
        <header class="page-header">
          <div class="header-left">
            <a routerLink="/dashboard/orders" class="back-link">← Back to Orders</a>
            <h1>Order #{{ order.id.substring(0, 8) }}</h1>
          </div>
          <div class="header-right">
             <span class="status-badge" [ngClass]="getStatusColor(order.status)">{{ order.status }}</span>
          </div>
        </header>

        <div class="content-grid">
           <!-- Customer & Order Info -->
           <section class="glass-card info-card">
              <h2>Customer Information</h2>
              <div class="info-row">
                 <div class="info-group">
                    <label>Name</label>
                    <p>{{ order.user?.name || 'Guest' }}</p>
                 </div>
                 <div class="info-group">
                    <label>Email</label>
                    <p>{{ order.user?.email }}</p>
                 </div>
                 <div class="info-group">
                    <label>Phone</label>
                    <p>{{ order.deliveryPhone }}</p>
                 </div>
              </div>
           </section>

           <section class="glass-card info-card">
              <h2>Delivery Details</h2>
              <p class="address">{{ order.deliveryAddress }}</p>
              @if (order.deliveryNotes) {
                <p class="notes"><strong>Notes:</strong> {{ order.deliveryNotes }}</p>
              }
           </section>

           <!-- Items -->
           <section class="glass-card items-card">
              <h2>Order Items</h2>
              <table class="items-table">
                 <thead>
                    <tr>
                       <th>Product</th>
                       <th>Price</th>
                       <th>Qty</th>
                       <th>Total</th>
                    </tr>
                 </thead>
                 <tbody>
                    @for (item of order.items; track item.productId) {
                       <tr>
                           <td>{{ item.productName }}<br><small *ngIf="item.variantName" style="color: var(--text-secondary)">({{ item.variantName }})</small></td>
                          <td>₹{{ item.price | number }}</td>
                          <td>{{ item.quantity }}</td>
                          <td>₹{{ item.price * item.quantity | number }}</td>
                       </tr>
                    }
                 </tbody>
                 <tfoot>
                    <tr>
                       <td colspan="3" class="total-label">Total Amount</td>
                       <td class="total-amount">₹{{ order.totalAmount | number }}</td>
                    </tr>
                 </tfoot>
              </table>
           </section>

           <!-- Timeline -->
           <section class="glass-card timeline-card">
              <h2>Status History</h2>
              <div class="timeline">
                 @for (event of orderHistory; track event.id) {
                    <div class="timeline-item">
                       <span class="time">{{ event.createdAt | date:'medium' }}</span>
                       <span class="status">{{ event.status }}</span>
                       <span class="message">{{ event.message }}</span>
                       <span class="user" *ngIf="event.changedBy">by {{ event.changedBy.name }}</span>
                    </div>
                 }
              </div>
           </section>
        </div>

      } @else {
        <div class="error">Order not found</div>
      }
    </div>
  `,
   styles: [`
    .admin-order-detail-page { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .back-link { display: block; margin-bottom: 0.5rem; text-decoration: none; color: var(--text-secondary); }
    h1 { margin: 0; color: var(--text-primary); }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .items-card, .timeline-card { grid-column: 1 / -1; }

    .glass-card { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; }
    h2 { font-size: 1.1rem; margin: 0 0 1rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }

    .info-row { display: flex; gap: 2rem; }
    .info-group label { font-size: 0.8rem; color: var(--text-secondary); display: block; }
    .info-group p { margin: 0; font-weight: 500; color: var(--text-primary); }
    
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { text-align: left; color: var(--text-secondary); padding: 0.5rem; font-weight: 500; }
    .items-table td { padding: 0.75rem 0.5rem; border-top: 1px solid var(--border-color); color: var(--text-primary); }
    .total-amount { font-weight: 700; font-size: 1.1rem; }

    .timeline-item { display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; align-items: center; }
    .timeline-item:last-child { border-bottom: none; }
    .time { color: var(--text-secondary); min-width: 150px; }
    .status { font-weight: 600; min-width: 100px; color: var(--primary-color); }
    .message { flex: 1; color: var(--text-primary); }
    .user { color: var(--text-secondary); font-style: italic; font-size: 0.8rem; }

    .status-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.85rem; font-weight: 600; background: var(--surface-hover); }
    .status-badge.info { color: #2196f3; background: rgba(33, 150, 243, 0.1); }
    .status-badge.success { color: #4caf50; background: rgba(76, 175, 80, 0.1); }
    .status-badge.warning { color: #ffc107; background: rgba(255, 193, 7, 0.1); }
  `]
})
export class AdminOrderDetailComponent implements OnInit {
   private route = inject(ActivatedRoute);
   private orderService = inject(OrderService);

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
            console.error('Failed to load order:', error);
         } finally {
            this.isLoading = false;
         }
      }
   }

   getStatusColor(status: string): string {
      const colors: Record<string, string> = {
         'Pending': 'warning', 'Confirmed': 'info', 'Packaging': 'info',
         'Dispatched': 'primary', 'Delivered': 'success', 'Cancelled': 'danger'
      };
      return colors[status] || 'secondary';
   }
}
