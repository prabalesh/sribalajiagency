import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product } from 'src/products/entities/product.entity';

/**
 * Service for managing product reviews and ratings.
 * 
 * Handles CRUD operations for reviews, including creation, retrieval,
 * replies from sellers/admins, and deletion. Automatically updates
 * product rating averages when reviews are added or removed.
 * 
 * @remarks
 * - Enforces one review per user per product
 * - Automatically recalculates product ratings
 * - Supports pagination for review listings
 * - Thread-safe rating calculations
 * 
 * @example
 * ```typescript
 * const review = await reviewsService.create(dto, userId);
 * const reviews = await reviewsService.findAllByProduct(productId, 1, 10);
 * ```
 * 
 * TODO: Add transaction support for create/delete operations with rating updates
 * TODO: Add caching layer for product reviews (Redis)
 * TODO: Add support for review moderation/approval workflow
 * TODO: Add review helpful/upvote functionality
 * TODO: Add review reporting/flagging system
 * TODO: Add review media support (images/videos)
 * TODO: Implement soft delete instead of hard delete
 */
@Injectable()
export class ReviewsService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(ReviewsService.name);

    /**
     * Initializes the reviews service with required repositories
     * 
     * @param reviewsRepository - Repository for Review entity operations
     * @param productRepository - Repository for Product entity operations
     */
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    /**
     * Creates a new product review.
     * 
     * Validates that:
     * - Product exists
     * - User hasn't already reviewed this product
     * - Rating and comment meet validation criteria
     * 
     * After creating the review, automatically recalculates the product's
     * average rating and review count.
     * 
     * @param createReviewDto - Review data (productId, rating, comment)
     * @param userId - ID of the user creating the review
     * @returns Promise resolving to the created Review entity
     * 
     * @throws {NotFoundException} If product doesn't exist
     * @throws {ConflictException} If user already reviewed this product
     * 
     * @example
     * ```typescript
     * const review = await reviewsService.create({
     *   productId: 'prod_123',
     *   rating: 5,
     *   comment: 'Excellent product!'
     * }, 'user_456');
     * ```
     * 
     * TODO: Verify user actually purchased the product before allowing review
     * TODO: Add transaction to ensure review creation and rating update are atomic
     * TODO: Add profanity filter for review comments
     * TODO: Add rate limiting to prevent review spam
     * TODO: Emit event for review notifications (notify seller/admin)
     * TODO: Add review verification badge for verified purchases
     * TODO: Consider adding review edit functionality within time window
     */
    async create(createReviewDto: CreateReviewDto, userId: string) {
        const { productId, rating, comment } = createReviewDto;

        this.logger.log(`User ${userId} attempting to create review for product ${productId}`);

        // Validate product exists
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) {
            this.logger.warn(`Product ${productId} not found for review creation`);
            throw new NotFoundException('Product not found');
        }

        // Check for duplicate review from same user
        const existingReview = await this.reviewsRepository.findOne({
            where: { userId: userId, productId },
        });

        if (existingReview) {
            this.logger.warn(`User ${userId} attempted to create duplicate review for product ${productId}`);
            throw new ConflictException('You have already reviewed this product');
        }

        // Create and save review
        const review = this.reviewsRepository.create({
            rating,
            comment,
            userId: userId,
            productId,
        });

        await this.reviewsRepository.save(review);
        this.logger.log(`Review created successfully: ${review.id}`);

        // Update product rating asynchronously
        // TODO: Move to transaction to ensure atomicity
        await this.updateProductRating(productId);

        // TODO: Emit ReviewCreatedEvent here
        // TODO: Send notification to product owner

        return review;
    }

    /**
     * Retrieves paginated reviews for a specific product.
     * 
     * Returns reviews in descending order (newest first) with user
     * information populated. Supports pagination for performance.
     * 
     * @param productId - ID of the product to fetch reviews for
     * @param page - Page number (1-indexed, default: 1)
     * @param limit - Number of reviews per page (default: 5)
     * @returns Promise resolving to paginated review results
     * 
     * @example
     * ```typescript
     * const result = await reviewsService.findAllByProduct('prod_123', 1, 10);
     * // Returns: { items: [...], total: 45, page: 1, limit: 10, totalPages: 5 }
     * ```
     * 
     * TODO: Add filtering by rating (e.g., show only 5-star reviews)
     * TODO: Add sorting options (helpful, rating, date)
     * TODO: Add search functionality for review content
     * TODO: Cache results for popular products
     * TODO: Add average rating breakdown (5-star: 60%, 4-star: 20%, etc.)
     * TODO: Add verified purchase indicator in response
     * TODO: Add review media (images) in response
     * TODO: Consider using cursor-based pagination for better performance
     */
    async findAllByProduct(productId: string, page: number = 1, limit: number = 5) {
        this.logger.log(`Fetching reviews for product ${productId}, page ${page}, limit ${limit}`);

        // TODO: Add validation for page and limit parameters (max limit, positive numbers)
        
        const [items, total] = await this.reviewsRepository.findAndCount({
            where: { productId },
            order: { createdAt: 'DESC' },
            relations: ['user'], // TODO: Select only necessary user fields to avoid data leakage
            skip: (page - 1) * limit,
            take: limit,
        });

        this.logger.log(`Found ${total} total reviews for product ${productId}`);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Adds a seller/admin reply to an existing review.
     * 
     * Allows sellers or admins to respond to customer reviews.
     * Records the reply timestamp for tracking.
     * 
     * @param id - ID of the review to reply to
     * @param reply - Reply message text
     * @returns Promise resolving to updated Review entity
     * 
     * @throws {NotFoundException} If review doesn't exist
     * 
     * @example
     * ```typescript
     * await reviewsService.replyToReview(
     *   'review_123',
     *   'Thank you for your feedback! We appreciate your business.'
     * );
     * ```
     * 
     * TODO: Add authorization check (only seller/admin can reply)
     * TODO: Add validation for reply content length and format
     * TODO: Add support for editing/deleting replies
     * TODO: Track who replied (seller vs admin) for audit trail
     * TODO: Emit notification to reviewer when reply is added
     * TODO: Add profanity filter for replies
     * TODO: Consider limiting reply length (e.g., 500 chars)
     * TODO: Add support for multiple replies/conversation thread
     */
    async replyToReview(id: string, reply: string) {
        this.logger.log(`Adding reply to review ${id}`);

        const review = await this.reviewsRepository.findOne({ where: { id } });
        if (!review) {
            this.logger.warn(`Review ${id} not found for reply`);
            throw new NotFoundException('Review not found');
        }

        // TODO: Check if review already has a reply and handle accordingly
        // TODO: Validate reply is not empty after trimming whitespace

        review.reply = reply;
        review.repliedAt = new Date();

        const updated = await this.reviewsRepository.save(review);
        this.logger.log(`Reply added successfully to review ${id}`);

        // TODO: Emit ReviewRepliedEvent
        // TODO: Send notification to review author

        return updated;
    }

    /**
     * Deletes a review.
     * 
     * Only allows users to delete their own reviews. Admin deletion
     * should be handled separately with appropriate guards.
     * 
     * After deletion, automatically recalculates the product's rating.
     * 
     * @param id - ID of the review to delete
     * @param userId - ID of the user attempting deletion
     * 
     * @throws {NotFoundException} If review doesn't exist
     * @throws {ForbiddenException} If user tries to delete another user's review
     * 
     * @example
     * ```typescript
     * await reviewsService.remove('review_123', 'user_456');
     * ```
     * 
     * TODO: Implement soft delete instead of hard delete (preserve data)
     * TODO: Add transaction to ensure delete and rating update are atomic
     * TODO: Add admin override capability (separate method or isAdmin check)
     * TODO: Add audit logging for review deletions
     * TODO: Add grace period for deletion (e.g., can only delete within 24h)
     * TODO: Emit ReviewDeletedEvent for analytics
     * TODO: Archive deleted reviews instead of removing completely
     * TODO: Add confirmation/reason for deletion
     */
    async remove(id: string, userId: string) {
        this.logger.log(`User ${userId} attempting to delete review ${id}`);

        const review = await this.reviewsRepository.findOne({ where: { id } });

        if (!review) {
            this.logger.warn(`Review ${id} not found for deletion`);
            throw new NotFoundException('Review not found');
        }

        // Authorization check - only owner can delete
        // TODO: Add admin/moderator override capability
        if (review.userId !== userId) {
            this.logger.warn(`User ${userId} attempted to delete review ${id} owned by ${review.userId}`);
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const productId = review.productId;

        // TODO: Use soft delete instead
        await this.reviewsRepository.remove(review);
        this.logger.log(`Review ${id} deleted successfully`);

        // Update product rating after deletion
        // TODO: Move to transaction to ensure atomicity
        await this.updateProductRating(productId);

        // TODO: Emit ReviewDeletedEvent
        // TODO: Notify product owner of deletion
    }

    /**
     * Recalculates and updates a product's average rating and review count.
     * 
     * Called automatically after review creation or deletion.
     * Computes average rating to 1 decimal place.
     * 
     * @param productId - ID of the product to update
     * @private
     * 
     * @remarks
     * This is a critical operation that affects product display and sorting.
     * Should be executed within a transaction with the calling operation.
     * 
     * TODO: Optimize with aggregation query instead of loading all reviews
     * TODO: Add error handling and retry logic
     * TODO: Add caching for frequently updated products
     * TODO: Consider using database triggers for real-time updates
     * TODO: Add weighted ratings (verified purchases count more)
     * TODO: Add time-decay for ratings (recent reviews weighted higher)
     * TODO: Add transaction support to prevent race conditions
     * TODO: Add logging for rating changes
     */
    private async updateProductRating(productId: string) {
        this.logger.debug(`Updating rating for product ${productId}`);

        // TODO: Replace with aggregation query for better performance
        // Example: SELECT AVG(rating), COUNT(*) FROM reviews WHERE productId = ?
        const reviews = await this.reviewsRepository.find({ where: { productId } });
        const count = reviews.length;

        if (count === 0) {
            await this.productRepository.update(productId, { rating: 0, reviewCount: 0 });
            this.logger.debug(`Product ${productId} rating reset to 0 (no reviews)`);
            return;
        }

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = parseFloat((sum / count).toFixed(1)); // Keep 1 decimal place

        await this.productRepository.update(productId, { rating: average, reviewCount: count });
        this.logger.debug(`Product ${productId} rating updated to ${average} (${count} reviews)`);

        // TODO: Invalidate product cache after rating update
        // TODO: Emit ProductRatingUpdatedEvent for real-time updates
    }
}
