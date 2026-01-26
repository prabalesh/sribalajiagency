import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private router = inject(Router);

  password = '';
  confirmPassword = '';
  isLoading = false;
  error = '';
  isSuccess = false;

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Simulate API delay
    setTimeout(() => {
      this.isSuccess = true;
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }, 1500);
  }
}
