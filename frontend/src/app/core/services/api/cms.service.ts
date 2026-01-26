import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';

@Injectable({
    providedIn: 'root'
})
export class CmsService {
    private api = inject(ApiService);

    async getHomeCMS() {
        const res = await this.api.get<any>('/home-cms');
        return res.data;
    }

    async updateHomeCMS(data: any) {
        const res = await this.api.put<any>('/home-cms', data);
        return res.data;
    }

    async uploadHeroImage(file: File) {
        return this.uploadCmsFile(file);
    }

    async uploadCmsFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await this.api.post<{ url: string }>('/home-cms/upload', formData);
        return res.data;
    }

    async deleteCmsFile(url: string) {
        await this.api.post('/home-cms/delete-file', { url });
    }
}
