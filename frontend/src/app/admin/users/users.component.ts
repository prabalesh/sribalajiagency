import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  newUser: any = this.getEmptyUser();
  isEditing = false;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.users = await this.authService.getUsers();
  }

  async saveUser() {
    if (this.newUser.name && this.newUser.email && this.newUser.role) {
      const userToSave: any = {
        name: this.newUser.name,
        email: this.newUser.email,
        // Backend expects roles array or handles role string if specific endpoint used
        // Our addUser/updateUser in AuthService should handle this mapping if needed
        roles: [{ name: this.newUser.role }]
      };

      if (this.isEditing && this.newUser.id) {
        userToSave.id = this.newUser.id;
        await this.authService.updateUser(userToSave);
      } else {
        userToSave.password = 'password123';
        await this.authService.addUser(userToSave);
      }
      this.resetForm();
      await this.loadUsers();
    }
  }

  editUser(user: User) {
    this.newUser = {
      ...user,
      role: user.roles && user.roles.length > 0 ? user.roles[0].name : 'user'
    };
    this.isEditing = true;
  }

  async deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await this.authService.deleteUser(id);
      await this.loadUsers();
    }
  }

  resetForm() {
    this.newUser = this.getEmptyUser();
    this.isEditing = false;
  }

  getEmptyUser(): any {
    return {
      name: '',
      email: '',
      role: 'user'
    };
  }
}
