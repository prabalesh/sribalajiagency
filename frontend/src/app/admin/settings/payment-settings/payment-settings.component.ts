import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/api/settings.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule, Lock, Unlock, Save, RotateCcw, Clock, AlertCircle, Info, Check } from 'lucide-angular';
import { SiteSettings } from '../../../core/models/settings.model';
import { UpdateSettingsDto } from '../../../core/models/settings.dto';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payment-settings.component.html',
  styleUrl: './payment-settings.component.scss'
})
export class PaymentSettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  public readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // Icons
  readonly Lock = Lock;
  readonly Unlock = Unlock;
  readonly Save = Save;
  readonly RotateCcw = RotateCcw;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly Info = Info;
  readonly Check = Check;

  settings: SiteSettings = {
    id: 1,
    enabledPaymentMethods: ['online', 'cod'],
    allowCod: true,
    allowOnline: true,
    updatedAt: new Date()
  };

  private originalSettings: SiteSettings | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = null;
      const settingsData = await this.settingsService.getStoreSettings();
      if (settingsData) {
        this.settings = { ...settingsData };
        this.originalSettings = { ...settingsData };
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to load settings';
      this.toastService.error(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  async saveSettings(): Promise<void> {
    if (!this.authService.hasPermission('UPDATE_SETTINGS')) {
      this.toastService.error('You do not have permission to update settings');
      return;
    }

    if (!this.settings.allowCod && !this.settings.allowOnline) {
      const confirmed = confirm('⚠️ This will prevent customers from placing orders. Continue?');
      if (!confirmed) return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    try {
      const enabledMethods: string[] = [];
      if (this.settings.allowOnline) enabledMethods.push('online');
      if (this.settings.allowCod) enabledMethods.push('cod');

      const updateDto: UpdateSettingsDto = {
        enabledPaymentMethods: enabledMethods,
        allowCod: this.settings.allowCod,
        allowOnline: this.settings.allowOnline
      };

      const updatedSettings = await this.settingsService.updateStoreSettings(updateDto);
      this.settings = { ...updatedSettings };
      this.originalSettings = { ...updatedSettings };

      this.toastService.success(
        enabledMethods.length === 0 
          ? 'Store closed for orders' 
          : 'Settings updated successfully'
      );
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save settings';
      this.toastService.error(this.errorMessage || 'Failed to save settings');
    } finally {
      this.isSaving = false;
    }
  }

  resetSettings(): void {
    if (!this.originalSettings) return;
    if (this.hasUnsavedChanges() && !confirm('Discard changes?')) return;
    this.settings = { ...this.originalSettings };
    this.errorMessage = null;
  }

  hasUnsavedChanges(): boolean {
    if (!this.originalSettings) return false;
    return (
      this.settings.allowCod !== this.originalSettings.allowCod ||
      this.settings.allowOnline !== this.originalSettings.allowOnline
    );
  }

  isStoreClosed(): boolean {
    return !this.settings.allowCod && !this.settings.allowOnline;
  }

  canUpdateSettings(): boolean {
    return this.authService.hasPermission('UPDATE_SETTINGS');
  }

  async openStore(): Promise<void> {
    this.settings.allowCod = true;
    this.settings.allowOnline = true;
    await this.saveSettings();
  }
}
