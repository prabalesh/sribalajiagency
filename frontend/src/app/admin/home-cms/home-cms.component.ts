import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CmsService, HomeCMS, HeroSlide, SocialLink } from '../../core/services/api/cms.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CmsPreviewService } from '../../core/services/cms-preview.service';
import { ImageUploaderComponent } from '../../shared/components/image-uploader/image-uploader.component';

type TabType = 'hero' | 'sections' | 'about' | 'social';


@Component({
    selector: 'app-admin-home-cms',
    standalone: true,
    imports: [CommonModule, FormsModule, ImageUploaderComponent],
    templateUrl: './home-cms.component.html',
    styleUrl: './home-cms.component.scss'
})
export class HomeCMSComponent implements OnInit, OnDestroy {
    private cmsService = inject(CmsService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);
    private previewService = inject(CmsPreviewService);
    private router = inject(Router);

    cms: HomeCMS = {
        id: '',
        heroType: 'classic',
        heroContentAlignment: 'center',
        heroBadge: '',
        heroTitle: '',
        heroSubtitle: '',
        heroImage: '',
        heroLink: '',
        heroLinkText: '',
        heroSlides: [],
        showCategories: true,
        showFeatured: true,
        showBrands: true,
        showTrustMarkers: true,
        aboutTitle: '',
        aboutContent: '',
        aboutImage: '',
        socialLinks: [],
        updatedAt: new Date()
    };

    activeTab: TabType = 'hero';
    isSaving = false;
    isLoading = true;
    uploadingFiles: Set<string> = new Set();

    // Track if using upload or link for images
    imageSource: { [key: string]: 'upload' | 'link' } = {
        heroImage: 'upload',
        aboutImage: 'upload'
    };

