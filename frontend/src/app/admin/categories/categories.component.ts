import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/api/category.service';
import { Category } from '../../core/models/category.model';

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

  constructor(private categoryService: CategoryService) { }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    // Only showing Main Categories for management simplicty first?
    // Or all? Let's show all for transparency.
    this.categories = await this.categoryService.getCategories();
  }

  isEditing = false;

  async addCategory() {
    if (this.newCategory.name && this.newCategory.slug) {
      if (this.isEditing) {
        await this.categoryService.updateCategory(this.newCategory as Category);
      } else {
        const category: Category = {
          id: `cat-${Math.random().toString(36).substr(2, 5)}`,
          name: this.newCategory.name!,
          slug: this.newCategory.slug!,
          description: this.newCategory.description
        };
        await this.categoryService.addCategory(category);
      }
      this.resetForm();
      this.loadCategories();
    }
  }

  editCategory(category: Category) {
    this.newCategory = { ...category };
    this.isEditing = true;
  }

  async deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      await this.categoryService.deleteCategory(id);
      this.loadCategories();
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
