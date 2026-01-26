import { Component, OnInit, inject } from '@angular/core';
import { ProductService } from '../../core/services/api/product.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { OrderService } from '../../core/services/api/order.service';
import { QuotationService } from '../../core/services/api/quotation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private quotationService = inject(QuotationService);

  stats = [
    { label: 'Products', value: 0, icon: '📦', color: '#ff3e00' },
    { label: 'Orders', value: 0, icon: '🛒', color: '#ffa500' },
    { label: 'Customers', value: 0, icon: '👥', color: '#4caf50' },
    { label: 'Quotations', value: 0, icon: '📄', color: '#2196f3' }
  ];

  async ngOnInit() {
    const [products, orders, users, quotes] = await Promise.all([
      this.productService.getProducts(),
      this.orderService.getAllOrders(),
      this.authService.getUsers(),
      this.quotationService.getRequests()
    ]);

    this.stats[0].value = products.length;
    this.stats[1].value = orders.length;
    this.stats[2].value = users.length;
    this.stats[3].value = quotes.length;
  }
}

