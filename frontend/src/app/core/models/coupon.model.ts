export interface Coupon {
    id: string;
    name: string;
    code: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    minOrderAmount: number;
    maxDiscountAmount?: number;
}
