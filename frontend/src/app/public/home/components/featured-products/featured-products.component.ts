import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
    selector: 'app-featured-products',
    standalone: true,
    imports: [CommonModule, ProductCardComponent],
    templateUrl: './featured-products.component.html',
    styleUrl: './featured-products.component.scss'
})
export class FeaturedProductsComponent {
    @Input() products: Product[] = [];
    @Input() showFeatured: boolean = true;
    @Output() addToCart = new EventEmitter<Product>();

    onAddToCart(product: Product) {
        this.addToCart.emit(product);
    }
}
