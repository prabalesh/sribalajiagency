import { Component, Input, Output, EventEmitter, OnInit, SecurityContext, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { LucideAngularModule, Edit, Plus, X, Package, Tag, FolderTree, DollarSign, ShoppingCart, Check, AlertCircle, ImageIcon, ChevronDown, Layers, Trash2, ShieldCheck, FileText, PlusCircle, Bold, Italic, Underline, List, ListOrdered, Star } from 'lucide-angular';
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { Brand } from '../../../../core/models/brand.model';
import { VariantType } from '../../../../core/models/variant-type.model';
import { ProductVariantFormComponent } from '../product-variant-form/product-variant-form.component';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        ProductVariantFormComponent
    ],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, AfterViewInit, OnChanges {
  constructor(private sanitizer: DomSanitizer) {}
    @Input({ required: true }) product!: Product;
    @Input() isEditing = false;
    @Input() isSaving = false;
    @Input() isUploadingImage = false;
    @Input({ required: true }) brands: Brand[] = [];
    @Input({ required: true }) categories: (Category & { level: number })[] = [];

    @Input({ required: true }) selectedCategoryId: string = '';
    @Input() variantTypes: VariantType[] = [];

    @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;

    @Output() save = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    @Output() addVariant = new EventEmitter<void>();
    @Output() removeVariant = new EventEmitter<number>();

    @Output() variantFileSelected = new EventEmitter<{ file: File, variant: any }>();
    @Output() variantFilesSelected = new EventEmitter<{ files: File[], variant: any }>();
    @Output() variantUrlChanged = new EventEmitter<{ url: string, variant: any }>();
    @Output() variantImageRemoved = new EventEmitter<any>();
    @Output() categoryChange = new EventEmitter<string>();
    @Output() paymentMethodToggle = new EventEmitter<string>();

    // Structured Specifications management for non-technical users
    specEntries: { key: string, value: string }[] = [];

    commandStates = {
        bold: false,
        italic: false,
        underline: false,
        insertUnorderedList: false,
        insertOrderedList: false
    };

    readonly Edit = Edit;
    readonly Plus = Plus;
    readonly PlusCircle = PlusCircle;
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
    readonly ShieldCheck = ShieldCheck;
    readonly Bold = Bold;
    readonly Italic = Italic;
    readonly Underline = Underline;
    readonly List = List;
    readonly ListOrdered = ListOrdered;
    readonly FileText = FileText;
    readonly Star = Star;

    ngOnInit() {
        // Initialize specEntries from product.specifications if it exists
        if (this.product.specifications) {
            this.specEntries = Object.entries(this.product.specifications).map(([key, value]) => ({
                key,
                value: String(value)
            }));
        }

        // Always ensure at least one empty entry if none exist
        if (this.specEntries.length === 0) {
            this.specEntries = [{ key: '', value: '' }];
        }
    }

    ngAfterViewInit() {
        this.updateEditorContent();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['product'] && this.editorRef) {
            this.updateEditorContent();
        }
    }

    private updateEditorContent() {
        if (this.editorRef && this.editorRef.nativeElement) {
            const currentContent = this.editorRef.nativeElement.innerHTML;
            const newContent = this.product.description || '';
            
            // Only update if the content is actually different to avoid cursor resets
            if (currentContent !== newContent) {
                this.editorRef.nativeElement.innerHTML = newContent;
            }
        }
    }

    addSpec() {
        this.specEntries.push({ key: '', value: '' });
    }

    removeSpec(index: number) {
        this.specEntries.splice(index, 1);
        this.syncSpecs();
    }

    syncSpecs() {
        // Convert entries array back to object for the product model
        const specs: Record<string, string> = {};
        this.specEntries.forEach(entry => {
            if (entry.key.trim()) {
                specs[entry.key.trim()] = entry.value;
            }
        });
        this.product.specifications = specs;
    }

    onSave() {
        this.syncSpecs(); // Final sync before saving
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

    onVariantFilesSelected(files: File[], variant: any) {
        this.variantFilesSelected.emit({ files, variant });
    }

    onVariantUrlChanged(url: string, variant: any) {
        this.variantUrlChanged.emit({ url, variant });
    }

    onVariantImageRemoved(variant: any) {
        this.variantImageRemoved.emit(variant);
    }

    onVariantDefaultChange(selectedVariant: any) {
        if (!selectedVariant.isDefault) return;
        
        // Ensure only one is default
        this.product.variants.forEach(v => {
            if (v !== selectedVariant) {
                v.isDefault = false;
            }
        });
    }



    /**
     * Handles rich text description changes with sanitization.
     * Ensures the stored description is safe HTML.
     */
    onDescriptionChange(event: Event): void {
        const target = event.target as HTMLElement;
        const rawHtml = target.innerHTML;
        
        // Sanitize the HTML before saving to the model
        // SecurityContext.HTML ensures only safe tags/attributes are kept
        const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml);
        
        if (sanitized !== null) {
            this.product.description = sanitized;
        } else {
            // If sanitization fails completely, reset to empty to be safe
            this.product.description = '';
        }
        this.checkCommandStates();
    }

    /**
     * Executes browser rich text commands (Bold, Italic, etc.)
     */
    formatDoc(command: string, value?: string): void {
        document.execCommand(command, false, value);
        // Ensure editor remains focused after formatting
        if (this.editorRef) {
            this.editorRef.nativeElement.focus();
        }
        // Force an input event to update the model
        const event = new Event('input', { bubbles: true });
        this.editorRef.nativeElement.dispatchEvent(event);
        this.checkCommandStates();
    }

    checkCommandStates(): void {
        if (!this.editorRef) return;
        this.commandStates.bold = document.queryCommandState('bold');
        this.commandStates.italic = document.queryCommandState('italic');
        this.commandStates.underline = document.queryCommandState('underline');
        this.commandStates.insertUnorderedList = document.queryCommandState('insertUnorderedList');
        this.commandStates.insertOrderedList = document.queryCommandState('insertOrderedList');
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Tab') {
            event.preventDefault();
            if (event.shiftKey) {
                document.execCommand('outdent', false);
            } else {
                document.execCommand('indent', false);
            }
            this.checkCommandStates();
        }
    }

    /**
     * Handles editor focus to manage placeholders or focus states.
     */
    onFocusEditor(event: FocusEvent): void {
        // This can be used for accessibility or custom placeholder logic
        // For now, we ensure the editor remains interactive
    }
}
