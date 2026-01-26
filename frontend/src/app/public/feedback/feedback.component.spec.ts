import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackComponent } from './feedback.component';
import { FormsModule } from '@angular/forms';

describe('FeedbackComponent', () => {
  let component: FeedbackComponent;
  let fixture: ComponentFixture<FeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit feedback and show success alert', () => {
    spyOn(window, 'alert');
    component.feedbackForm = { name: 'Admin', rating: 5, comment: 'Great!' };
    component.onSubmit();

    expect(window.alert).toHaveBeenCalledWith('Thank you for your feedback!');
    expect(component.recentFeedbacks[0].name).toBe('Admin');
    expect(component.feedbackForm.name).toBe(''); // Form reset
  });
});
