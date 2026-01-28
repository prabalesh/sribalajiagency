import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CartService } from '../../core/store/cart.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Product } from '../../core/models/product.model';

describe('ProductDetailComponent', () => {
    let component: ProductDetailComponent;
    let fixture: ComponentFixture<ProductDetailComponent>;
    let productServiceSpy: jasmine.SpyObj<ProductService>;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let brandServiceSpy: jasmine.SpyObj<BrandService>;
    let cartServiceSpy: jasmine.SpyObj<CartService>;

    const mockProduct: Product = {
        id: '1',
        name: 'P1',
        price: 100,
        stock: 10,
        categoryId: 'cat1',
        brandId: 'b1',
        images: [{ url: '1' }]
    } as any;

    beforeEach(async () => {
        const pSpy = jasmine.createSpyObj('ProductService', ['getProductById', 'getProductsByCategory']);
        const cSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);
        const bSpy = jasmine.createSpyObj('BrandService', ['getBrandById']);
        const cartSpy = jasmine.createSpyObj('CartService', ['addToCart']);

        await TestBed.configureTestingModule({
            imports: [ProductDetailComponent],
            providers: [
                { provide: ProductService, useValue: pSpy },
                { provide: CategoryService, useValue: cSpy },
                { provide: BrandService, useValue: bSpy },
                { provide: CartService, useValue: cartSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(convertToParamMap({ id: '1' }))
                    }
                }
            ]
        }).compileComponents();

        productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
        categoryServiceSpy = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
        brandServiceSpy = TestBed.inject(BrandService) as jasmine.SpyObj<BrandService>;
        cartServiceSpy = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;

        productServiceSpy.getProductById.and.returnValue(Promise.resolve(mockProduct));
        productServiceSpy.getProductsByCategory.and.returnValue(Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }));
        categoryServiceSpy.getCategories.and.returnValue(Promise.resolve([{ id: 'cat1', name: 'C1' } as any]));
        brandServiceSpy.getBrandById.and.returnValue(Promise.resolve({ id: 'b1', name: 'B1' } as any));
    });

    it('should create', () => {
        fixture = TestBed.createComponent(ProductDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should load product detail on init', fakeAsync(() => {
        fixture = TestBed.createComponent(ProductDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        tick();

        expect(productServiceSpy.getProductById).toHaveBeenCalledWith('1');
        expect(component.product?.name).toBe('P1');
    }));
});
