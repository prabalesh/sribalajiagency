import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {
  feedbackForm = {
    name: '',
    rating: 5,
    comment: ''
  };

  recentFeedbacks = [
    { name: 'John Doe', rating: 5, comment: 'Excellent service and quality tools!' },
    { name: 'Jane Smith', rating: 4, comment: 'Good delivery speed, satisfied with product.' }
  ];

  onSubmit() {
    console.log('Feedback Submitted', this.feedbackForm);
    alert('Thank you for your feedback!');
    this.recentFeedbacks.unshift({ ...this.feedbackForm }); // Optimistic update
    this.feedbackForm = { name: '', rating: 5, comment: '' };
  }
}
