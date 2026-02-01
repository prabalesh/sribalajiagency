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
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';


import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, SkeletonComponent, ProductCardComponent, BreadcrumbsComponent],
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
  isLoading = false;
  breadcrumbItems: BreadcrumbItem[] = [];


  ngOnInit() {
    console.log('ProductDetailComponent: ngOnInit');
    this.route.paramMap.subscribe(async params => {
      console.log('ProductDetailComponent: params', params);
      const id = params.get('id');
      console.log('ProductDetailComponent: id', id);
      if (id) {
        await this.loadProduct(id);
      } else {
        console.warn('ProductDetailComponent: No ID found in route');
      }
    });
  }

  async loadProduct(id: string) {
    this.isLoading = true;
    try {
      this.selectedImageIndex = 0; // Reset to first image
      this.product = await this.productService.getProductById(id);

      if (this.product) {
        // Build Breadcrumbs immediately
        this.breadcrumbItems = [
          { label: 'Home', url: '/' },
          { label: 'Catalog', url: '/products' }
        ];

        const catId = this.product.categoryId || this.product.category?.id;
        const bId = this.product.brandId || this.product.brand?.id;

        if (catId) {
          const categories = await this.categoryService.getCategories();
          this.category = categories.find((c: Category) => c.id === catId);

          if (this.category) {
            this.breadcrumbItems.push({
              label: this.category.name,
              url: ['/products', this.category.slug]
            });
          }

          try {
            const related = await this.productService.getProductsByCategory(catId);
            this.relatedProducts = related.items
              .filter((p: Product) => p.id !== id)
              .slice(0, 4);
          } catch (err) {
            console.warn('Failed to load related products', err);
          }
        }

        this.breadcrumbItems.push({ label: this.product.name });

        if (bId) {
          try {
            this.brand = await this.brandService.getBrandById(bId);
          } catch (err) {
            console.warn('Failed to load brand', err);
          }
        }

        // Reset scroll
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('ProductDetail: Failed to load product', error);
      // Handle error (e.g., redirect to 404 or show error state)
    } finally {
      this.isLoading = false;
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

  onCardAddToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}
