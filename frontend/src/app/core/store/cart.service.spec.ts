import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { PLATFORM_ID } from '@angular/core';
import { Product } from '../models/models';

describe('CartService', () => {
    let service: CartService;
    const mockProduct: Product = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stock: 10,
        isAvailable: true,
        isShowcaseOnly: false,
        categoryId: 'cat1',
        brandId: 'brand1',
        images: [],
        variants: [],
        isFeatured: false
    };

    const mockShowcaseProduct: Product = {
        ...mockProduct,
        id: '2',
        isShowcaseOnly: true
    };

    beforeEach(() => {
        // Mock localStorage
        const store: { [key: string]: string } = {};
        spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
        spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);
        spyOn(localStorage, 'clear').and.callFake(() => {
            for (const key in store) delete store[key];
        });

        TestBed.configureTestingModule({
            providers: [
                CartService,
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        });
        service = TestBed.inject(CartService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add item to cart', () => {
        service.addToCart(mockProduct, 2);
        expect(service.count()).toBe(2);
        expect(service.items().length).toBe(1);
        expect(service.items()[0].product.id).toBe('1');
        expect(service.items()[0].quantity).toBe(2);
    });

    it('should increment quantity if item already exists in cart', () => {
        service.addToCart(mockProduct, 1);
        service.addToCart(mockProduct, 2);
        expect(service.count()).toBe(3);
        expect(service.items().length).toBe(1);
        expect(service.items()[0].quantity).toBe(3);
    });

    it('should not add showcase only product to cart', () => {
        spyOn(window, 'alert');
        service.addToCart(mockShowcaseProduct, 1);
        expect(service.count()).toBe(0);
        expect(window.alert).toHaveBeenCalledWith('This product is for showcase only and cannot be purchased online.');
    });

    it('should respect stock limits when adding to cart', () => {
        spyOn(window, 'alert');
        service.addToCart(mockProduct, 15); // stock is 10
        expect(service.count()).toBe(0);
        expect(window.alert).toHaveBeenCalled();
    });

    it('should respect max order quantity if set', () => {
        const productWithLimit: Product = { ...mockProduct, maxOrderQuantity: 5 };
        spyOn(window, 'alert');
        service.addToCart(productWithLimit, 6);
        expect(service.count()).toBe(0);
        expect(window.alert).toHaveBeenCalled();
    });

    it('should remove item from cart', () => {
        service.addToCart(mockProduct, 1);
        service.removeFromCart('1');
        expect(service.count()).toBe(0);
    });

    it('should update item quantity', () => {
        service.addToCart(mockProduct, 1);
        service.updateQuantity('1', 5);
        expect(service.items()[0].quantity).toBe(5);
    });

    it('should remove item if quantity set to 0 or less', () => {
        service.addToCart(mockProduct, 1);
        service.updateQuantity('1', 0);
        expect(service.count()).toBe(0);
    });

    it('should calculate correct total price', () => {
        const prod2 = { ...mockProduct, id: '2', price: 50 };
        service.addToCart(mockProduct, 2); // 2 * 100 = 200
        service.addToCart(prod2, 3);       // 3 * 50 = 150
        expect(service.total()).toBe(350);
    });

    it('should clear cart', () => {
        service.addToCart(mockProduct, 5);
        service.clearCart();
        expect(service.count()).toBe(0);
        expect(service.items().length).toBe(0);
    });

    it('should load cart from localStorage on init', () => {
        const savedData = JSON.stringify([{ product: mockProduct, quantity: 4 }]);
        (localStorage.getItem as jasmine.Spy).and.returnValue(savedData);

        // Re-inject service to trigger constructor
        const newService = new CartService('browser' as any);
        expect(newService.count()).toBe(4);
    });
});
