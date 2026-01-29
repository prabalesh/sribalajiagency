import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../core/services/api/cms.service';
import { SettingsService } from '../../core/services/api/settings.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-admin-home-cms',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './home-cms.component.html',
    styleUrl: './home-cms.component.scss'
})
export class HomeCMSComponent implements OnInit {
    private cmsService = inject(CmsService);
    private settingsService = inject(SettingsService);
    public authService = inject(AuthService);

    cms: any = {
        heroSlides: [],
        socialLinks: [],
        showCategories: true,
        showFeatured: true,
        showBrands: true,
        showTrustMarkers: true
    };
    settings: any = {
        enabledPaymentMethods: ['online', 'cod'],
        allowCod: true,
        allowOnline: true
    };
    activeTab: 'hero' | 'sections' | 'about' | 'social' | 'settings' = 'hero';
    isSaving = false;

    async ngOnInit() {
        this.loadCMS();
    }

    async loadCMS() {
        const data = await this.cmsService.getHomeCMS();
        this.cms = {
            ...this.cms,
            ...data
        };
        if (!this.cms.heroSlides) this.cms.heroSlides = [];
        if (!this.cms.socialLinks) this.cms.socialLinks = [];

        const settingsData = await this.settingsService.getStoreSettings();
        if (settingsData) {
            this.settings = { ...this.settings, ...settingsData };
        }
    }

    async saveCMS() {
        this.isSaving = true;
        try {
            await this.cmsService.updateHomeCMS(this.cms);
            await this.settingsService.updateStoreSettings(this.settings);
            alert('Settings updated successfully!');
        } finally {
            this.isSaving = false;
        }
    }

    addSlide() {
        this.cms.heroSlides.push({
            title: '',
            subtitle: '',
            badge: '',
            image: '',
            link: '',
            linkText: ''
        });
    }

    removeSlide(index: number) {
        this.cms.heroSlides.splice(index, 1);
    }

    async onFileSelected(event: any, target: any, field: string = 'image') {
        const file = event.target.files[0];
        if (file) {
            const res = await this.cmsService.uploadCmsFile(file);
            target[field] = res.url;
        }
    }

    addSocialLink() {
        this.cms.socialLinks.push({ platform: '', url: '', icon: '' });
    }

    removeSocialLink(index: number) {
        this.cms.socialLinks.splice(index, 1);
    }
}
