import { Component, OnInit } from '@angular/core';
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
import { DragDropDirective } from '../../shared/directives/drag-drop.directive';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropDirective, PaginationComponent, ImageUrlPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  newProduct: Product = this.getEmptyProduct();
  isEditing = false;
  uploadedFiles: any[] = [];

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
  mainCategories: Category[] = [];
  subCategories: Category[] = [];

  // Selection State
  selectedMainCategoryId: string = '';

  // Debouncing for search/filter (if you add search later)
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private toastService: ToastService,
    public authService: AuthService
  ) { }

  async ngOnInit() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadProducts(),
        this.loadBrands(),
        this.loadMainCategories()
      ]);
    } catch (error) {
      console.error('Error initializing component:', error);
      this.toastService.error('Failed to load initial data');
    } finally {
      this.isLoading = false;
    }

    // Setup debounced search (for future search functionality)
    this.setupSearchDebounce();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      // Implement search logic here when needed
      this.performSearch(searchTerm);
    });
  }

  private async performSearch(searchTerm: string) {
    // Placeholder for search implementation
    console.log('Searching for:', searchTerm);
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

  private async loadMainCategories() {
    try {
      this.mainCategories = await this.categoryService.getCategoriesByParentId(undefined);
    } catch (error) {
      console.error('Error loading main categories:', error);
      throw error;
    }
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

  async onMainCategoryChange() {
    try {
      this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
      this.newProduct.categoryId = '';
    } catch (error) {
      console.error('Error loading subcategories:', error);
      this.toastService.error('Failed to load subcategories');
    }
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
    if (!this.selectedMainCategoryId) {
      this.toastService.warning('Please select a Main Category');
      return;
    }
    if (!this.newProduct.categoryId) {
      this.toastService.warning('Please select a Sub Category');
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
        variants: this.newProduct.variants?.map(v => {
          const { sku, specifications, ...variantData } = v;
          return {
            ...variantData,
            id: v.id && v.id !== '' ? v.id : undefined
          };
        })
      };

      let savedProduct: Product;
      if (this.isEditing) {
        console.log('AdminProducts: Attempting to update product', this.newProduct);
        savedProduct = await this.productService.updateProduct(this.newProduct.id, productData);
      } else {
        savedProduct = await this.productService.addProduct(productData);
      }

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
        this.isUploadingImage = false;
      }

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

    try {
      const categories = await this.categoryService.getCategories();
      const currentCategory = categories.find((c: Category) => c.id === product.categoryId);
      if (currentCategory && currentCategory.parentId) {
        this.selectedMainCategoryId = currentCategory.parentId;
        this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
      } else if (currentCategory) {
        this.selectedMainCategoryId = currentCategory.id;
        this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
      }
    } catch (error) {
      console.error('Error loading categories for edit:', error);
      this.toastService.error('Failed to load category information');
    }
  }

  async deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
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
    event.target.value = '';
  }

  // Image Management
  async removeImage(imageId: string) {
    if (confirm('Remove this image?')) {
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
  }

  removeUploadedFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  resetForm() {
    this.newProduct = this.getEmptyProduct();
    this.uploadedFiles = [];
    this.isEditing = false;
    this.selectedMainCategoryId = '';
    this.subCategories = [];
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

  onFileDropped(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      this.uploadedFiles.push(files[i]);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedFiles.push(files[i]);
      }
    }
    event.target.value = '';
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
}
