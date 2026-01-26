import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelsComponent } from './models.component';
import { FormsModule } from '@angular/forms';

describe('ModelsComponent', () => {
  let component: ModelsComponent;
  let fixture: ComponentFixture<ModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelsComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.models.length).toBe(2);
  });

  it('should add a model', () => {
    component.newModel = { id: '', name: 'New Model', brandId: '1' };
    component.addModel();
    expect(component.models.length).toBe(3);
    expect(component.models[2].name).toBe('New Model');
    expect(component.newModel.name).toBe(''); // Reset check
  });

  it('should not add model if name or brandId is missing', () => {
    component.newModel = { id: '', name: '', brandId: '1' };
    component.addModel();
    expect(component.models.length).toBe(2);
  });

  it('should delete a model', () => {
    component.deleteModel('1');
    expect(component.models.length).toBe(1);
    expect(component.models[0].id).toBe('2');
  });
});
