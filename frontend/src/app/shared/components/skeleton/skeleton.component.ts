import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="skeleton-loader" 
      [style.width]="width" 
      [style.height]="height"
      [class.circle]="shape === 'circle'"
      [class.rect]="shape === 'rect'"
    ></div>
  `,
    styles: [`
    .skeleton-loader {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.1) 37%,
        rgba(255, 255, 255, 0.05) 63%
      );
      background-size: 400% 100%;
      animation: skeleton-loading 1.4s ease infinite;
      border-radius: 4px;
      display: inline-block;
    }

    .circle {
      border-radius: 50%;
    }

    .rect {
      border-radius: 4px;
    }

    @keyframes skeleton-loading {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    /* Support for Light Mode */
    :host-context(body:not(.dark-mode)) .skeleton-loader {
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.06) 25%,
        rgba(0, 0, 0, 0.1) 37%,
        rgba(0, 0, 0, 0.06) 63%
      );
      background-size: 400% 100%;
    }
  `]
})
export class SkeletonComponent {
    @Input() width: string = '100%';
    @Input() height: string = '20px';
    @Input() shape: 'rect' | 'circle' = 'rect';
}
