import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
      <div class="toast glass-card animate-slide-in" [class]="toast.type">
        <div class="toast-icon">
          @if (toast.type === 'success') { ✅ }
          @else if (toast.type === 'error') { ❌ }
          @else if (toast.type === 'warning') { ⚠️ }
          @else { ℹ️ }
        </div>
        <div class="toast-content">{{ toast.message }}</div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
      </div>
      }
    </div>
  `,
    styleUrl: './toast.component.scss'
})
export class ToastComponent {
    toastService = inject(ToastService);
}
