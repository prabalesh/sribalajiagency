import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandService } from '../../core/services/api/brand.service';
import { Brand } from '../../core/models/brand.model';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe],
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent implements OnInit {
  private brandService = inject(BrandService);
  brands: Brand[] = [];

  async ngOnInit() {
    this.brands = await this.brandService.getBrands();
  }
}
