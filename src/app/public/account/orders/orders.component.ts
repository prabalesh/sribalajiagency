import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  authService = inject(AuthService);

  // Mock orders specific to the user
  orders = [
    {
      id: 'ORD-82741',
      date: new Date('2024-01-15'),
      total: 124900,
      status: 'Delivered',
      items: [
        { name: 'Sony Bravia XR 65"', qty: 1, price: 124900 }
      ]
    },
    {
      id: 'ORD-71922',
      date: new Date('2023-12-20'),
      total: 24500,
      status: 'Shipped',
      items: [
        { name: 'Bosch Drill GSB 18V', qty: 1, price: 15500 },
        { name: 'Philips Airfryer', qty: 1, price: 9000 }
      ]
    }
  ];

  logout() {
    this.authService.logout();
  }
}
