import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Brand } from '../../core/models/brand.model';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { VariantTypeService } from '../../core/services/api/variant-type.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LucideAngularModule, Package } from 'lucide-angular';
import { VariantType } from '../../core/models/variant-type.model';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductListComponent } from './components/product-list/product-list.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ProductFormComponent,
    ProductListComponent
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private variantTypeService = inject(VariantTypeService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  readonly Package = Package;

  products: Product[] = [];
  newProduct: Product = this.getEmptyProduct();
  isEditing = false;
  uploadedFiles: File[] = [];
  pendingImageUrl: string = '';
  pendingUrls: string[] = [];

  // Loading States
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isUploadingImage = false;

  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Dropdown Data
  brands: Brand[] = [];
  categories: (Category & { level: number })[] = [];
  variantTypes: VariantType[] = [];

  // Selection State
  selectedCategoryId: string = '';

  // Search
  searchQuery = '';
  private searchSubject = new Subject<string>();

  async ngOnInit() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadProducts(),
        this.loadBrands(),
        this.loadCategories(),
        this.loadVariantTypes()
      ]);
    } catch (error) {
      console.error('Error initializing component:', error);
      this.toastService.error('Failed to load initial data');
    } finally {
      this.isLoading = false;
    }

    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  private async performSearch(searchTerm: string) {
    console.log('Searching for:', searchTerm);
  }

  onSearchInput(searchTerm: string) {
    this.searchQuery = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  private async loadBrands() {
    try {
      this.brands = await this.brandService.getBrands();
    } catch (error) {
      console.error('Error loading brands:', error);
      throw error;
    }
  }

  private async loadCategories() {
    try {
      const tree = await this.categoryService.getCategoryTree();
      this.categories = this.flattenCategories(tree);
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  private flattenCategories(cats: Category[], level = 0): (Category & { level: number })[] {
    const flattened: (Category & { level: number })[] = [];
    cats.forEach(cat => {
      flattened.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        flattened.push(...this.flattenCategories(cat.children, level + 1));
      }
    });
    return flattened;
  }

  togglePaymentMethod(method: string) {
    if (!this.newProduct.allowedPaymentMethods) {
      this.newProduct.allowedPaymentMethods = [];
    }
    const idx = this.newProduct.allowedPaymentMethods.indexOf(method);
    if (idx > -1) {
      this.newProduct.allowedPaymentMethods.splice(idx, 1);
    } else {
      this.newProduct.allowedPaymentMethods.push(method);
    }
  }

  private async loadVariantTypes() {
    try {
      this.variantTypeService.getVariantTypes().subscribe(types => {
        this.variantTypes = types;
      });
    } catch (error) {
      console.error('Error loading variant types:', error);
      throw error;
    }
  }

  onCategoryChange(categoryId: string) {
    this.selectedCategoryId = categoryId;
    this.newProduct.categoryId = categoryId;
  }

  async saveProduct() {
    this.isSaving = true;
    try {
      const productData = {
        name: this.newProduct.name,
        description: this.newProduct.description,
        isAvailable: this.newProduct.isAvailable,
        isShowcaseOnly: this.newProduct.isShowcaseOnly,
        allowedPaymentMethods: this.newProduct.allowedPaymentMethods,
        categoryId: this.newProduct.categoryId,
        brandId: this.newProduct.brandId,
        isFeatured: this.newProduct.isFeatured,
        variants: this.newProduct.variants?.map(v => {
          const { sku, specifications, variantType, ...variantData } = v;
          return {
            ...variantData,
            id: v.id && v.id !== '' ? v.id : undefined,
            variantTypeId: v.variantTypeId === '' ? null : v.variantTypeId
          };
        }) || []
      };

      let savedProduct: Product;
      if (this.isEditing) {
        savedProduct = await this.productService.updateProduct(this.newProduct.id, productData);
      } else {
        savedProduct = await this.productService.addProduct(productData);
      }

      if (this.uploadedFiles.length > 0) {
        this.isUploadingImage = true;
        for (let i = 0; i < this.uploadedFiles.length; i++) {
          await this.productService.uploadImage(
            savedProduct.id,
            this.uploadedFiles[i],
            i === 0 && !savedProduct.images?.some(img => img.isPrimary)
          );
        }
      }

      if (this.pendingUrls.length > 0) {
        this.isUploadingImage = true;
        for (let i = 0; i < this.pendingUrls.length; i++) {
          await this.productService.addImageLink(
            savedProduct.id,
            this.pendingUrls[i],
            !savedProduct.images?.some(img => img.isPrimary) && i === 0 && this.uploadedFiles.length === 0
          );
        }
      }
      this.isUploadingImage = false;

      await this.loadProducts();
      this.resetForm();
      this.toastService.success(`Product ${this.isEditing ? 'updated' : 'added'} successfully!`);
    } catch (err: any) {
      console.error('AdminProducts: Failed to save product', err);
      this.toastService.apiError(err, 'Failed to save product');
    } finally {
      this.isSaving = false;
    }
  }

  async editProduct(product: Product) {
    this.newProduct = {
      ...product,
      variants: product.variants ? [...product.variants] : [],
      categoryId: product.categoryId || product.category?.id || '',
      brandId: product.brandId || product.brand?.id || ''
    };
    this.isEditing = true;
    this.selectedCategoryId = product.categoryId || product.category?.id || '';

    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.querySelector('.form-card')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }

  async deleteProduct(id: string) {
    if (!confirm('Delete this product? This action cannot be undone.')) {
      return;
    }

    this.isDeleting = true;
    try {
      await this.productService.deleteProduct(id);
      this.products = this.products.filter(p => p.id !== id);
      this.toastService.success('Product deleted successfully');
    } catch (err) {
      console.error('AdminProducts: Failed to delete product', err);
      this.toastService.apiError(err, 'Failed to delete product');
    } finally {
      this.isDeleting = false;
    }
  }

  addVariant() {
    const lastPrice = this.newProduct.variants?.[this.newProduct.variants.length - 1]?.price || 0;
    const lastComparisonPrice = this.newProduct.variants?.[this.newProduct.variants.length - 1]?.comparisonPrice;

    this.newProduct.variants.push({
      id: '',
      name: '',
      price: lastPrice,
      comparisonPrice: lastComparisonPrice,
      stock: 0,
      image: '',
      images: [],
      description: '',
      variantTypeId: ''
    });
  }

  removeVariant(index: number) {
    this.newProduct.variants?.splice(index, 1);
  }

  async onVariantFileSelected(event: { file: File, variant: any }) {
    this.isUploadingImage = true;
    try {
      const res = await this.productService.uploadGenericImages([event.file] as any);
      if (res.urls && res.urls.length > 0) {
        event.variant.image = res.urls[0];
        if (!event.variant.images) event.variant.images = [];
        event.variant.images.push(res.urls[0]);
        this.toastService.success('Variant image uploaded');
      }
    } catch (err) {
      console.error(err);
      this.toastService.error('Failed to upload variant image');
    } finally {
      this.isUploadingImage = false;
    }
  }

  onVariantUrlChanged(event: { url: string, variant: any }) {
    event.variant.image = event.url;
  }

  onVariantImageRemoved(variant: any) {
    variant.image = '';
  }

  async removeImage(imageId: string) {
    if (!confirm('Remove this image?')) {
      return;
    }

    this.isUploadingImage = true;
    try {
      await this.productService.deleteImage(imageId);
      if (this.isEditing) {
        this.newProduct.images = this.newProduct.images?.filter(img => img.id !== imageId);
      }
      this.toastService.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      this.toastService.error('Failed to remove image');
    } finally {
      this.isUploadingImage = false;
    }
  }

  removeUploadedFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  resetForm() {
    this.newProduct = this.getEmptyProduct();
    this.uploadedFiles = [];
    this.pendingUrls = [];
    this.pendingImageUrl = '';
    this.isEditing = false;
    this.selectedCategoryId = '';
  }

  getEmptyProduct(): Product {
    return {
      id: '',
      name: '',
      description: '',
      brandId: '',
      categoryId: '',
      images: [],
      variants: [{
        id: '',
        name: 'Default',
        price: 0,
        stock: 0,
        sku: 'DEFAULT-SKU',
        image: '',
        images: [],
        description: ''
      }],
      isAvailable: true,
      isFeatured: false,
      isShowcaseOnly: false,
      allowedPaymentMethods: ['online', 'cod']
    };
  }

  onMainFileSelected(file: File) {
    this.uploadedFiles.push(file);
    this.toastService.success('Image added to gallery');
  }

  onMainUrlChanged(url: string) {
    this.pendingImageUrl = url;
  }

  addPendingUrl() {
    if (this.pendingImageUrl) {
      this.pendingUrls.push(this.pendingImageUrl);
      this.pendingImageUrl = '';
      this.toastService.success('URL added to gallery');
    }
  }

  removePendingUrl(index: number) {
    this.pendingUrls.splice(index, 1);
  }

  async loadProducts() {
    this.isLoading = true;
    try {
      const data = await this.productService.getProducts({
        page: this.currentPage,
        limit: this.itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      });
      this.products = data.items;
      this.totalItems = data.total;
    } catch (error) {
      console.error('Error loading products:', error);
      this.toastService.error('Failed to load products');
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  private generateSku(name: string): string {
    return `${name.replace(/\s+/g, '-').toUpperCase()}-DEF`;
  }
}
