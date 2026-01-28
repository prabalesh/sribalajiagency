import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrandsComponent } from './brands.component';
import { BrandService } from '../../core/services/api/brand.service';
import { FormsModule } from '@angular/forms';

describe('BrandsComponent', () => {
  let component: BrandsComponent;
  let fixture: ComponentFixture<BrandsComponent>;
  let brandServiceSpy: jasmine.SpyObj<BrandService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('BrandService', ['getBrands', 'addBrand', 'updateBrand', 'deleteBrand', 'uploadBrandImage']);

    await TestBed.configureTestingModule({
      imports: [BrandsComponent, FormsModule],
      providers: [
        { provide: BrandService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandsComponent);
    component = fixture.componentInstance;
    brandServiceSpy = TestBed.inject(BrandService) as jasmine.SpyObj<BrandService>;

    brandServiceSpy.getBrands.and.returnValue(Promise.resolve([]));
    brandServiceSpy.addBrand.and.returnValue(Promise.resolve({ id: 'b1', name: 'B1' } as any));
    brandServiceSpy.updateBrand.and.returnValue(Promise.resolve({ id: 'b1', name: 'Updated' } as any));
    brandServiceSpy.deleteBrand.and.returnValue(Promise.resolve());
    brandServiceSpy.uploadBrandImage.and.returnValue(Promise.resolve({ id: 'b1', name: 'B1', image: 'img.png' } as any));

    fixture.detectChanges();
  });

  it('should create and load brands', fakeAsync(() => {
    tick();
    expect(brandServiceSpy.getBrands).toHaveBeenCalled();
  }));

  it('should add a new brand', fakeAsync(() => {
    component.newBrand = { name: 'New' } as any;
    component.addBrand();
    tick();
    expect(brandServiceSpy.addBrand).toHaveBeenCalled();
    expect(component.brands.length).toBe(1);
  }));

  it('should update an existing brand', fakeAsync(() => {
    component.brands = [{ id: 'b1', name: 'Old' }] as any;
    component.newBrand = { id: 'b1', name: 'Updated' } as any;
    component.isEditing = true;

    component.addBrand();
    tick();
    expect(brandServiceSpy.updateBrand).toHaveBeenCalled();
    expect(component.brands[0].name).toBe('Updated');
  }));

  it('should handle image upload if file selected', fakeAsync(() => {
    component.newBrand = { name: 'Brand' } as any;
    component.selectedFile = new File([''], 'test.png');

    component.addBrand();
    tick();
    expect(brandServiceSpy.uploadBrandImage).toHaveBeenCalled();
  }));

  it('should delete brand after confirm', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.brands = [{ id: 'b1', name: 'B1' }] as any;
    component.deleteBrand('b1');
    tick();
    expect(brandServiceSpy.deleteBrand).toHaveBeenCalledWith('b1');
    expect(component.brands.length).toBe(0);
  }));
});
