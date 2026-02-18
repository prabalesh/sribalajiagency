import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Package, Search, ImageIcon, Edit, Trash2 } from 'lucide-angular';
import { Product } from '../../../../core/models/product.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, ImageUrlPipe],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
    public authService = inject(AuthService);

    @Input({ required: true }) products: Product[] = [];
    @Input() isLoading = false;
    @Input() isDeleting = false;
    @Input() isSaving = false;
    @Input({ required: true }) totalItems = 0;
    @Input({ required: true }) itemsPerPage = 0;
    @Input({ required: true }) currentPage = 1;
    @Input({ required: true }) searchQuery = '';

    @Output() edit = new EventEmitter<Product>();
    @Output() delete = new EventEmitter<string>();
    @Output() search = new EventEmitter<string>();
    @Output() pageChange = new EventEmitter<number>();

    readonly Package = Package;
    readonly Search = Search;
    readonly ImageIcon = ImageIcon;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;

    onSearchInput(query: string) {
        this.search.emit(query);
    }

    onEdit(product: Product) {
        this.edit.emit(product);
    }

    onDelete(id: string) {
        this.delete.emit(id);
    }

    onPageChange(page: number) {
        this.pageChange.emit(page);
    }

    get filteredProducts(): Product[] {
        if (!this.searchQuery.trim()) {
            return this.products;
        }
        const query = this.searchQuery.toLowerCase();
        return this.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        );
    }

    sumStock = (acc: number, variant: any) => acc + (variant.stock || 0);

    getMinPrice(product: Product): number {
        if (!product.variants || product.variants.length === 0) return 0;
        return Math.min(...product.variants.map(v => v.price));
    }

    getMinComparisonPrice(product: Product): number | undefined {
        if (!product.variants || product.variants.length === 0) return undefined;
        const comparisonPrices = product.variants
            .map(v => v.comparisonPrice)
            .filter((p): p is number => p !== undefined && p !== null);
        return comparisonPrices.length > 0 ? Math.min(...comparisonPrices) : undefined;
    }
}
