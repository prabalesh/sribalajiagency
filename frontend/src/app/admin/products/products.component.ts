import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private toastService: ToastService,
    public authService: AuthService
  ) { }

  async ngOnInit() {
    await this.loadProducts();
    this.brands = await this.brandService.getBrands();
    this.mainCategories = await this.categoryService.getCategoriesByParentId(undefined);
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
    this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
    this.newProduct.categoryId = '';
  }

  async saveProduct() {
    console.log('AdminProducts: Attempting to save product', this.newProduct);
    if (this.newProduct.name && this.newProduct.categoryId) {
      try {
        let savedProduct: Product;
        if (this.isEditing) {
          savedProduct = await this.productService.updateProduct(this.newProduct);
        } else {
          savedProduct = await this.productService.addProduct(this.newProduct);
        }

        // Handle Image Uploads
        if (this.uploadedFiles.length > 0) {
          for (let i = 0; i < this.uploadedFiles.length; i++) {
            await this.productService.uploadImage(savedProduct.id, this.uploadedFiles[i], i === 0 && !savedProduct.images?.some(img => img.isPrimary));
          }
        }

        // Refresh list
        // Refresh list
        await this.loadProducts();
        this.resetForm();
        this.toastService.success(`Product ${this.isEditing ? 'updated' : 'added'} successfully!`);
      } catch (err) {
        console.error('AdminProducts: Failed to save product', err);
        this.toastService.error('Failed to save product. Check backend logs.');
      }
    } else {
      this.toastService.warning('Please fill all required fields including Category');
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

    const categories = await this.categoryService.getCategories();
    const currentCategory = categories.find((c: Category) => c.id === product.categoryId);
    if (currentCategory && currentCategory.parentId) {
      this.selectedMainCategoryId = currentCategory.parentId;
      this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
    } else if (currentCategory) {
      this.selectedMainCategoryId = currentCategory.id;
      this.subCategories = await this.categoryService.getCategoriesByParentId(this.selectedMainCategoryId);
    }
  }

  async deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      await this.productService.deleteProduct(id);
      this.products = this.products.filter(p => p.id !== id);
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
      images: [], // Init empty array
      description: ''
    });
  }

  removeVariant(index: number) {
    this.newProduct.variants?.splice(index, 1);
  }

  async uploadVariantImage(event: any, variant: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const res = await this.productService.uploadGenericImages(files);
        if (!variant.images) variant.images = [];

        // Add all returned URLs
        if (res.urls && res.urls.length > 0) {
          variant.images.push(...res.urls);

          // Set primary if empty
          if (!variant.image) variant.image = res.urls[0];
        }

        this.toastService.success(`${files.length} image(s) uploaded`);
      } catch (err) {
        console.error(err);
        this.toastService.error('Failed to upload images');
      }
    }
    event.target.value = ''; // Reset input
  }

  // Image Management
  async removeImage(imageId: string) {
    if (confirm('Remove this image?')) {
      await this.productService.deleteImage(imageId);
      if (this.isEditing) {
        this.newProduct.images = this.newProduct.images?.filter(img => img.id !== imageId);
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
    // Reset the input so the same file can be picked again if needed
    event.target.value = '';
  }
  async loadProducts() {
    const data = await this.productService.getProducts({
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    this.products = data.items;
    this.totalItems = data.total;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }
}

