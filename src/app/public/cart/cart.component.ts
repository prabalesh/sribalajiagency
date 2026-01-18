import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  cartService = inject(CartService);

  updateQty(productId: string, delta: number, currentQty: number) {
    this.cartService.updateQuantity(productId, currentQty + delta);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }
}
