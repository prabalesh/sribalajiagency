import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/store/cart.service';
import { SettingsService } from '../../core/services/api/settings.service';
import { OrderService } from '../../core/services/api/order.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LucideAngularModule, Trash2, Minus, Plus, Truck, Lock, ShieldCheck, CreditCard, Banknote, CheckCircle, Sparkles, ArrowLeft, ShoppingBag, TrendingUp, Tag, ShoppingCart } from 'lucide-angular';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  cartService = inject(CartService);

  // Register Lucide icons
  readonly Trash2 = Trash2;
  readonly Minus = Minus;
  readonly Plus = Plus;
  readonly Truck = Truck;
  readonly Lock = Lock;
  readonly ShieldCheck = ShieldCheck;
  readonly CreditCard = CreditCard;
  readonly Banknote = Banknote;
  readonly CheckCircle = CheckCircle;
  readonly Sparkles = Sparkles;
  readonly ArrowLeft = ArrowLeft;
  readonly ShoppingBag = ShoppingBag;
  readonly TrendingUp = TrendingUp;
  readonly Tag = Tag;
  readonly ShoppingCart = ShoppingCart;

  settings: any;
  selectedPayment: 'online' | 'cod' | '' = '';
  isCheckoutMode = false;

  // Delivery information
  deliveryAddress: string = '';
  deliveryPhone: string = '';
  deliveryNotes: string = '';
  isProcessingOrder = false;

  async ngOnInit() {
    this.settings = await this.settingsService.getStoreSettings();
  }

  get allowedMethods() {
    if (!this.settings) return [];

    let methods = [];
    if (this.settings.allowOnline) methods.push('online');
    if (this.settings.allowCod) methods.push('cod');

    const items = this.cartService.items();
    for (const item of items) {
      if (item.product.allowedPaymentMethods) {
        methods = methods.filter(m => item.product.allowedPaymentMethods?.includes(m));
      }
    }
    return methods;
  }

  updateQty(productId: string, delta: number, currentQty: number) {
    this.cartService.updateQuantity(productId, currentQty + delta);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  async proceedToCheckout() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      alert('Please login to proceed with checkout');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    if (this.allowedMethods.length === 0) {
      alert('No compatible payment method found for this combination of products. Please contact support.');
      return;
    }
    this.isCheckoutMode = true;
  }

  async finalizeOrder() {
    if (!this.selectedPayment) {
      alert('Please select a payment method');
      return;
    }

    if (!this.deliveryAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }

    if (!this.deliveryPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    this.isProcessingOrder = true;

    try {
      const items = this.cartService.items().map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price || 0,
        quantity: item.quantity
      }));

      const order = await this.orderService.createOrder({
        items,
        paymentMethod: this.selectedPayment,
        deliveryAddress: this.deliveryAddress,
        deliveryPhone: this.deliveryPhone,
        deliveryNotes: this.deliveryNotes
      });

      // Clear cart
      this.cartService.clearCart();

      // Navigate to order confirmation
      this.router.navigate(['/order-confirmation', order.id]);
    } catch (error: any) {
      console.error('Order creation failed:', error);
      alert(error.message || 'Failed to create order. Please try again.');
    } finally {
      this.isProcessingOrder = false;
    }
  }
}
