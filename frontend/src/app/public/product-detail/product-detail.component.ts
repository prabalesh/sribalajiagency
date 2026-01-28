import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CartService } from '../../core/store/cart.service';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Brand } from '../../core/models/brand.model';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cartService = inject(CartService);

  product?: Product;
  category?: Category;
  brand?: Brand;
  relatedProducts: Product[] = [];
  quantity: number = 1;
  selectedImageIndex: number = 0;

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        await this.loadProduct(id);
      }
    });
  }

  async loadProduct(id: string) {
    try {
      this.selectedImageIndex = 0; // Reset to first image
      this.product = await this.productService.getProductById(id);
      if (this.product) {
        const catId = this.product.categoryId || this.product.category?.id;
        const bId = this.product.brandId || this.product.brand?.id;

        if (catId) {
          const categories = await this.categoryService.getCategories();
          this.category = categories.find((c: Category) => c.id === catId);

          const related = await this.productService.getProductsByCategory(catId);
          this.relatedProducts = related.items
            .filter((p: Product) => p.id !== id)
            .slice(0, 4);
        }

        if (bId) {
          this.brand = await this.brandService.getBrandById(bId);
        }

        // Reset scroll
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('ProductDetail: Failed to load product', error);
      // Handle error (e.g., redirect to 404 or show error state)
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      // Optional: Show a toast or notification
    }
  }

  updateQuantity(delta: number) {
    const newQty = this.quantity + delta;
    if (newQty < 1) return;

    if (this.product) {
      const stockLimit = this.product.stock;
      const orderLimit = this.product.maxOrderQuantity || Infinity;
      const maxAllowed = Math.min(stockLimit, orderLimit);

      if (newQty > maxAllowed) {
        alert(`Maximum allowed quantity is ${maxAllowed}`);
        return;
      }
    }

    this.quantity = newQty;
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }
}
