import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, User, Mail, Calendar, Lock, Edit2, X, Check } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Lucide icons
  readonly User = User;
  readonly Mail = Mail;
  readonly Calendar = Calendar;
  readonly Lock = Lock;
  readonly Edit2 = Edit2;
  readonly X = X;
  readonly Check = Check;

  name = this.authService.user()?.name || '';
  email = this.authService.user()?.email || '';
  isEditing = false;
  message = '';

  async saveProfile() {
    await this.authService.updateProfile(this.name, this.email);
    this.isEditing = false;
    this.toast.success('Profile updated successfully!');
  }

  cancelEdit() {
    this.isEditing = false;
    this.name = this.authService.user()?.name || '';
    this.email = this.authService.user()?.email || '';
  }

  logout() {
    this.authService.logout();
    this.toast.info('Logged out successfully');
    this.router.navigate(['/login']);
  }
}
