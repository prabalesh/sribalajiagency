import { Component, OnInit, inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { ToastService } from '../../core/services/toast.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, SkeletonComponent, ProductCardComponent, BreadcrumbsComponent, FormsModule, ProductReviewsComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cartService = inject(CartService);
  private uiService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  private isBrowser = false;

  @ViewChild('productGrid') productGrid!: ElementRef<HTMLElement>;
  product?: Product;
  category?: Category;
  brand?: Brand;
  relatedProducts: Product[] = [];
  quantity: number = 1;
  selectedImageIndex: number = 0;
  isLoading = false;
  breadcrumbItems: BreadcrumbItem[] = [];

  error: string | null = null;

  ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
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
    if (!this.isBrowser) return; // Skip fetching on server to avoid SSR issues
    this.isLoading = true;
    this.error = null;
    try {
      this.selectedImageIndex = 0; // Reset to first image
      this.product = await this.productService.getProductById(id);

      if (this.product) {
        // NG0900 Fix: Ensure images is an array
        if (this.product.images && !Array.isArray(this.product.images)) {
          console.warn('ProductDetail: images is not an array, converting...', this.product.images);
          // If it's an object, try to convert values to array, otherwise empty array
          this.product.images = typeof this.product.images === 'object'
            ? Object.values(this.product.images)
            : [];
        } else if (!this.product.images) {
          this.product.images = [];
        }

        // Build Breadcrumbs immediately
        this.breadcrumbItems = [
          { label: 'Home', url: '/' },
          { label: 'Catalog', url: '/products' }
        ];

        const catId = this.product.categoryId || this.product.category?.id;
        const brandSlug = this.product.brand?.slug || undefined;

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
              .slice(0, 12);
          } catch (err) {
            console.warn('Failed to load related products', err);
          }
        }

        this.breadcrumbItems.push({ label: this.product.name });

        if (brandSlug) {
          try {
            this.brand = await this.brandService.getBrandBySlug(brandSlug);
          } catch (err) {
            console.warn('Failed to load brand', err);
          }
        }

        // Reset scroll
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('ProductDetail: Failed to load product', error);
      this.error = 'Failed to load product. Please try again later.';
      this.uiService.show('Failed to load product', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
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

  scrollCarousel(direction: 'left' | 'right') {
    if (!this.productGrid) return;

    const container = this.productGrid.nativeElement;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of view width

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
