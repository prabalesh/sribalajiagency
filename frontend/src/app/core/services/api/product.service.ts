import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Product } from '../../models/product.model';

import { CreateProductDto, UpdateProductDto } from '../../models/product.dto';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  async getProducts(params: {
    page?: number,
    limit?: number,
    categoryId?: string,
    categorySlug?: string,
    brandId?: string,
    brandSlug?: string,
    q?: string,
    isFeatured?: boolean,
    minPrice?: number,
    maxPrice?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC'
  } = {}) {
    const res = await this.api.get<{ items: Product[], total: number, page: number, limit: number }>('/products', params);
    return res.data;
  }

  async getProductById(id: string) {
    const res = await this.api.get<Product>(`/products/${id}`);
    return res.data;
  }

  async addProduct(product: CreateProductDto) {
    const res = await this.api.post<Product>('/products', product);
    return res.data;
  }

  async updateProduct(id: string, product: UpdateProductDto) {
    const res = await this.api.put<Product>(`/products/${id}`, product);
    return res.data;
  }

  async deleteProduct(id: string) {
    await this.api.delete(`/products/${id}`);
  }

  async uploadImage(productId: string, file: File, isPrimary: boolean = false) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());
    const res = await this.api.post<any>(`/products/${productId}/images`, formData);
    return res.data;
  }

  async addImageLink(productId: string, url: string, isPrimary: boolean = false) {
    const res = await this.api.post<any>(`/products/${productId}/images/link`, { url, isPrimary });
    return res.data;
  }

  async uploadGenericImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.api.post<{ url: string }>(`/products/media/upload`, formData);
    return res.data;
  }

  async uploadGenericImages(files: FileList | File[]) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await this.api.post<{ urls: string[] }>(`/products/media/bulk-upload`, formData);
    return res.data;
  }

   async deleteImage(imageId: string) {
    await this.api.delete(`/products/images/${imageId}`);
  }

  async setPrimaryImage(productId: string, imageId: string) {
    const res = await this.api.patch<any>(`/products/${productId}/images/${imageId}/primary`, {});
    return res.data;
  }

  async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    return this.getProducts({ categoryId, page, limit });
  }

  async searchProducts(query: string, page: number = 1, limit: number = 20) {
    return this.getProducts({ q: query, page, limit });
  }
}
