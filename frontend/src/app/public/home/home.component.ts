import { Component, OnInit, OnDestroy, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CmsService } from '../../core/services/api/cms.service';
import { CartService } from '../../core/store/cart.service';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { LucideAngularModule } from 'lucide-angular';

import { HeroComponent } from './components/hero/hero.component';
import { CategoryGridComponent } from './components/category-grid/category-grid.component';
import { FeaturedProductsComponent } from './components/featured-products/featured-products.component';
import { AboutSectionComponent } from './components/about-section/about-section.component';
import { BrandShelfComponent } from './components/brand-shelf/brand-shelf.component';
import { TrustMarkersComponent } from './components/trust-markers/trust-markers.component';
import { SocialSectionComponent } from './components/social-section/social-section.component';
import { Brand } from '../../core/models/brand.model';
import { HomeMobileComponent } from './components/home-mobile/home-mobile.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    HeroComponent,
    CategoryGridComponent,
    FeaturedProductsComponent,
    AboutSectionComponent,
    BrandShelfComponent,
    TrustMarkersComponent,
    SocialSectionComponent,
    HomeMobileComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cmsService = inject(CmsService);
  private cartService = inject(CartService);

  categories: Category[] = [];
  featuredProducts: Product[] = [];
  brands: Brand[] = [];
  cms: any = null;

  isMobile = signal(false);
  private platformId = inject(PLATFORM_ID);

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  async ngOnInit() {
    this.checkScreenSize();
    [this.categories, this.brands, this.cms] = await Promise.all([
      this.categoryService.getCategories(),
      this.brandService.getBrands(),
      this.cmsService.getHomeCMS()
    ]);

    const result = await this.productService.getProducts({ page: 1, limit: 8 });
    this.featuredProducts = result.items;
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product.id);
  }
}
