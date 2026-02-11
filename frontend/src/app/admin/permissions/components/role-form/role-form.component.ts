import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, Edit, Plus, X, Users, Key, Check } from 'lucide-angular';
import { Permission } from '../../../../core/models/auth.model';
import { PermissionSelectorComponent } from '../permission-selector/permission-selector.component';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, PermissionSelectorComponent],
    templateUrl: './role-form.component.html',
    styleUrl: './role-form.component.scss'
})
export class RoleFormComponent {
    @Input({ required: true }) newRole: any;
    @Input() isEditing = false;
    @Input() isSaving = false;
    @Input({ required: true }) permissions: Permission[] = [];

    @Output() save = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    readonly ShieldCheck = ShieldCheck;
    readonly Edit = Edit;
    readonly Plus = Plus;
    readonly X = X;
    readonly Users = Users;
    readonly Key = Key;
    readonly Check = Check;

    onTogglePermission(id: string) {
        const index = this.newRole.permissionIds.indexOf(id);
        if (index > -1) {
            this.newRole.permissionIds.splice(index, 1);
        } else {
            this.newRole.permissionIds.push(id);
        }
    }

    onSelectAllPermissions(ids: string[]) {
        this.newRole.permissionIds = ids;
    }

    onDeselectAllPermissions() {
        this.newRole.permissionIds = [];
    }

    onSubmit() {
        this.save.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
