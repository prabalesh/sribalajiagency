import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import { FormsModule } from '@angular/forms';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit contact form and reset', () => {
    spyOn(window, 'alert');
    component.contactForm = { name: 'Test', email: 't@t.com', subject: 'Sub', message: 'Msg' };
    component.onSubmit();

    expect(window.alert).toHaveBeenCalled();
    expect(component.contactForm.name).toBe('');
  });
});
