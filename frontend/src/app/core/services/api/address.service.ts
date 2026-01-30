import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Address } from '../../models/address.model';

@Injectable({
    providedIn: 'root'
})
export class AddressService {
    private api = inject(ApiService);

    async getAddresses() {
        const res = await this.api.get<Address[]>('/user-addresses');
        return res.data;
    }

    async addAddress(address: Partial<Address>) {
        const res = await this.api.post<Address>('/user-addresses', address);
        return res.data;
    }

    async updateAddress(id: string, address: Partial<Address>) {
        const res = await this.api.put<Address>(`/user-addresses/${id}`, address);
        return res.data;
    }

    async deleteAddress(id: string) {
        await this.api.delete(`/user-addresses/${id}`);
    }

    async setDefault(id: string) {
        const res = await this.api.post<Address>(`/user-addresses/${id}/set-default`, {});
        return res.data;
    }
}
