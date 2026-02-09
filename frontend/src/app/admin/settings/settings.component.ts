import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/services/api/settings.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  settings: any = {
      enabledPaymentMethods: ['online', 'cod'],
      allowCod: true,
      allowOnline: true
  };

  isSaving = false;
  isLoading = true;

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.isLoading = true;
      const settingsData = await this.settingsService.getStoreSettings();
      if (settingsData) {
        this.settings = { ...this.settings, ...settingsData };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.toastService.error('Failed to load settings. Please refresh the page.');
    } finally {
      this.isLoading = false;
    }
  }

  async saveSettings() {
    if (!this.authService.hasPermission('UPDATE_SETTINGS')) {
      alert('You do not have permission to update settings');
      return;
    }

    this.isSaving = true;
    try {
      await this.settingsService.updateStoreSettings(this.settings);
      this.toastService.success('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.toastService.error('Failed to save settings. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }
}
