import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';

export interface BreadcrumbItem {
  label: string;
  url?: string | any[];
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <nav class="breadcrumbs">
      <!-- First Item (Home) -->
      @if (items.length > 0) {
        <a [routerLink]="items[0].url" class="home-link">
          <lucide-icon [img]="Home" [size]="16"></lucide-icon>
          <span class="text">Home</span>
        </a>
        <span class="sep">/</span>
      }

      <!-- Middle Items: Hidden on Mobile if > 2 items total -->
      @for (item of items.slice(1, -1); track item.label) {
        <ng-container>
          <a [routerLink]="item.url" class="middle-item">{{ item.label }}</a>
          <span class="sep middle-sep">/</span>
        </ng-container>
      }

      <!-- Ellipsis: Visible ONLY on Mobile if we have middle items -->
      @if (items.length > 2) {
        <span class="mobile-ellipsis">...</span>
        <span class="sep mobile-sep">/</span>
      }

      <!-- Last Item (Current Page) -->
      @if (items.length > 1) {
        <span class="current">{{ items[items.length - 1].label }}</span>
      }
    </nav>
  `,
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  readonly Home = Home;
  @Input() items: BreadcrumbItem[] = [];
}
