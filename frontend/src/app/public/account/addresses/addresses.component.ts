import { Component, inject, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AddressService } from '../../../core/services/api/address.service';
import { Address } from '../../../core/models/address.model';
import { STATES, CITIES_BY_STATE } from '../../../core/constants/location.constants';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss'
})
export class AddressesComponent implements OnInit {
  authService = inject(AuthService);
  addressService = inject(AddressService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  addresses: Address[] = [];
  isAdding = false;
  isLoading = true;
  showMap = false;
  verificationStatus: 'none' | 'pending' | 'verified' | 'mismatch' = 'none';
  isEditingAddress = false;
  editingAddressId: string | null = null;

  newAddress: Partial<Address> = {
    type: 'Home',
    name: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    zip: '',
    phonePrimary: '',
    phoneSecondary: '',
    isDefault: false
  };

  states = STATES;

  get availableCities(): string[] {
    return CITIES_BY_STATE[this.newAddress.state || ''] || [];
  }

  private map: any;
  private marker: any;
  private L: any;

  async ngOnInit() {
    await this.loadAddresses();
    this.checkQueryParams();
  }

  checkQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.isAdding = true;
      }
    });
  }

  async loadAddresses() {
    this.isLoading = true;
    try {
      this.addresses = await this.addressService.getAddresses();
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      this.isLoading = false;
    }
  }


  async toggleAdd() {
    this.isAdding = !this.isAdding;
    this.isEditingAddress = false;
    this.editingAddressId = null;
    if (this.isAdding) {
      this.newAddress = {
        type: 'Home', name: '', street: '', city: '', state: 'Tamil Nadu',
        zip: '', phonePrimary: '', phoneSecondary: '', isDefault: false
      };
      this.showMap = false;
      this.verificationStatus = 'none';
      this.destroyMap();
    } else {
      this.destroyMap();
    }
  }

  async onZipChange() {
    const zip = this.newAddress.zip;
    if (zip && zip.length === 6 && this.isValidZip()) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
        const data = await response.json();

        if (data && data[0] && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          this.newAddress.city = postOffice.District;
          this.newAddress.state = postOffice.State;
        }
      } catch (error) {
        console.error('Error fetching PIN code details:', error);
      }
    }
  }

  async editAddress(address: Address) {
    this.isAdding = true;
    this.isEditingAddress = true;
    this.editingAddressId = address.id;
    this.newAddress = { ...address };
    this.showMap = !!(address.lat && address.lng);
    this.verificationStatus = this.showMap ? 'verified' : 'none';

    if (this.showMap) {
      setTimeout(() => {
        this.initMap().then(() => {
          this.setMarker(address.lat!, address.lng!);
          this.map.setView([address.lat, address.lng], 15);
        });
      }, 100);
    }
  }

  async toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap) {
      setTimeout(() => this.initMap(), 100);
    } else {
      this.destroyMap();
      this.newAddress.lat = undefined;
      this.newAddress.lng = undefined;
      this.verificationStatus = 'none';
    }
  }

  private async initMap() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.L) {
      this.L = await import('leaflet');
      const DefaultIcon = this.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      this.L.Marker.prototype.options.icon = DefaultIcon;
    }

    const defaultLat = 11.0168;
    const defaultLng = 76.9558;

    if (!this.map) {
      this.map = this.L.map('map-container').setView([defaultLat, defaultLng], 13);
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.setMarker(lat, lng);
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.map.setView([lat, lng], 15);
          this.setMarker(lat, lng);
        }, () => { });
      }
    }
  }

  private setMarker(lat: number, lng: number) {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = this.L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        this.newAddress.lat = position.lat;
        this.newAddress.lng = position.lng;
        this.verifyLocation(position.lat, position.lng);
      });
    }
    this.newAddress.lat = lat;
    this.newAddress.lng = lng;
    this.verifyLocation(lat, lng);
  }

  async verifyLocation(lat: number, lng: number) {
    this.verificationStatus = 'pending';
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();

      if (data && data.address) {
        const geoCity = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county;
        const geoState = data.address.state;

        // Simple case-insensitive comparison
        const cityMatch = geoCity?.toLowerCase().includes(this.newAddress.city?.toLowerCase() || 'impossible_string');
        const stateMatch = geoState?.toLowerCase().includes(this.newAddress.state?.toLowerCase() || 'impossible_string');

        if (cityMatch || stateMatch) {
          this.verificationStatus = 'verified';
        } else {
          this.verificationStatus = 'mismatch';
        }
      } else {
        this.verificationStatus = 'mismatch';
      }
    } catch (error) {
      console.error('Location verification failed:', error);
      this.verificationStatus = 'none';
    }
  }

  private destroyMap() {
    if (this.marker) {
      this.marker.remove();
      this.marker = undefined;
    }
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  isValidZip(): boolean {
    return /^[1-9][0-9]{5}$/.test(this.newAddress.zip || '');
  }

  isValidPhone(phone: string | undefined): boolean {
    if (!phone) return true; // Optional field
    return /^[6-9][0-9]{9}$/.test(phone);
  }

  async saveAddress() {
    if (!this.isValidZip()) {
      this.toastService.warning('Please enter a valid 6-digit Indian ZIP code.');
      return;
    }

    if (!this.isValidPhone(this.newAddress.phonePrimary)) {
      this.toastService.warning('Please enter a valid 10-digit primary phone number.');
      return;
    }

    if (this.newAddress.phoneSecondary && !this.isValidPhone(this.newAddress.phoneSecondary)) {
      this.toastService.warning('Please enter a valid 10-digit secondary phone number.');
      return;
    }

    try {
      if (this.isEditingAddress && this.editingAddressId) {
        await this.addressService.updateAddress(this.editingAddressId, this.newAddress);
        this.toastService.success('Address updated successfully');
      } else {
        await this.addressService.addAddress(this.newAddress);
        this.toastService.success('Address added successfully');
      }

      this.isAdding = false;
      this.isEditingAddress = false;
      this.editingAddressId = null;
      this.destroyMap();

      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const checkout = this.route.snapshot.queryParams['checkout'];

      if (returnUrl) {
        this.router.navigate([returnUrl], { queryParams: { checkout: checkout } });
      } else {
        await this.loadAddresses();
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      const message = error.response?.data?.message || 'Error saving address';
      this.toastService.error(message);
    }
  }

  async deleteAddress(id: string) {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await this.addressService.deleteAddress(id);
        this.toastService.success('Address deleted successfully');
        await this.loadAddresses();
      } catch (error: any) {
        console.error('Error deleting address:', error);
        const message = error.response?.data?.message || 'Error deleting address';
        this.toastService.error(message);
      }
    }
  }

  async setDefault(id: string) {
    try {
      await this.addressService.setDefault(id);
      this.toastService.success('Default address updated');
      await this.loadAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      const message = error.response?.data?.message || 'Error setting default address';
      this.toastService.error(message);
    }
  }

  logout() {
    this.authService.logout();
  }
}
