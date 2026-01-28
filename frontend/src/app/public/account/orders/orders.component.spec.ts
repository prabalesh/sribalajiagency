import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrdersComponent } from './orders.component';
import { OrderService } from '../../../core/services/api/order.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { mockAuthService } from '../../../core/testing/mocks';
import { provideRouter } from '@angular/router';

describe('OrdersComponent', () => {
    let component: OrdersComponent;
    let fixture: ComponentFixture<OrdersComponent>;
    let orderServiceSpy: jasmine.SpyObj<OrderService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('OrderService', ['getMyOrders']);

        await TestBed.configureTestingModule({
            imports: [OrdersComponent],
            providers: [
                { provide: OrderService, useValue: spy },
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OrdersComponent);
        component = fixture.componentInstance;
        orderServiceSpy = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
        orderServiceSpy.getMyOrders.and.returnValue(Promise.resolve([]));

        fixture.detectChanges();
    });

    it('should create and load orders', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(orderServiceSpy.getMyOrders).toHaveBeenCalled();
    }));
});
