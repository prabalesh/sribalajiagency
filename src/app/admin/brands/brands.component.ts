import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from '../../core/models/models';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss'
})
export class BrandsComponent {
  brands: Brand[] = [
    { id: '1', name: 'Bosch', description: 'Tools' },
    { id: '2', name: 'Makita', description: 'Power' }
  ];

  newBrand: Brand = { id: '', name: '', description: '' };
  isEditing = false;

  addBrand() {
    if (this.newBrand.name) {
      if (this.isEditing) {
        // Update logic
        const index = this.brands.findIndex(b => b.id === this.newBrand.id);
        if (index !== -1) this.brands[index] = { ...this.newBrand };
        this.isEditing = false;
      } else {
        // Create logic
        this.newBrand.id = Math.random().toString(36).substr(2, 9);
        this.brands.push({ ...this.newBrand });
      }
      this.resetForm();
    }
  }

  editBrand(brand: Brand) {
    this.newBrand = { ...brand };
    this.isEditing = true;
  }

  deleteBrand(id: string) {
    if (confirm('Are you sure?')) {
      this.brands = this.brands.filter(b => b.id !== id);
    }
  }

  resetForm() {
    this.newBrand = { id: '', name: '', description: '' };
    this.isEditing = false;
  }
}
