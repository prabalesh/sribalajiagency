import { Injectable, signal, computed, Inject, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, debounceTime, switchMap, from, catchError, of } from 'rxjs';
import { CartItem, ValidatedCartItem } from '../models/cart.model';
import { ToastService } from '../services/toast.service';
import { CartApiService } from '../services/api/cart-api.service';
import { AuthService } from '../services/auth/auth.service';

const GUEST_CART_KEY = 'guest_cart';
const DEBOUNCE_MS = 500;

@Injectable({
    providedIn: 'root'
})
export class CartService implements OnDestroy {
    private cartItems = signal<ValidatedCartItem[]>([]);
    private isLoadingSignal = signal<boolean>(false);
    private toast = inject(ToastService);
    private cartApi = inject(CartApiService);
    private authService = inject(AuthService);
    private isBrowser: boolean;
    private visibilityListener?: () => void;
    private syncSubject = new Subject<CartItem[]>();
    private lastValidItems: ValidatedCartItem[] = [];

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Register this service with AuthService to avoid circular dependency
        this.authService.setCartService(this);

        // Load cart on initialization
        if (this.isBrowser) {
            this.loadCart();
            this.setupVisibilityListener();
            this.setupSyncPipe();
        }
    }

    private setupSyncPipe() {
        this.syncSubject.pipe(
            debounceTime(DEBOUNCE_MS),
            switchMap(items => from(this.performSync(items)).pipe(
                catchError(error => {
                    console.error('Debounced sync failed:', error);
                    return of(null);
                })
            ))
        ).subscribe();
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
                const validated = await this.validateAndSetCart(items);

                // If items were adjusted during load, persist them
                if (validated.some(item => item.quantityAdjusted || !item.available)) {
                    this.saveToLocalStorage(this.toCartItems(validated));
                }
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
            const validated = await this.validateAndSetCart(items);

            // If items were adjusted during load from database, persist them back to db
            if (validated.some(item => item.quantityAdjusted || !item.available)) {
                await this.cartApi.updateCart(this.toCartItems(validated));
            }
        } catch (error) {
            console.error('Failed to load cart from database:', error);
            // Fallback to empty cart
            this.cartItems.set([]);
        }
    }

    // Validate cart items and update state
    private async validateAndSetCart(items: CartItem[]): Promise<ValidatedCartItem[]> {
        if (items.length === 0) {
            this.cartItems.set([]);
            this.lastValidItems = [];
            return [];
        }

        try {
            const validated = await this.cartApi.validateCart(items);
            this.cartItems.set(validated);
            this.lastValidItems = [...validated];
            this.showValidationNotifications(validated);
            return validated;
        } catch (error) {
            console.error('Cart validation failed:', error);
            // If validation fails, we keep the last valid items or clear if none
            if (this.lastValidItems.length > 0) {
                this.cartItems.set(this.lastValidItems);
            }
            return this.lastValidItems;
        }
    }

    // Perform the actual synchronization (validate + save)
    private async performSync(items: CartItem[]) {
        this.isLoadingSignal.set(true);
        try {
            const validated = await this.validateAndSetCart(items);
            const itemsToSave = this.toCartItems(validated);

            if (this.authService.isLoggedIn()) {
                await this.cartApi.updateCart(itemsToSave);
            } else {
                this.saveToLocalStorage(itemsToSave);
            }
        } finally {
            this.isLoadingSignal.set(false);
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

    // Save cart (to localStorage or database based on auth state)
    private save(items: CartItem[]) {
        this.syncSubject.next(items);
    }

    // Save to localStorage
    private saveToLocalStorage(items: CartItem[]) {
        if (!this.isBrowser) return;
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
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
        if (!this.authService.isLoggedIn()) {
            this.toast.info('Please log in to add items to your cart');
            return;
        }

        const current = this.cartItems();
        const existingIndex = current.findIndex(item =>
            item.productId === productId &&
            (item.variantId || null) === (variantId || null)
        );

        let newItems: ValidatedCartItem[];
        if (existingIndex > -1) {
            // Update existing item optimistically
            const updated = [...current];
            const existingItem = updated[existingIndex];
            updated[existingIndex] = {
                ...existingItem,
                quantity: existingItem.quantity + quantity
            };
            newItems = updated;

            this.cartItems.set(newItems);
            this.save(this.toCartItems(newItems));

            this.toast.success(`${existingItem.productName} quantity updated!`);
        } else {
            // For brand new items, we can't fully update optimistically without names/prices
            // but we can at least push to sync and wait if needed, or if we want it fast:
            // For now, let's just trigger the sync. 
            // If we had product details passed in, we could do better.
            const minimalItems = [...this.toCartItems(current), { productId, variantId, quantity }];
            await this.performSync(minimalItems);

            const addedItem = this.cartItems().find(item =>
                item.productId === productId && (item.variantId || null) === (variantId || null)
            );
            if (addedItem && addedItem.available) {
                this.toast.success(`${addedItem.productName}${addedItem.variantName ? ' (' + addedItem.variantName + ')' : ''} added to cart!`);
            }
        }
    }

    // Update quantity
    updateQuantity(productId: string, quantity: number, variantId?: string) {
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

        this.cartItems.set(updated); // Optimistic update
        this.save(this.toCartItems(updated));
    }

    // Remove from cart
    removeFromCart(productId: string, variantId?: string) {
        const current = this.cartItems();
        const filtered = current.filter(item =>
            !(item.productId === productId && (item.variantId || null) === (variantId || null))
        );

        this.cartItems.set(filtered); // Optimistic update
        this.save(this.toCartItems(filtered));
    }

    // Clear cart
    clearCart() {
        this.cartItems.set([]);
        this.save([]);
    }

    /**
     * @deprecated Use syncSubject via save() instead
     */
    private legacySave(items: CartItem[]) {
        if (this.authService.isLoggedIn()) {
            // Logic moved to performSync
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
        this.syncSubject.complete();
    }
}
