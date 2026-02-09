import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/api/settings.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SiteSettings } from '../../core/models/settings.model';
import { UpdateSettingsDto } from '../../core/models/settings.dto';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly settingsService = inject(SettingsService);
  public readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

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

  readonly availablePaymentMethods = [
    { value: 'online', label: 'Online Payment' },
    { value: 'cod', label: 'Cash on Delivery' }
  ];

  async ngOnInit(): Promise<void> {
    console.log('[SettingsComponent] Component initialized');
    await this.loadSettings();
  }

  ngOnDestroy(): void {
    console.log('[SettingsComponent] Component destroyed');
  }

  async loadSettings(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = null;

      console.log('[SettingsComponent] Loading settings...');
      const settingsData = await this.settingsService.getStoreSettings();

      if (settingsData) {
        this.settings = { ...settingsData };
        this.originalSettings = { ...settingsData };
        console.log('[SettingsComponent] Settings loaded:', this.settings);
      }
    } catch (error: any) {
      const errorMsg = 'Failed to load settings. Please refresh the page.';
      this.errorMessage = errorMsg;
      
      console.error('[SettingsComponent] Load settings error:', error);
      this.toastService.error(errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Saves updated settings to the backend.
   * Allows disabling all payment methods to disable purchasing.
   */
  async saveSettings(): Promise<void> {
    if (!this.authService.hasPermission('UPDATE_SETTINGS')) {
      const errorMsg = 'You do not have permission to update settings';
      console.warn('[SettingsComponent] Permission denied:', errorMsg);
      this.toastService.error(errorMsg);
      return;
    }

    // Show confirmation if disabling all payment methods
    if (!this.settings.allowCod && !this.settings.allowOnline) {
      const confirmed = await this.confirmDisableAllPayments();
      if (!confirmed) {
        return;
      }
    }

    this.isSaving = true;
    this.errorMessage = null;

    try {
      console.log('[SettingsComponent] Saving settings:', this.settings);

      // Sync enabledPaymentMethods based on checkbox state
      const enabledMethods: string[] = [];
      if (this.settings.allowOnline) {
        enabledMethods.push('online');
      }
      if (this.settings.allowCod) {
        enabledMethods.push('cod');
      }

      const updateDto: UpdateSettingsDto = {
        enabledPaymentMethods: enabledMethods,
        allowCod: this.settings.allowCod,
        allowOnline: this.settings.allowOnline
      };

      console.log('[SettingsComponent] Sending update DTO:', updateDto);

      const updatedSettings = await this.settingsService.updateStoreSettings(updateDto);
      
      this.settings = { ...updatedSettings };
      this.originalSettings = { ...updatedSettings };

      console.log('[SettingsComponent] Settings saved successfully');
      
      // Show appropriate success message
      if (enabledMethods.length === 0) {
        this.toastService.success('All payment methods disabled. Store is now closed for orders.');
      } else {
        this.toastService.success('Settings updated successfully!');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to save settings. Please try again.';
      this.errorMessage = errorMsg;
      
      console.error('[SettingsComponent] Save settings error:', error);
      this.toastService.error(errorMsg);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Shows confirmation dialog when disabling all payment methods.
   * Returns promise that resolves to user's choice.
   */
  private confirmDisableAllPayments(): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(
        '⚠️ Warning: Disabling all payment methods will prevent customers from placing orders.\n\n' +
        'This effectively closes your store for new purchases.\n\n' +
        'Are you sure you want to continue?'
      );
      resolve(confirmed);
    });
  }

  /**
   * Validates settings before saving.
   * Removed validation that requires at least one payment method.
   */
  private validateSettings(): boolean {
    // No validation needed - allowing all methods to be disabled
    // This is intentional for store maintenance/closure
    return true;
  }

  hasUnsavedChanges(): boolean {
    if (!this.originalSettings) {
      return false;
    }

    return (
      this.settings.allowCod !== this.originalSettings.allowCod ||
      this.settings.allowOnline !== this.originalSettings.allowOnline
    );
  }

  resetSettings(): void {
    if (!this.originalSettings) {
      console.warn('[SettingsComponent] No original settings to reset to');
      return;
    }

    if (this.hasUnsavedChanges()) {
      const confirmed = confirm('Are you sure you want to discard all changes?');
      if (!confirmed) {
        return;
      }
    }

    this.settings = { ...this.originalSettings };
    this.errorMessage = null;
    console.log('[SettingsComponent] Settings reset to original values');
  }

  canUpdateSettings(): boolean {
    return this.authService.hasPermission('UPDATE_SETTINGS');
  }

  /**
   * Checks if store is currently closed (no payment methods enabled).
   */
  isStoreClosed(): boolean {
    return !this.settings.allowCod && !this.settings.allowOnline;
  }

  /**
   * Quick action to disable all payment methods (close store).
   */
  async closeStore(): Promise<void> {
    const confirmed = confirm(
      '🔒 Close Store\n\n' +
      'This will disable all payment methods and prevent new orders.\n\n' +
      'Are you sure?'
    );

    if (!confirmed) return;

    this.settings.allowCod = false;
    this.settings.allowOnline = false;
    await this.saveSettings();
  }

  /**
   * Quick action to enable all payment methods (open store).
   */
  async openStore(): Promise<void> {
    this.settings.allowCod = true;
    this.settings.allowOnline = true;
    await this.saveSettings();
  }
}
