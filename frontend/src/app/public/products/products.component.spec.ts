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
    { id: '1', name: 'Product 1', price: 100, images: [{ url: '1' }], categoryId: 'cat1', brandId: 'b1' },
    { id: '2', name: 'Product 2', price: 200, images: [{ url: '2' }], categoryId: 'cat2', brandId: 'b2' }
  ] as any;

  const mockPaginatedResponse = {
    items: mockProducts,
    total: 2,
    page: 1,
    limit: 12
  };

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Category 1', slug: 'category-1' }
  ] as any;

  async function setupTests(params: any = {}) {
    const pSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
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

    productServiceSpy.getProducts.and.returnValue(Promise.resolve(mockPaginatedResponse));
    categoryServiceSpy.getCategories.and.returnValue(Promise.resolve(mockCategories));
    categoryServiceSpy.getCategoryBySlug.and.returnValue(Promise.resolve(mockCategories[0]));
  }

  describe('General', () => {
    beforeEach(async () => {
      await setupTests({});
      fixture = TestBed.createComponent(ProductsComponent);
      component = fixture.componentInstance;
    });

    it('should load products on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(productServiceSpy.getProducts).toHaveBeenCalled();
      expect(component.products.length).toBe(2);
      expect(component.totalItems).toBe(2);
    }));

    it('should append products on scroll if has more', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.hasMore = true;
      component.currentPage = 2;
      productServiceSpy.getProducts.and.returnValue(Promise.resolve({
        items: [{ id: '3', name: 'P3' } as any],
        total: 3,
        page: 2,
        limit: 12
      }));

      component.loadProducts(undefined);
      tick();

      expect(component.products.length).toBe(3);
      expect(component.hasMore).toBe(false);
    }));
  });
});
