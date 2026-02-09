import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Feedback } from '../../core/models/feedback.model';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {
  feedbacks: Feedback[] = [];

  toggleApproval(feedback: Feedback) {
    feedback.isApproved = !feedback.isApproved;
  }

  deleteFeedback(id: string) {
    if (confirm('Delete this feedback?')) {
      this.feedbacks = this.feedbacks.filter(f => f.id !== id);
    }
  }
}
