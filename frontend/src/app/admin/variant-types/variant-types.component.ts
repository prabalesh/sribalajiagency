import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VariantType, CreateVariantTypeDto, UpdateVariantTypeDto } from '../../core/models/variant-type.model';
import { VariantTypeService } from '../../core/services/api/variant-type.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Layers, Edit, Trash2, Plus, X, Search } from 'lucide-angular';

@Component({
    selector: 'app-admin-variant-types',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmDialogComponent, LucideAngularModule],
    templateUrl: './variant-types.component.html',
    styleUrl: './variant-types.component.scss'
})
export class VariantTypesComponent implements OnInit {
    private variantTypeService = inject(VariantTypeService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    // Icon references
    readonly Layers = Layers;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Plus = Plus;
    readonly X = X;
    readonly Search = Search;

    variantTypes: VariantType[] = [];
    newVariantType: any = { name: '', displayName: '' };
    isEditing = false;
    editingId: string | null = null;
    isLoading = false;
    isSaving = false;
    showDeleteConfirm = false;
    typeToDelete: { id: string; name: string } | null = null;
    searchQuery = '';

    async ngOnInit() {
        await this.loadVariantTypes();
    }

    async loadVariantTypes() {
        this.isLoading = true;
        try {
            this.variantTypeService.getVariantTypes().subscribe({
                next: (types) => {
                    this.variantTypes = types;
                    this.isLoading = false;
                },
                error: (error) => {
                    this.toastService.apiError(error, 'Failed to load variant types');
                    this.isLoading = false;
                }
            });
        } catch (error) {
            console.error('Error loading variant types:', error);
            this.isLoading = false;
        }
    }

    async saveVariantType() {
        if (!this.newVariantType.name?.trim()) {
            this.toastService.warning('Variant type name is required');
            return;
        }

        this.isSaving = true;
        try {
            if (this.isEditing && this.editingId) {
                const updateDto: UpdateVariantTypeDto = {
                    name: this.newVariantType.name,
                    displayName: this.newVariantType.displayName
                };
                this.variantTypeService.updateVariantType(this.editingId, updateDto).subscribe({
                    next: (result) => {
                        const index = this.variantTypes.findIndex(t => t.id === result.id);
                        if (index !== -1) this.variantTypes[index] = result;
                        this.toastService.success('Variant type updated successfully');
                        this.resetForm();
                        this.isSaving = false;
                    },
                    error: (error) => {
                        this.toastService.apiError(error, 'Failed to update variant type');
                        this.isSaving = false;
                    }
                });
            } else {
                const createDto: CreateVariantTypeDto = {
                    name: this.newVariantType.name,
                    displayName: this.newVariantType.displayName
                };
                this.variantTypeService.createVariantType(createDto).subscribe({
                    next: (result) => {
                        this.variantTypes.push(result);
                        this.toastService.success('Variant type created successfully');
                        this.resetForm();
                        this.isSaving = false;
                    },
                    error: (error) => {
                        this.toastService.apiError(error, 'Failed to create variant type');
                        this.isSaving = false;
                    }
                });
            }
        } catch (error) {
            this.toastService.apiError(error, 'Failed to save variant type');
            this.isSaving = false;
        }
    }

    editVariantType(type: VariantType) {
        this.newVariantType = {
            name: type.name,
            displayName: type.displayName
        };
        this.isEditing = true;
        this.editingId = type.id;

        if (window.innerWidth < 1024) {
            setTimeout(() => {
                document.querySelector('.form-card')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    openDeleteConfirm(id: string, name: string) {
        this.typeToDelete = { id, name };
        this.showDeleteConfirm = true;
    }

    closeDeleteConfirm() {
        this.showDeleteConfirm = false;
        this.typeToDelete = null;
    }

    async confirmDelete() {
        if (!this.typeToDelete) return;

        this.variantTypeService.deleteVariantType(this.typeToDelete.id).subscribe({
            next: () => {
                this.variantTypes = this.variantTypes.filter(t => t.id !== this.typeToDelete!.id);
                this.toastService.success('Variant type deleted successfully');
                this.closeDeleteConfirm();
            },
            error: (error) => {
                this.toastService.apiError(error, 'Failed to delete variant type');
                this.closeDeleteConfirm();
            }
        });
    }

    resetForm() {
        this.newVariantType = { name: '', displayName: '' };
        this.isEditing = false;
        this.editingId = null;
    }

    get filteredVariantTypes(): VariantType[] {
        if (!this.searchQuery.trim()) {
            return this.variantTypes;
        }
        const query = this.searchQuery.toLowerCase();
        return this.variantTypes.filter(type =>
            type.name.toLowerCase().includes(query) ||
            type.displayName?.toLowerCase().includes(query)
        );
    }
}
