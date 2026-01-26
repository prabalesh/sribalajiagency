import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { Permission, Role } from '../../core/models/auth.model';

@Component({
    selector: 'app-admin-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss'
})
export class PermissionsComponent implements OnInit {
    private authService = inject(AuthService);

    roles: Role[] = [];
    permissions: Permission[] = [];
    newRole: any = this.getEmptyRole();
    isEditing = false;

    async ngOnInit() {
        this.loadData();
    }

    async loadData() {
        [this.roles, this.permissions] = await Promise.all([
            this.authService.getRoles(),
            this.authService.getPermissions()
        ]);
    }

    async saveRole() {
        if (this.newRole.name) {
            // Map selected permission IDs to objects
            const roleToSave = {
                ...this.newRole,
                permissions: this.permissions.filter(p => this.newRole.permissionIds.includes(p.id))
            };

            if (this.isEditing) {
                await this.authService.updateRole(roleToSave);
            } else {
                await this.authService.addRole(roleToSave);
            }
            this.resetForm();
            this.loadData();
        }
    }

    editRole(role: Role) {
        this.newRole = {
            ...role,
            permissionIds: role.permissions.map(p => p.id)
        };
        this.isEditing = true;
    }

    async deleteRole(id: string) {
        if (confirm('Delete this role?')) {
            await this.authService.deleteRole(id);
            this.loadData();
        }
    }

    togglePermission(id: string) {
        const index = this.newRole.permissionIds.indexOf(id);
        if (index > -1) {
            this.newRole.permissionIds.splice(index, 1);
        } else {
            this.newRole.permissionIds.push(id);
        }
    }

    resetForm() {
        this.newRole = this.getEmptyRole();
        this.isEditing = false;
    }

    getEmptyRole() {
        return {
            name: '',
            description: '',
            permissionIds: []
        };
    }
}
