import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShoppingBag } from 'lucide-angular';

@Component({
    selector: 'app-empty-cart',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './empty-cart.component.html',
    styleUrl: './empty-cart.component.scss'
})
export class EmptyCartComponent {
    readonly ShoppingBag = ShoppingBag;
}
