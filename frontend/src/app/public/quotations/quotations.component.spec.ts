import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QuotationsComponent } from './quotations.component';
import { ProductService } from '../../core/services/api/product.service';
import { CartService } from '../../core/store/cart.service';
import { QuotationService } from '../../core/services/api/quotation.service';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { mockProductService, mockCartService, mockActivatedRoute } from '../../core/testing/mocks';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('QuotationsComponent', () => {
  let component: QuotationsComponent;
  let fixture: ComponentFixture<QuotationsComponent>;
  let quotationServiceSpy: jasmine.SpyObj<QuotationService>;
  let router: Router;

  beforeEach(async () => {
    const qSpy = jasmine.createSpyObj('QuotationService', ['createRequest']);

    await TestBed.configureTestingModule({
      imports: [QuotationsComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService },
        { provide: QuotationService, useValue: qSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuotationsComponent);
    component = fixture.componentInstance;
    quotationServiceSpy = TestBed.inject(QuotationService) as jasmine.SpyObj<QuotationService>;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit form and redirect', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    quotationServiceSpy.createRequest.and.returnValue(Promise.resolve({ id: '1' } as any));
    spyOn(window, 'alert');

    component.quoteForm = {
      name: 'Test',
      email: 'test@test.com',
      phone: '1234567890',
      productName: 'P1',
      message: 'Hello'
    };

    component.onSubmit();
    tick();

    expect(quotationServiceSpy.createRequest).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  }));
});
