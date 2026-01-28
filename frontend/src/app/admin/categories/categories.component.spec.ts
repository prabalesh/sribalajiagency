import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CategoriesComponent } from './categories.component';
import { CategoryService } from '../../core/services/api/category.service';
import { FormsModule } from '@angular/forms';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('CategoryService', ['getCategories', 'addCategory', 'updateCategory', 'deleteCategory']);

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, FormsModule],
      providers: [
        { provide: CategoryService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
    categoryServiceSpy = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    categoryServiceSpy.getCategories.and.returnValue(Promise.resolve([]));
    categoryServiceSpy.addCategory.and.returnValue(Promise.resolve({ id: 'c1', name: 'C1' } as any));
    categoryServiceSpy.updateCategory.and.returnValue(Promise.resolve({ id: 'c1', name: 'Updated' } as any));
    categoryServiceSpy.deleteCategory.and.returnValue(Promise.resolve());

    fixture.detectChanges();
  });

  it('should load categories on init', fakeAsync(() => {
    tick();
    expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
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
    expect(categoryServiceSpy.addCategory).toHaveBeenCalled();
  }));

  it('should update an existing category', fakeAsync(() => {
    component.newCategory = { id: 'c1', name: 'Cat', slug: 'cat' } as any;
    component.isEditing = true;
    component.addCategory();
    tick();
    expect(categoryServiceSpy.updateCategory).toHaveBeenCalled();
  }));

  it('should delete category after confirm', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteCategory('c1');
    tick();
    expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith('c1');
  }));
});
