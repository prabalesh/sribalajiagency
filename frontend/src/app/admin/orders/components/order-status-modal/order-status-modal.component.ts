import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit, X, User, IndianRupee, Package, Mail, Check } from 'lucide-angular';
import { Order, OrderStatus } from '../../../../core/models/order.model';

@Component({
    selector: 'app-order-status-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './order-status-modal.component.html',
    styleUrl: './order-status-modal.component.scss'
})
export class OrderStatusModalComponent {
    @Input({ required: true }) order: Order | null = null;
    @Input() isOpen = false;
    @Input() isUpdating = false;
    @Input({ required: true }) statusOptions: OrderStatus[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<{ status: OrderStatus, message: string }>();

    newStatus: OrderStatus | '' = '';
    statusMessage: string = '';

    // Icons
    readonly Edit = Edit;
    readonly X = X;
    readonly User = User;
    readonly IndianRupee = IndianRupee;
    readonly Package = Package;
    readonly Mail = Mail;
    readonly Check = Check;

    ngOnChanges() {
        if (this.order) {
            this.newStatus = this.order.status;
            this.statusMessage = '';
        }
    }

    onClose() {
        this.close.emit();
    }

    onSave() {
        if (this.newStatus) {
            this.save.emit({
                status: this.newStatus as OrderStatus,
                message: this.statusMessage
            });
        }
    }

    getTruncatedId(id: string): string {
        return id.substring(0, 8);
    }
}
