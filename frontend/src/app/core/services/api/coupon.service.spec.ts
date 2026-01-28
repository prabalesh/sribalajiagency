import { TestBed } from '@angular/core/testing';
import { CouponService } from './coupon.service';
import { ApiService } from '../../api/api.service';
import { Coupon } from '../../models/coupon.model';

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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch coupons', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.getCoupons();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/coupons');
    });

    it('should add a coupon', async () => {
        const dto = { code: 'SAVE10' };
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.addCoupon(dto);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/coupons', dto);
    });

    it('should validate a coupon', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: { valid: true } } as any));
        const res = await service.validateCoupon('SAVE10', 1000);
        expect(res.valid).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/coupons/validate', { code: 'SAVE10', amount: 1000 });
    });

    it('should delete a coupon', async () => {
        apiServiceSpy.delete.and.returnValue(Promise.resolve({} as any));
        await service.deleteCoupon('c1');
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/coupons/c1');
    });
});
