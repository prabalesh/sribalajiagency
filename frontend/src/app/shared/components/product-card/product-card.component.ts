import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product, ProductVariant } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth/auth.service';



@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {


  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() product!: Product;
  @Input() searchTerm: string = '';
  @Output() addToCart = new EventEmitter<Product>();

  private _bestVariant: ProductVariant | undefined;

  onAddToCart(event: Event): void {
    event.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.addToCart.emit(this.product);
  }

  get stock(): number {
    if (!this.product.variants || this.product.variants.length === 0) return 0;
    return this.product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }

  get preferredVariant(): ProductVariant | undefined {
    if (this._bestVariant) return this._bestVariant;

    if (!this.product.variants || this.product.variants.length === 0) return undefined;

    // 1. Try to find a variant that matches search term
    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase();
      const match = this.product.variants.find(v =>
        v.name.toLowerCase().includes(query) ||
        (v.sku && v.sku.toLowerCase().includes(query))
      );
      if (match) {
        this._bestVariant = match;
        return match;
      }
    }

    // 2. Try to find the default variant
    const defaultVariant = this.product.variants.find(v => v.isDefault);
    if (defaultVariant) {
      this._bestVariant = defaultVariant;
      return defaultVariant;
    }

    // 3. Fallback to first variant
    this._bestVariant = this.product.variants[0];
    return this._bestVariant;
  }

  get displayPrice(): number {
    return this.preferredVariant?.price || 0;
  }

  get displayComparisonPrice(): number | undefined {
    return this.preferredVariant?.comparisonPrice;
  }

  get displayImage(): string {
    const variant = this.preferredVariant;
    if (variant?.images && variant.images.length > 0) {
      return variant.images.find(img => img.isPrimary)?.url || variant.images[0].url;
    }

    // Fallback to product images
    if (this.product.images && this.product.images.length > 0) {
      return this.product.images.find(img => img.isPrimary)?.url || this.product.images[0].url;
    }

    // Fallback to any variant image
    for (const v of this.product.variants) {
      if (v.images && v.images.length > 0) {
        return v.images.find(img => img.isPrimary)?.url || v.images[0].url;
      }
    }

    return 'https://placehold.co/400x400?text=No+Image';
  }
}
