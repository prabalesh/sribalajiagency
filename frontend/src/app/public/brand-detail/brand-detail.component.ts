import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BrandService } from '../../core/services/api/brand.service';
import { Brand } from '../../core/models/brand.model';
import { Category } from '../../core/models/category.model';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
    selector: 'app-brand-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ImageUrlPipe, SkeletonComponent],
    templateUrl: './brand-detail.component.html',
    styleUrl: './brand-detail.component.scss'
})
export class BrandDetailComponent implements OnInit {
    private brandService = inject(BrandService);
    private route = inject(ActivatedRoute);

    brand: Brand | undefined;
    categories: Category[] = [];
    isLoading = true;

    async ngOnInit() {
        this.route.paramMap.subscribe(async params => {
            const slug = params.get('brand');
            if (slug) {
                this.isLoading = true;
                try {
                    this.brand = await this.brandService.getBrandBySlug(slug);
                    this.categories = await this.brandService.getCategoriesByBrand(slug);
                } catch (error) {
                    console.error('Error loading brand details:', error);
                } finally {
                    this.isLoading = false;
                }
            }
        });
    }
}
