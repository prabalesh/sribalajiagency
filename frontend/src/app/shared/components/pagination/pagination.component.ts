import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="pagination-container" *ngIf="totalItems > 0">
      <div class="pagination-info">
        Showing {{ getStartItem() }} to {{ getEndItem() }} of {{ totalItems }} results
      </div>
      
      <div class="pagination-controls">
        <button 
          class="btn-icon" 
          [disabled]="currentPage === 1"
          (click)="onPageChange(currentPage - 1)">
          <i class="fas fa-chevron-left">&lt;</i>
        </button>

        <ng-container *ngFor="let page of getPages()">
          <button 
            class="btn-page" 
            [class.active]="page === currentPage"
            (click)="onPageChange(page)">
            {{ page }}
          </button>
        </ng-container>

        <button 
          class="btn-icon" 
          [disabled]="currentPage === totalPages"
          (click)="onPageChange(currentPage + 1)">
          <i class="fas fa-chevron-right">&gt;</i>
        </button>
      </div>
    </div>
  `,
    styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      margin-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .pagination-info {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    button {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;

      &:hover:not(:disabled) {
        background: var(--surface-hover);
        border-color: var(--primary-color);
      }

      &.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-icon {
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
    }
  `]
})
export class PaginationComponent {
    @Input() currentPage: number = 1;
    @Input() totalItems: number = 0;
    @Input() itemsPerPage: number = 20;
    @Output() pageChange = new EventEmitter<number>();

    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    getStartItem(): number {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndItem(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }

    getPages(): number[] {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    }
}
