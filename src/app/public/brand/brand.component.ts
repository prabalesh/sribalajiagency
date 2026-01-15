import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand', // Updated selector to match folder name context, or keep as BrandComponent
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent {
  brands = [
    { name: 'Bosch', description: 'German multinational engineering and technology company.', logo: 'assets/bosch.png' },
    { name: 'Makita', description: 'Japanese manufacturer of power tools.', logo: 'assets/makita.png' },
    { name: 'DeWalt', description: 'American worldwide brand of power tools.', logo: 'assets/dewalt.png' },
    { name: 'Hitachi', description: 'Japanese multinational conglomerate.', logo: 'assets/hitachi.png' },
    { name: 'Stanley', description: 'Hand tools, power tools, and accessories.', logo: 'assets/stanley.png' }
  ];
}
