import { Injectable, signal, computed, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, ProductVariant } from '../models/product.model';
import { CartItem } from '../models/cart.model';
import { ToastService } from '../services/toast.service';


@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = signal<CartItem[]>([]);
    private toast = inject(ToastService);
    private isBrowser: boolean;


    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);

        if (this.isBrowser) {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    this.cartItems.set(JSON.parse(savedCart));
                } catch (e) {
                    console.error('Error parsing cart from localStorage', e);
                }
            }
        }
    }

    items = this.cartItems.asReadonly();

    count = computed(() => {
        return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
    });

    total = computed(() => {
        return this.cartItems().reduce((acc, item) => {
            const price = item.variant ? item.variant.price : (item.product.price || 0);
            return acc + price * item.quantity;
        }, 0);
    });

    addToCart(product: Product, quantity: number = 1, variant?: ProductVariant) {
        if (product.isShowcaseOnly) {
            this.toast.warning('This product is for showcase only and cannot be purchased online.');
            return;
        }

        const current = this.cartItems();
        const existingIndex = current.findIndex(item =>
            item.product.id === product.id &&
            (!variant || item.variant?.id === variant.id)
        );

        const existing = existingIndex > -1 ? current[existingIndex] : null;
        const currentQty = existing ? existing.quantity : 0;
        const newTotalQty = currentQty + quantity;

        // Check stock and limits
        const stockLimit = variant ? variant.stock : product.stock;
        const orderLimit = product.maxOrderQuantity || Infinity;
        const maxAllowed = Math.min(stockLimit, orderLimit);

        if (newTotalQty > maxAllowed) {
            this.toast.error(`Sorry, you can only order up to ${maxAllowed} of this item.`);
            return;
        }

        if (newTotalQty > stockLimit) {
            this.toast.error(`Sorry, only ${stockLimit} items are available in stock.`);
            return;
        }

        if (existing) {
            this.cartItems.set(current.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantity: newTotalQty }
                    : item
            ));
        } else {
            this.cartItems.set([...current, { product, variant, quantity }]);
        }
        this.toast.success(`${product.name}${variant ? ' (' + variant.name + ')' : ''} added to cart!`);
        this.save();
    }

    removeFromCart(productId: string, variantId?: string) {
        this.cartItems.set(this.cartItems().filter(item =>
            !(item.product.id === productId && (!variantId || item.variant?.id === variantId))
        ));
        this.save();
    }

    updateQuantity(productId: string, quantity: number, variantId?: string) {
        if (quantity <= 0) {
            this.removeFromCart(productId, variantId);
            return;
        }

        const item = this.cartItems().find(i =>
            i.product.id === productId && (!variantId || i.variant?.id === variantId)
        );

        if (item) {
            const product = item.product;
            const stockLimit = item.variant ? item.variant.stock : product.stock;
            const orderLimit = product.maxOrderQuantity || Infinity;
            const maxAllowed = Math.min(stockLimit, orderLimit);

            if (quantity > maxAllowed) {
                this.toast.warning(`Maximum allowed quantity is ${maxAllowed}`);
                return;
            }
        }

        this.cartItems.set(this.cartItems().map(item =>
            (item.product.id === productId && (!variantId || item.variant?.id === variantId))
                ? { ...item, quantity }
                : item
        ));
        this.save();
    }

    clearCart() {
        this.cartItems.set([]);
        this.save();
    }

    private save() {
        if (this.isBrowser) {
            localStorage.setItem('cart', JSON.stringify(this.cartItems()));
        }
    }
}
