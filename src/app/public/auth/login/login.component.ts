import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  onSubmit() {
    this.error = '';
    this.isLoading = true;

    // Simulate API delay
    setTimeout(() => {
      const success = this.authService.login(this.email, this.password);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.error = 'Invalid email or password. Use admin@sribalaji.com or user@example.com';
      }
      this.isLoading = false;
    }, 1000);
  }
}
