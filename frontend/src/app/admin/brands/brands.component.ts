import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from '../../core/models/brand.model';
import { BrandService } from '../../core/services/api/brand.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Tag, Edit, Trash2, Plus, X, Image, Upload, Search } from 'lucide-angular';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, LucideAngularModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Icon references
  readonly Tag = Tag;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Image = Image;
  readonly Upload = Upload;
  readonly Search = Search;

  brands: Brand[] = [];
  newBrand: Brand = { id: '', name: '', slug: '', description: '' };
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  showDeleteConfirm = false;
  brandToDelete: { id: string; name: string } | null = null;
  searchQuery = '';

  async ngOnInit() {
    await this.loadBrands();
  }

  async loadBrands() {
    this.isLoading = true;
    try {
      this.brands = await this.brandService.getBrands();
    } catch (error) {
      this.toastService.apiError(error, 'Failed to load brands');
      console.error('Error loading brands:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async addBrand() {
    if (!this.validateBrand()) {
      this.toastService.warning('Brand name is required');
      return;
    }

    this.isSaving = true;
    try {
      if (!this.newBrand.slug) {
        this.newBrand.slug = this.generateSlug(this.newBrand.name);
      }

      let result: Brand;
      if (this.isEditing) {
        result = await this.brandService.updateBrand(this.newBrand);
        const index = this.brands.findIndex(b => b.id === result.id);
        if (index !== -1) this.brands[index] = result;
        this.toastService.success('Brand updated successfully');
      } else {
        result = await this.brandService.addBrand(this.newBrand);
        this.brands.push(result);
        this.toastService.success('Brand created successfully');
      }

      if (this.selectedFile) {
        try {
          const withImage = await this.brandService.uploadBrandImage(result.id, this.selectedFile);
          const index = this.brands.findIndex(b => b.id === withImage.id);
          if (index !== -1) this.brands[index] = withImage;
          this.toastService.success('Brand image uploaded successfully');
        } catch (error) {
          this.toastService.apiError(error, 'Failed to upload image');
        }
      }

      this.resetForm();
    } catch (error) {
      this.toastService.apiError(error, 'Failed to save brand');
      console.error('Error saving brand:', error);
    } finally {
      this.isSaving = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error('Image size must be less than 5MB');
      return;
    }

    this.selectedFile = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removePreview() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  editBrand(brand: Brand) {
    this.newBrand = { ...brand };
    this.isEditing = true;
    this.previewUrl = brand.image ? `http://localhost:3000${brand.image}` : null;

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

  openDeleteConfirm(id: string, name: string) {
    this.brandToDelete = { id, name };
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.brandToDelete = null;
  }

  async confirmDelete() {
    if (!this.brandToDelete) return;

    try {
      await this.brandService.deleteBrand(this.brandToDelete.id);
      this.brands = this.brands.filter(b => b.id !== this.brandToDelete!.id);
      this.toastService.success('Brand deleted successfully');
    } catch (error) {
      this.toastService.apiError(error, 'Failed to delete brand');
      console.error('Error deleting brand:', error);
    } finally {
      this.closeDeleteConfirm();
    }
  }

  resetForm() {
    this.newBrand = { id: '', name: '', slug: '', description: '' };
    this.selectedFile = null;
    this.previewUrl = null;
    this.isEditing = false;
  }

  validateBrand(): boolean {
    return !!this.newBrand.name?.trim();
  }

  generateSlug(name: string): string {
    return name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  autoGenerateSlug() {
    if (this.newBrand.name && !this.isEditing) {
      this.newBrand.slug = this.generateSlug(this.newBrand.name);
    }
  }

  getBrandImageUrl(brand: Brand): string {
    return brand.image 
      ? `http://localhost:3000${brand.image}` 
      : 'https://placehold.co/200x200?text=No+Logo';
  }

  get filteredBrands(): Brand[] {
    if (!this.searchQuery.trim()) {
      return this.brands;
    }
    const query = this.searchQuery.toLowerCase();
    return this.brands.filter(brand => 
      brand.name.toLowerCase().includes(query) ||
      brand.description?.toLowerCase().includes(query) ||
      brand.slug.toLowerCase().includes(query)
    );
  }
}
