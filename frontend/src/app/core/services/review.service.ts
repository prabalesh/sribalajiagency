import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private apiUrl = `${environment.apiUrl}/reviews`;

    constructor(private http: HttpClient) { }

    createReview(data: { productId: string, rating: number, comment?: string }): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    getReviewsByProduct(productId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/product/${productId}`);
    }

    deleteReview(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
