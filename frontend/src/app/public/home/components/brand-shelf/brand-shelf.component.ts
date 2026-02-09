import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Brand } from '../../../../core/models/brand.model';

@Component({
    selector: 'app-brand-shelf',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage],
    templateUrl: './brand-shelf.component.html',
    styleUrl: './brand-shelf.component.scss'
})
export class BrandShelfComponent {
    @Input() brands: Brand[] = [];
    @Input() showBrands: boolean = true;
}
