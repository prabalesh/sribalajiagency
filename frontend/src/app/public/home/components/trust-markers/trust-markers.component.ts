import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Truck, ShieldCheck, MessageCircle } from 'lucide-angular';

@Component({
    selector: 'app-trust-markers',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './trust-markers.component.html',
    styleUrl: './trust-markers.component.scss'
})
export class TrustMarkersComponent {
    readonly Truck = Truck;
    readonly ShieldCheck = ShieldCheck;
    readonly MessageCircle = MessageCircle;

    @Input() showTrustMarkers: boolean = true;
}
