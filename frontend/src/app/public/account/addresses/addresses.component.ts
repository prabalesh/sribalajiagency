import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss'
})
export class AddressesComponent {
  authService = inject(AuthService);

  addresses = [
    {
      id: '1',
      type: 'Work',
      name: 'Sri Balaji Agency HQ',
      street: '123 Industrial Estate',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      zip: '641001',
      isDefault: true
    },
    {
      id: '2',
      type: 'Home',
      name: 'John Doe',
      street: '45 Residential Avenue',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zip: '600001',
      isDefault: false
    }
  ];

  isAdding = false;
  newAddress = {
    type: 'Home',
    name: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  };

  addAddress() {
    this.addresses.push({
      id: Math.random().toString(36).substr(2, 5),
      ...this.newAddress,
      isDefault: false
    });
    this.isAdding = false;
    this.newAddress = { type: 'Home', name: '', street: '', city: '', state: '', zip: '' };
  }

  deleteAddress(id: string) {
    this.addresses = this.addresses.filter(a => a.id !== id);
  }

  setDefault(id: string) {
    this.addresses = this.addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
  }

  logout() {
    this.authService.logout();
  }
}
