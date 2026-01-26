import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Coupon } from '../../models/coupon.model';

@Injectable({
    providedIn: 'root'
})
export class CouponService {
    private api = inject(ApiService);

    async getCoupons() {
        const res = await this.api.get<Coupon[]>('/coupons');
        return res.data;
    }

    async getCouponById(id: string) {
        const res = await this.api.get<Coupon>(`/coupons/${id}`);
        return res.data;
    }

    async addCoupon(coupon: any) {
        const res = await this.api.post<Coupon>('/coupons', coupon);
        return res.data;
    }

    async updateCoupon(coupon: any) {
        const res = await this.api.put<Coupon>(`/coupons/${coupon.id}`, coupon);
        return res.data;
    }

    async deleteCoupon(id: string) {
        await this.api.delete(`/coupons/${id}`);
    }

    async validateCoupon(code: string, amount: number) {
        const res = await this.api.get<any>(`/coupons/validate`, { code, amount });
        return res.data;
    }
}
