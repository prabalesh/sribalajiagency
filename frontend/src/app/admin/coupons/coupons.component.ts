import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../core/services/api/coupon.service';
import { Coupon } from '../../core/models/coupon.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { 
    LucideAngularModule, 
    Ticket,
    Plus,
    Edit,
    Trash2,
    X,
    Check,
    Calendar,
    Percent,
    IndianRupee,
    Tag,
    Clock,
    AlertCircle,
    Copy,
    TrendingUp
} from 'lucide-angular';

@Component({
    selector: 'app-admin-coupons',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './coupons.component.html',
    styleUrl: './coupons.component.scss'
})
export class CouponsComponent implements OnInit {
    private couponService = inject(CouponService);
    public authService = inject(AuthService);
    private toastService = inject(ToastService);

    // Icon references
    readonly Ticket = Ticket;
    readonly Plus = Plus;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly X = X;
    readonly Check = Check;
    readonly Calendar = Calendar;
    readonly Percent = Percent;
    readonly IndianRupee = IndianRupee;
    readonly Tag = Tag;
    readonly Clock = Clock;
    readonly AlertCircle = AlertCircle;
    readonly Copy = Copy;
    readonly TrendingUp = TrendingUp;

    coupons: Coupon[] = [];
    newCoupon: any = this.getEmptyCoupon();
    isEditing = false;
    isLoading = true;
    isSaving = false;
    isDeleting = false;

    async ngOnInit() {
        await this.loadCoupons();
    }

    async loadCoupons() {
        this.isLoading = true;
        try {
            this.coupons = await this.couponService.getCoupons();
        } catch (error) {
            console.error('Failed to load coupons:', error);
            this.toastService.error('Failed to load coupons');
        } finally {
            this.isLoading = false;
        }
    }

    async saveCoupon() {
        if (!this.newCoupon.name || !this.newCoupon.code) {
            this.toastService.warning('Please fill in all required fields');
            return;
        }

        if (this.newCoupon.discountValue <= 0) {
            this.toastService.warning('Discount value must be greater than 0');
            return;
        }

        if (this.newCoupon.discountType === 'percentage' && this.newCoupon.discountValue > 100) {
            this.toastService.warning('Percentage discount cannot exceed 100%');
            return;
        }

        this.isSaving = true;
        try {
            if (this.isEditing) {
                await this.couponService.updateCoupon(this.newCoupon);
                this.toastService.success('Coupon updated successfully');
            } else {
                await this.couponService.addCoupon(this.newCoupon);
                this.toastService.success('Coupon created successfully');
            }
            this.resetForm();
            await this.loadCoupons();
        } catch (error) {
            console.error('Failed to save coupon:', error);
            this.toastService.error('Failed to save coupon');
        } finally {
            this.isSaving = false;
        }
    }

    editCoupon(coupon: Coupon) {
        this.newCoupon = { 
            ...coupon,
            startDate: new Date(coupon.startDate).toISOString().split('T')[0],
            endDate: new Date(coupon.endDate).toISOString().split('T')[0]
        };
        this.isEditing = true;

        // Scroll to form on mobile
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                document.querySelector('.form-card')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }
    }

    async deleteCoupon(id: string) {
        if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
            return;
        }

        this.isDeleting = true;
        try {
            await this.couponService.deleteCoupon(id);
            this.toastService.success('Coupon deleted successfully');
            await this.loadCoupons();
        } catch (error) {
            console.error('Failed to delete coupon:', error);
            this.toastService.error('Failed to delete coupon');
        } finally {
            this.isDeleting = false;
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

    async copyCouponCode(code: string) {
        try {
            await navigator.clipboard.writeText(code);
            this.toastService.success('Coupon code copied to clipboard');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.toastService.error('Failed to copy coupon code');
        }
    }

    isExpired(endDate: Date): boolean {
        return new Date(endDate) < new Date();
    }

    getActiveCouponsCount(): number {
        return this.coupons.filter(c => c.isActive && !this.isExpired(c.endDate)).length;
    }

    getTotalDiscountValue(): number {
        return this.coupons.reduce((sum, c) => {
            if (c.discountType === 'flat') {
                return sum + c.discountValue;
            }
            return sum;
        }, 0);
    }
}
