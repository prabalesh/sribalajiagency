import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CmsService } from '../../core/services/api/cms.service';
import { CartService } from '../../core/store/cart.service';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { Brand } from '../../core/models/brand.model';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { LucideAngularModule, ChevronLeft, ChevronRight, Truck, ShieldCheck, MessageCircle, ExternalLink, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ImageUrlPipe,
    LucideAngularModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly icons = {
    ChevronLeft,
    ChevronRight,
    Truck,
    ShieldCheck,
    MessageCircle,
    ExternalLink,
    ArrowRight
  };

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cmsService = inject(CmsService);
  private cartService = inject(CartService);

  categories: Category[] = [];
  featuredProducts: Product[] = [];
  brands: Brand[] = [];
  cms: any = null;
  currentSlideIndex = 0;
  private slideInterval: any;

  async ngOnInit() {
    [this.categories, this.brands, this.cms] = await Promise.all([
      this.categoryService.getCategories(),
      this.brandService.getBrands(),
      this.cmsService.getHomeCMS()
    ]);

    const result = await this.productService.getProducts({ page: 1, limit: 8 });
    this.featuredProducts = result.items;

    if (this.cms?.heroSlides?.length > 1) {
      this.startSlideShow();
    }
  }

  startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    if (this.cms?.heroSlides) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.cms.heroSlides.length;
    }
  }

  prevSlide() {
    if (this.cms?.heroSlides) {
      this.currentSlideIndex = (this.currentSlideIndex - 1 + this.cms.heroSlides.length) % this.cms.heroSlides.length;
    }
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product);
  }
}
