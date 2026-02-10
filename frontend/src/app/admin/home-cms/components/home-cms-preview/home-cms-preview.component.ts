import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, Monitor } from 'lucide-angular';
import { CmsPreviewService } from '../../../../core/services/cms-preview.service';
import { CmsService, HomeCMS } from '../../../../core/services/api/cms.service';
import { ToastService } from '../../../../core/services/toast.service';

// Re-use home components for preview
import { HeroComponent } from '../../../../public/home/components/hero/hero.component';
import { CategoryGridComponent } from '../../../../public/home/components/category-grid/category-grid.component';
import { FeaturedProductsComponent } from '../../../../public/home/components/featured-products/featured-products.component';
import { AboutSectionComponent } from '../../../../public/home/components/about-section/about-section.component';
import { BrandShelfComponent } from '../../../../public/home/components/brand-shelf/brand-shelf.component';
import { TrustMarkersComponent } from '../../../../public/home/components/trust-markers/trust-markers.component';
import { SocialSectionComponent } from '../../../../public/home/components/social-section/social-section.component';
import { ProductService } from '../../../../core/services/api/product.service';
import { CategoryService } from '../../../../core/services/api/category.service';
import { BrandService } from '../../../../core/services/api/brand.service';
import { Category } from '../../../../core/models/category.model';
import { Brand } from '../../../../core/models/brand.model';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-home-cms-preview',
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
    templateUrl: './home-cms-preview.component.html',
    styleUrl: './home-cms-preview.component.scss'
})
export class HomeCMSPreviewComponent implements OnInit {
    private previewService = inject(CmsPreviewService);
    private cmsService = inject(CmsService);
    private toastService = inject(ToastService);
    private router = inject(Router);
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);

    cms: HomeCMS | null = null;
    categories: Category[] = [];
    featuredProducts: Product[] = [];
    brands: Brand[] = [];

    isSaving = false;

    async ngOnInit() {
        this.cms = this.previewService.getPreviewData();

        if (!this.cms) {
            this.toastService.warning('No preview data found. Returning to editor.');
            this.goBack();
            return;
        }

        // Load necessary data for sections
        try {
            [this.categories, this.brands] = await Promise.all([
                this.categoryService.getCategories(),
                this.brandService.getBrands()
            ]);

            const result = await this.productService.getProducts({ page: 1, limit: 8 });
            this.featuredProducts = result.items;
        } catch (error) {
            console.error('Error loading data for preview:', error);
        }
    }

    goBack() {
        this.router.navigate(['/dashboard/home-cms']);
    }

    async saveChanges() {
        if (!this.cms || this.isSaving) return;

        this.isSaving = true;
        try {
            await this.cmsService.updateHomeCMS(this.cms);
            this.toastService.success('CMS updated successfully!');
            this.goBack();
        } catch (error) {
            this.toastService.error('Failed to save changes');
            console.error('Save error:', error);
        } finally {
            this.isSaving = false;
        }
    }
}
