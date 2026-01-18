import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, Category } from '../../core/models/models';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  products: Product[] = [];
  categories: Category[] = [];
  currentCategory: Category | undefined;
  breadcrumbCategories: Category[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const categorySlug = params.get('category');

      if (categorySlug) {
        this.currentCategory = this.productService.getCategoryBySlug(categorySlug);
        this.loadProducts(this.currentCategory?.id);
      } else {
        this.currentCategory = undefined;
        this.loadProducts(undefined);
      }
      this.categories = this.productService.getCategories();
    });
  }

  loadProducts(categoryId: string | undefined) {
    if (categoryId) {
      this.products = this.productService.getProductsByCategory(categoryId);
    } else {
      this.products = this.productService.getProducts();
    }
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product);
  }
}
