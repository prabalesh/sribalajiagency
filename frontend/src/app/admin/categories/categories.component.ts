import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/api/category.service';
import { Category } from '../../core/models/category.model';
import { ToastService } from '../../core/services/toast.service';

import { AuthService } from '../../core/services/auth/auth.service';

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

  constructor(
    private categoryService: CategoryService,
    public authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.categories = await this.categoryService.getCategories();
    } catch (error) {
      this.toastService.apiError(error, 'Failed to load categories');
    }
  }

  isEditing = false;

  async addCategory() {
    if (this.newCategory.name && this.newCategory.slug) {
      try {
        if (this.isEditing) {
          await this.categoryService.updateCategory(this.newCategory as Category);
          this.toastService.success('Category updated successfully');
        } else {
          const category: Category = {
            id: `cat-${Math.random().toString(36).substr(2, 5)}`,
            name: this.newCategory.name!,
            slug: this.newCategory.slug!,
            description: this.newCategory.description
          };
          await this.categoryService.addCategory(category);
          this.toastService.success('Category added successfully');
        }
        this.resetForm();
        this.loadCategories();
      } catch (error: any) {
        this.toastService.apiError(error, 'Failed to save category');
      }
    }
  }

  editCategory(category: Category) {
    this.newCategory = { ...category };
    this.isEditing = true;
  }

  async deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await this.categoryService.deleteCategory(id);
        this.toastService.success('Category deleted successfully');
        this.loadCategories();
      } catch (error: any) {
        this.toastService.apiError(error, 'Failed to delete category');
      }
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
