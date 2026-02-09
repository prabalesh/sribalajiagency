import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../../core/store/location.service';
import { LocationRestriction } from '../../../core/models/location.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { STATES, CITIES_BY_STATE } from '../../../core/constants/location.constants';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Check, X } from 'lucide-angular';

@Component({
  selector: 'app-location-restrictions',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './location-restrictions.component.html',
  styleUrl: './location-restrictions.component.scss'
})
export class LocationRestrictionsComponent implements OnInit {
  private locationService = inject(LocationService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Check = Check;
  readonly X = X;

  locations: LocationRestriction[] = [];
  newLocation: any = this.getEmptyLocation();
  isEditing = false;
  states = STATES;

  async ngOnInit() {
    await this.loadLocations();
  }

  get availableCities(): string[] {
    return CITIES_BY_STATE[this.newLocation.state] || [];
  }

  async onZipChange() {
    const zip = this.newLocation.zipcode;
    if (zip && zip.length === 6 && /^[1-9][0-9]{5}$/.test(zip)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
        const data = await response.json();
        if (data?.[0]?.Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          this.newLocation.state = postOffice.State;
          this.newLocation.city = postOffice.District;
          this.toastService.success('Location auto-filled');
        } else {
          this.toastService.warning('PIN code not found');
        }
      } catch (error) {
        this.toastService.error('Failed to fetch PIN code info');
      }
    }
  }

  async loadLocations() {
    try {
      this.locations = await this.locationService.getLocations();
    } catch (error: any) {
      this.toastService.error(error.response?.data?.message || 'Error loading locations');
    }
  }

  async saveLocation() {
    if (!this.newLocation.state) return;
    
    try {
      if (this.isEditing) {
        await this.locationService.updateLocation(this.newLocation);
        this.toastService.success('Location updated');
      } else {
        await this.locationService.addLocation(this.newLocation);
        this.toastService.success('Location added');
      }
      this.resetForm();
      await this.loadLocations();
    } catch (error: any) {
      this.toastService.error(error.response?.data?.message || 'Error saving location');
    }
  }

  editLocation(loc: LocationRestriction) {
    this.newLocation = { ...loc };
    this.isEditing = true;
  }

  async deleteLocation(id: string) {
    if (!confirm('Remove this restriction?')) return;
    
    try {
      await this.locationService.deleteLocation(id);
      this.toastService.success('Location removed');
      await this.loadLocations();
    } catch (error: any) {
      this.toastService.error(error.response?.data?.message || 'Error deleting location');
    }
  }

  resetForm() {
    this.newLocation = this.getEmptyLocation();
    this.isEditing = false;
  }

  getEmptyLocation() {
    return {
      state: '',
      city: '',
      zipcode: '',
      isAllowed: true
    };
  }
}
