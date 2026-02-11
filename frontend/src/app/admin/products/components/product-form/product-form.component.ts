import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit, Plus, X, Package, Tag, FolderTree, DollarSign, ShoppingCart, Check, AlertCircle, ImageIcon, ChevronDown, Layers, Trash2 } from 'lucide-angular';
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { Brand } from '../../../../core/models/brand.model';
import { ImageUploaderComponent } from '../../../../shared/components/image-uploader/image-uploader.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ProductVariantFormComponent } from '../product-variant-form/product-variant-form.component';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        ImageUploaderComponent,
        ImageUrlPipe,
        ProductVariantFormComponent
    ],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {
    @Input({ required: true }) product!: Product;
    @Input() isEditing = false;
    @Input() isSaving = false;
    @Input() isUploadingImage = false;
    @Input({ required: true }) brands: Brand[] = [];
    @Input({ required: true }) categories: (Category & { level: number })[] = [];
    @Input({ required: true }) uploadedFiles: File[] = [];
    @Input({ required: true }) pendingUrls: string[] = [];
    @Input({ required: true }) pendingImageUrl: string = '';
    @Input({ required: true }) selectedCategoryId: string = '';

    @Output() save = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() fileSelected = new EventEmitter<File>();
    @Output() urlChanged = new EventEmitter<string>();
    @Output() addPendingUrl = new EventEmitter<void>();
    @Output() removePendingUrl = new EventEmitter<number>();
    @Output() removeUploadedFile = new EventEmitter<number>();
    @Output() removeImage = new EventEmitter<string>();
    @Output() addVariant = new EventEmitter<void>();
    @Output() removeVariant = new EventEmitter<number>();
    @Output() variantFileSelected = new EventEmitter<{ file: File, variant: any }>();
    @Output() variantUrlChanged = new EventEmitter<{ url: string, variant: any }>();
    @Output() variantImageRemoved = new EventEmitter<any>();
    @Output() categoryChange = new EventEmitter<string>();
    @Output() paymentMethodToggle = new EventEmitter<string>();

    readonly Edit = Edit;
    readonly Plus = Plus;
    readonly X = X;
    readonly Package = Package;
    readonly Tag = Tag;
    readonly FolderTree = FolderTree;
    readonly DollarSign = DollarSign;
    readonly ShoppingCart = ShoppingCart;
    readonly Check = Check;
    readonly AlertCircle = AlertCircle;
    readonly ImageIcon = ImageIcon;
    readonly ChevronDown = ChevronDown;
    readonly Layers = Layers;
    readonly Trash2 = Trash2;

    onSave() {
        this.save.emit();
    }

    onCancel() {
        this.cancel.emit();
    }

    onCategoryChange() {
        this.categoryChange.emit(this.selectedCategoryId);
    }

    onPaymentMethodToggle(method: string) {
        this.paymentMethodToggle.emit(method);
    }

    onAddVariant() {
        this.addVariant.emit();
    }

    onRemoveVariant(index: number) {
        this.removeVariant.emit(index);
    }

    onVariantFileSelected(file: File, variant: any) {
        this.variantFileSelected.emit({ file, variant });
    }

    onVariantUrlChanged(url: string, variant: any) {
        this.variantUrlChanged.emit({ url, variant });
    }

    onVariantImageRemoved(variant: any) {
        this.variantImageRemoved.emit(variant);
    }

    onFileSelected(file: File) {
        this.fileSelected.emit(file);
    }

    onUrlChanged(url: string) {
        this.urlChanged.emit(url);
    }

    onAddPendingUrl() {
        this.addPendingUrl.emit();
    }

    onRemovePendingUrl(index: number) {
        this.removePendingUrl.emit(index);
    }

    onRemoveUploadedFile(index: number) {
        this.removeUploadedFile.emit(index);
    }

    onRemoveImage(id: string) {
        this.removeImage.emit(id);
    }
}
