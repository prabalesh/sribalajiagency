import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../core/services/api/product.service';
import { CartService } from '../../core/store/cart.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { mockProductService, mockCartService, mockActivatedRoute } from '../../core/testing/mocks';

describe('ProductDetailComponent', () => {
    let component: ProductDetailComponent;
    let fixture: ComponentFixture<ProductDetailComponent>;
    let productServiceSpy: any;

    beforeEach(async () => {
        productServiceSpy = {
            ...mockProductService,
            getProductById: jasmine.createSpy('getProductById').and.returnValue(Promise.resolve({ id: '1', name: 'P1', categoryId: 'c1', brandId: 'b1', stock: 10 })),
            getCategories: jasmine.createSpy('getCategories').and.returnValue(Promise.resolve([{ id: 'c1', name: 'C1' }])),
            getBrandById: jasmine.createSpy('getBrandById').and.returnValue(Promise.resolve({ id: 'b1', name: 'B1' })),
            getProductsByCategory: jasmine.createSpy('getProductsByCategory').and.returnValue(Promise.resolve([]))
        };

        await TestBed.configureTestingModule({
            imports: [ProductDetailComponent],
            providers: [
                { provide: ProductService, useValue: productServiceSpy },
                { provide: CartService, useValue: mockCartService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProductDetailComponent);
        component = fixture.componentInstance;
        // Fix for inject vs provide issue: sometimes direct object injection is needed
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load product on init', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(productServiceSpy.getProductById).toHaveBeenCalled();
        expect(component.product?.name).toBe('P1');
    }));

    it('should update quantity within limits', () => {
        component.product = { id: '1', stock: 5 } as any;
        component.quantity = 1;

        component.updateQuantity(1);
        expect(component.quantity).toBe(2);

        component.updateQuantity(10); // Exceeds stock
        expect(component.quantity).toBe(2);
    });

    it('should add to cart', () => {
        spyOn(mockCartService, 'addToCart');
        component.product = { id: '1' } as any;
        component.addToCart();
        expect(mockCartService.addToCart).toHaveBeenCalled();
    });
});
