import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  async getProducts() {
    const res = await this.api.get<Product[]>('/products');
    return res.data;
  }

  async getProductById(id: string) {
    const res = await this.api.get<Product>(`/products/${id}`);
    return res.data;
  }

  async addProduct(product: any) {
    const res = await this.api.post<Product>('/products', product);
    return res.data;
  }

  async updateProduct(product: any) {
    const res = await this.api.put<Product>(`/products/${product.id}`, product);
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

  async deleteImage(imageId: string) {
    await this.api.delete(`/products/images/${imageId}`);
  }

  async getProductsByCategory(categoryId: string) {
    const res = await this.api.get<Product[]>('/products', { categoryId });
    return res.data;
  }

  async searchProducts(query: string) {
    const res = await this.api.get<Product[]>('/products', { q: query });
    return res.data;
  }
}

