import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { ProductService } from '../../core/services/api/product.service';
import { CartService } from '../../core/store/cart.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('CartComponent', () => {
    let component: CartComponent;
    let fixture: ComponentFixture<CartComponent>;
    let productServiceSpy: jasmine.SpyObj<ProductService>;
    let cartServiceSpy: any;

    beforeEach(async () => {
        const pSpy = jasmine.createSpyObj('ProductService', ['getStoreSettings']);
        cartServiceSpy = {
            items: signal([]),
            count: signal(0),
            total: signal(0),
            updateQuantity: jasmine.createSpy(),
            removeFromCart: jasmine.createSpy(),
            clearCart: jasmine.createSpy()
        };

        await TestBed.configureTestingModule({
            imports: [CartComponent],
            providers: [
                { provide: ProductService, useValue: pSpy },
                { provide: CartService, useValue: cartServiceSpy },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CartComponent);
        component = fixture.componentInstance;
        productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load settings on init', async () => {
        const mockSettings = { allowOnline: true, allowCod: true };
        productServiceSpy.getStoreSettings.and.returnValue(Promise.resolve(mockSettings));

        await component.ngOnInit();
        expect(component.settings).toEqual(mockSettings);
        expect(productServiceSpy.getStoreSettings).toHaveBeenCalled();
    });

    it('should calculate allowed methods correctly', async () => {
        component.settings = { allowOnline: true, allowCod: true };

        // No items in cart
        expect(component.allowedMethods).toEqual(['online', 'cod']);

        // Item with online only
        cartServiceSpy.items.set([{ product: { allowedPaymentMethods: ['online'] } as any, quantity: 1 }]);
        expect(component.allowedMethods).toEqual(['online']);

        // Item with cod only
        cartServiceSpy.items.set([{ product: { allowedPaymentMethods: ['cod'] } as any, quantity: 1 }]);
        expect(component.allowedMethods).toEqual(['cod']);

        // Mixed items (no common method)
        cartServiceSpy.items.set([
            { product: { allowedPaymentMethods: ['online'] } as any, quantity: 1 },
            { product: { allowedPaymentMethods: ['cod'] } as any, quantity: 1 }
        ]);
        expect(component.allowedMethods).toEqual([]);
    });

    it('should proceed to checkout if methods available', async () => {
        component.settings = { allowOnline: true };
        await component.proceedToCheckout();
        expect(component.isCheckoutMode).toBeTrue();
    });

    it('should not proceed to checkout if no common methods', async () => {
        spyOn(window, 'alert');
        component.settings = { allowOnline: false, allowCod: false };
        await component.proceedToCheckout();
        expect(component.isCheckoutMode).toBeFalse();
        expect(window.alert).toHaveBeenCalled();
    });

    it('should finalize order and clear cart', async () => {
        spyOn(window, 'alert');
        component.selectedPayment = 'online';
        component.isCheckoutMode = true;

        await component.finalizeOrder();

        expect(cartServiceSpy.clearCart).toHaveBeenCalled();
        expect(component.isCheckoutMode).toBeFalse();
        expect(window.alert).toHaveBeenCalled();
    });
});
