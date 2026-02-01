import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { OrderService } from '../../../core/services/api/order.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountSidebarComponent } from '../../../shared/components/account-sidebar/account-sidebar.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AccountSidebarComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  authService = inject(AuthService);
  orderService = inject(OrderService);
  private router = inject(Router);

  orders: Order[] = [];
  isLoading = true;

  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;

  get totalPages() {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages either side of current

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const range: (number | string)[] = [];
    const rangeStart = Math.max(2, current - delta);
    const rangeEnd = Math.min(total - 1, current + delta);

    range.push(1);

    if (rangeStart > 2) {
      range.push('...');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      range.push(i);
    }

    if (rangeEnd < total - 1) {
      range.push('...');
    }

    range.push(total);

    return range;
  }

  // Filters
  statusFilter: OrderStatus | 'All' = 'All';
  searchQuery: string = '';
  statusOptions: OrderStatus[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'];

  get filteredOrders() {
    return this.orders.filter(order => {
      const matchesStatus = this.statusFilter === 'All' || order.status === this.statusFilter;
      const matchesSearch = !this.searchQuery ||
        order.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;
    try {
      const status = this.statusFilter === 'All' ? undefined : this.statusFilter;
      const res = await this.orderService.getMyOrders(this.currentPage, this.itemsPerPage, status);
      this.orders = res.items;
      this.totalItems = res.total;
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async filterOrders() {
    this.currentPage = 1;
    await this.loadOrders();
  }

  async onPageChange(page: number | string) {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    await this.loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewProduct(productId: string) {
    this.router.navigate(['/products/detail', productId]);
  }

  getProgressSteps(order: Order) {
    const steps = [
      { status: 'Pending', label: 'Placed', index: 1 },
      { status: 'Confirmed', label: 'Confirmed', index: 2 },
      { status: 'Packaging', label: 'Packed', index: 3 },
      { status: 'Dispatched', label: 'Shipped', index: 4 },
      { status: 'Delivered', label: 'Delivered', index: 5 }
    ];

    let currentFound = false;
    const history = order.statusHistory || [];

    return steps.map(step => {
      const historyEntry = history.find(h => h.status === step.status);
      const isCurrent = order.status === step.status;
      let completed = !!historyEntry;

      if (order.status === step.status) currentFound = true;

      const orderStatusIndex = steps.findIndex(s => s.status === order.status);
      const stepIndex = steps.findIndex(s => s.status === step.status);

      if (orderStatusIndex >= stepIndex) completed = true;

      return {
        ...step,
        completed,
        active: isCurrent,
        date: historyEntry?.createdAt
      };
    });
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
