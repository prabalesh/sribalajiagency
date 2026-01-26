import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Model } from '../../core/models/brand.model';

@Component({
  selector: 'app-admin-models',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './models.component.html',
  styleUrl: './models.component.scss'
})
export class ModelsComponent {
  models: Model[] = [
    { id: '1', name: 'GSH 500', brandId: '1' }, // Linked to Bosch id 1
    { id: '2', name: 'GA 4030', brandId: '2' }
  ];

  newModel: Model = { id: '', name: '', brandId: '' };

  // Mock brands for selection
  brands = [
    { id: '1', name: 'Bosch' },
    { id: '2', name: 'Makita' }
  ];

  addModel() {
    if (this.newModel.name && this.newModel.brandId) {
      this.newModel.id = Math.random().toString(36).substr(2, 9);
      this.models.push({ ...this.newModel });
      this.newModel = { id: '', name: '', brandId: '' };
    }
  }

  deleteModel(id: string) {
    this.models = this.models.filter(m => m.id !== id);
  }
}
