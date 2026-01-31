import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { LocationRestriction } from '../models/location.model';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private api = inject(ApiService);

    async getLocations() {
        const res = await this.api.get<LocationRestriction[]>('/locations');
        return res.data;
    }

    async addLocation(location: any) {
        const res = await this.api.post<LocationRestriction>('/locations', location);
        return res.data;
    }

    async updateLocation(location: any) {
        const res = await this.api.put<LocationRestriction>(`/locations/${location.id}`, location);
        return res.data;
    }

    async deleteLocation(id: string) {
        await this.api.delete(`/locations/${id}`);
    }

    async checkLocation(state: string, city?: string, zipcode?: string) {
        const res = await this.api.get<boolean>(`/locations/check`, { state, city, zipcode });
        return res.data;
    }
}
