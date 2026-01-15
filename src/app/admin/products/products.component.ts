import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, Category, Brand } from '../../core/models/models';
import { ProductService } from '../../core/services/product.service';
import { DragDropDirective } from '../../shared/directives/drag-drop.directive';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropDirective],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  newProduct: Product = this.getEmptyProduct();
  isEditing = false;
  uploadedFiles: any[] = [];

  // Dropdown Data
  brands: Brand[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];

  // Selection State
  selectedMainCategoryId: string = '';

  constructor(private productService: ProductService) { }

  ngOnInit() {
    // Load Initial Data
    this.products = this.productService.getProducts(); // In real app, this would be an Observable
    this.brands = this.productService.getBrands();
    this.mainCategories = this.productService.getCategoriesByParentId(undefined); // Get root categories
  }

  onMainCategoryChange() {
    // Load subcategories based on selection
    this.subCategories = this.productService.getCategoriesByParentId(this.selectedMainCategoryId);
    // Reset subcategory selection in product
    this.newProduct.categoryId = '';
  }

  saveProduct() {
    // Ensure specific subcategory is selected if available, else maybe main category?
    // For this user logic, they seem to want specific leaf categories (Ceiling Fan, etc)
    if (this.newProduct.name && this.newProduct.categoryId) {
      if (this.isEditing) {
        const index = this.products.findIndex(p => p.id === this.newProduct.id);
        if (index !== -1) this.products[index] = { ...this.newProduct };
      } else {
        this.newProduct.id = Math.random().toString(36).substr(2, 9);
        this.products.push({ ...this.newProduct });
      }
      this.resetForm();
    } else {
      alert('Please fill all required fields including Category');
    }
  }

  editProduct(product: Product) {
    this.newProduct = { ...product };
    this.isEditing = true;

    // Find parent category of the product's category to set Main Dropdown
    const currentCategory = this.productService.getCategories().find(c => c.id === product.categoryId);
    if (currentCategory && currentCategory.parentId) {
      this.selectedMainCategoryId = currentCategory.parentId;
      this.subCategories = this.productService.getCategoriesByParentId(this.selectedMainCategoryId);
    } else if (currentCategory) {
      // It is a main category?
      this.selectedMainCategoryId = currentCategory.id;
      this.subCategories = this.productService.getCategoriesByParentId(this.selectedMainCategoryId);
    }
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      this.products = this.products.filter(p => p.id !== id);
    }
  }

  resetForm() {
    this.newProduct = this.getEmptyProduct();
    this.uploadedFiles = [];
    this.isEditing = false;
    this.selectedMainCategoryId = '';
    this.subCategories = [];
  }

  getEmptyProduct(): Product {
    return { id: '', name: '', description: '', brandId: '', categoryId: '', price: 0, imageUrls: [], isAvailable: true };
  }

  onFileDropped(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      this.uploadedFiles.push(files[i]);
    }
  }
}
