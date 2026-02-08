import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Brand } from '../../models/brand.model';
import { Category } from '../../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private api = inject(ApiService);

  async getBrands() {
    const res = await this.api.get<Brand[]>('/brands');
    return res.data;
  }

  async getBrandBySlug(slug: string) {
    const res = await this.api.get<Brand>(`/brands/slug/${slug}`);
    return res.data;
  }

  async getCategoriesByBrand(brandSlug: string) {
    const res = await this.api.get<Category[]>(`/brands/${brandSlug}/categories`);
    return res.data;
  }

  async getBrandById(id: string) {
    const res = await this.api.get<Brand>(`/brands/${id}`);
    return res.data;
  }

  async addBrand(brand: Brand) {
    const res = await this.api.post<Brand>('/brands', brand);
    return res.data;
  }

  async updateBrand(brand: Brand) {
    const res = await this.api.put<Brand>(`/brands/${brand.id}`, brand);
    return res.data;
  }

  async deleteBrand(id: string) {
    await this.api.delete(`/brands/${id}`);
  }

  async uploadBrandImage(brandId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.api.post<Brand>(`/brands/${brandId}/image`, formData);
    return res.data;
  }
}
