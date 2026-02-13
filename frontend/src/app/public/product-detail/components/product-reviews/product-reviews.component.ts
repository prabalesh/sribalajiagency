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
        /* ============================================
      PRODUCT REVIEWS COMPONENT
      ============================================ */

    .reviews-section {
      padding: 2rem 0;
      border-top: 2px solid var(--border-color);
      margin-top: 3rem;
    }

    /* ============================================
      REVIEWS HEADER
      ============================================ */

    .reviews-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 2rem;

      .header-main {
        flex: 1;

        h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-color);
          margin-bottom: 0.75rem;
        }
      }

      .rating-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;

        .review-count {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
        }
      }

      .btn-primary {
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    /* ============================================
      REVIEW FORM
      ============================================ */

    .review-form-container {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1.75rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);

      h3 {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-color);
        margin-bottom: 1.5rem;
      }

      .rating-input,
      .comment-input {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.625rem;
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-color);
        }
      }

      textarea {
        width: 100%;
        min-height: 120px;
        padding: 1rem;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-family);
        font-size: 0.9375rem;
        line-height: 1.6;
        resize: vertical;
        transition: all var(--transition-speed) var(--transition-curve);

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
        }

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;

        .btn-primary {
          min-width: 140px;
        }
      }
    }

    /* ============================================
      LOGIN PROMPT
      ============================================ */

    .login-prompt {
      padding: 1.5rem;
      background: var(--surface-color-secondary);
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius-md);
      text-align: center;
      margin-bottom: 2rem;

      p {
        color: var(--text-secondary);
        font-size: 0.9375rem;
        margin: 0;

        a {
          color: var(--primary-color);
          font-weight: 700;
          text-decoration: underline;
          transition: color 0.2s ease;

          &:hover {
            color: var(--primary-hover);
          }
        }
      }
    }

    /* ============================================
      REVIEWS LIST
      ============================================ */

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;

      &.loading {
        opacity: 0.5;
        pointer-events: none;
      }

      .reviews-loading,
      .no-reviews {
        padding: 3rem 2rem;
        text-align: center;
        background: var(--surface-color-secondary);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--border-color);

        p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          margin: 0;
        }
      }
    }

    /* ============================================
      REVIEW CARD
      ============================================ */

    .review-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-speed) var(--transition-curve);

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .review-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;

        .review-info {
          flex: 1;
        }

        .review-actions {
          flex-shrink: 0;
        }
      }

      .reviewer-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;

        .reviewer-name {
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--text-color);
        }

        .review-date {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
      }

      .review-comment {
        margin: 1rem 0 0;
        line-height: 1.7;
        color: var(--text-color);
        font-size: 0.9375rem;
      }

      .btn-icon-danger {
        background: none;
        border: none;
        color: var(--danger-color);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: var(--border-radius-sm);
        font-size: 0.8125rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: all 0.2s ease;

        i {
          font-style: normal;
        }

        &:hover {
          background: rgba(var(--danger-color-rgb), 0.1);
          transform: scale(1.05);
        }
      }
    }

    /* ============================================
      MERCHANT REPLY
      ============================================ */

    .merchant-reply {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: var(--surface-color-secondary);
      border-radius: var(--border-radius-sm);
      border-left: 4px solid var(--primary-color);

      .reply-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        gap: 1rem;

        .merchant-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary-color);
        }

        .reply-date {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
      }

      .reply-text {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.6;
        color: var(--text-color);
      }
    }

    /* ============================================
      ADMIN REPLY FORM
      ============================================ */

    .reply-form {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);

      .btn-text {
        background: none;
        border: none;
        color: var(--primary-color);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.5rem 0;
        transition: all 0.2s ease;

        &:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }
      }

      .reply-input-container {
        margin-top: 1rem;

        textarea {
          width: 100%;
          min-height: 100px;
          padding: 1rem;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-color);
          font-family: var(--font-family);
          font-size: 0.875rem;
          line-height: 1.6;
          resize: vertical;
          transition: all var(--transition-speed) var(--transition-curve);

          &:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
          }

          &::placeholder {
            color: var(--text-secondary);
          }
        }

        .reply-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 1rem;
          margin-top: 0.75rem;

          .btn-text {
            padding: 0.5rem 1rem;
          }

          .btn-primary-sm {
            padding: 0.5rem 1.25rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--border-radius-sm);
            font-size: 0.875rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background: var(--primary-hover);
              transform: translateY(-2px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }
    }

    /* ============================================
      RESPONSIVE DESIGN
      ============================================ */

    /* Tablet (1024px and below) */
    @media (max-width: 1024px) {
      .reviews-section {
        padding: 1.75rem 0;
        margin-top: 2.5rem;
      }

      .reviews-header {
        gap: 1.25rem;

        .header-main h2 {
          font-size: 1.5rem;
        }

        .rating-summary {
          gap: 0.625rem;

          .review-count {
            font-size: 0.8125rem;
          }
        }
      }

      .review-form-container {
        padding: 1.5rem;

        h3 {
          font-size: 1rem;
        }

        textarea {
          min-height: 100px;
          font-size: 0.875rem;
        }
      }

      .review-card {
        padding: 1.25rem;

        .reviewer-meta {
          .reviewer-name {
            font-size: 0.875rem;
          }

          .review-date {
            font-size: 0.75rem;
          }
        }

        .review-comment {
          font-size: 0.875rem;
        }
      }

      .merchant-reply {
        padding: 1rem;

        .reply-text {
          font-size: 0.875rem;
        }
      }
    }

    /* Mobile Large (768px and below) */
    @media (max-width: 768px) {
      .reviews-section {
        padding: 1.5rem 0;
        margin-top: 2rem;
      }

      .reviews-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        .header-main h2 {
          font-size: 1.375rem;
          margin-bottom: 0.5rem;
        }

        .rating-summary {
          margin-top: 0.375rem;

          .review-count {
            font-size: 0.75rem;
          }
        }

        .btn-primary {
          width: 100%;
          justify-content: center;
        }
      }

      .review-form-container {
        padding: 1.25rem;

        h3 {
          font-size: 0.9375rem;
          margin-bottom: 1.25rem;
        }

        .rating-input,
        .comment-input {
          margin-bottom: 1.25rem;

          label {
            font-size: 0.8125rem;
            margin-bottom: 0.5rem;
          }
        }

        textarea {
          min-height: 90px;
          padding: 0.875rem;
          font-size: 0.8125rem;
        }

        .form-actions {
          .btn-primary {
            width: 100%;
            min-width: auto;
          }
        }
      }

      .login-prompt {
        padding: 1.25rem;

        p {
          font-size: 0.875rem;
        }
      }

      .reviews-list {
        gap: 1.25rem;

        .reviews-loading,
        .no-reviews {
          padding: 2.5rem 1.5rem;

          p {
            font-size: 0.875rem;
          }
        }
      }

      .review-card {
        padding: 1rem;

        .review-main {
          flex-direction: column;
          gap: 0.75rem;

          .review-actions {
            align-self: flex-end;
          }
        }

        .reviewer-meta {
          gap: 0.75rem;

          .reviewer-name {
            font-size: 0.8125rem;
          }

          .review-date {
            font-size: 0.6875rem;
          }
        }

        .review-comment {
          margin-top: 0.75rem;
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .btn-icon-danger {
          padding: 0.375rem 0.625rem;
          font-size: 0.75rem;
        }
      }

      .merchant-reply {
        margin-top: 1.25rem;
        padding: 0.875rem;

        .reply-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.375rem;
          margin-bottom: 0.625rem;

          .merchant-label {
            font-size: 0.6875rem;
          }

          .reply-date {
            font-size: 0.6875rem;
          }
        }

        .reply-text {
          font-size: 0.8125rem;
          line-height: 1.5;
        }
      }

      .reply-form {
        margin-top: 1rem;
        padding-top: 1rem;

        .btn-text {
          font-size: 0.8125rem;
          padding: 0.375rem 0;
        }

        .reply-input-container {
          textarea {
            min-height: 90px;
            padding: 0.875rem;
            font-size: 0.8125rem;
          }

          .reply-actions {
            flex-direction: column;
            align-items: stretch;

            .btn-text,
            .btn-primary-sm {
              width: 100%;
              text-align: center;
              justify-content: center;
            }

            .btn-primary-sm {
              font-size: 0.8125rem;
              padding: 0.625rem 1rem;
            }
          }
        }
      }
    }

    /* Mobile Small (480px and below) */
    @media (max-width: 480px) {
      .reviews-section {
        padding: 1.25rem 0;
        margin-top: 1.5rem;
      }

      .reviews-header {
        gap: 0.875rem;

        .header-main h2 {
          font-size: 1.125rem;
          margin-bottom: 0.375rem;
        }

        .rating-summary {
          margin-top: 0.25rem;
          gap: 0.5rem;

          .review-count {
            font-size: 0.6875rem;
          }
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
        }
      }

      .review-form-container {
        padding: 1rem;

        h3 {
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .rating-input,
        .comment-input {
          margin-bottom: 1rem;

          label {
            font-size: 0.75rem;
          }
        }

        textarea {
          min-height: 80px;
          padding: 0.75rem;
          font-size: 0.75rem;
        }

        .form-actions .btn-primary {
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
        }
      }

      .login-prompt {
        padding: 1rem;

        p {
          font-size: 0.8125rem;
        }
      }

      .reviews-list {
        gap: 1rem;

        .reviews-loading,
        .no-reviews {
          padding: 2rem 1rem;

          p {
            font-size: 0.8125rem;
          }
        }
      }

      .review-card {
        padding: 0.875rem;

        .reviewer-meta {
          gap: 0.5rem;
          margin-bottom: 0.625rem;

          .reviewer-name {
            font-size: 0.75rem;
          }

          .review-date {
            font-size: 0.625rem;
          }
        }

        .review-comment {
          margin-top: 0.625rem;
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .btn-icon-danger {
          padding: 0.3125rem 0.5rem;
          font-size: 0.6875rem;
        }
      }

      .merchant-reply {
        margin-top: 1rem;
        padding: 0.75rem;
        border-left-width: 3px;

        .reply-header {
          gap: 0.25rem;
          margin-bottom: 0.5rem;

          .merchant-label,
          .reply-date {
            font-size: 0.625rem;
          }
        }

        .reply-text {
          font-size: 0.75rem;
          line-height: 1.5;
        }
      }

      .reply-form {
        margin-top: 0.875rem;
        padding-top: 0.875rem;

        .btn-text {
          font-size: 0.75rem;
          padding: 0.3125rem 0;
        }

        .reply-input-container {
          textarea {
            min-height: 80px;
            padding: 0.75rem;
            font-size: 0.75rem;
          }

          .reply-actions {
            margin-top: 0.625rem;
            gap: 0.75rem;

            .btn-primary-sm {
              font-size: 0.75rem;
              padding: 0.5rem 0.875rem;
            }
          }
        }
      }
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
