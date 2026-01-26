import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';
import { ApiService } from '../api/api.service';

describe('OrderService', () => {
    let service: OrderService;
    let apiServiceSpy: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch']);
        TestBed.configureTestingModule({
            providers: [
                OrderService,
                { provide: ApiService, useValue: spy }
            ]
        });
        service = TestBed.inject(OrderService);
        apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should create order', async () => {
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { id: 'o1' } } as any));
        const res = await service.createOrder([]);
        expect(res.id).toBe('o1');
    });

    it('should fetch my orders', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [{ id: 'o1' }] } as any));
        const res = await service.getMyOrders();
        expect(res.length).toBe(1);
    });
});
