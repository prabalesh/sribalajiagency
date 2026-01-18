import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private users: User[] = [
    { id: 'u-admin', name: 'Admin User', email: 'admin@sribalaji.com', role: 'admin', createdAt: new Date() },
    { id: 'u-user', name: 'John Doe', email: 'user@example.com', role: 'user', createdAt: new Date() }
  ];
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          this.currentUser.set(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
        }
      }
    }
  }

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  login(email: string, password: string): boolean {
    // Mock login logic
    if (email === 'admin@sribalaji.com' && password === 'admin123') {
      const user: User = {
        id: 'u-admin',
        name: 'Admin User',
        email: email,
        role: 'admin',
        createdAt: new Date()
      };
      this.setUser(user);
      return true;
    } else if (email === 'user@example.com' && password === 'user123') {
      const user: User = {
        id: 'u-user',
        name: 'John Doe',
        email: email,
        role: 'user',
        createdAt: new Date()
      };
      this.setUser(user);
      return true;
    }
    return false;
  }

  register(name: string, email: string) {
    // Mock register
    const user: User = {
      id: `u-${Math.random().toString(36).substr(2, 5)}`,
      name: name,
      email: email,
      role: 'user',
      createdAt: new Date()
    };
    this.setUser(user);
  }

  logout() {
    this.currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
  }

  private setUser(user: User) {
    this.currentUser.set(user);
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  updateProfile(name: string, email: string) {
    const current = this.currentUser();
    if (current) {
      const updated = { ...current, name, email };
      this.setUser(updated);
      // Also update in users list
      const index = this.users.findIndex(u => u.id === current.id);
      if (index !== -1) {
        this.users[index] = updated;
      }
    }
  }

  // Admin User Management Methods
  getUsers(): User[] {
    return this.users;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  updateUser(user: User) {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = { ...user };
    }
  }

  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
  }
}
