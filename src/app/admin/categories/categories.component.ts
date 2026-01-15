import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Category } from '../../core/models/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [];
  newCategory: Partial<Category> = {
    name: '',
    slug: '',
    description: '',
  };

  constructor(private productService: ProductService) { }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    // Only showing Main Categories for management simplicty first?
    // Or all? Let's show all for transparency.
    this.categories = this.productService.getCategories();
  }

  addCategory() {
    if (this.newCategory.name && this.newCategory.slug) {
      const category: Category = {
        id: `cat-${Math.random().toString(36).substr(2, 5)}`,
        name: this.newCategory.name!,
        slug: this.newCategory.slug!,
        description: this.newCategory.description
        // parentId is undefined, so it's a Main Category
      };

      this.productService.addCategory(category);
      this.resetForm();
    }
  }

  resetForm() {
    this.newCategory = { name: '', slug: '', description: '' };
  }

  // Helper to auto-generate slug from name
  generateSlug() {
    if (this.newCategory.name) {
      this.newCategory.slug = this.newCategory.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
  }
}
