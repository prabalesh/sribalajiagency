import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Trash2, Layers } from 'lucide-angular';
import { VariantType } from '../../../../core/models/variant-type.model';
import { ImageUploaderComponent } from '../../../../shared/components/image-uploader/image-uploader.component';

@Component({
    selector: 'app-product-variant-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, ImageUploaderComponent],
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

    readonly Trash2 = Trash2;

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
}
