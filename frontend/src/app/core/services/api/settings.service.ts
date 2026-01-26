import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private api = inject(ApiService);

    async getStoreSettings() {
        const res = await this.api.get<any>('/settings');
        return res.data;
    }

    async updateStoreSettings(data: any) {
        const res = await this.api.put<any>('/settings', data);
        return res.data;
    }
}
