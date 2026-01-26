import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { OrderService } from '../../core/services/api/order.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('OrderService', ['getMyOrders']);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        { provide: OrderService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    orderServiceSpy = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    orderServiceSpy.getMyOrders.and.returnValue(Promise.resolve([{ id: 'o1' } as any]));

    fixture.detectChanges();
  });

  it('should create and load orders', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.orders.length).toBe(1);
    expect(orderServiceSpy.getMyOrders).toHaveBeenCalled();
  }));
});
