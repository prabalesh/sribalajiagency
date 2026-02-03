import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent, PaginationComponent],
  template: `
    <div class="reviews-section">
      <div class="reviews-header">
        <div class="header-main">
          <h2>Customer Reviews</h2>
          <div class="rating-summary" *ngIf="totalReviews > 0">
            <app-star-rating [rating]="averageRating" [readonly]="true"></app-star-rating>
            <span class="review-count">({{ totalReviews }} reviews)</span>
          </div>
        </div>
        <button class="btn-primary" *ngIf="isLoggedIn()" (click)="showReviewForm = !showReviewForm">
          {{ showReviewForm ? 'Cancel' : 'Write a Review' }}
        </button>
      </div>

      <!-- Review Form -->
      <div class="review-form-container" *ngIf="showReviewForm && isLoggedIn()">
        <h3>Write your review</h3>
        <div class="rating-input">
          <label>Rating:</label>
          <app-star-rating [rating]="userRating" (ratingChange)="userRating = $event"></app-star-rating>
        </div>
        <div class="comment-input">
          <label>Your Comment:</label>
          <textarea [(ngModel)]="reviewComment" placeholder="Share your experience..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-primary" [disabled]="isReviewSubmitting || userRating === 0" (click)="submitReview()">
            {{ isReviewSubmitting ? 'Submitting...' : 'Post Review' }}
          </button>
        </div>
      </div>

      <!-- Login Prompt -->
      <div class="login-prompt" *ngIf="!isLoggedIn()">
        <p>Please <a href="/login">login</a> to write a review.</p>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list" [class.loading]="isLoading">
        <div *ngIf="isLoading && reviews.length === 0" class="reviews-loading">
          <p>Loading reviews...</p>
        </div>

        <div *ngIf="reviews.length === 0 && !isLoading" class="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>

        <div *ngFor="let review of reviews" class="review-card">
          <div class="review-main">
            <div class="review-info">
              <div class="reviewer-meta">
                <span class="reviewer-name">{{ review.user?.name || 'Anonymous' }}</span>
                <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
              </div>
              <app-star-rating [rating]="review.rating" [readonly]="true"></app-star-rating>
              <p class="review-comment">{{ review.comment }}</p>
            </div>
            
            <div class="review-actions" *ngIf="canDelete(review)">
              <button class="btn-icon-danger" (click)="deleteReview(review.id)">
                <i class="fas fa-trash-alt">Delete</i>
              </button>
            </div>
          </div>

          <!-- Merchant Reply -->
          <div class="merchant-reply" *ngIf="review.reply">
            <div class="reply-header">
              <span class="merchant-label">Merchant Response</span>
              <span class="reply-date">{{ review.repliedAt | date:'mediumDate' }}</span>
            </div>
            <p class="reply-text">{{ review.reply }}</p>
          </div>

          <!-- Admin Reply Form (Simple for now) -->
          <div class="reply-form" *ngIf="isAdmin() && !review.reply">
            <button class="btn-text" *ngIf="activeReplyId !== review.id" (click)="activeReplyId = review.id">
              Reply to this review
            </button>
            <div class="reply-input-container" *ngIf="activeReplyId === review.id">
              <textarea [(ngModel)]="adminReply" placeholder="Write your response..."></textarea>
              <div class="reply-actions">
                 <button class="btn-text" (click)="activeReplyId = null; adminReply = ''">Cancel</button>
                 <button class="btn-primary-sm" [disabled]="!adminReply" (click)="submitReply(review.id)">
                    Post Reply
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <app-pagination 
        *ngIf="totalReviews > 5" 
        [currentPage]="currentPage" 
        [totalItems]="totalReviews" 
        [itemsPerPage]="limit"
        (pageChange)="onPageChange($event)">
      </app-pagination>
    </div>
  `,
  styles: [`
    .reviews-section {
      padding: 2rem 0;
      border-top: 1px solid var(--border-color);
      margin-top: 3rem;
    }
    .reviews-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .header-main h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }
    .rating-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .review-count {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    .review-form-container {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
    }
    .rating-input, .comment-input {
      margin-bottom: 1.5rem;
    }
    .rating-input label, .comment-input label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--surface-hover);
      color: var(--text-primary);
      resize: vertical;
    }
    .login-prompt {
      padding: 1.5rem;
      background: var(--surface-card);
      border-radius: 12px;
      text-align: center;
      margin-bottom: 2rem;
      border: 1px dashed var(--border-color);
    }
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .review-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
    }
    .review-main {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .reviewer-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .reviewer-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .review-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .review-comment {
      margin: 1rem 0 0;
      line-height: 1.6;
      color: var(--text-primary);
    }
    .merchant-reply {
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--surface-active);
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
    }
    .reply-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .merchant-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary-color);
    }
    .reply-text {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }
    .reply-form {
      margin-top: 1rem;
    }
    .reply-input-container {
      margin-top: 1rem;
    }
    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .btn-text {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0;
    }
    .btn-primary-sm {
      padding: 0.4rem 0.8rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .btn-icon-danger {
       background: none;
       border: none;
       color: #ef4444;
       cursor: pointer;
       font-size: 0.75rem;
    }
    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
  `]
})
export class ProductReviewsComponent implements OnInit {
  @Input() productId!: string;
  @Input() averageRating: number = 0;

  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private uiService = inject(ToastService);
  private dialogService = inject(DialogService);

