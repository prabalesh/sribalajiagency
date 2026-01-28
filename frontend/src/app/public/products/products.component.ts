import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { CartService } from '../../core/store/cart.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  products: Product[] = [];
  categories: Category[] = [];
  currentCategory: Category | undefined;
  breadcrumbCategories: Category[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const categorySlug = params.get('category');

      if (categorySlug) {
        this.currentCategory = await this.categoryService.getCategoryBySlug(categorySlug);
        await this.loadProducts(this.currentCategory?.id);
      } else {
        this.currentCategory = undefined;
        await this.loadProducts(undefined);
      }
      this.categories = await this.categoryService.getCategories();
    });
  }

  async loadProducts(categoryId: string | undefined) {
    if (categoryId) {
      this.products = await this.productService.getProductsByCategory(categoryId);
    } else {
      this.products = await this.productService.getProducts();
    }
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product);
  }
}
