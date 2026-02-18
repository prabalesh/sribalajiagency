import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { HeroComponent } from '../hero/hero.component';
import { CategoryGridComponent } from '../category-grid/category-grid.component';
import { FeaturedProductsComponent } from '../featured-products/featured-products.component';
import { AboutSectionComponent } from '../about-section/about-section.component';
import { BrandShelfComponent } from '../brand-shelf/brand-shelf.component';
import { TrustMarkersComponent } from '../trust-markers/trust-markers.component';
import { SocialSectionComponent } from '../social-section/social-section.component';
import { Category } from '../../../../core/models/category.model';
import { Product } from '../../../../core/models/product.model';
import { Brand } from '../../../../core/models/brand.model';

@Component({
    selector: 'app-home-mobile',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        HeroComponent,
        CategoryGridComponent,
        FeaturedProductsComponent,
        AboutSectionComponent,
        BrandShelfComponent,
        TrustMarkersComponent,
        SocialSectionComponent
    ],
    templateUrl: './home-mobile.component.html',
    styleUrl: './home-mobile.component.scss'
})
export class HomeMobileComponent {
    @Input() categories: Category[] = [];
    @Input() featuredProducts: Product[] = [];
    @Input() brands: Brand[] = [];
    @Input() cms: any = null;

    @Output() addToCart = new EventEmitter<Product>();

    onAddToCart(product: Product) {
        this.addToCart.emit(product);
    }
}
