import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/store/cart.service';
import { SettingsService } from '../../core/services/api/settings.service';
import { OrderService } from '../../core/services/api/order.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { AddressService } from '../../core/services/api/address.service';
import { LocationService } from '../../core/services/api/location.service';
import { ToastService } from '../../core/services/toast.service';
import { Address } from '../../core/models/address.model';
import { LucideAngularModule, Trash2, Minus, Plus, Truck, Lock, ShieldCheck, CreditCard, Banknote, CheckCircle, Sparkles, ArrowLeft, ShoppingBag, TrendingUp, Tag, ShoppingCart, MapPin, Phone, Home, Briefcase, PlusCircle, XCircle } from 'lucide-angular';

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
  private addressService = inject(AddressService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  cartService = inject(CartService);
  private toastService = inject(ToastService);

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
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly Home = Home;
  readonly Briefcase = Briefcase;
  readonly PlusCircle = PlusCircle;
  readonly XCircle = XCircle;

  settings: any;
  selectedPayment: 'online' | 'cod' | '' = '';
  isCheckoutMode = false;

  // Delivery information
  addresses: Address[] = [];
  selectedAddressId: string = '';
  isLocationEligible = false;
  checkingEligibility = false;


  deliveryNotes: string = '';
  isProcessingOrder = false;
  taxBreakdown: any = null;

  private route = inject(ActivatedRoute);

  async ngOnInit() {
    this.settings = await this.settingsService.getStoreSettings();

    // Check if we should auto-open checkout (e.g. after returning from addresses)
    if (this.route.snapshot.queryParams['checkout'] === 'true') {
      setTimeout(() => this.proceedToCheckout(), 100);
    }
  }

  get allowedMethods() {
    console.log('Calculating allowed payment methods...', this.settings);
    if (!this.settings) return [];

    let methods = [];
    if (this.settings.allowOnline) methods.push('online');
    if (this.settings.allowCod) methods.push('cod');
    console.log('Initial allowed methods from settings:', methods);

    const items = this.cartService.items();
    console.log('Cart items:', items);
    // Note: Payment method filtering by product is removed since we don't have product objects
    // This should be handled on the backend during validation if needed

    const uniqueMethods = Array.from(new Set(methods));
    console.log('Allowed payment methods based on settings:', uniqueMethods);
    return methods;
  }

  updateQty(productId: string, delta: number, currentQty: number, variantId?: string) {
    this.cartService.updateQuantity(productId, currentQty + delta, variantId);
    if (this.isCheckoutMode) this.recalculateTax();
  }

  removeItem(productId: string, variantId?: string) {
    this.cartService.removeFromCart(productId, variantId);
    if (this.isCheckoutMode) this.recalculateTax();
  }

  async proceedToCheckout() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.toastService.warning('Please login to proceed with checkout');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    if (this.allowedMethods.length === 0) {
      this.toastService.error('No compatible payment method found for this combination of products. Please contact support.');
      return;
    }

    // Load addresses
    try {
      this.addresses = await this.addressService.getAddresses();
      const defaultAddress = this.addresses.find(a => a.isDefault);
      if (defaultAddress) {
        this.selectedAddressId = defaultAddress.id;
        await this.checkEligibility(defaultAddress);
      } else if (this.addresses.length > 0) {
        this.selectedAddressId = this.addresses[0].id;
        await this.checkEligibility(this.addresses[0]);
      } else {
        this.navigateToAddresses();
        return;
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }

    this.isCheckoutMode = true;
    this.recalculateTax();
  }

  async selectAddress(address: Address) {
    this.selectedAddressId = address.id;
    await this.checkEligibility(address);
    this.recalculateTax();
  }

  async checkEligibility(address: Address) {
    this.checkingEligibility = true;
    try {
      this.isLocationEligible = await this.locationService.checkLocation(address.state, address.city, address.zip);
    } catch (error) {
      console.error('Eligibility check failed:', error);
      this.isLocationEligible = false;
    } finally {
      this.checkingEligibility = false;
    }
  }

  async recalculateTax() {
    const selectedAddress = this.addresses.find(a => a.id === this.selectedAddressId);
    if (!selectedAddress) return;

    const items = this.cartService.items().map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity
    }));

    try {
      this.taxBreakdown = await this.orderService.calculateTax(items, selectedAddress.state);
    } catch (e) {
      console.error('Tax calculation failed:', e);
    }
  }

  navigateToAddresses() {
    this.router.navigate(['/account/addresses'], {
      queryParams: {
        returnUrl: '/cart',
        checkout: 'true',
        action: 'add'
      }
    });
  }


  async finalizeOrder() {
    if (!this.selectedPayment) {
      this.toastService.warning('Please select a payment method');
      return;
    }

    const selectedAddress = this.addresses.find(a => a.id === this.selectedAddressId);
    if (!selectedAddress) {
      this.toastService.warning('Please select a delivery address');
      return;
    }

    if (!this.isLocationEligible) {
      this.toastService.error('Sorry, we do not deliver to this location yet.');
      return;
    }

    this.isProcessingOrder = true;

    try {
      const items = this.cartService.items().map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        price: item.price,
        quantity: item.quantity
      }));

      const deliveryAddressStr = `${selectedAddress.name}, ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.zip}`;

      const order = await this.orderService.createOrder({
        items,
        paymentMethod: this.selectedPayment,
        deliveryAddress: deliveryAddressStr,
        deliveryPhone: selectedAddress.phonePrimary || '',
        deliveryState: selectedAddress.state,
        deliveryNotes: this.deliveryNotes
      });

      // Clear cart
      this.cartService.clearCart();

      // Navigate to order confirmation
      this.router.navigate(['/order-confirmation', order.id]);
    } catch (error: any) {
      console.error('Order creation failed:', error);
      this.toastService.error(error.message || 'Failed to create order. Please try again.');
    } finally {
      this.isProcessingOrder = false;
    }
  }
}
