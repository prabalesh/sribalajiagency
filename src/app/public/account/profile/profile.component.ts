import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  name = this.authService.user()?.name || '';
  email = this.authService.user()?.email || '';
  isEditing = false;
  message = '';

  saveProfile() {
    this.authService.updateProfile(this.name, this.email);
    this.isEditing = false;
    this.message = 'Profile updated successfully!';
    setTimeout(() => this.message = '', 3000);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
