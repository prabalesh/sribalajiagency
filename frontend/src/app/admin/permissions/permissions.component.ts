import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Permission, Role } from '../../core/models/auth.model';
import { LucideAngularModule, Shield, Key } from 'lucide-angular';
import { RoleFormComponent } from './components/role-form/role-form.component';
import { RoleListComponent } from './components/role-list/role-list.component';

@Component({
    selector: 'app-admin-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, RoleFormComponent, RoleListComponent],
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss'
})
export class PermissionsComponent implements OnInit {
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    // Icon references
    readonly Shield = Shield;
    readonly Key = Key;

    roles: Role[] = [];
    permissions: Permission[] = [];
    newRole: any = this.getEmptyRole();
    isEditing = false;
    isLoading = true;
    isSaving = false;
    isDeleting = false;

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        try {
            [this.roles, this.permissions] = await Promise.all([
                this.authService.getRoles(),
                this.authService.getPermissions()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            this.toastService.error('Failed to load roles and permissions');
        } finally {
            this.isLoading = false;
        }
    }

    async saveRole() {
        if (!this.newRole.name) {
            this.toastService.warning('Please enter a role name');
            return;
        }

        if (this.newRole.permissionIds.length === 0) {
            this.toastService.warning('Please select at least one permission');
            return;
        }

        this.isSaving = true;
        try {
            // Map selected permission IDs to objects
            const roleToSave = {
                ...this.newRole,
                permissions: this.permissions.filter(p => this.newRole.permissionIds.includes(p.id))
            };

            if (this.isEditing) {
                await this.authService.updateRole(roleToSave);
                this.toastService.success('Role updated successfully');
            } else {
                await this.authService.addRole(roleToSave);
                this.toastService.success('Role created successfully');
            }
            this.resetForm();
            await this.loadData();
        } catch (error) {
            console.error('Failed to save role:', error);
            this.toastService.error('Failed to save role');
        } finally {
            this.isSaving = false;
        }
    }

    editRole(role: Role) {
        this.newRole = {
            ...role,
            permissionIds: role.permissions.map(p => p.id)
        };
        this.isEditing = true;

        // Scroll to form on mobile
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                document.querySelector('.form-card')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    async deleteRole(id: string) {
        if (!confirm('Are you sure you want to delete this role? Users with this role will lose their permissions.')) {
            return;
        }

        this.isDeleting = true;
        try {
            await this.authService.deleteRole(id);
            this.toastService.success('Role deleted successfully');
            await this.loadData();
        } catch (error) {
            console.error('Failed to delete role:', error);
            this.toastService.error('Failed to delete role');
        } finally {
            this.isDeleting = false;
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
