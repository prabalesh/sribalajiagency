import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = signal<CartItem[]>([]);
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
        return this.cartItems().reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);
    });

    addToCart(product: Product, quantity: number = 1) {
        if (product.isShowcaseOnly) {
            alert('This product is for showcase only and cannot be purchased online.');
            return;
        }

        const current = this.cartItems();
        const existing = current.find(item => item.product.id === product.id);
        const currentQty = existing ? existing.quantity : 0;
        const newTotalQty = currentQty + quantity;

        // Check stock and limits
        const stockLimit = product.stock;
        const orderLimit = product.maxOrderQuantity || Infinity;
        const maxAllowed = Math.min(stockLimit, orderLimit);

        if (newTotalQty > maxAllowed) {
            alert(`Sorry, you can only order up to ${maxAllowed} of this item (current in cart: ${currentQty}).`);
            return;
        }

        if (newTotalQty > product.stock) {
            alert(`Sorry, only ${product.stock} items are available in stock.`);
            return;
        }

        if (existing) {
            this.cartItems.set(current.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: newTotalQty }
                    : item
            ));
        } else {
            this.cartItems.set([...current, { product, quantity }]);
        }
        this.save();
    }

    removeFromCart(productId: string) {
        this.cartItems.set(this.cartItems().filter(item => item.product.id !== productId));
        this.save();
    }

    updateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const item = this.cartItems().find(i => i.product.id === productId);
        if (item) {
            const product = item.product;
            const stockLimit = product.stock;
            const orderLimit = product.maxOrderQuantity || Infinity;
            const maxAllowed = Math.min(stockLimit, orderLimit);

            if (quantity > maxAllowed) {
                alert(`Maximum allowed quantity is ${maxAllowed}`);
                return;
            }
        }

        this.cartItems.set(this.cartItems().map(item =>
            item.product.id === productId ? { ...item, quantity } : item
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
