import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="btn-close" (click)="onCancel()">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn-danger" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-content {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-color);
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-color-muted);
      transition: color 0.2s;
    }
    .btn-close:hover {
      color: var(--text-color);
    }
    .modal-body {
      margin-bottom: 1.5rem;
      color: var(--text-color-muted);
      line-height: 1.5;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    button {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary {
      background: var(--surface-color-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .btn-secondary:hover {
      background: var(--border-color);
    }
    .btn-danger {
      background: var(--danger-color);
      border: none;
      color: white;
    }
    .btn-danger:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel() {
    this.cancel.emit();
    this.isOpen = false;
  }
}
