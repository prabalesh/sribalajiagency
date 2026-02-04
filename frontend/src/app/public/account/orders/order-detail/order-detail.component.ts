import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../../core/services/api/order.service';
import { Order, OrderStatusHistory } from '../../../../core/models/order.model';

@Component({
  selector: 'app-user-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="order-detail-page container">
      @if (isLoading) {
        <div class="loading">Loading order details...</div>
      } @else if (order) {
        <header class="page-header">
          <a routerLink="/account/orders" class="back-link">← Back to Orders</a>
          <div class="header-content">
            <h1>Order #{{ order.id.substring(0, 8) }}</h1>
            <span class="status-badge" [ngClass]="getStatusColor(order.status)">{{ order.status }}</span>
          </div>
          <p class="date">Placed on {{ order.createdAt | date:'medium' }}</p>
        </header>


          <!-- Progress Bar -->
          <div class="glass-card full-width">
            <div class="progress-track">
                @for (step of getProgressSteps(); track step.status) {
                    <div class="progress-step" [class.completed]="step.completed" [class.active]="step.active">
                        <div class="step-icon" [title]="step.message || ''">
                            @if (step.completed) { ✓ } @else { {{ step.index }} }
                        </div>
                        <div class="step-label">{{ step.label }}</div>
                        <div class="step-date">{{ step.date | date:'shortDate' }}</div>
                        @if (step.message) {
                          <div class="step-message">{{ step.message }}</div>
                        }
                    </div>
                }
            </div>
          </div>
          
          <div class="content-grid">
            <!-- Left Column: Items & Info -->
            <div class="main-info">
            <!-- Items List -->
            <section class="glass-card items-section">
              <h2>Items</h2>
              <div class="items-list">
                @for (item of order.items; track item.productId) {
                  <div class="item-row clickable" (click)="viewProduct(item.productId)">
                    <div class="item-details">
                      <h3>
                        {{ item.productName }}
                        @if (item.variantName) {
                          <span class="variant-info">({{ item.variantName }})</span>
                        }
                      </h3>
                      <p>Quantity: {{ item.quantity }}</p>
                    </div>
                    <div class="item-price">
                      ₹{{ item.price * item.quantity | number }}
                    </div>
                  </div>
                }
              </div>
              <div class="order-total">
                <span>Total Amount</span>
                <span class="amount">₹{{ order.totalAmount | number }}</span>
              </div>
            </section>

            <!-- Delivery & Payment -->
            <section class="glass-card info-section">
              <div class="info-block">
                <h3>Delivery Address</h3>
                <p>{{ order.deliveryAddress }}</p>
                <p><strong>Phone:</strong> {{ order.deliveryPhone }}</p>
              </div>
              <div class="info-block">
                <h3>Payment Method</h3>
                <p>{{ order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery' }}</p>
              </div>
              @if (order.deliveryNotes) {
                <div class="info-block full-width">
                  <h3>Delivery Notes</h3>
                  <p>{{ order.deliveryNotes }}</p>
                </div>
              }
            </section>
          </div>

          <!-- Right Column: Timeline -->
          <aside class="timeline-sidebar glass-card">
            <h2>Order History</h2>
            <div class="timeline">
              @for (event of orderHistory; track event.id; let last = $last) {
                <div class="timeline-item" [class.latest]="last">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <h4>{{ event.status }}</h4>
                    <p class="time">{{ event.createdAt | date:'short' }}</p>
                    <p class="message">{{ event.message }}</p>
                  </div>
                </div>
              }
            </div>
          </aside>
        </div>
      } @else {
        <div class="error-state">
          <p>Order not found.</p>
          <a routerLink="/account/orders" class="btn-primary">Back to Orders</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-detail-page {
      padding-top: 2rem;
      padding-bottom: 4rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      display: inline-block;
      &:hover { color: var(--primary-color); }
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      
      h1 { margin: 0; font-size: clamp(1.25rem, 5vw, 1.75rem); color: var(--text-color); word-break: break-all; }
    }

    .date { color: var(--text-color-muted); margin: 0 0 1.5rem; font-size: 0.9rem; }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      
      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

    .glass-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      @media (max-width: 600px) {
        padding: 1rem;
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--surface-color-secondary);
      border-radius: 0.75rem;
      transition: background-color 0.2s;

      @media (max-width: 480px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      &.clickable {
        cursor: pointer;
        &:hover { background: var(--border-color); }
      }

      h3 { margin: 0 0 0.25rem; font-size: 0.95rem; color: var(--text-color); }
      p { margin: 0; color: var(--text-color-muted); font-size: 0.85rem; }
      .item-price { font-weight: 600; color: var(--text-color); }
    }

    .order-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
      
      h3 { font-size: 0.9rem; color: var(--text-color-muted); margin: 0 0 0.5rem; text-transform: uppercase; }
      p { margin: 0; color: var(--text-color); }
    }

    /* Progress Bar Styles */
    .progress-track {
        display: flex;
        justify-content: space-between;
        position: relative;
        margin-bottom: 2rem;
        padding: 0 1rem;

        @media (max-width: 768px) {
            overflow-x: auto;
            padding-bottom: 1.5rem;
            justify-content: flex-start;
            gap: 2rem;
            
            &::-webkit-scrollbar {
                height: 4px;
            }
            &::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 4px;
            }
        }
        
        &::before {
            content: '';
            position: absolute;
            top: 17px;
            left: 2rem;
            right: 2rem;
            height: 4px;
            background: var(--border-color);
            z-index: 0;

            @media (max-width: 768px) {
                width: 500px;
                left: 1rem;
            }
        }
    }

    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        z-index: 1;
        width: 100px;
        flex-shrink: 0;
        text-align: center;
        
        .step-icon {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: var(--surface-card);
            border: 2px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
            transition: all 0.3s;
            font-weight: bold;
            color: var(--text-color-muted);
        }
        
        .step-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-color-muted);
            margin-bottom: 0.25rem;
        }
        
        .step-date {
            font-size: 0.75rem;
            color: var(--text-color-muted);
            font-style: italic;
        }
        
        &.active, &.completed {
            .step-icon {
                border-color: var(--primary-color);
                background: var(--primary-color);
                color: white;
                box-shadow: 0 0 0 4px rgba(var(--primary-color-rgb), 0.2);
            }
            .step-label { color: var(--text-color); }
        }
    }

    .step-message {
        position: absolute;
        top: 100%;
        margin-top: 1.5rem;
        width: 150px;
        background: var(--surface-card);
        border: 1px solid var(--border-color);
        padding: 0.5rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        box-shadow: var(--shadow-sm);
        display: none;
        z-index: 10;
    }

    .progress-step:hover .step-message {
        display: block;
    }

    .info-block.full-width {
        grid-column: 1 / -1;
        border-top: 1px solid var(--border-color);
        padding-top: 1rem;
        margin-top: 0.5rem;
    }

    .timeline-sidebar {
        h2 { margin-top: 0; font-size: 1.2rem; margin-bottom: 1rem; }
    }

    .timeline {
      position: relative;
      padding-left: 1rem;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.5rem;
        bottom: 0;
        width: 2px;
        background: var(--border-color);
      }
    }

    .timeline-item {
      position: relative;
      padding-left: 1.5rem;
      padding-bottom: 1.5rem;

      &:last-child { padding-bottom: 0; }

      .timeline-marker {
        position: absolute;
        left: -0.35rem;
        top: 0.25rem;
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 50%;
        background: var(--text-secondary);
        border: 2px solid var(--surface-card);
      }

      &.latest .timeline-marker {
        background: var(--primary-color);
        box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.2);
      }

      h4 { margin: 0 0 0.25rem; color: var(--text-primary); font-size: 0.95rem; }
      .time { margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.8rem; }
      .message { margin: 0; color: var(--text-primary); font-size: 0.9rem; background: var(--surface-ground); padding: 0.75rem; border-radius: 0.5rem; }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.warning { background: rgba(255, 193, 7, 0.15); color: #ffc107; }
      &.info { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
      &.primary { background: rgba(var(--primary-rgb), 0.15); color: var(--primary-color); }
      &.success { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
      &.danger { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    }
  `]
})
export class UserOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  order: Order | null = null;
  orderHistory: OrderStatusHistory[] = [];
  isLoading = true;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        // Fetch order details
        this.order = await this.orderService.getOrderById(id);

        // Ensure items and history are populated
        if (this.order) {
          this.orderHistory = this.order.statusHistory || [];
          // Sort history descending (newest first) for display
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

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': 'warning', 'Confirmed': 'info', 'Packaging': 'info',
      'Dispatched': 'primary', 'Delivered': 'success', 'Cancelled': 'danger'
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

    let currentFound = false;

    return steps.map(step => {
      // Check if this step exists in history
      const historyEntry = this.orderHistory.find(h => h.status === step.status);
      const isCurrent = this.order?.status === step.status;

      // Logic for completed: if we found a history entry OR we passed this stage
      let completed = !!historyEntry;

      // If we find the current status, all previous are completed
      if (this.order?.status === step.status) currentFound = true;

      // Simple logic: if order status is 'Delivered', everything before is done
      const orderStatusIndex = steps.findIndex(s => s.status === this.order?.status);
      const stepIndex = steps.findIndex(s => s.status === step.status);

      if (orderStatusIndex >= stepIndex) completed = true;

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
