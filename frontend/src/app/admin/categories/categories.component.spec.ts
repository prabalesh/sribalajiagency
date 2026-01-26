import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CategoriesComponent } from './categories.component';
import { ProductService } from '../../core/services/api/product.service';
import { FormsModule } from '@angular/forms';
import { mockProductService } from '../../core/testing/mocks';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let productServiceSpy: any;

  beforeEach(async () => {
    productServiceSpy = {
      ...mockProductService,
      getCategories: jasmine.createSpy().and.returnValue(Promise.resolve([])),
      addCategory: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'c1', name: 'C1' })),
      updateCategory: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'c1', name: 'Updated' })),
      deleteCategory: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load categories on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(productServiceSpy.getCategories).toHaveBeenCalled();
  }));

  it('should generate slug from name', () => {
    component.newCategory.name = 'Test Category 123';
    component.generateSlug();
    expect(component.newCategory.slug).toBe('test-category-123');
  });

  it('should add a new category', fakeAsync(() => {
    component.newCategory = { name: 'Cat', slug: 'cat' };
    component.addCategory();
    tick();
    expect(productServiceSpy.addCategory).toHaveBeenCalled();
  }));

  it('should update an existing category', fakeAsync(() => {
    component.newCategory = { id: 'c1', name: 'Cat', slug: 'cat' } as any;
    component.isEditing = true;
    component.addCategory();
    tick();
    expect(productServiceSpy.updateCategory).toHaveBeenCalled();
  }));

  it('should delete category after confirm', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteCategory('c1');
    tick();
    expect(productServiceSpy.deleteCategory).toHaveBeenCalledWith('c1');
  }));
});
