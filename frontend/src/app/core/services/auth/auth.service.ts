import { Injectable, signal, computed, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../api/api.service';
import { User } from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private currentUser = signal<User | null>(null);
  public isInitialCheckDone = signal<boolean>(false);
  private cartService: any; // Will be set after construction to avoid circular dependency

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    // User data is no longer stored in localStorage for security
    // It will be fetched via APP_INITIALIZER
    this.isInitialCheckDone.set(false); // Will be true after fetchCurrentUser
  }

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.roles?.some(r => r.name === 'admin'));
  permissions = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return user.roles?.flatMap(r => r.permissions?.map(p => p.name)) || [];
  });

  hasPermission(permission: string): boolean {
    if (this.isAdmin()) return true;
    return this.permissions().includes(permission);
  }

  /**
   * Fetch current user from server
   * Called on app initialization and when refreshing permissions
   */
  async fetchCurrentUser(): Promise<boolean> {
    try {
      const res = await this.api.get<{ user: User }>('/auth/me');
      if (res && res.data && res.data.user) {
        this.currentUser.set(res.data.user);
        this.isInitialCheckDone.set(true);
        return true;
      }
      return false;
    } catch (e) {
      this.currentUser.set(null);
      this.isInitialCheckDone.set(true);
      return false;
    }
  }

  /**
   * Force refresh user data (roles/permissions) from server
   */
  async refreshUser() {
    await this.fetchCurrentUser();
  }

  async login(email: string, password: string) {
    try {
      const res = await this.api.post<any>('/auth/local/signin', { email, password });
      const { user } = res.data;

      if (this.isBrowser) {
        // Only store ID for analytics if needed, no sensitive data
        localStorage.setItem('user_id', user.id);
      }

      this.currentUser.set(user);

      // Merge cart after successful login
      await this.cartService?.mergeOnLogin();

      return true;
    } catch (e) {
      return false;
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      await this.api.post('/auth/local/signup', { name, email, password });
      return true;
    } catch (e) {
      return false;
    }
  }

  async logout() {
    // Clear cart before logout
    this.cartService?.onLogout();

    try {
      await this.api.post('/auth/logout', {});
    } catch (e) {
      console.error('Logout failed', e);
    }

    this.currentUser.set(null);
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      // Clear user related items but keep theme
      localStorage.removeItem('user_id');

      if (savedTheme) {
        localStorage.setItem('theme', savedTheme);
      }
      this.redirect('/login');
    }
  }

  private redirect(url: string) {
    if (this.isBrowser) {
      window.location.assign(url);
    }
  }


  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const res = await this.api.get<{ items: User[], total: number, page: number, limit: number }>('/users', { page, limit });
    return res.data;
  }

  async addUser(user: any) {
    const res = await this.api.post<User>('/users', user);
    return res.data;
  }

  async updateUser(user: User) {
    const res = await this.api.put<User>(`/users/${user.id}`, user);
    return res.data;
  }

  async deleteUser(id: string) {
    await this.api.delete(`/users/${id}`);
  }

  async updateProfile(name: string, email: string) {
    const current = this.currentUser();
    if (current) {
      const res = await this.api.put<User>(`/users/profile`, { name, email });
      const updated = res.data;
      this.currentUser.set(updated);
      // No localStorage update needed
    }
  }

  // Roles & Permissions management
  async getRoles() {
    const res = await this.api.get<any[]>('/roles');
    return res.data;
  }

  async addRole(role: any) {
    const res = await this.api.post<any>('/roles', role);
    return res.data;
  }

  async updateRole(role: any) {
    const res = await this.api.put<any>(`/roles/${role.id}`, role);
    return res.data;
  }

  async deleteRole(id: string) {
    await this.api.delete(`/roles/${id}`);
  }

  async getPermissions() {
    const res = await this.api.get<any[]>('/roles/permissions');
    return res.data;
  }

  // Set cart service (called from CartService to avoid circular dependency)
  setCartService(cartService: any) {
    this.cartService = cartService;
  }
}
