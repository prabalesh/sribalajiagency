import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { VariantType, CreateVariantTypeDto, UpdateVariantTypeDto } from '../../models/variant-type.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VariantTypeService {
    private apiUrl = `${environment.apiUrl}/variant-types`;

    constructor(private http: HttpClient) { }

    getVariantTypes(): Observable<VariantType[]> {
        return this.http.get<VariantType[]>(this.apiUrl);
    }

    getVariantType(id: string): Observable<VariantType> {
        return this.http.get<VariantType>(`${this.apiUrl}/${id}`);
    }

    createVariantType(data: CreateVariantTypeDto): Observable<VariantType> {
        return this.http.post<VariantType>(this.apiUrl, data);
    }

    updateVariantType(id: string, data: UpdateVariantTypeDto): Observable<VariantType> {
        return this.http.patch<VariantType>(`${this.apiUrl}/${id}`, data);
    }

    deleteVariantType(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
