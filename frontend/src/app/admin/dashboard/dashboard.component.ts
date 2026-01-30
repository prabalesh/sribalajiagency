import { Component, OnInit, inject, computed } from '@angular/core';
import { ProductService } from '../../core/services/api/product.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { OrderService } from '../../core/services/api/order.service';
import { QuotationService } from '../../core/services/api/quotation.service';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private quotationService = inject(QuotationService);
  isLoading = false;


  stats = [
    { label: 'Products', value: 0, icon: '📦', color: 'var(--primary-color)', perm: 'VIEW_PRODUCTS' },
    { label: 'Orders', value: 0, icon: '🛒', color: 'var(--warning-color)', perm: 'VIEW_ORDERS' },
    { label: 'Customers', value: 0, icon: '👥', color: 'var(--success-color)', perm: 'VIEW_USERS' },
    { label: 'Quotations', value: 0, icon: '📄', color: 'var(--info-color)', perm: 'VIEW_QUOTATIONS' }
  ];

  filteredStats = computed(() => {
    return this.stats.filter(s => !s.perm || this.authService.hasPermission(s.perm));
  });

  async ngOnInit() {
    this.isLoading = true;
    try {
      const [products, orders, users, quotes] = await Promise.all([
        this.authService.hasPermission('VIEW_PRODUCTS') ? this.productService.getProducts() : Promise.resolve({ total: 0 }),
        this.authService.hasPermission('VIEW_ORDERS') ? this.orderService.getAllOrders() : Promise.resolve({ total: 0, items: [] }),
        this.authService.hasPermission('VIEW_USERS') ? this.authService.getUsers() : Promise.resolve({ total: 0, items: [] }),
        this.authService.hasPermission('VIEW_QUOTATIONS') ? this.quotationService.getRequests() : Promise.resolve([])
      ]);

      this.stats[0].value = products.total;
      // @ts-ignore - type mismatch fix
      this.stats[1].value = orders.total || orders.length || 0;
      // @ts-ignore - type mismatch fix
      this.stats[2].value = users.total || users.length || 0;
      this.stats[3].value = quotes.length;
    } finally {
      this.isLoading = false;
    }
  }
}
