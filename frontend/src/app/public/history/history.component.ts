import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/api/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {

  orders: Order[] = [];
  // Mock current user ID for demonstration
  currentUserId = 'u1';

  constructor(private orderService: OrderService) { }

  async ngOnInit() {
    this.orders = await this.orderService.getMyOrders();
  }
}
