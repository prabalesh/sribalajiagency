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

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          this.currentUser.set(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing user', e);
        }
      }
    }
  }

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.roles?.some(r => r.name === 'admin'));

  async login(email: string, password: string) {
    try {
      const res = await this.api.post<any>('/auth/local/signin', { email, password });
      const { user } = res.data;

      if (this.isBrowser) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.id);
      }

      this.currentUser.set(user);
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
    try {
      await this.api.post('/auth/logout', {});
    } catch (e) {
      console.error('Logout failed', e);
    }

    this.currentUser.set(null);
    if (this.isBrowser) {
      localStorage.clear();
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

  async getUsers() {
    const res = await this.api.get<User[]>('/users');
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
      if (this.isBrowser) {
        localStorage.setItem('user', JSON.stringify(updated));
      }
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
}

