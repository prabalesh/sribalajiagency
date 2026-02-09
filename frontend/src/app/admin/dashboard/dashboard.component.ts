import { Component, OnInit, inject, computed } from '@angular/core';
import { ProductService } from '../../core/services/api/product.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { OrderService } from '../../core/services/api/order.service';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LucideAngularModule, Package, ShoppingCart, Users, FileText } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  
  isLoading = false;

  // Icon references
  readonly Package = Package;
  readonly ShoppingCart = ShoppingCart;
  readonly Users = Users;
  readonly FileText = FileText;

  stats = [
    { 
      label: 'Products', 
      value: 0, 
      icon: this.Package, 
      color: 'primary', 
      bgColor: 'rgba(var(--primary-color-rgb), 0.1)',
      perm: 'VIEW_PRODUCTS' 
    },
    { 
      label: 'Orders', 
      value: 0, 
      icon: this.ShoppingCart, 
      color: 'warning', 
      bgColor: 'rgba(var(--warning-color-rgb), 0.1)',
      perm: 'VIEW_ORDERS' 
    },
    { 
      label: 'Customers', 
      value: 0, 
      icon: this.Users, 
      color: 'success', 
      bgColor: 'rgba(var(--success-color-rgb), 0.1)',
      perm: 'VIEW_USERS' 
    }
  ];

  filteredStats = computed(() => {
    return this.stats.filter(s => !s.perm || this.authService.hasPermission(s.perm));
  });

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      const [products, orders, users] = await Promise.all([
        this.authService.hasPermission('VIEW_PRODUCTS') 
          ? this.productService.getProducts() 
          : Promise.resolve({ total: 0 }),
        this.authService.hasPermission('VIEW_ORDERS') 
          ? this.orderService.getAllOrders() 
          : Promise.resolve({ total: 0, items: [] }),
        this.authService.hasPermission('VIEW_USERS') 
          ? this.authService.getUsers() 
          : Promise.resolve({ total: 0, items: [] }),
      ]);

      this.stats[0].value = products.total || 0;
      this.stats[1].value = (orders as any).total || (orders as any).length || 0;
      this.stats[2].value = (users as any).total || (users as any).length || 0;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
