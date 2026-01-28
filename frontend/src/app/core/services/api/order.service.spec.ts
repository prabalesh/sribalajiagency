import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';
import { ApiService } from '../../api/api.service';
import { Order } from '../../models/order.model';

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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create an order', async () => {
        const items = [{ productId: '1', quantity: 2 }];
        const mockOrder = { id: 'o1' } as any;
        apiServiceSpy.post.and.returnValue(Promise.resolve({ data: mockOrder } as any));

        const res = await service.createOrder(items);
        expect(res).toEqual(mockOrder);
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/orders', { items });
    });

    it('should fetch my orders', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.getMyOrders();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/orders/my');
    });

    it('should fetch all orders', async () => {
        apiServiceSpy.get.and.returnValue(Promise.resolve({ data: [] } as any));
        await service.getAllOrders();
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/orders');
    });

    it('should update order status', async () => {
        apiServiceSpy.patch.and.returnValue(Promise.resolve({ data: {} } as any));
        await service.updateOrderStatus('o1', 'Shipped');
        expect(apiServiceSpy.patch).toHaveBeenCalledWith('/orders/o1/status', { status: 'Shipped' });
    });
});
