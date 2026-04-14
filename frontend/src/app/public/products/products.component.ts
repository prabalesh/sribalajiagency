import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { switchMap, takeUntil, map } from 'rxjs/operators';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
// ImageUrlPipe removed as it is now used in ProductCardComponent
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent, InfiniteScrollDirective, ProductCardComponent, BreadcrumbsComponent],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private cartService = inject(CartService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroy$ = new Subject<void>();

    products: Product[] = [];
    categories: Category[] = [];
    currentCategory: Category | undefined;
    isCategoryNotFound = false;
    breadcrumbItems: BreadcrumbItem[] = [];

    // Pagination & Filter State
    currentPage = 1;
    pageSize = 12;
    totalItems = 0;
    isLoading = false;
    hasMore = true;

    // Filters
    minPrice: number = 0;
    maxPrice: number = 50000;
    sliderMin = 0;
    sliderMax = 50000;
    sortBy: string = 'name';
    sortOrder: 'ASC' | 'DESC' = 'ASC';

    ngOnInit() {
        // 1. Fetch Categories and handle route reactively
        combineLatest([
            this.categoryService.getCategories(),
            this.route.paramMap
        ]).pipe(
            takeUntil(this.destroy$),
            switchMap(([categories, params]) => {
                this.categories = categories;
                const brandSlug = params.get('brand');
                const subcategorySlug = params.get('subcategory');
                const categorySlug = params.get('category');
                const activeSlug = subcategorySlug ?? categorySlug ?? undefined;

                // Reset state for new route
                this.resetFilters();
                this.isCategoryNotFound = false;
                this.isLoading = true;

                // Set current category
                if (activeSlug) {
                    this.currentCategory = this.categories.find(c => c.slug === activeSlug);
                    if (!this.currentCategory) this.isCategoryNotFound = true;
                } else {
                    this.currentCategory = undefined;
                }

                // Update Breadcrumbs
                this.updateBreadcrumbs();

                return this.loadProductsData({ categorySlug: activeSlug, brandSlug: brandSlug ?? undefined });
            })
        ).subscribe({
            next: result => {
                this.handleProductsResult(result);
                this.isLoading = false;
            },
            error: err => {
                console.error('Error in product stream:', err);
                this.isLoading = false;
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    resetFilters() {
        this.products = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.minPrice = this.sliderMin;
        this.maxPrice = this.sliderMax;
        this.sortBy = 'name';
        this.sortOrder = 'ASC';
    }

    async applyFilters() {
        this.products = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = true;

        const params: any = {
            brandSlug: this.route.snapshot.paramMap.get('brand') || undefined,
            categorySlug: this.route.snapshot.paramMap.get('subcategory') || this.route.snapshot.paramMap.get('category') || undefined
        };

        const result = await this.loadProductsData(params);
        this.handleProductsResult(result);
        this.isLoading = false;
    }

    onSortChange(event: any) {
        const val = event.target.value;
        if (val === 'price_asc') {
            this.sortBy = 'price';
            this.sortOrder = 'ASC';
        } else if (val === 'price_desc') {
            this.sortBy = 'price';
            this.sortOrder = 'DESC';
        } else {
            this.sortBy = 'name';
            this.sortOrder = 'ASC';
        }
        this.applyFilters();
    }

    validateRange() {
        if (this.minPrice > this.maxPrice) {
            const temp = this.minPrice;
            this.minPrice = this.maxPrice;
            this.maxPrice = temp;
        }
        this.applyFilters();
    }

    private handleProductsResult(result: any) {
        this.products = result.items;
        this.totalItems = result.total;
        this.hasMore = this.products.length < this.totalItems;
        if (this.hasMore) this.currentPage++;
    }

    private async loadProductsData(params: { categoryId?: string, categorySlug?: string, brandSlug?: string }) {
        try {
            // If maxPrice is at the slider's max, treat it as unlimited (undefined)
            const isMax = this.maxPrice >= this.sliderMax;
            return await this.productService.getProducts({
                page: this.currentPage,
                limit: this.pageSize,
                categoryId: params.categoryId,
                categorySlug: params.categorySlug,
                brandSlug: params.brandSlug,
                minPrice: this.minPrice,
                maxPrice: isMax ? undefined : this.maxPrice,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });
        } catch (error) {
            console.error('Error loading products:', error);
            return { items: [], total: 0 };
        }
    }

    async onScroll() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        try {
            const params = {
                categoryId: this.currentCategory?.id,
                brandSlug: this.route.snapshot.paramMap.get('brand') || undefined
            };
            const result = await this.loadProductsData(params);
            this.products = [...this.products, ...result.items];
            this.totalItems = result.total;
            this.hasMore = this.products.length < this.totalItems;

            if (this.hasMore) {
                this.currentPage++;
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            this.isLoading = false;
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private updateBreadcrumbs() {
        this.breadcrumbItems = [
            { label: 'Home', url: '/' },
            { label: 'Catalog', url: '/products' }
        ];

        if (this.currentCategory) {
            this.breadcrumbItems.push({ label: this.currentCategory.name });
        }
    }

    addToCart(product: Product) {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.cartService.addToCart(product.id);
    }
}
