import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { switchMap, takeUntil, map } from 'rxjs/operators';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { CartService } from '../../core/store/cart.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { InfiniteScrollDirective } from '../../shared/directives/infinite-scroll.directive';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, SkeletonComponent, InfiniteScrollDirective],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private cartService = inject(CartService);
    private route = inject(ActivatedRoute);
    private destroy$ = new Subject<void>();

    products: Product[] = [];
    categories: Category[] = [];
    currentCategory: Category | undefined;
    isCategoryNotFound = false;

    // Pagination State
    currentPage = 1;
    pageSize = 12;
    totalItems = 0;
    isLoading = false;
    hasMore = true;

    ngOnInit() {
        // 1. Fetch Categories once
        this.loadInitialData();

        // 2. Reactive Route Handling
        this.route.paramMap.pipe(
            takeUntil(this.destroy$),
            switchMap(params => {
                const brandSlug = params.get('brand');
                const subcategorySlug = params.get('subcategory');
                const categorySlug = params.get('category');
                const activeSlug = subcategorySlug ?? categorySlug ?? undefined;

                // Reset state for new route
                this.products = [];
                this.currentPage = 1;
                this.hasMore = true;
                this.isCategoryNotFound = false;
                this.isLoading = true;

                // Derive current category from existing list (if loaded)
                if (activeSlug && this.categories.length > 0) {
                    this.currentCategory = this.categories.find(c => c.slug === activeSlug);
                }

                return this.loadProductsData(undefined, activeSlug, brandSlug ?? undefined);
            })
        ).subscribe(result => {
            this.products = result.items;
            this.totalItems = result.total;
            this.hasMore = this.products.length < this.totalItems;
            if (this.hasMore) this.currentPage++;

            // If we have products, sync the currentCategory if it wasn't found yet
            if (this.products.length > 0 && !this.currentCategory) {
                this.currentCategory = this.products[0].category;
            } else if (!this.currentCategory && this.route.snapshot.paramMap.has('category')) {
                // If slug provided but no products and no category found in list
                // We might need to handle the case where categories list isn't loaded yet
                this.isCategoryNotFound = this.categories.length > 0 && !this.categories.find(c =>
                    c.slug === (this.route.snapshot.paramMap.get('subcategory') || this.route.snapshot.paramMap.get('category'))
                );
            }

            this.isLoading = false;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async loadInitialData() {
        try {
            this.categories = await this.categoryService.getCategories();
            // sync currentCategory if it's already filtered but list just arrived
            const activeSlug = this.route.snapshot.paramMap.get('subcategory') || this.route.snapshot.paramMap.get('category');
            if (activeSlug && !this.currentCategory) {
                this.currentCategory = this.categories.find(c => c.slug === activeSlug);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    private async loadProductsData(categoryId: string | undefined, categorySlug?: string, brandSlug?: string) {
        try {
            return await this.productService.getProducts({
                page: this.currentPage,
                limit: this.pageSize,
                categoryId: categoryId,
                categorySlug: categorySlug,
                brandSlug: brandSlug
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
            const result = await this.loadProductsData(this.currentCategory?.id);
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

    addToCart(product: Product, event: Event) {
        event.stopPropagation();
        this.cartService.addToCart(product);
    }
}
