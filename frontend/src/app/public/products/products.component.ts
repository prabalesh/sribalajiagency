import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
export class ProductsComponent implements OnInit {
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private cartService = inject(CartService);
    private route = inject(ActivatedRoute);

    products: Product[] = [];
    categories: Category[] = [];
    currentCategory: Category | undefined;
    breadcrumbCategories: Category[] = [];

    // Pagination State
    currentPage = 1;
    pageSize = 12;
    totalItems = 0;
    isLoading = false;
    hasMore = true;

    async ngOnInit() {
        this.route.paramMap.subscribe(async params => {
            const categorySlug = params.get('category');

            // Reset state for new category
            this.products = [];
            this.currentPage = 1;
            this.hasMore = true;

            if (categorySlug) {
                this.currentCategory = await this.categoryService.getCategoryBySlug(categorySlug);
                await this.loadProducts(this.currentCategory?.id);
            } else {
                this.currentCategory = undefined;
                await this.loadProducts(undefined);
            }
            this.categories = await this.categoryService.getCategories();
        });
    }

    async loadProducts(categoryId: string | undefined) {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        try {
            const result = await this.productService.getProducts({
                page: this.currentPage,
                limit: this.pageSize,
                categoryId: categoryId
            });

            this.products = [...this.products, ...result.items];
            this.totalItems = result.total;
            this.hasMore = this.products.length < this.totalItems;

            if (this.hasMore) {
                this.currentPage++;
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            this.isLoading = false;
        }
    }

    onScroll() {
        this.loadProducts(this.currentCategory?.id);
    }

    addToCart(product: Product, event: Event) {
        event.stopPropagation();
        this.cartService.addToCart(product);
    }
}
