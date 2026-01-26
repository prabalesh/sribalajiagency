import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackComponent } from './feedback.component';

describe('FeedbackComponent', () => {
  let component: FeedbackComponent;
  let fixture: ComponentFixture<FeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.feedbacks.length).toBe(2);
  });

  it('should toggle approval state', () => {
    const feedback = component.feedbacks[1]; // Initially false
    component.toggleApproval(feedback);
    expect(feedback.isApproved).toBeTrue();
    component.toggleApproval(feedback);
    expect(feedback.isApproved).toBeFalse();
  });

  it('should delete feedback after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteFeedback('1');
    expect(component.feedbacks.length).toBe(1);
    expect(component.feedbacks[0].id).toBe('2');
  });

  it('should not delete feedback if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteFeedback('1');
    expect(component.feedbacks.length).toBe(2);
  });
});
