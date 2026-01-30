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
                const subcategorySlug = params.get('subcategory');
                const categorySlug = params.get('category');
                const activeSlug = subcategorySlug || categorySlug;

                // Reset state for new route
                this.products = [];
                this.currentPage = 1;
                this.hasMore = true;
                this.isCategoryNotFound = false;
                this.isLoading = true;

                if (activeSlug) {
                    return this.categoryService.getCategoryBySlug(activeSlug).then(category => ({
                        category,
                        isSlugProvided: true
                    }));
                } else {
                    return Promise.resolve({ category: undefined, isSlugProvided: false });
                }
            }),
            switchMap(async ({ category, isSlugProvided }) => {
                this.currentCategory = category;

                if (isSlugProvided && !category) {
                    this.isCategoryNotFound = true;
                    this.isLoading = false;
                    return { items: [], total: 0 };
                }

                return this.loadProductsData(category?.id);
            })
        ).subscribe(result => {
            this.products = result.items;
            this.totalItems = result.total;
            this.hasMore = this.products.length < this.totalItems;
            if (this.hasMore) this.currentPage++;
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
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    private async loadProductsData(categoryId: string | undefined) {
        try {
            return await this.productService.getProducts({
                page: this.currentPage,
                limit: this.pageSize,
                categoryId: categoryId
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
