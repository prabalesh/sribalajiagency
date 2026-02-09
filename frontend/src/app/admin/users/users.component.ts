import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/auth.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LucideAngularModule, Users, Mail, Shield, Edit, Trash2, X, Plus, Search, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  // Icon references
  readonly Users = Users;
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly UserPlus = UserPlus;

  users: User[] = [];
  roles: any[] = [];
  newUser: any = this.getEmptyUser();
  isEditing = false;
  isLoading = false;
  isSaving = false;
  searchQuery = '';

  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 10;

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadUsers(),
        this.loadRoles()
      ]);
    } catch (error) {
      this.toastService.error('Failed to load users data');
      console.error('Error loading users:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadUsers() {
    try {
      const data = await this.authService.getUsers(this.currentPage, this.itemsPerPage);
      this.users = data.items || [];
      this.totalItems = data.total || 0;
    } catch (error) {
      this.toastService.error('Failed to load users');
      console.error('Error loading users:', error);
    }
  }

  async loadRoles() {
    try {
      this.roles = await this.authService.getRoles();
    } catch (error) {
      this.toastService.error('Failed to load roles');
      console.error('Error loading roles:', error);
    }
  }

  async saveUser() {
    if (!this.validateUser()) {
      this.toastService.error('Please fill all required fields');
      return;
    }

    this.isSaving = true;
    try {
      const userToSave: any = {
        name: this.newUser.name.trim(),
        email: this.newUser.email.trim().toLowerCase(),
        roleIds: Array.isArray(this.newUser.roleIds) 
          ? this.newUser.roleIds 
          : [this.newUser.roleIds]
      };

      if (this.isEditing && this.newUser.id) {
        userToSave.id = this.newUser.id;
        await this.authService.updateUser(userToSave);
        this.toastService.success('User updated successfully');
      } else {
        userToSave.password = 'password123'; // Consider generating random password
        await this.authService.addUser(userToSave);
        this.toastService.success('User created successfully');
      }

      this.resetForm();
      await this.loadUsers();
    } catch (error) {
      this.toastService.error(
        this.isEditing ? 'Failed to update user' : 'Failed to create user'
      );
      console.error('Error saving user:', error);
    } finally {
      this.isSaving = false;
    }
  }

  editUser(user: User) {
    this.newUser = {
      ...user,
      roleIds: user.roles?.map(r => r.id) || []
    };
    this.isEditing = true;

    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  async deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await this.authService.deleteUser(id);
      this.toastService.success('User deleted successfully');
      await this.loadUsers();
    } catch (error) {
      this.toastService.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  }

  resetForm() {
    this.newUser = this.getEmptyUser();
    this.isEditing = false;
  }

  validateUser(): boolean {
    return !!(
      this.newUser.name?.trim() && 
      this.newUser.email?.trim() && 
      this.newUser.roleIds?.length > 0
    );
  }

  getEmptyUser(): any {
    return {
      name: '',
      email: '',
      roleIds: []
    };
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  getRoleBadgeClass(roleName: string): string {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'badge-admin';
    if (name.includes('manager')) return 'badge-manager';
    if (name.includes('editor')) return 'badge-editor';
    return 'badge-user';
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.users;
    }
    const query = this.searchQuery.toLowerCase();
    return this.users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roles?.some(role => role.name.toLowerCase().includes(query))
    );
  }
}
