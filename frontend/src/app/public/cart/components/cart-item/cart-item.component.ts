import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2, Minus, Plus } from 'lucide-angular';
import { ValidatedCartItem } from '../../../../core/models/cart.model';

@Component({
    selector: 'app-cart-item',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './cart-item.component.html',
    styleUrl: './cart-item.component.scss'
})
export class CartItemComponent {
    @Input({ required: true }) item!: ValidatedCartItem;
    @Output() updateQty = new EventEmitter<{ delta: number }>();
    @Output() remove = new EventEmitter<void>();

    readonly Trash2 = Trash2;
    readonly Minus = Minus;
    readonly Plus = Plus;

    onUpdateQty(delta: number) {
        this.updateQty.emit({ delta });
    }

    onRemove() {
        this.remove.emit();
    }
}
