import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private toastService = inject(ToastService);

  email = '';
  isSubmitted = false;
  isLoading = false;

  onSubmit() {
    if (!this.email) return;
    this.isLoading = true;

    // Simulate API delay
    setTimeout(() => {
      this.isSubmitted = true;
      this.isLoading = false;
      this.toastService.success('Reset link sent to your email.');
    }, 1500);
  }
}
