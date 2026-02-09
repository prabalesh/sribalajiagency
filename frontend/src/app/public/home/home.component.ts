import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
    SocialSectionComponent
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

  async ngOnInit() {
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
