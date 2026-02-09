import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Permission, Role } from '../../core/models/auth.model';
import { 
    LucideAngularModule, 
    Shield,
    ShieldCheck,
    Plus,
    Edit,
    Trash2,
    X,
    Check,
    Lock,
    Unlock,
    Users,
    Key,
    AlertCircle,
    Search,
    Filter
} from 'lucide-angular';

@Component({
    selector: 'app-admin-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss'
})
export class PermissionsComponent implements OnInit {
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    // Icon references
    readonly Shield = Shield;
    readonly ShieldCheck = ShieldCheck;
    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly X = X;
    readonly Check = Check;
    readonly Lock = Lock;
    readonly Unlock = Unlock;
    readonly Users = Users;
    readonly Key = Key;
    readonly AlertCircle = AlertCircle;
    readonly Search = Search;
    readonly Filter = Filter;

    roles: Role[] = [];
    permissions: Permission[] = [];
    newRole: any = this.getEmptyRole();
    isEditing = false;
    isLoading = true;
    isSaving = false;
    isDeleting = false;

    // Search & Filter
    searchTerm = '';
    selectedCategory = 'all';

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

    togglePermission(id: string) {
        const index = this.newRole.permissionIds.indexOf(id);
        if (index > -1) {
            this.newRole.permissionIds.splice(index, 1);
        } else {
            this.newRole.permissionIds.push(id);
        }
    }

    selectAllPermissions() {
        this.newRole.permissionIds = this.filteredPermissions.map(p => p.id);
    }

    deselectAllPermissions() {
        this.newRole.permissionIds = [];
    }

    resetForm() {
        this.newRole = this.getEmptyRole();
        this.isEditing = false;
        this.searchTerm = '';
        this.selectedCategory = 'all';
    }

    getEmptyRole() {
        return {
            name: '',
            description: '',
            permissionIds: []
        };
    }

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

    getSelectedCount(): number {
        return this.newRole.permissionIds.length;
    }

    getTotalCount(): number {
        return this.filteredPermissions.length;
    }
}
