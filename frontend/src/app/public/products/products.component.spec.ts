import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { CartService } from '../../core/store/cart.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  const mockProducts: Product[] = [
    { id: '1', name: 'Product 1', price: 100, originalPrice: 150, images: [{ url: '1' }], categoryId: 'cat1', brandId: 'b1', description: '', isAvailable: true, variants: [], stock: 10, isFeatured: false, isShowcaseOnly: false },
    { id: '2', name: 'Product 2', price: 200, images: [{ url: '2' }], categoryId: 'cat2', brandId: 'b2', description: '', isAvailable: true, variants: [], stock: 5, isFeatured: true, isShowcaseOnly: false }
  ] as any;

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat2', name: 'Category 2', slug: 'category-2' }
  ] as any;

  async function setupTests(params: any = {}) {
    const pSpy = jasmine.createSpyObj('ProductService', ['getProducts', 'getProductsByCategory']);
    const cSpy = jasmine.createSpyObj('CategoryService', ['getCategories', 'getCategoryBySlug']);
    const crtSpy = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        { provide: ProductService, useValue: pSpy },
        { provide: CategoryService, useValue: cSpy },
        { provide: CartService, useValue: crtSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(params))
          }
        }
      ]
    }).compileComponents();

    productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    categoryServiceSpy = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    cartServiceSpy = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;

    productServiceSpy.getProducts.and.returnValue(Promise.resolve(mockProducts));
    productServiceSpy.getProductsByCategory.and.returnValue(Promise.resolve([mockProducts[0]]));
    categoryServiceSpy.getCategories.and.returnValue(Promise.resolve(mockCategories));
    categoryServiceSpy.getCategoryBySlug.and.returnValue(Promise.resolve(mockCategories[0]));
  }

  describe('General', () => {
    beforeEach(async () => {
      await setupTests({});
      fixture = TestBed.createComponent(ProductsComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load all products if no category slug is provided', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      tick();
      expect(productServiceSpy.getProducts).toHaveBeenCalled();
      expect(component.products).toEqual(mockProducts);
    }));

    it('should add product to cart and prevent event propagation', () => {
      fixture.detectChanges();
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      const product = mockProducts[0];
      component.addToCart(product, mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(cartServiceSpy.addToCart).toHaveBeenCalledWith(product);
    });
  });

  describe('With Category', () => {
    beforeEach(async () => {
      await setupTests({ category: 'category-1' });
      fixture = TestBed.createComponent(ProductsComponent);
      component = fixture.componentInstance;
    });

    it('should load category-specific products if category slug is provided', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      tick();
      tick();
      expect(categoryServiceSpy.getCategoryBySlug).toHaveBeenCalledWith('category-1');
      expect(productServiceSpy.getProductsByCategory).toHaveBeenCalledWith('cat1');
      expect(component.products).toEqual([mockProducts[0]]);
      expect(component.currentCategory).toEqual(mockCategories[0]);
    }));
  });
});
