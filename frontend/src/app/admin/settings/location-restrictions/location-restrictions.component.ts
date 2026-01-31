import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../../core/store/location.service';
import { LocationRestriction } from '../../../core/models/location.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { STATES, CITIES_BY_STATE } from '../../../core/constants/location.constants';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-admin-location-restrictions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './location-restrictions.component.html',
    styleUrl: './location-restrictions.component.scss'
})
export class LocationRestrictionsComponent implements OnInit {
    private locationService = inject(LocationService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    locations: LocationRestriction[] = [];
    newLocation: any = this.getEmptyLocation();
    isEditing = false;
    states = STATES;

    async ngOnInit() {
        this.loadLocations();
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

                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    this.newLocation.state = postOffice.State;
                    this.newLocation.city = postOffice.District;
                    this.toastService.success(`Location auto-filled for ${zip}`);
                } else {
                    this.toastService.warning('PIN code information not found');
                }
            } catch (error) {
                console.error('Error fetching PIN code details:', error);
                this.toastService.error('Failed to fetch PIN code information');
            }
        }
    }

    async loadLocations() {
        try {
            this.locations = await this.locationService.getLocations();
        } catch (error: any) {
            console.error('Error loading locations:', error);
            const message = error.response?.data?.message || 'Error loading locations';
            this.toastService.error(message);
        }
    }

    async saveLocation() {
        if (this.newLocation.state) {
            try {
                if (this.isEditing) {
                    await this.locationService.updateLocation(this.newLocation);
                    this.toastService.success('Location updated successfully');
                } else {
                    await this.locationService.addLocation(this.newLocation);
                    this.toastService.success('Location added successfully');
                }
                this.resetForm();
                this.loadLocations();
            } catch (error: any) {
                const message = error.response?.data?.message || 'Error saving location';
                this.toastService.error(message);
                console.error('Error saving location:', error);
            }
        }
    }

    editLocation(loc: LocationRestriction) {
        this.newLocation = { ...loc };
        this.isEditing = true;
    }

    async deleteLocation(id: string) {
        if (confirm('Remove this restriction?')) {
            try {
                await this.locationService.deleteLocation(id);
                this.toastService.success('Location removed successfully');
                this.loadLocations();
            } catch (error: any) {
                const message = error.response?.data?.message || 'Error deleting location';
                this.toastService.error(message);
            }
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
