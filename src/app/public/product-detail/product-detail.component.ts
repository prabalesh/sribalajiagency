import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Category, Brand } from '../../core/models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  product?: Product;
  category?: Category;
  brand?: Brand;
  relatedProducts: Product[] = [];
  quantity: number = 1;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.product = this.productService.getProductById(id);
    if (this.product) {
      this.category = this.productService.getCategories().find(c => c.id === this.product?.categoryId);
      this.brand = this.productService.getBrandById(this.product.brandId);
      this.relatedProducts = this.productService.getProductsByCategory(this.product.categoryId)
        .filter(p => p.id !== id)
        .slice(0, 4);

      // Reset scroll
      window.scrollTo(0, 0);
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      // Optional: Show a toast or notification
    }
  }

  updateQuantity(delta: number) {
    this.quantity = Math.max(1, this.quantity + delta);
  }
}
