import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from '../../core/models/brand.model';
import { BrandService } from '../../core/services/api/brand.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
  brands: Brand[] = [];
  newBrand: Brand = { id: '', name: '', slug: '', description: '' };
  selectedFile: File | null = null;
  isEditing = false;

  private brandService = inject(BrandService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  async ngOnInit() {
    await this.loadBrands();
  }

  async loadBrands() {
    try {
      this.brands = await this.brandService.getBrands();
    } catch (error) {
      this.toastService.error(this.extractErrorMessage(error));
    }
  }

  async addBrand() {
    if (!this.newBrand.name) {
      this.toastService.warning('Brand name is required');
      return;
    }

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
        this.isEditing = false;
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
          this.toastService.error('Failed to upload image: ' + this.extractErrorMessage(error));
        }
      }

      this.resetForm();
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.toastService.error(errorMessage);
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  editBrand(brand: Brand) {
    this.newBrand = { ...brand };
    this.isEditing = true;
  }

  async deleteBrand(id: string) {
    if (!confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      await this.brandService.deleteBrand(id);
      this.brands = this.brands.filter(b => b.id !== id);
      this.toastService.success('Brand deleted successfully');
    } catch (error) {
      this.toastService.error(this.extractErrorMessage(error));
    }
  }

  resetForm() {
    this.newBrand = { id: '', name: '', slug: '', description: '' };
    this.selectedFile = null;
    this.isEditing = false;
  }

  generateSlug(name: string): string {
    return name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    // Handle validation errors from backend
    if (error?.error?.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      }
      return error.error.message;
    }

    // Handle other error formats
    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
