import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../core/services/api/cms.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-admin-home-cms',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './home-cms.component.html',
    styleUrl: './home-cms.component.scss'
})
export class HomeCMSComponent implements OnInit {
    private cmsService = inject(CmsService);
    public authService = inject(AuthService);
    public toastService = inject(ToastService);

    cms: any = {
        heroSlides: [],
        socialLinks: [],
        showCategories: true,
        showFeatured: true,
        showBrands: true,
        showTrustMarkers: true
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
        if (!this.cms.socialLinks) this.cms.socialLinks = [];
    }

    async saveCMS() {
        this.isSaving = true;
        try {
            await this.cmsService.updateHomeCMS(this.cms);
            this.toastService.success('CMS updated successfully!');
        } catch (error) {
            this.toastService.error('Failed to update CMS. Please try again.');
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
