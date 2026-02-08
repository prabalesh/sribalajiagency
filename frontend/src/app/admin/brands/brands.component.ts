import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from '../../core/models/brand.model';
import { BrandService } from '../../core/services/api/brand.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
  brands: Brand[] = [];
  newBrand: Brand = { id: '', name: '', slug: '', description: '' };
  selectedFile: File | null = null;
  isEditing = false;
  showDeleteConfirm = false;
  brandToDelete: { id: string; name: string } | null = null;

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
      this.toastService.apiError(error, 'Failed to load brands');
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
          this.toastService.apiError(error, 'Failed to upload image');
        }
      }

      this.resetForm();
    } catch (error) {
      this.toastService.apiError(error, 'Failed to save brand');
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  editBrand(brand: Brand) {
    this.newBrand = { ...brand };
    this.isEditing = true;
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
    } finally {
      this.closeDeleteConfirm();
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
}
