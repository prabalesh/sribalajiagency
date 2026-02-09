import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/api/category.service';
import { Category } from '../../core/models/category.model';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LucideAngularModule, FolderTree, Edit, Trash2, Plus, X, Layers, Search, Tag } from 'lucide-angular';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  // Icon references
  readonly FolderTree = FolderTree;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Layers = Layers;
  readonly Search = Search;
  readonly Tag = Tag;

  categories: Category[] = [];
  categoryTree: Category[] = [];
  newCategory: Partial<Category> = {
    name: '',
    slug: '',
    parentId: ''
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;
  searchQuery = '';

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    this.isLoading = true;
    try {
      this.categories = await this.categoryService.getCategories();
      this.categoryTree = await this.categoryService.getCategoryTree();
    } catch (error) {
      this.toastService.apiError(error, 'Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async addCategory() {
    if (!this.validateCategory()) {
      this.toastService.error('Please fill all required fields');
      return;
    }

    this.isSaving = true;
    try {
      const categoryData = {
        ...this.newCategory,
        parentId: this.newCategory.parentId || undefined
      };

      if (this.isEditing && this.newCategory.id) {
        await this.categoryService.updateCategory(categoryData as Category);
        this.toastService.success('Category updated successfully');
      } else {
        await this.categoryService.addCategory(categoryData as Category);
        this.toastService.success('Category added successfully');
      }
      this.resetForm();
      await this.loadCategories();
    } catch (error: any) {
      this.toastService.apiError(
        error,
        this.isEditing ? 'Failed to update category' : 'Failed to add category'
      );
      console.error('Error saving category:', error);
    } finally {
      this.isSaving = false;
    }
  }

  editCategory(category: Category) {
    this.newCategory = { ...category };
    this.isEditing = true;

    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.querySelector('.form-card')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }

  async deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await this.categoryService.deleteCategory(id);
      this.toastService.success('Category deleted successfully');
      await this.loadCategories();
    } catch (error: any) {
      this.toastService.apiError(error, 'Failed to delete category');
      console.error('Error deleting category:', error);
    }
  }

  resetForm() {
    this.newCategory = { name: '', slug: '', parentId: '' };
    this.isEditing = false;
  }

  validateCategory(): boolean {
    return !!(
      this.newCategory.name?.trim() &&
      this.newCategory.slug?.trim()
    );
  }

  // Auto-generate slug from name
  generateSlug() {
    if (this.newCategory.name) {
      this.newCategory.slug = this.newCategory.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }

  get filteredCategories(): (Category & { level: number })[] {
    const flattened: (Category & { level: number })[] = [];

    const flatten = (cats: Category[], level = 0) => {
      cats.forEach(cat => {
        flattened.push({ ...cat, level });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };

    flatten(this.categoryTree);

    if (!this.searchQuery.trim()) {
      return flattened;
    }

    const query = this.searchQuery.toLowerCase();
    return flattened.filter(cat =>
      cat.name.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query)
    );
  }

  get availableParents(): Category[] {
    if (this.isEditing && this.newCategory.id) {
      return this.categories.filter(c => c.id !== this.newCategory.id);
    }
    return this.categories;
  }

  getCategoryIcon(category: Category) {
    return category.parentId ? this.Tag : this.Layers;
  }

  getCategoryBadgeClass(category: Category): string {
    return category.parentId ? 'badge-sub' : 'badge-main';
  }
}
