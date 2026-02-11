import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShoppingCart, Truck } from 'lucide-angular';

@Component({
    selector: 'app-order-queue-tabs',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './order-queue-tabs.component.html',
    styleUrl: './order-queue-tabs.component.scss'
})
export class OrderQueueTabsComponent {
    @Input({ required: true }) activeTab: 'orders' | 'delivery' = 'orders';
    @Output() tabChange = new EventEmitter<'orders' | 'delivery'>();

    readonly ShoppingCart = ShoppingCart;
    readonly Truck = Truck;

    onTabClick(tab: 'orders' | 'delivery') {
        this.tabChange.emit(tab);
    }
}
