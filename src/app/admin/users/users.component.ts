import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  newUser: Partial<User> = this.getEmptyUser();
  isEditing = false;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.users = this.authService.getUsers();
  }

  saveUser() {
    if (this.newUser.name && this.newUser.email && this.newUser.role) {
      if (this.isEditing && this.newUser.id) {
        // Update
        this.authService.updateUser(this.newUser as User);
      } else {
        // Create
        const user: User = {
          id: `u${Math.random().toString(36).substr(2, 5)}`,
          name: this.newUser.name,
          email: this.newUser.email,
          role: this.newUser.role,
          createdAt: new Date(),
          password: 'password123' // Default password
        };
        this.authService.addUser(user);
      }
      this.resetForm();
      this.loadUsers(); // Refresh list (though it's reference based so might auto update)
    }
  }

  editUser(user: User) {
    this.newUser = { ...user };
    this.isEditing = true;
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(id);
      this.loadUsers();
    }
  }

  resetForm() {
    this.newUser = this.getEmptyUser();
    this.isEditing = false;
  }

  getEmptyUser(): Partial<User> {
    return {
      name: '',
      email: '',
      role: 'user'
    };
  }
}
