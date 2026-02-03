import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-star-rating',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="star-rating" [class.readonly]="readonly">
      <span *ngFor="let star of stars; let i = index" 
            class="star" 
            [class.filled]="i < rating"
            [class.interactive]="!readonly"
            (click)="rate(i + 1)">
        ★
      </span>
    </div>
  `,
    styles: [`
    .star-rating {
      display: inline-flex;
      gap: 2px;
    }
    .star {
      color: var(--border-color); /* Empty star color */
      font-size: 1.2rem;
      transition: color 0.2s;
    }
    .star.filled {
      color: #f59e0b; /* Filled star color (warning color) */
    }
    .star.interactive {
      cursor: pointer;
    }
    .star.interactive:hover {
      transform: scale(1.2);
    }
    .readonly {
      pointer-events: none;
    }
  `]
})
export class StarRatingComponent {
    @Input() rating: number = 0;
    @Input() readonly: boolean = false;
    @Output() ratingChange = new EventEmitter<number>();

    stars = new Array(5);

    rate(value: number) {
        if (!this.readonly) {
            this.rating = value;
            this.ratingChange.emit(value);
        }
    }
}
