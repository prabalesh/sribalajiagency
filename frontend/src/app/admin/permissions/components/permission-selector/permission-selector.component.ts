import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Key, Search, Filter, ShieldCheck, Shield, AlertCircle } from 'lucide-angular';
import { Permission } from '../../../../core/models/auth.model';

@Component({
    selector: 'app-permission-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './permission-selector.component.html',
    styleUrl: './permission-selector.component.scss'
})
export class PermissionSelectorComponent {
    @Input({ required: true }) selectedPermissionIds: string[] = [];
    @Input({ required: true }) permissions: Permission[] = [];
    @Input() isSaving = false;

    @Output() toggle = new EventEmitter<string>();
    @Output() selectAll = new EventEmitter<string[]>();
    @Output() deselectAll = new EventEmitter<void>();

    searchTerm = '';
    selectedCategory = 'all';

    readonly Key = Key;
    readonly Search = Search;
    readonly Filter = Filter;
    readonly ShieldCheck = ShieldCheck;
    readonly Shield = Shield;
    readonly AlertCircle = AlertCircle;

    get filteredPermissions(): Permission[] {
        return this.permissions.filter(p => {
            const matchesSearch = !this.searchTerm ||
                p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesCategory = this.selectedCategory === 'all' ||
                p.name.toLowerCase().startsWith(this.selectedCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }

    get permissionCategories(): string[] {
        const categories = new Set<string>();
        this.permissions.forEach(p => {
            const category = p.name.split('_')[0];
            categories.add(category);
        });
        return ['all', ...Array.from(categories)];
    }

    onToggle(id: string) {
        this.toggle.emit(id);
    }

    onSelectAll() {
        this.selectAll.emit(this.filteredPermissions.map(p => p.id));
    }

    onDeselectAll() {
        this.deselectAll.emit();
    }

    getSelectedCount(): number {
        return this.selectedPermissionIds.length;
    }

    getTotalCount(): number {
        return this.filteredPermissions.length;
    }
}
