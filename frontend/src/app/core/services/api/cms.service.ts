import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';

// Type definitions for CMS data structures
export interface HeroSlide {
    title: string;
    subtitle: string;
    badge: string;
    image: string;
    link: string;
    linkText: string;
}

export interface SocialLink {
    platform: string;
    url: string;
    icon: string;
}

export interface HomeCMS {
    id: string;
    heroType: 'standard' | 'carousel';
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    heroLink: string;
    heroLinkText: string;
    heroSlides: HeroSlide[];
    showCategories: boolean;
    showFeatured: boolean;
    showBrands: boolean;
    showTrustMarkers: boolean;
    aboutTitle: string;
    aboutContent: string;
    aboutImage: string;
    socialLinks: SocialLink[];
    updatedAt: Date;
}

export interface FileUploadResponse {
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class CmsService {
    private api = inject(ApiService);

    async getHomeCMS(): Promise<HomeCMS> {
        const res = await this.api.get<HomeCMS>('/home-cms');
        return res.data;
    }

    async updateHomeCMS(data: Partial<HomeCMS>): Promise<HomeCMS> {
        const res = await this.api.put<HomeCMS>('/home-cms', data);
        return res.data;
    }

    async uploadCmsFile(file: File): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await this.api.post<FileUploadResponse>('/home-cms/upload', formData);
        return res.data;
    }

    async deleteCmsFile(url: string): Promise<void> {
        await this.api.post('/home-cms/delete-file', { url });
    }
}
