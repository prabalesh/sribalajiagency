import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Category } from '../../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private api = inject(ApiService);

    async getCategories() {
        const res = await this.api.get<Category[]>('/categories');
        return res.data;
    }

    async getCategoryTree() {
        const res = await this.api.get<Category[]>('/categories/tree');
        return res.data;
    }

    async addCategory(category: Category) {
        const res = await this.api.post<Category>('/categories', category);
        return res.data;
    }

    async updateCategory(category: Category) {
        const res = await this.api.put<Category>(`/categories/${category.id}`, category);
        return res.data;
    }

    async deleteCategory(id: string) {
        await this.api.delete(`/categories/${id}`);
    }

    async getCategoriesByParentId(parentId: string | undefined) {
        const res = await this.api.get<Category[]>('/categories', { params: { parentId } });
        return res.data;
    }

    async getCategoryBySlug(slug: string) {
        const res = await this.api.get<Category[]>('/categories', { params: { slug } });
        return res.data[0];
    }
}
