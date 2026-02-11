import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MapPin, CheckCircle, XCircle, Home, Briefcase, CreditCard, Banknote } from 'lucide-angular';
import { Address } from '../../../../core/models/address.model';

@Component({
    selector: 'app-checkout-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './checkout-form.component.html',
    styleUrl: './checkout-form.component.scss'
})
export class CheckoutFormComponent {
    @Input({ required: true }) addresses: Address[] = [];
    @Input({ required: true }) selectedAddressId: string = '';
    @Input({ required: true }) isLocationEligible: boolean = false;
    @Input({ required: true }) checkingEligibility: boolean = false;
    @Input({ required: true }) allowedMethods: string[] = [];
    @Input({ required: true }) isProcessingOrder: boolean = false;

    @Output() addressSelected = new EventEmitter<Address>();
    @Output() paymentSelected = new EventEmitter<'online' | 'cod'>();
    @Output() finalizeOrder = new EventEmitter<{ notes: string }>();
    @Output() backToCart = new EventEmitter<void>();
    @Output() addNewAddress = new EventEmitter<void>();

    selectedPayment: 'online' | 'cod' | '' = '';
    deliveryNotes: string = '';

    readonly MapPin = MapPin;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Home = Home;
    readonly Briefcase = Briefcase;
    readonly CreditCard = CreditCard;
    readonly Banknote = Banknote;

    onSelectAddress(address: Address) {
        this.addressSelected.emit(address);
    }

    onSelectPayment(method: 'online' | 'cod') {
        this.selectedPayment = method;
        this.paymentSelected.emit(method);
    }

    onFinalize() {
        this.finalizeOrder.emit({ notes: this.deliveryNotes });
    }

    onBack() {
        this.backToCart.emit();
    }

    onAddAddress() {
        this.addNewAddress.emit();
    }
}
