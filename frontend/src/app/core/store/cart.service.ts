import { Injectable, signal, computed, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem, ValidatedCartItem } from '../models/cart.model';
import { ToastService } from '../services/toast.service';
import { CartApiService } from '../services/api/cart-api.service';
import { AuthService } from '../services/auth/auth.service';

const GUEST_CART_KEY = 'guest_cart';
const DEBOUNCE_MS = 500;

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = signal<ValidatedCartItem[]>([]);
    private isLoadingSignal = signal<boolean>(false);
    private toast = inject(ToastService);
    private cartApi = inject(CartApiService);
    private authService = inject(AuthService);
    private isBrowser: boolean;
    private saveTimeout: any;
    private visibilityListener?: () => void;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Register this service with AuthService to avoid circular dependency
        this.authService.setCartService(this);

        // Load cart on initialization
        if (this.isBrowser) {
            this.loadCart();
            this.setupVisibilityListener();
        }
    }

    // Public readonly signals
    items = this.cartItems.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();

    // Computed properties
    count = computed(() => {
        return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
    });

    total = computed(() => {
        return this.cartItems().reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);
    });

    hasUnavailableItems = computed(() => {
        return this.cartItems().some(item => !item.available);
    });

    canCheckout = computed(() => {
        return this.cartItems().length > 0 && !this.hasUnavailableItems();
    });

    // Load cart based on auth state
    async loadCart() {
        this.isLoadingSignal.set(true);
        try {
            if (this.authService.isLoggedIn()) {
                await this.loadFromDatabase();
            } else {
                await this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            this.isLoadingSignal.set(false);
        }
    }

    // Load from localStorage (guest users)
    private async loadFromLocalStorage() {
        if (!this.isBrowser) return;

        const saved = localStorage.getItem(GUEST_CART_KEY);
        if (saved) {
            try {
                const items: CartItem[] = JSON.parse(saved);
                await this.validateAndSetCart(items);
            } catch (e) {
                console.error('Error parsing guest cart', e);
                localStorage.removeItem(GUEST_CART_KEY);
            }
        }
    }

    // Load from database (logged-in users)
    private async loadFromDatabase() {
        try {
            const items = await this.cartApi.getCart();
            await this.validateAndSetCart(items);
        } catch (error) {
            console.error('Failed to load cart from database:', error);
            // Fallback to empty cart
            this.cartItems.set([]);
        }
    }

    // Validate cart items and update state
    private async validateAndSetCart(items: CartItem[]) {
        if (items.length === 0) {
            this.cartItems.set([]);
            return;
        }

        try {
            const validated = await this.cartApi.validateCart(items);
            this.cartItems.set(validated);
            this.showValidationNotifications(validated);
        } catch (error) {
            console.error('Cart validation failed:', error);
            this.cartItems.set([]);
        }
    }

    // Show notifications for validation issues
    private showValidationNotifications(validated: ValidatedCartItem[]) {
        const unavailable = validated.filter(item => !item.available);
        const adjusted = validated.filter(item => item.quantityAdjusted);

        if (unavailable.length > 0) {
            this.toast.warning(`${unavailable.length} item(s) in your cart are no longer available`);
        }

        if (adjusted.length > 0) {
            adjusted.forEach(item => {
                this.toast.warning(
                    `Quantity adjusted for ${item.productName} from ${item.originalQuantity} to ${item.quantity} due to stock availability`
                );
            });
        }
    }

    // Save to localStorage
    private saveToLocalStorage(items: CartItem[]) {
        if (!this.isBrowser) return;
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }

    // Save to database (debounced)
    private saveToDatabaseDebounced(items: CartItem[]) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(async () => {
            try {
                await this.cartApi.updateCart(items);
            } catch (error) {
                console.error('Failed to save cart to database:', error);
                this.toast.error('Failed to sync cart. Please try again.');
            }
        }, DEBOUNCE_MS);
    }

    // Convert validated items to minimal cart items
    private toCartItems(validated: ValidatedCartItem[]): CartItem[] {
        return validated.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity
        }));
    }

    // Add to cart
    async addToCart(productId: string, quantity: number = 1, variantId?: string) {
        const current = this.cartItems();
        const existingIndex = current.findIndex(item =>
            item.productId === productId &&
            (item.variantId || null) === (variantId || null)
        );

        let newItems: CartItem[];
        if (existingIndex > -1) {
            // Update existing item
            const updated = [...current];
            updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + quantity
            };
            newItems = this.toCartItems(updated);
        } else {
            // Add new item
            newItems = [...this.toCartItems(current), { productId, variantId, quantity }];
        }

        // Validate and save
        await this.validateAndSetCart(newItems);
        this.save(newItems);

        // Show success message only if item is available after validation
        const addedItem = this.cartItems().find(item =>
            item.productId === productId && (item.variantId || null) === (variantId || null)
        );
        if (addedItem && addedItem.available) {
            this.toast.success(`${addedItem.productName}${addedItem.variantName ? ' (' + addedItem.variantName + ')' : ''} added to cart!`);
        }
    }

    // Update quantity
    async updateQuantity(productId: string, quantity: number, variantId?: string) {
        if (quantity <= 0) {
            this.removeFromCart(productId, variantId);
            return;
        }

        const current = this.cartItems();
        const updated = current.map(item =>
            (item.productId === productId && (item.variantId || null) === (variantId || null))
                ? { ...item, quantity }
                : item
        );

        const newItems = this.toCartItems(updated);
        await this.validateAndSetCart(newItems);
        this.save(newItems);
    }

    // Remove from cart
    removeFromCart(productId: string, variantId?: string) {
        const current = this.cartItems();
        const filtered = current.filter(item =>
            !(item.productId === productId && (item.variantId || null) === (variantId || null))
        );

        this.cartItems.set(filtered);
        const newItems = this.toCartItems(filtered);
        this.save(newItems);
    }

    // Clear cart
    clearCart() {
        this.cartItems.set([]);
        this.save([]);
    }

    // Save cart (to localStorage or database based on auth state)
    private save(items: CartItem[]) {
        if (this.authService.isLoggedIn()) {
            this.saveToDatabaseDebounced(items);
        } else {
            this.saveToLocalStorage(items);
        }
    }

    // Merge guest cart with user cart on login
    async mergeOnLogin() {
        if (!this.isBrowser) return;

        const guestCartStr = localStorage.getItem(GUEST_CART_KEY);
        if (!guestCartStr) {
            // No guest cart, just load user cart
            await this.loadFromDatabase();
            return;
        }

        try {
            const guestCart: CartItem[] = JSON.parse(guestCartStr);
            if (guestCart.length === 0) {
                await this.loadFromDatabase();
                return;
            }

            // Merge with user cart
            const mergedItems = await this.cartApi.mergeCart(guestCart);
            await this.validateAndSetCart(mergedItems);

            // Clear guest cart
            localStorage.removeItem(GUEST_CART_KEY);

            this.toast.success('Items from your guest session have been added to your cart');
        } catch (error) {
            console.error('Failed to merge carts:', error);
            this.toast.error('Failed to merge carts. Please try again.');
            await this.loadFromDatabase();
        }
    }

    // Handle logout
    onLogout() {
        if (!this.isBrowser) return;

        // Clear guest cart
        localStorage.removeItem(GUEST_CART_KEY);

        // Clear cart state
        this.cartItems.set([]);
    }

    // Setup visibility change listener for multi-device sync
    private setupVisibilityListener() {
        if (!this.isBrowser) return;

        this.visibilityListener = () => {
            if (document.visibilityState === 'visible' && this.authService.isLoggedIn()) {
                // Reload cart from database when tab becomes visible
                this.loadFromDatabase();
            }
        };

        document.addEventListener('visibilitychange', this.visibilityListener);
    }

    // Cleanup
    ngOnDestroy() {
        if (this.visibilityListener && this.isBrowser) {
            document.removeEventListener('visibilitychange', this.visibilityListener);
        }
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
    }
}
