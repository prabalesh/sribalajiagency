import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../core/services/api/coupon.service';
import { Coupon } from '../../core/models/coupon.model';

@Component({
    selector: 'app-admin-coupons',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './coupons.component.html',
    styleUrl: './coupons.component.scss'
})
export class CouponsComponent implements OnInit {
    private couponService = inject(CouponService);

    coupons: Coupon[] = [];
    newCoupon: any = this.getEmptyCoupon();
    isEditing = false;

    async ngOnInit() {
        this.loadCoupons();
    }

    async loadCoupons() {
        this.coupons = await this.couponService.getCoupons();
    }

    async saveCoupon() {
        if (this.newCoupon.name && this.newCoupon.code) {
            if (this.isEditing) {
                await this.couponService.updateCoupon(this.newCoupon);
            } else {
                await this.couponService.addCoupon(this.newCoupon);
            }
            this.resetForm();
            this.loadCoupons();
        }
    }

    editCoupon(coupon: Coupon) {
        this.newCoupon = { ...coupon };
        this.isEditing = true;
    }

    async deleteCoupon(id: string) {
        if (confirm('Delete this coupon?')) {
            await this.couponService.deleteCoupon(id);
            this.loadCoupons();
        }
    }

    resetForm() {
        this.newCoupon = this.getEmptyCoupon();
        this.isEditing = false;
    }

    getEmptyCoupon() {
        return {
            name: '',
            code: '',
            discountType: 'percentage',
            discountValue: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
            minOrderAmount: 0
        };
    }
}
