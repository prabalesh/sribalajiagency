import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string | any[];
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumbs">
      @for (item of items; track item.label; let last = $last) {
        @if (item.url && !last) {
          <a [routerLink]="item.url">{{ item.label }}</a>
        } @else {
          <span [class.current]="last">{{ item.label }}</span>
        }
        @if (!last) {
          <span class="sep">/</span>
        }
      }
    </nav>
  `,
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