  reviews: any[] = [];
  totalReviews = 0;
  currentPage = 1;
  limit = 5;

  showReviewForm = false;
  userRating = 0;
  reviewComment = '';
  isReviewSubmitting = false;
  isLoading = false;

  activeReplyId: string | null = null;
  adminReply = '';

  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  currentUser = this.authService.user;

  ngOnInit() {
    this.loadReviews();
  }

  async loadReviews() {
    this.isLoading = true;
    try {
      const res = await this.reviewService.getReviewsByProduct(this.productId, this.currentPage, this.limit);

      // NG0900 Fix: Use safety check for array
      let items = res.items;
      if (items && !Array.isArray(items)) {
        console.warn('ProductReviews: items is not an array, converting...', items);
        items = typeof items === 'object' ? Object.values(items) : [];
      }

      this.reviews = items || [];
      this.totalReviews = res.total;
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      this.isLoading = false;
    }
  }

  async submitReview() {
    if (this.userRating === 0) return;

    this.isReviewSubmitting = true;
    try {
      await this.reviewService.createReview({
        productId: this.productId,
        rating: this.userRating,
        comment: this.reviewComment
      });

      this.uiService.show('Review submitted successfully!', 'success');
      this.reviewComment = '';
      this.userRating = 0;
      this.showReviewForm = false;
      this.currentPage = 1; // Go to first page to see new review
      await this.loadReviews();
    } catch (err: any) {
      this.uiService.show(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      this.isReviewSubmitting = false;
    }
  }

  async deleteReview(reviewId: string) {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep'
    });

    if (!confirmed) return;

    try {
      await this.reviewService.deleteReview(reviewId);
      this.uiService.show('Review deleted', 'success');
      await this.loadReviews();
    } catch (err) {
      this.uiService.show('Failed to delete review', 'error');
    }
  }

  async submitReply(reviewId: string) {
    if (!this.adminReply) return;

    try {
      await this.reviewService.replyToReview(reviewId, this.adminReply);
      this.uiService.show('Reply posted', 'success');
      this.activeReplyId = null;
      this.adminReply = '';
      await this.loadReviews();
    } catch (err) {
      this.uiService.show('Failed to post reply', 'error');
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadReviews();
    // Scroll to reviews section
    const element = document.querySelector('.reviews-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  canDelete(review: any): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return this.isAdmin() || review.userId === user.id;
  }
}
