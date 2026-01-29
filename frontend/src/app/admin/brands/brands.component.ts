import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from '../../core/models/brand.model';
import { BrandService } from '../../core/services/api/brand.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent implements OnInit {
  brands: Brand[] = [];
  newBrand: Brand = { id: '', name: '', description: '' };
  selectedFile: File | null = null;
  isEditing = false;

  constructor(
    private brandService: BrandService,
    public authService: AuthService
  ) { }

  async ngOnInit() {
    this.brands = await this.brandService.getBrands();
  }

  async addBrand() {
    if (this.newBrand.name) {
      let result: Brand;
      if (this.isEditing) {
        result = await this.brandService.updateBrand(this.newBrand);
        const index = this.brands.findIndex(b => b.id === result.id);
        if (index !== -1) this.brands[index] = result;
        this.isEditing = false;
      } else {
        result = await this.brandService.addBrand(this.newBrand);
        this.brands.push(result);
      }

      if (this.selectedFile) {
        const withImage = await this.brandService.uploadBrandImage(result.id, this.selectedFile);
        const index = this.brands.findIndex(b => b.id === withImage.id);
        if (index !== -1) this.brands[index] = withImage;
      }

      this.resetForm();
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
    if (confirm('Are you sure?')) {
      await this.brandService.deleteBrand(id);
      this.brands = this.brands.filter(b => b.id !== id);
    }
  }

  resetForm() {
    this.newBrand = { id: '', name: '', description: '' };
    this.selectedFile = null;
    this.isEditing = false;
  }
}
