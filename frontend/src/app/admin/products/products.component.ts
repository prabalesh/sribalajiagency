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
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import {
  LucideAngularModule,
  Package,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  ShoppingCart,
  AlertCircle,
  Check,
  Search,
  FolderTree,
  ChevronDown
} from 'lucide-angular';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ImageUploaderComponent,
    ImageUrlPipe,
    LucideAngularModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  // Icon references
  readonly Package = Package;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Upload = Upload;
  readonly ImageIcon = ImageIcon;
  readonly Tag = Tag;
  readonly DollarSign = DollarSign;
  readonly Layers = Layers;
  readonly ShoppingCart = ShoppingCart;
  readonly AlertCircle = AlertCircle;
  readonly Check = Check;
  readonly Search = Search;
  readonly FolderTree = FolderTree;
  readonly ChevronDown = ChevronDown;

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
        this.loadCategories()
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
    // Implement search logic here when needed
  }

  onSearchInput(searchTerm: string) {
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

  onCategoryChange() {
    this.newProduct.categoryId = this.selectedCategoryId;
  }

  async saveProduct() {
    console.log('AdminProducts: Attempting to save product', this.newProduct);

    // Validation
    if (!this.newProduct.name) {
      this.toastService.warning('Product Name is required');
      return;
    }
    if (!this.newProduct.brandId) {
      this.toastService.warning('Please select a Brand');
      return;
    }
    if (!this.newProduct.categoryId) {
      this.toastService.warning('Please select a Category');
      return;
    }
    if (!this.newProduct.price || this.newProduct.price <= 0) {
      this.toastService.warning('Price must be greater than 0');
      return;
    }
    if (!this.newProduct.description) {
      this.toastService.warning('Description is required');
      return;
    }
    if (this.newProduct.stock < 0) {
      this.toastService.warning('Stock cannot be negative');
      return;
    }

    this.isSaving = true;
    try {
      const productData = {
        name: this.newProduct.name,
        description: this.newProduct.description,
        price: this.newProduct.price,
        comparisonPrice: this.newProduct.comparisonPrice,
        isAvailable: this.newProduct.isAvailable,
        stock: this.newProduct.stock,
        isShowcaseOnly: this.newProduct.isShowcaseOnly,
        allowedPaymentMethods: this.newProduct.allowedPaymentMethods,
        categoryId: this.newProduct.categoryId,
        brandId: this.newProduct.brandId,
        isFeatured: this.newProduct.isFeatured,
        // isFeatured: this.newProduct.isFeatured,
        variants: (this.newProduct.variants && this.newProduct.variants.length > 0)
          ? this.newProduct.variants.map(v => {
            const { sku, specifications, ...variantData } = v;
            return {
              ...variantData,
              id: v.id && v.id !== '' ? v.id : undefined
            };
          })
          : [{
            name: 'Default',
            price: this.newProduct.price,
            comparisonPrice: this.newProduct.comparisonPrice,
            stock: this.newProduct.stock,
            sku: this.generateSku(this.newProduct.name),
            image: this.newProduct.images && this.newProduct.images.length > 0 ? this.newProduct.images[0].url : '',
            images: this.newProduct.images && this.newProduct.images.length > 0 ? [this.newProduct.images[0].url] : []
          }]
      };

      let savedProduct: Product;
      if (this.isEditing) {
        console.log('AdminProducts: Attempting to update product', this.newProduct);
        savedProduct = await this.productService.updateProduct(this.newProduct.id, productData);
      } else {
        savedProduct = await this.productService.addProduct(productData);
      }

      // Handle image deletions if any (already handled by removeImage tool)

      // Handle Image Uploads
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

      // Handle Image URLs
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

      // Refresh list
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
    console.log('AdminProducts: Attempting to edit product', product);
    this.newProduct = {
      ...product,
      variants: product.variants ? [...product.variants] : [],
      categoryId: product.categoryId || product.category?.id || '',
      brandId: product.brandId || product.brand?.id || ''
    };
    this.isEditing = true;

    this.selectedCategoryId = product.categoryId || product.category?.id || '';

    // Scroll to form
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

  // Variant Management
  addVariant() {
    if (!this.newProduct.variants) this.newProduct.variants = [];
    this.newProduct.variants.push({
      id: '',
      name: '',
      price: this.newProduct.price,
      comparisonPrice: this.newProduct.comparisonPrice,
      stock: 0,
      image: '',
      images: [],
      description: ''
    });
  }

  removeVariant(index: number) {
    this.newProduct.variants?.splice(index, 1);
  }

  async uploadVariantImage(event: any, variant: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.isUploadingImage = true;
      try {
        const res = await this.productService.uploadGenericImages(files);
        if (!variant.images) variant.images = [];

        if (res.urls && res.urls.length > 0) {
          variant.images.push(...res.urls);
          if (!variant.image) variant.image = res.urls[0];
        }

        this.toastService.success(`${files.length} image(s) uploaded`);
      } catch (err) {
        console.error(err);
        this.toastService.error('Failed to upload images');
      } finally {
        this.isUploadingImage = false;
      }
    }
    if (event.target) event.target.value = '';
  }

  async onVariantFileSelected(file: File, variant: any) {
    this.isUploadingImage = true;
    try {
      const res = await this.productService.uploadGenericImages([file] as any);
      if (res.urls && res.urls.length > 0) {
        variant.image = res.urls[0];
        if (!variant.images) variant.images = [];
        variant.images.push(res.urls[0]);
        this.toastService.success('Variant image uploaded');
      }
    } catch (err) {
      console.error(err);
      this.toastService.error('Failed to upload variant image');
    } finally {
      this.isUploadingImage = false;
    }
  }

  onVariantUrlChanged(url: string, variant: any) {
    variant.image = url;
  }

  onVariantImageRemoved(variant: any) {
    variant.image = '';
  }

  // Image Management
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
      price: 0,
      comparisonPrice: undefined,
      images: [],
      variants: [],
      isAvailable: true,
      isFeatured: false,
      stock: 0,
      isShowcaseOnly: false,
      allowedPaymentMethods: ['online', 'cod']
    };
  }

  async onMainFileSelected(file: File) {
    this.uploadedFiles.push(file);
    this.toastService.success('Image added to gallery');
  }

  onMainUrlChanged(url: string) {
    this.pendingImageUrl = url;
  }

  addPendingUrl() {
    if (this.pendingImageUrl) {
      // In this app, we'll store temporary URLs in a separate list or push to images with a flag
      if (!this.newProduct.images) this.newProduct.images = [];

      // We'll use a specific indicator for new URL-based images
      // The backend doesn't support URLs in CreateProductDto yet, so we'll need a workaround
      // For now, let's just add it to a list we'll handle on submit
      this.pendingUrls.push(this.pendingImageUrl);
      this.pendingImageUrl = '';
      this.toastService.success('URL added to gallery');
    }
  }

  removePendingUrl(index: number) {
    this.pendingUrls.splice(index, 1);
  }

  onMainImageRemoved() {
    this.pendingImageUrl = '';
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

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  private generateSku(name: string): string {
    return `${name.replace(/\s+/g, '-').toUpperCase()}-DEF`;
  }
}
