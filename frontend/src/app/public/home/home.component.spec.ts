import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ProductService } from '../../core/services/api/product.service';
import { CategoryService } from '../../core/services/api/category.service';
import { BrandService } from '../../core/services/api/brand.service';
import { CmsService } from '../../core/services/api/cms.service';
import { CartService } from '../../core/store/cart.service';
import { provideRouter } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let brandServiceSpy: jasmine.SpyObj<BrandService>;
  let cmsServiceSpy: jasmine.SpyObj<CmsService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  beforeEach(async () => {
    const pSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
    const catSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);
    const bSpy = jasmine.createSpyObj('BrandService', ['getBrands']);
    const cmsSpy = jasmine.createSpyObj('CmsService', ['getHomeCMS']);
    const cartSpy = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ProductService, useValue: pSpy },
        { provide: CategoryService, useValue: catSpy },
        { provide: BrandService, useValue: bSpy },
        { provide: CmsService, useValue: cmsSpy },
        { provide: CartService, useValue: cartSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    categoryServiceSpy = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    brandServiceSpy = TestBed.inject(BrandService) as jasmine.SpyObj<BrandService>;
    cmsServiceSpy = TestBed.inject(CmsService) as jasmine.SpyObj<CmsService>;
    cartServiceSpy = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', async () => {
    const mockCats = [{ id: 'c1' } as any];
    const mockBrands = [{ id: 'b1' } as any];
    const mockCMS = { heroSlides: [{ image: '1' }] };
    const mockProds = [{ id: 'p1' } as any];

    categoryServiceSpy.getCategories.and.returnValue(Promise.resolve(mockCats));
    brandServiceSpy.getBrands.and.returnValue(Promise.resolve(mockBrands));
    cmsServiceSpy.getHomeCMS.and.returnValue(Promise.resolve(mockCMS));
    productServiceSpy.getProducts.and.returnValue(Promise.resolve(mockProds));

    await component.ngOnInit();

    expect(component.categories).toBe(mockCats);
    expect(component.brands).toBe(mockBrands);
    expect(component.cms).toBe(mockCMS);
    expect(component.featuredProducts.length).toBe(1);
  });

  it('should navigate carousel slides', () => {
    component.cms = { heroSlides: [{}, {}, {}] };
    component.currentSlideIndex = 0;

    component.nextSlide();
    expect(component.currentSlideIndex).toBe(1);

    component.nextSlide();
    expect(component.currentSlideIndex).toBe(2);

    component.nextSlide();
    expect(component.currentSlideIndex).toBe(0); // Wrap around

    component.prevSlide();
    expect(component.currentSlideIndex).toBe(2); // Wrap around back
  });

  it('should add to cart and stop propagation', () => {
    const mockProd = { id: 'p1' } as any;
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);

    component.addToCart(mockProd, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(cartServiceSpy.addToCart).toHaveBeenCalledWith(mockProd);
  });
});
