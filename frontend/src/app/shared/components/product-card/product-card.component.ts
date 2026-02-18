import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  get stock(): number {
    if (!this.product.variants || this.product.variants.length === 0) return 0;
    return this.product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }

  get displayPrice(): number {
    return this.product.variants?.[0]?.price || 0;
  }

  get displayComparisonPrice(): number | undefined {
    return this.product.variants?.[0]?.comparisonPrice;
  }
}
