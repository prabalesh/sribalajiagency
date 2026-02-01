import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AccountSidebarComponent } from '../../../shared/components/account-sidebar/account-sidebar.component';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AccountSidebarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);


  name = this.authService.user()?.name || '';
  email = this.authService.user()?.email || '';
  isEditing = false;
  message = '';

  async saveProfile() {
    await this.authService.updateProfile(this.name, this.email);
    this.isEditing = false;
    this.toast.success('Profile updated successfully!');
  }

  logout() {
    this.authService.logout();
    this.toast.info('Logged out successfully');
    this.router.navigate(['/login']);
  }
}
