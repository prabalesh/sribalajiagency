import { Component, OnInit, inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CartService } from '../../core/store/cart.service';
import { Product, ProductVariant } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Brand } from '../../core/models/brand.model';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { ToastService } from '../../core/services/toast.service';
import {
    LucideAngularModule,
    ShoppingCart,
    Plus,
    Minus,
    Heart,
    Share2,
    ChevronLeft,
    ChevronRight,
    Package,
    Truck,
    ShieldCheck,
    CreditCard,
    Wallet,
    Home,
    AlertCircle,
    Check,
    X,
    Star,
    Tag,
    Info
} from 'lucide-angular';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        NgOptimizedImage,
        LucideAngularModule,
        SkeletonComponent,
        ProductCardComponent,
        BreadcrumbsComponent,
        ProductReviewsComponent
    ],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);
    private cartService = inject(CartService);
    private toastService = inject(ToastService);
    private platformId = inject(PLATFORM_ID);

    // Icon references
    readonly ShoppingCart = ShoppingCart;
    readonly Plus = Plus;
    readonly Minus = Minus;
    readonly Heart = Heart;
    readonly Share2 = Share2;
    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;
    readonly Package = Package;
    readonly Truck = Truck;
    readonly ShieldCheck = ShieldCheck;
    readonly CreditCard = CreditCard;
    readonly Wallet = Wallet;
    readonly Home = Home;
    readonly AlertCircle = AlertCircle;
    readonly Check = Check;
    readonly X = X;
    readonly Star = Star;
    readonly Tag = Tag;
    readonly Info = Info;

    private isBrowser = false;

    @ViewChild('productGrid') productGrid!: ElementRef<HTMLElement>;

    product?: Product;
    category?: Category;
    brand?: Brand;
    relatedProducts: Product[] = [];
    quantity: number = 1;
    selectedImageIndex: number = 0;
    isLoading = false;
    breadcrumbItems: BreadcrumbItem[] = [];
    selectedVariant: ProductVariant | undefined;
    error: string | null = null;
    isAddingToCart = false;

    ngOnInit() {
        this.isBrowser = isPlatformBrowser(this.platformId);
        this.route.paramMap.subscribe(async params => {
            const id = params.get('id');
            if (id) {
                await this.loadProduct(id);
            }
        });
    }

    async loadProduct(id: string) {
        if (!this.isBrowser) return;
        this.isLoading = true;
        this.error = null;
        try {
            this.selectedImageIndex = 0;
            this.selectedVariant = undefined;
            this.quantity = 1;
            this.product = await this.productService.getProductById(id);

            if (this.product) {
                // Ensure images is an array
                if (this.product.images && !Array.isArray(this.product.images)) {
                    this.product.images = typeof this.product.images === 'object'
                        ? Object.values(this.product.images)
                        : [];
                } else if (!this.product.images) {
                    this.product.images = [];
                }

                // Auto-select first variant if exists
                if (this.product.variants && this.product.variants.length > 0) {
                    this.selectVariant(this.product.variants[0]);
                }

                // Build Breadcrumbs
                this.breadcrumbItems = [
                    { label: 'Home', url: '/' },
                    { label: 'Catalog', url: '/products' }
                ];

                const catId = this.product.categoryId || this.product.category?.id;

                if (catId) {
                    const categories = await this.categoryService.getCategories();
                    this.category = categories.find((c: Category) => c.id === catId);
                    if (this.category) {
                        this.breadcrumbItems.push({
                            label: this.category.name,
                            url: ['/products', this.category.slug]
                        });
                    }
                    try {
                        const related = await this.productService.getProductsByCategory(catId);
                        this.relatedProducts = related.items
                            .filter((p: Product) => p.id !== id)
                            .slice(0, 12);
                    } catch (err) {
                        console.error('Failed to load related products', err);
                    }
                }

                this.breadcrumbItems.push({ label: this.product.name });

                const brandSlug = this.product.brand?.slug;
                if (brandSlug) {
                    try {
                        this.brand = await this.brandService.getBrandBySlug(brandSlug);
                    } catch (err) {
                        console.error('Failed to load brand', err);
                    }
                }

                // Reset scroll
                if (this.isBrowser) {
                    window.scrollTo(0, 0);
                }
            }
        } catch (error) {
            console.error('ProductDetail: Failed to load product', error);
            this.error = 'Failed to load product. Please try again later.';
            this.toastService.error('Failed to load product');
        } finally {
            this.isLoading = false;
        }
    }

    selectVariant(variant: ProductVariant) {
        this.selectedVariant = variant;
        this.selectedImageIndex = 0;
        this.quantity = 1; // Reset quantity on variant change
    }

    get groupedVariants() {
        if (!this.product?.variants) return {};
        const groups: { [key: string]: { type: any, variants: ProductVariant[] } } = {};

        this.product.variants.forEach(v => {
            const typeName = v.variantType?.displayName || v.variantType?.name || 'Options';
            if (!groups[typeName]) {
                groups[typeName] = { type: v.variantType, variants: [] };
            }
            groups[typeName].variants.push(v);
        });

        return groups;
    }

    get displayImages(): any[] {
        if (this.selectedVariant?.images?.length) {
            return this.selectedVariant.images.map(url => ({ url, isPrimary: false }));
        }
        if (this.selectedVariant?.image) {
            return [{ url: this.selectedVariant.image, isPrimary: true }];
        }
        return this.product?.images || [];
    }

    get currentPrice(): number {
        return this.selectedVariant ? this.selectedVariant.price : (this.product?.variants?.[0]?.price || 0);
    }

    get currentComparisonPrice(): number | undefined {
        return this.selectedVariant?.comparisonPrice || this.product?.variants?.[0]?.comparisonPrice;
    }

    get discountPercentage(): number | undefined {
        const comparison = this.currentComparisonPrice;
        if (!comparison || comparison <= this.currentPrice) return undefined;
        return Math.round(((comparison - this.currentPrice) / comparison) * 100);
    }

    get currentStock(): number {
        if (this.product?.variants?.length) {
            return this.selectedVariant ? this.selectedVariant.stock : 0;
        }
        return 0;
    }

    get maxQuantity(): number {
        const stock = this.currentStock;
        const orderLimit = this.product?.maxOrderQuantity || Infinity;
        return Math.min(stock, orderLimit);
    }

    async addToCart() {
        if (!this.product) return;

        if (this.product.variants?.length && !this.selectedVariant) {
            this.toastService.warning('Please select a variation');
            return;
        }

        if (this.currentStock <= 0) {
            this.toastService.error('Product is out of stock');
            return;
        }

        this.isAddingToCart = true;
        try {
            await this.cartService.addToCart(
                this.product.id,
                this.quantity,
                this.selectedVariant?.id
            );
            this.toastService.success('Added to cart successfully');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            this.toastService.error('Failed to add to cart');
        } finally {
            this.isAddingToCart = false;
        }
    }

    updateQuantity(delta: number) {
        const newQty = this.quantity + delta;
        if (newQty < 1 || newQty > this.maxQuantity) return;
        this.quantity = newQty;
    }

    selectImage(index: number) {
        this.selectedImageIndex = index;
    }

    onCardAddToCart(product: Product) {
        this.cartService.addToCart(product.id);
    }

    scrollCarousel(direction: 'left' | 'right') {
        if (!this.productGrid) return;

        const container = this.productGrid.nativeElement;
        const scrollAmount = container.clientWidth * 0.8;

        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    async shareProduct() {
        if (!this.product || !this.isBrowser) return;

        const shareData = {
            title: this.product.name,
            text: this.product.description,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                this.toastService.success('Link copied to clipboard');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    }
}
