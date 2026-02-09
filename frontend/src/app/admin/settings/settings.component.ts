import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentSettingsComponent } from './payment-settings/payment-settings.component';
import { LocationRestrictionsComponent } from './location-restrictions/location-restrictions.component';
import { LucideAngularModule, Settings, MapPin, CreditCard, Lock } from 'lucide-angular';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    PaymentSettingsComponent,
    LocationRestrictionsComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  public readonly authService = inject(AuthService);

  readonly Settings = Settings;
  readonly MapPin = MapPin;
  readonly CreditCard = CreditCard;
  readonly Lock = Lock;

  activeTab: 'payment' | 'location' = 'payment';

  ngOnInit(): void {
    // Auto-select first available tab based on permissions
    if (this.authService.hasPermission('VIEW_SETTINGS')) {
      this.activeTab = 'payment';
    } else if (this.authService.hasPermission('VIEW_LOCATIONS')) {
      this.activeTab = 'location';
    }
  }

  setActiveTab(tab: 'payment' | 'location'): void {
    this.activeTab = tab;
  }

  canAccessSettings(): boolean {
    return (
      this.authService.hasPermission('VIEW_SETTINGS') ||
      this.authService.hasPermission('VIEW_LOCATIONS')
    );
  }
}
