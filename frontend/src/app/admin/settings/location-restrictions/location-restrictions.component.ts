import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../../core/store/location.service';
import { LocationRestriction } from '../../../core/models/location.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { STATES, CITIES_BY_STATE } from '../../../core/constants/location.constants';

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
                }
            } catch (error) {
                console.error('Error fetching PIN code details:', error);
            }
        }
    }

    async loadLocations() {
        this.locations = await this.locationService.getLocations();
    }

    async saveLocation() {
        if (this.newLocation.state) {
            if (this.isEditing) {
                await this.locationService.updateLocation(this.newLocation);
            } else {
                await this.locationService.addLocation(this.newLocation);
            }
            this.resetForm();
            this.loadLocations();
        }
    }

    editLocation(loc: LocationRestriction) {
        this.newLocation = { ...loc };
        this.isEditing = true;
    }

    async deleteLocation(id: string) {
        if (confirm('Remove this restriction?')) {
            await this.locationService.deleteLocation(id);
            this.loadLocations();
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
