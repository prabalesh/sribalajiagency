import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandComponent } from './brand.component';
import { BrandService } from '../../core/services/api/brand.service';
import { provideRouter } from '@angular/router';
import { Brand } from '../../core/models/brand.model';

describe('BrandComponent', () => {
  let component: BrandComponent;
  let fixture: ComponentFixture<BrandComponent>;
  let mockBrandService: jasmine.SpyObj<BrandService>;

  const mockBrands: Brand[] = [
    {
      id: '1',
      name: 'Nike',
      slug: 'nike',
      description: 'Athletic footwear and apparel',
      image: 'nike.jpg'
    },
    {
      id: '2',
      name: 'Adidas',
      slug: 'adidas',
      description: 'Sports brand',
      image: undefined
    }
  ];

  beforeEach(async () => {
    // Create a spy object for BrandService with getBrands method
    mockBrandService = jasmine.createSpyObj('BrandService', ['getBrands']);

    await TestBed.configureTestingModule({
      imports: [BrandComponent],
      providers: [
        { provide: BrandService, useValue: mockBrandService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty brands array and loading false', () => {
    expect(component.brands()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should have 6 skeleton items for loading state', () => {
    expect(component.skeletonItems.length).toBe(6);
  });

  describe('ngOnInit', () => {
    it('should load brands successfully', async () => {
      mockBrandService.getBrands.and.returnValue(Promise.resolve(mockBrands));

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
      expect(component.brands()).toEqual(mockBrands);
      expect(component.error()).toBeNull();
      expect(mockBrandService.getBrands).toHaveBeenCalledTimes(1);
    });

    it('should set loading to true during data fetch', () => {
      mockBrandService.getBrands.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockBrands), 100))
      );

      component.ngOnInit();

      expect(component.loading()).toBe(true);
    });

    it('should handle error when loading brands fails', async () => {
      const errorMessage = 'Network error';
      mockBrandService.getBrands.and.returnValue(Promise.reject(errorMessage));
      spyOn(console, 'error');

      await component.ngOnInit();

      expect(component.loading()).toBe(false);
      expect(component.brands()).toEqual([]);
      expect(component.error()).toBe('Failed to load brands. Please try again later.');
      expect(console.error).toHaveBeenCalledWith('Error loading brands:', errorMessage);
    });

    it('should clear previous error on retry', async () => {
      component.error.set('Previous error');
      mockBrandService.getBrands.and.returnValue(Promise.resolve(mockBrands));

      await component.ngOnInit();

      expect(component.error()).toBeNull();
      expect(component.brands()).toEqual(mockBrands);
    });
  });

  describe('Template rendering', () => {
    it('should display skeleton cards when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const skeletonCards = fixture.nativeElement.querySelectorAll('.skeleton-card');
      expect(skeletonCards.length).toBe(6);
    });

    it('should display error message when error occurs', () => {
      component.loading.set(false);
      component.error.set('Failed to load brands. Please try again later.');
      fixture.detectChanges();

      const errorState = fixture.nativeElement.querySelector('.error-state');
      expect(errorState).toBeTruthy();
      expect(errorState.textContent).toContain('Failed to load brands');
    });

    it('should display brand cards when brands are loaded', () => {
      component.loading.set(false);
      component.brands.set(mockBrands);
      fixture.detectChanges();

      const brandCards = fixture.nativeElement.querySelectorAll('.brand-card:not(.skeleton-card)');
      expect(brandCards.length).toBe(2);
    });

    it('should display empty state when no brands available', () => {
      component.loading.set(false);
      component.brands.set([]);
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No brands available');
    });

    it('should render brand name and description correctly', () => {
      component.loading.set(false);
      component.brands.set(mockBrands);
      fixture.detectChanges();

      const brandCards = fixture.nativeElement.querySelectorAll('.brand-card');
      const firstCard = brandCards[0];

      expect(firstCard.querySelector('h3').textContent).toContain('Nike');
      expect(firstCard.querySelector('p').textContent).toContain('Athletic footwear');
    });

    it('should display brand placeholder when no image is provided', () => {
      component.loading.set(false);
      component.brands.set([mockBrands[1]]); // Adidas has no image
      fixture.detectChanges();

      const placeholder = fixture.nativeElement.querySelector('.brand-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent).toContain('A'); // First character of 'Adidas'
    });

    it('should have clickable brand cards with correct routing', () => {
      component.loading.set(false);
      component.brands.set(mockBrands);
      fixture.detectChanges();

      const firstCard = fixture.nativeElement.querySelector('.brand-card');
      expect(firstCard.classList.contains('clickable')).toBe(true);
    });
  });
});
