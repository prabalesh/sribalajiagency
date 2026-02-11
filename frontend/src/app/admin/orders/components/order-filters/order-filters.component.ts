import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, Calendar, X } from 'lucide-angular';
import { OrderStatus } from '../../../../core/models/order.model';

@Component({
    selector: 'app-order-filters',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './order-filters.component.html',
    styleUrl: './order-filters.component.scss'
})
export class OrderFiltersComponent {
    @Input({ required: true }) searchTerm: string = '';
    @Input({ required: true }) statusFilter: OrderStatus | 'All' = 'All';
    @Input({ required: true }) startDate: string = '';
    @Input({ required: true }) endDate: string = '';
    @Input({ required: true }) statusOptions: OrderStatus[] = [];

    @Output() searchTermChange = new EventEmitter<string>();
    @Output() statusFilterChange = new EventEmitter<OrderStatus | 'All'>();
    @Output() startDateChange = new EventEmitter<string>();
    @Output() endDateChange = new EventEmitter<string>();
    @Output() apply = new EventEmitter<void>();
    @Output() reset = new EventEmitter<void>();

    readonly Search = Search;
    readonly Filter = Filter;
    readonly Calendar = Calendar;
    readonly X = X;

    onSearchChange() {
        this.searchTermChange.emit(this.searchTerm);
    }

    onEnter() {
        this.apply.emit();
    }

    onStatusChange() {
        this.statusFilterChange.emit(this.statusFilter);
        this.apply.emit();
    }

    onStartDateChange() {
        this.startDateChange.emit(this.startDate);
        this.apply.emit();
    }

    onEndDateChange() {
        this.endDateChange.emit(this.endDate);
        this.apply.emit();
    }

    onReset() {
        this.reset.emit();
    }
}
