import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ProductService } from '../../core/services/api/product.service';
import { CartService } from '../../core/store/cart.service';
import { provideRouter } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  beforeEach(async () => {
    const pSpy = jasmine.createSpyObj('ProductService', ['getCategories', 'getBrands', 'getHomeCMS', 'getProducts']);
    const cSpy = jasmine.createSpyObj('CartService', ['addToCart']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ProductService, useValue: pSpy },
        { provide: CartService, useValue: cSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    productServiceSpy = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
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

    productServiceSpy.getCategories.and.returnValue(Promise.resolve(mockCats));
    productServiceSpy.getBrands.and.returnValue(Promise.resolve(mockBrands));
    productServiceSpy.getHomeCMS.and.returnValue(Promise.resolve(mockCMS));
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
