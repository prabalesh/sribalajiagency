import { Injectable } from '@angular/core';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = true; // Default to true for development

  private users: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@sribalajiconstructions.com', role: 'admin', createdAt: new Date() },
    { id: 'u2', name: 'Normal User', email: 'user@example.com', role: 'user', createdAt: new Date() }
  ];

  constructor() { }

  login() {
    this.isLoggedIn = true;
  }

  logout() {
    this.isLoggedIn = false;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  // User Management Methods
  getUsers(): User[] {
    return this.users;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  updateUser(user: User) {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  deleteUser(userId: string) {
    this.users = this.users.filter(u => u.id !== userId);
  }
}
