import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  featuredBrands = [
    { name: 'Bosch', logo: 'assets/bosch-logo.png' }, // Placeholder
    { name: 'Makita', logo: 'assets/makita-logo.png' },
    { name: 'DeWalt', logo: 'assets/dewalt-logo.png' },
    { name: 'Hitachi', logo: 'assets/hitachi-logo.png' }
  ];
}
