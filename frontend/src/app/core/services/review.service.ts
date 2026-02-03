import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private api = inject(ApiService);

    async createReview(data: { productId: string, rating: number, comment?: string }) {
        const res = await this.api.post<any>('/reviews', data);
        return res.data;
    }

    async getReviewsByProduct(productId: string, page: number = 1, limit: number = 5) {
        const res = await this.api.get<{
            items: any[],
            total: number,
            page: number,
            limit: number,
            totalPages: number
        }>(`/reviews/product/${productId}`, { page, limit });
        return res.data;
    }

    async replyToReview(id: string, reply: string) {
        const res = await this.api.post<any>(`/reviews/${id}/reply`, { reply });
        return res.data;
    }

    async deleteReview(id: string) {
        const res = await this.api.delete<any>(`/reviews/${id}`);
        return res.data;
    }
}
