import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private api = inject(ApiService);

    async checkLocation(state: string, city?: string, zipcode?: string) {
        const params: any = { state };
        if (city) params.city = city;
        if (zipcode) params.zipcode = zipcode;
        const res = await this.api.get<boolean>('/locations/check', params);
        return res.data;
    }

    async getLocations() {
        const res = await this.api.get<any[]>('/locations');
        return res.data;
    }
}
