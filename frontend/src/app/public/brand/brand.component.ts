import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandService } from '../../core/services/api/brand.service';
import { Brand } from '../../core/models/brand.model';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe],
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent implements OnInit {
  private brandService = inject(BrandService);

  brands = signal<Brand[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  skeletonItems = Array(6).fill(0); // Show 6 skeleton cards

  async ngOnInit() {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.brands.set(await this.brandService.getBrands());
    } catch (err) {
      this.error.set('Failed to load brands. Please try again later.');
      console.error('Error loading brands:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
