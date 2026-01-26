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
  feedbacks: Feedback[] = [
    { id: '1', userName: 'John', rating: 5, comment: 'Great!', isApproved: true, createdAt: new Date() },
    { id: '2', userName: 'Spam Bot', rating: 1, comment: 'Buy crypto...', isApproved: false, createdAt: new Date() }
  ];

  toggleApproval(feedback: Feedback) {
    feedback.isApproved = !feedback.isApproved;
  }

  deleteFeedback(id: string) {
    if (confirm('Delete this feedback?')) {
      this.feedbacks = this.feedbacks.filter(f => f.id !== id);
    }
  }
}
