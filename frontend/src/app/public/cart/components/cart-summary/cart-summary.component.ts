import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Lock } from 'lucide-angular';

@Component({
    selector: 'app-cart-summary',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './cart-summary.component.html',
    styleUrl: './cart-summary.component.scss'
})
export class CartSummaryComponent {
    @Input({ required: true }) subtotal!: number;
    @Input() isCheckoutMode = false;
    @Output() proceedToCheckout = new EventEmitter<void>();

    readonly Lock = Lock;

    get tax() {
        return this.subtotal * 0.18;
    }

    get total() {
        return this.subtotal + this.tax;
    }

    onProceed() {
        this.proceedToCheckout.emit();
    }
}
