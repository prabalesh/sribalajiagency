import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  error = '';

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.error = '';
    this.isLoading = true;

    try {
      const success = await this.authService.register(this.name, this.email, this.password);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.error = 'Registration failed. Please try again.';
      }
    } catch (e) {
      this.error = 'An error occurred during registration.';
    } finally {
      this.isLoading = false;
    }
  }
}
