import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Trash2, Layers, Star, X, ImageIcon, Plus } from 'lucide-angular';
import { VariantType } from '../../../../core/models/variant-type.model';
import { ImageUploaderComponent } from '../../../../shared/components/image-uploader/image-uploader.component';
import { ProductImage } from '../../../../core/models/product.model';

import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
    selector: 'app-product-variant-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, ImageUploaderComponent, ImageUrlPipe],
    templateUrl: './product-variant-form.component.html',
    styleUrl: './product-variant-form.component.scss'
})
export class ProductVariantFormComponent {
    @Input({ required: true }) variant: any;
    @Input({ required: true }) index: number = 0;
    @Input() isSaving = false;
    @Input() variantTypes: VariantType[] = [];

    @Output() remove = new EventEmitter<number>();
    @Output() fileSelected = new EventEmitter<File>();
    @Output() urlChanged = new EventEmitter<string>();
    @Output() imageRemoved = new EventEmitter<void>();
    @Output() setPrimaryImage = new EventEmitter<string>();
    @Output() addImage = new EventEmitter<{ file?: File, url?: string }>();
    @Output() filesSelected = new EventEmitter<File[]>();
    @Output() removeImageAt = new EventEmitter<number>();
    @Output() defaultChange = new EventEmitter<void>();

    @ViewChild(ImageUploaderComponent) uploader!: ImageUploaderComponent;

    readonly Trash2 = Trash2;
    readonly Star = Star;
    readonly X = X;
    readonly ImageIcon = ImageIcon;
    readonly Plus = Plus;

    onRemove() {
        this.remove.emit(this.index);
    }

    onFileSelected(file: File) {
        this.fileSelected.emit(file);
    }

    onUrlChanged(url: string) {
        this.urlChanged.emit(url);
    }

    onImageRemoved() {
        this.imageRemoved.emit();
    }

    onSetPrimary(url: string) {
        if (!this.variant.images) this.variant.images = [];
        
        this.variant.images.forEach((img: ProductImage) => {
            img.isPrimary = (img.url === url);
        });
        
        this.setPrimaryImage.emit(url);
    }

    onRemoveImage(index: number) {
        const removedImage = this.variant.images[index];
        const isWasPrimary = removedImage.isPrimary;
        
        this.variant.images.splice(index, 1);
        
        // If we removed the primary image, set the first remaining one as primary
        if (isWasPrimary && this.variant.images.length > 0) {
            this.variant.images[0].isPrimary = true;
        }
        
        this.removeImageAt.emit(index);
    }

    onAddVariantImageUrl(url: string) {
        if (!this.variant.images) this.variant.images = [];
        
        // Add as structured object
        const newImage: ProductImage = {
            url,
            isPrimary: this.variant.images.length === 0,
            sortOrder: this.variant.images.length
        };
        
        this.variant.images.push(newImage);
        this.addImage.emit({ url });
        this.uploader.reset();
    }

    onAddVariantFile(file: File) {
        this.fileSelected.emit(file);
        this.uploader.reset();
    }

    onAddVariantFiles(files: File[]) {
        this.filesSelected.emit(files);
        if (this.uploader) {
            this.uploader.reset();
        }
    }

    onDefaultChange() {
        this.defaultChange.emit();
    }

    onSetDefault() {
        this.variant.isDefault = true;
        this.onDefaultChange();
    }

    getImageUrl(img: any): string {
        return img?.url || '';
    }

    isImagePrimary(img: ProductImage): boolean {
        return !!img.isPrimary;
    }
}
