import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  isLoading = false;

  async onSubmit() {
    this.error = '';
    this.isLoading = true;

    try {
      const success = await this.authService.login(this.email, this.password);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.error = 'Invalid email or password.';
      }
    } catch (e) {
      this.error = 'An error occurred during sign in.';
    } finally {
      this.isLoading = false;
    }
  }
}
