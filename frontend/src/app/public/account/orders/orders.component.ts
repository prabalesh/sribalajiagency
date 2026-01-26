import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { OrderService } from '../../../core/services/api/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  authService = inject(AuthService);
  orderService = inject(OrderService);

  orders: any[] = [];

  async ngOnInit() {
    this.orders = await this.orderService.getMyOrders();
  }

  logout() {
    this.authService.logout();
  }
}
