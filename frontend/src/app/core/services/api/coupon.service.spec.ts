import { TestBed } from '@angular/core/testing';
import { CouponService } from './coupon.service';
import { ApiService } from '../api/api.service';

describe('CouponService', () => {
    let service: CouponService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
        TestBed.configureTestingModule({
            providers: [
                CouponService,
                { provide: ApiService, useValue: spy }
            ]
        });
        service = TestBed.inject(CouponService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should validate coupon', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: { valid: true } } as any));
        const res = await service.validateCoupon('SAVE10', 1000);
        expect(res.valid).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/coupons/validate', { code: 'SAVE10', amount: 1000 });
    });
});
