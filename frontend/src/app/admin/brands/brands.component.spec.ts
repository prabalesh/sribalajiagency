import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrandsComponent } from './brands.component';
import { ProductService } from '../../core/services/api/product.service';
import { FormsModule } from '@angular/forms';
import { mockProductService } from '../../core/testing/mocks';

describe('BrandsComponent', () => {
  let component: BrandsComponent;
  let fixture: ComponentFixture<BrandsComponent>;
  let productServiceSpy: any;

  beforeEach(async () => {
    productServiceSpy = {
      ...mockProductService,
      getBrands: jasmine.createSpy().and.returnValue(Promise.resolve([])),
      addBrand: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'b1', name: 'B1' })),
      updateBrand: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'b1', name: 'Updated' })),
      deleteBrand: jasmine.createSpy().and.returnValue(Promise.resolve()),
      uploadBrandImage: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'b1', name: 'B1', image: 'img.png' }))
    };

    await TestBed.configureTestingModule({
      imports: [BrandsComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load brands', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(productServiceSpy.getBrands).toHaveBeenCalled();
  }));

  it('should add a new brand', fakeAsync(() => {
    component.newBrand = { name: 'New' } as any;
    component.addBrand();
    tick();
    expect(productServiceSpy.addBrand).toHaveBeenCalled();
    expect(component.brands.length).toBe(1);
  }));

  it('should update an existing brand', fakeAsync(() => {
    component.brands = [{ id: 'b1', name: 'Old' }];
    component.newBrand = { id: 'b1', name: 'Updated' } as any;
    component.isEditing = true;

    component.addBrand();
    tick();
    expect(productServiceSpy.updateBrand).toHaveBeenCalled();
    expect(component.brands[0].name).toBe('Updated');
  }));

  it('should handle image upload if file selected', fakeAsync(() => {
    component.newBrand = { name: 'Brand' } as any;
    component.selectedFile = new File([''], 'test.png');

    component.addBrand();
    tick();
    expect(productServiceSpy.uploadBrandImage).toHaveBeenCalled();
  }));

  it('should delete brand after confirm', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.brands = [{ id: 'b1', name: 'B1' }];
    component.deleteBrand('b1');
    tick();
    expect(productServiceSpy.deleteBrand).toHaveBeenCalledWith('b1');
    expect(component.brands.length).toBe(0);
  }));
});
