import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { CartService } from '../../core/store/cart.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let productService: jasmine.SpyObj<ProductService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let cartService: jasmine.SpyObj<CartService>;

  const mockProducts: Product[] = [
    { id: '1', name: 'Product 1', price: 100, originalPrice: 150, images: [], categoryId: 'cat1', brandId: 'b1', description: '', isAvailable: true, variants: [], stock: 10, isFeatured: false, isShowcaseOnly: false },
    { id: '2', name: 'Product 2', price: 200, images: [], categoryId: 'cat2', brandId: 'b2', description: '', isAvailable: true, variants: [], stock: 5, isFeatured: true, isShowcaseOnly: false }
  ] as any;

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat2', name: 'Category 2', slug: 'category-2' }
  ] as any;

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', ['getProducts', 'getProductsByCategory']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories', 'getCategoryBySlug']);
    const cartServiceSpy = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        },
        provideRouter([])
      ]
    }).compileComponents();

    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;

    productService.getProducts.and.returnValue(Promise.resolve(mockProducts));
    productService.getProductsByCategory.and.returnValue(Promise.resolve([mockProducts[0]]));
    categoryService.getCategories.and.returnValue(Promise.resolve(mockCategories));
    categoryService.getCategoryBySlug.and.returnValue(Promise.resolve(mockCategories[0]));
  });

  function createComponent() {
    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should load all products if no category slug is provided', fakeAsync(() => {
    createComponent();
    tick();
    expect(productService.getProducts).toHaveBeenCalled();
    expect(component.products).toEqual(mockProducts);
    expect(component.currentCategory).toBeUndefined();
  }));

  it('should load category-specific products if category slug is provided', fakeAsync(() => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'category' ? 'category-1' : null });

    createComponent();
    tick();

    expect(categoryService.getCategoryBySlug).toHaveBeenCalledWith('category-1');
    expect(productService.getProductsByCategory).toHaveBeenCalledWith('cat1');
    expect(component.products).toEqual([mockProducts[0]]);
    expect(component.currentCategory).toEqual(mockCategories[0]);
  }));

  it('should load all categories for the sidebar', fakeAsync(() => {
    createComponent();
    tick();
    expect(categoryService.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
  }));

  it('should add product to cart and prevent event propagation', () => {
    createComponent();
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    const product = mockProducts[0];

    component.addToCart(product, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(cartService.addToCart).toHaveBeenCalledWith(product);
  });
});
