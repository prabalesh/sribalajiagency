import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { CartItem, ValidatedCartItem } from '../../models/cart.model';

@Injectable({
    providedIn: 'root'
})
export class CartApiService {
    private api = inject(ApiService);

    // Get user's cart from database
    async getCart(): Promise<CartItem[]> {
        const res = await this.api.get<CartItem[]>('/cart');
        return res.data;
    }

    // Update entire cart in database
    async updateCart(items: CartItem[]): Promise<CartItem[]> {
        const res = await this.api.put<CartItem[]>('/cart', { items });
        return res.data;
    }

    // Validate cart items (no auth required)
    async validateCart(items: CartItem[]): Promise<ValidatedCartItem[]> {
        const res = await this.api.post<ValidatedCartItem[]>('/cart/validate', { items });
        return res.data;
    }

    // Merge guest cart with user cart
    async mergeCart(guestCart: CartItem[]): Promise<CartItem[]> {
        const res = await this.api.post<CartItem[]>('/cart/merge', { guestCart });
        return res.data;
    }

    // Clear user's cart
    async clearCart(): Promise<void> {
        await this.api.delete('/cart');
    }
}
