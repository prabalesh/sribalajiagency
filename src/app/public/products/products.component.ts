import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, Category } from '../../core/models/models';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {

  products: Product[] = [];
  categories: Category[] = [];
  currentCategory: Category | undefined;
  subCategories: Category[] = [];

  // Breadcrumb/Navigation state
  isRoot = true;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const categorySlug = params.get('category');
      const subcategorySlug = params.get('subcategory');

      if (subcategorySlug) {
        // Level 2: Subcategory selected
        this.isRoot = false;
        this.currentCategory = this.productService.getCategoryBySlug(subcategorySlug);
        this.loadProducts(this.currentCategory?.id);
        this.subCategories = []; // No children for now
      } else if (categorySlug) {
        // Level 1: Main Category selected
        this.isRoot = false;
        this.currentCategory = this.productService.getCategoryBySlug(categorySlug);
        this.subCategories = this.productService.getCategoriesByParentId(this.currentCategory?.id);
        this.loadProducts(this.currentCategory?.id);
      } else {
        // Root: Show Main Categories
        this.isRoot = true;
        this.currentCategory = undefined;
        this.categories = this.productService.getCategoriesByParentId(undefined); // Get root categories
        this.loadProducts(undefined); // Load all or nothing? Let's load all for now or maybe featured
      }
    });
  }

  loadProducts(categoryId: string | undefined) {
    if (categoryId) {
      this.products = this.productService.getProductsByCategory(categoryId);
    } else {
      // If no category selected, maybe show all or just popular?
      // For now showing all
      this.products = this.productService.getProducts();
    }
  }
}
