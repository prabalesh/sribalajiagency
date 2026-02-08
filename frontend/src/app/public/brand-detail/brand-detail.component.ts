import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandService } from '../../core/services/api/brand.service';
import { Brand } from '../../core/models/brand.model';
import { Category } from '../../core/models/category.model';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
    selector: 'app-brand-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, SkeletonComponent, NgOptimizedImage],
    templateUrl: './brand-detail.component.html',
    styleUrl: './brand-detail.component.scss'
})
export class BrandDetailComponent implements OnInit, OnDestroy {
    private readonly brandService = inject(BrandService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroy$ = new Subject<void>();

    brand = signal<Brand | null>(null);
    categories = signal<Category[]>([]);
    isLoading = signal(true);
    error = signal<string | null>(null);

    readonly skeletonCount = [1, 2, 3, 4];

    ngOnInit(): void {
        this.subscribeToRouteChanges();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private subscribeToRouteChanges(): void {
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(async params => {
                const slug = params.get('brand');
                if (slug) {
                    await this.loadBrandData(slug);
                }
            });
    }

    private async loadBrandData(slug: string): Promise<void> {
        this.resetState();

        try {
            const [brand, categories] = await Promise.all([
                this.brandService.getBrandBySlug(slug),
                this.brandService.getCategoriesByBrand(slug)
            ]);

            this.brand.set(brand);
            this.categories.set(categories);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading.set(false);
        }
    }

    private resetState(): void {
        this.isLoading.set(true);
        this.error.set(null);
    }

    private handleError(error: unknown): void {
        const errorMessage = 'Failed to load brand details. Please try again later.';
        this.error.set(errorMessage);
        console.error('Error loading brand details:', error);
    }
}
