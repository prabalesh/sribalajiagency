import { Injectable, signal } from '@angular/core';
import { HomeCMS } from './api/cms.service';

@Injectable({
    providedIn: 'root'
})
export class CmsPreviewService {
    private previewData = signal<HomeCMS | null>(null);

    setPreviewData(data: HomeCMS) {
        this.previewData.set(data);
    }

    getPreviewData() {
        return this.previewData();
    }

    clearPreviewData() {
        this.previewData.set(null);
    }
}
