import { Component, inject, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AddressService } from '../../../core/services/api/address.service';
import { Address } from '../../../core/models/address.model';

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

  addresses: Address[] = [];
  isAdding = false;
  isLoading = true;
  showMap = false;
  verificationStatus: 'none' | 'pending' | 'verified' | 'mismatch' = 'none';

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

  states = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  cities: { [key: string]: string[] } = {
    'Andaman and Nicobar Islands': ['Port Blair'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Kadapa'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai'],
    'Chandigarh': ['Chandigarh'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand'],
    'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Vijayapura', 'Shivamogga'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Kalyan-Dombivli', 'Vasai-Virar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Mira-Bhayandar', 'Bhiwandi', 'Amravati', 'Nanded', 'Kolhapur', 'Akola', 'Panvel'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong', 'Tura'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar'],
    'Sikkim': ['Gangtok'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Nagercoil', 'Thanjavur', 'Dindigul', 'Hosur', 'Sivakasi', 'Karur', 'Kanchipuram', 'Kumbakonam'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam'],
    'Tripura': ['Agartala'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Maheshtala', 'Rajpur Sonarpur', 'Gopalpur', 'Bhatpara', 'Panihati']
  };

  private map: any;
  private marker: any;
  private L: any;

  async ngOnInit() {
    await this.loadAddresses();
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

  get availableCities(): string[] {
    return this.cities[this.newAddress.state || ''] || [];
  }

  async toggleAdd() {
    this.isAdding = !this.isAdding;
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

  async addAddress() {
    if (!this.isValidZip()) {
      alert('Please enter a valid 6-digit Indian ZIP code.');
      return;
    }

    if (!this.isValidPhone(this.newAddress.phonePrimary)) {
      alert('Please enter a valid 10-digit primary phone number.');
      return;
    }

    if (this.newAddress.phoneSecondary && !this.isValidPhone(this.newAddress.phoneSecondary)) {
      alert('Please enter a valid 10-digit secondary phone number.');
      return;
    }

    try {
      await this.addressService.addAddress(this.newAddress);
      this.isAdding = false;
      this.destroyMap();
      await this.loadAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
    }
  }

  async deleteAddress(id: string) {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await this.addressService.deleteAddress(id);
        await this.loadAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    }
  }

  async setDefault(id: string) {
    try {
      await this.addressService.setDefault(id);
      await this.loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  }

  logout() {
    this.authService.logout();
  }
}
