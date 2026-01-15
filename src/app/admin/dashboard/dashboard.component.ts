import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  stats = [
    { label: 'Total Products', value: 120 },
    { label: 'Brands', value: 15 },
    { label: 'Pending Quotes', value: 5 },
    { label: 'New Feedback', value: 3 }
  ];
}