    alignmentOptions: ('top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right')[] = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];

    // Auto-save with debouncing
    private autoSaveSubject = new Subject<Partial<HomeCMS>>();
    private destroy$ = new Subject<void>();

    async ngOnInit() {
        await this.loadCMS();
        this.setupAutoSave();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupAutoSave() {
        // Debounce auto-save by 2 seconds
        this.autoSaveSubject.pipe(
            debounceTime(2000),
            distinctUntilChanged()
        ).subscribe(async (data) => {
            if (this.authService.hasPermission('UPDATE_CMS')) {
                await this.saveCMSInternal(false);
            }
        });
    }

    async loadCMS() {
        try {
            this.isLoading = true;
            const data = await this.cmsService.getHomeCMS();
            this.cms = {
                ...this.cms,
                ...data,
                heroSlides: data.heroSlides || [],
                socialLinks: data.socialLinks || []
            };

            // Initialize slide alignment if missing
            this.cms.heroSlides.forEach((slide) => {
                if (!slide.alignment) {
                    slide.alignment = 'center';
                }
            });
        } catch (error) {
            const errorMessage = this.extractErrorMessage(error);
            this.toastService.error(errorMessage || 'Failed to load CMS data');
            console.error('Error loading CMS:', error);
        } finally {
            this.isLoading = false;
        }
    }

    onCmsChange() {
        // Trigger auto-save on any change
        this.autoSaveSubject.next(this.cms);
    }

    async saveCMS() {
        await this.saveCMSInternal(true);
    }

    async preview() {
        this.previewService.setPreviewData(this.cms);
        this.router.navigate(['/dashboard/home-cms/preview']);
    }

    private async saveCMSInternal(showToast: boolean = true) {
        if (this.isSaving) return;

        this.isSaving = true;
        try {
            switch (this.activeTab) {
                case 'hero':
                    await this.cmsService.updateHero(this.cms);
                    break;
                case 'about':
                    await this.cmsService.updateAbout(this.cms);
                    break;
                case 'social':
                    await this.cmsService.updateSocialLinks(this.cms.socialLinks);
                    break;
                case 'sections':
                    await this.cmsService.updateVisibility(this.cms);
                    break;
                default:
                    await this.cmsService.updateHomeCMS(this.cms);
            }

            if (showToast) {
                this.toastService.success(`${this.activeTab.charAt(0).toUpperCase() + this.activeTab.slice(1)} updated successfully!`);
            }
        } catch (error) {
            if (showToast) {
                const errorMessage = this.extractErrorMessage(error);
                this.toastService.error(errorMessage || 'Failed to update CMS');
            }
            console.error('Error updating CMS:', error);
        } finally {
            this.isSaving = false;
        }
    }

    setActiveTab(tab: TabType) {
        this.activeTab = tab;
    }

    addSlide() {
        const newSlide: HeroSlide = {
            title: '',
            subtitle: '',
            badge: '',
            image: '',
            link: '/products',
            linkText: 'Shop Now',
            alignment: 'center'
        };
        this.cms.heroSlides.push(newSlide);
        this.onCmsChange();
    }

    removeSlide(index: number) {
        if (confirm('Are you sure you want to remove this slide?')) {
            const slide = this.cms.heroSlides[index];
            // Delete image if exists
            if (slide.image) {
                this.cmsService.deleteCmsFile(slide.image).catch(err => {
                    console.error('Error deleting slide image:', err);
                });
            }
            this.cms.heroSlides.splice(index, 1);
            this.onCmsChange();
        }
    }

    moveSlide(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.cms.heroSlides.length) return;

        const temp = this.cms.heroSlides[index];
        this.cms.heroSlides[index] = this.cms.heroSlides[newIndex];
        this.cms.heroSlides[newIndex] = temp;
        this.onCmsChange();
    }

    async onImageFileSelected(file: File, target: HeroSlide | HomeCMS, field: keyof HeroSlide | keyof HomeCMS) {
        const uploadKey = `${field}-${Date.now()}`;
        this.uploadingFiles.add(uploadKey);

        try {
            const res = await this.cmsService.uploadCmsFile(file);
            (target as any)[field] = res.url;
            this.onCmsChange();
            this.toastService.success('Image uploaded successfully');
        } catch (error) {
            const errorMessage = this.extractErrorMessage(error);
            this.toastService.error(errorMessage || 'Failed to upload image');
            console.error('Upload error:', error);
        } finally {
            this.uploadingFiles.delete(uploadKey);
        }
    }

    onImageUrlChanged(url: string, target: HeroSlide | HomeCMS, field: keyof HeroSlide | keyof HomeCMS) {
        (target as any)[field] = url;
        this.onCmsChange();
    }

    async onImageRemoved(target: HeroSlide | HomeCMS, field: keyof HeroSlide | keyof HomeCMS) {
        const imageUrl = (target as any)[field];
        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                await this.cmsService.deleteCmsFile(imageUrl);
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
        (target as any)[field] = '';
        this.onCmsChange();
    }

    addSocialLink() {
        const newLink: SocialLink = {
            platform: '',
            url: '',
            icon: ''
        };
        this.cms.socialLinks.push(newLink);
        this.onCmsChange();
    }

    removeSocialLink(index: number) {
        if (confirm('Are you sure you want to remove this social link?')) {
            this.cms.socialLinks.splice(index, 1);
            this.onCmsChange();
        }
    }

    getImageUrl(url: string): string {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:3000${url}`;
    }

    isUploading(): boolean {
        return this.uploadingFiles.size > 0;
    }

    trackByIndex(index: number): number {
        return index;
    }

    onSlideImageChange(index: number) {
        this.onCmsChange();
    }

    /**
     * Extract error message from Axios error responses
     */
    private extractErrorMessage(error: any): string {
        // Axios error structure: error.response.data

        // Axios response with error
        if (error?.response?.data) {
            const data = error.response.data;

            // NestJS validation errors (array of messages)
            if (data.message && Array.isArray(data.message)) {
                return data.message.join(', ');
            }

            // NestJS single error message
            if (data.message && typeof data.message === 'string') {
                return data.message;
            }

            // Generic error property
            if (data.error && typeof data.error === 'string') {
                return data.error;
            }

            // If data itself is a string
            if (typeof data === 'string') {
                return data;
            }
        }

        // Axios error message (network errors, etc.)
        if (error?.message && typeof error.message === 'string') {
            return error.message;
        }

        // Axios request failed (no response)
        if (error?.request && !error?.response) {
            return 'Network error. Please check your connection.';
        }

        // Fallback
        return '';
    }
}
