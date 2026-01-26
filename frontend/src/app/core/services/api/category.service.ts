import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Category } from '../../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private api = inject(ApiService);

    async getCategories() {
        const res = await this.api.get<Category[]>('/products/categories');
        return res.data;
    }

    async addCategory(category: Category) {
        const res = await this.api.post<Category>('/products/categories', category);
        return res.data;
    }

    async updateCategory(category: Category) {
        const res = await this.api.put<Category>(`/products/categories/${category.id}`, category);
        return res.data;
    }

    async deleteCategory(id: string) {
        await this.api.delete(`/products/categories/${id}`);
    }

    async getCategoriesByParentId(parentId: string | undefined) {
        const res = await this.api.get<Category[]>('/products/categories', { parentId });
        return res.data;
    }

    async getCategoryBySlug(slug: string) {
        const res = await this.api.get<Category[]>('/products/categories', { slug });
        return res.data[0]; // Assuming it returns an array
    }
}
