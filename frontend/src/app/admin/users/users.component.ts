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
  roles: any[] = [];
  newUser: any = this.getEmptyUser();
  isEditing = false;

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    await Promise.all([
      this.loadUsers(),
      this.loadRoles()
    ]);
  }

  async loadUsers() {
    this.users = await this.authService.getUsers();
  }

  async loadRoles() {
    this.roles = await this.authService.getRoles();
  }

  async saveUser() {
    if (this.newUser.name && this.newUser.email) {
      const userToSave: any = {
        name: this.newUser.name,
        email: this.newUser.email,
        roleIds: Array.isArray(this.newUser.roleIds) ? this.newUser.roleIds : [this.newUser.roleIds]
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
      roleIds: user.roles?.map(r => r.id) || []
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
      roleIds: []
    };
  }
}
