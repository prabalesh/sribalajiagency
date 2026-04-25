import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CreateReviewDto } from './dto/create-review.dto';

/**
 * Service for managing product reviews using Drizzle ORM.
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Creates a new product review and updates product rating.
   */
  async create(createReviewDto: CreateReviewDto, userId: string) {
    const { productId, rating, comment } = createReviewDto;
    this.logger.log(`User ${userId} creating review for product ${productId}`);

    return await this.db.transaction(async (tx) => {
      // Validate product exists
      const product = await tx.query.products.findFirst({
        where: eq(schema.products.id, productId),
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check for duplicate review
      const existingReview = await tx.query.reviews.findFirst({
        where: and(
          eq(schema.reviews.userId, userId),
          eq(schema.reviews.productId, productId),
        ),
      });

      if (existingReview) {
        throw new ConflictException('You have already reviewed this product');
      }

      const [review] = await tx
        .insert(schema.reviews)
        .values({
          rating,
          comment,
          userId,
          productId,
        })
        .returning();

      // Update product rating
      await this.updateProductRating(tx, productId);

      return review;
    });
  }

  /**
   * Retrieves paginated reviews for a product.
   */
  async findAllByProduct(
    productId: string,
    page: number = 1,
    limit: number = 5,
  ) {
    this.logger.log(`Fetching reviews for product ${productId}`);

    const offset = (page - 1) * limit;

    const items = await this.db.query.reviews.findMany({
      where: eq(schema.reviews.productId, productId),
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [desc(schema.reviews.createdAt)],
    });

    const totalResult = await this.db.execute(
      sql`SELECT count(*) FROM reviews WHERE "productId" = ${productId}`,
    );
    const total = parseInt((totalResult.rows[0] as any).count);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Adds a seller reply to a review.
   */
  async replyToReview(id: string, reply: string) {
    this.logger.log(`Adding reply to review ${id}`);

    const [updatedReview] = await this.db
      .update(schema.reviews)
      .set({
        reply,
        repliedAt: new Date(),
      })
      .where(eq(schema.reviews.id, id))
      .returning();

    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }

    return updatedReview;
  }

  /**
   * Deletes a review and updates product rating.
   */
  async remove(id: string, userId: string) {
    this.logger.log(`User ${userId} deleting review ${id}`);

    return await this.db.transaction(async (tx) => {
      const review = await tx.query.reviews.findFirst({
        where: eq(schema.reviews.id, id),
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (review.userId !== userId) {
        throw new ForbiddenException('You can only delete your own reviews');
      }

      await tx.delete(schema.reviews).where(eq(schema.reviews.id, id));

      // Update product rating
      await this.updateProductRating(tx, review.productId);

      return { success: true };
    });
  }

  /**
   * Recalculates and updates product rating.
   */
  private async updateProductRating(tx: any, productId: string) {
    const statsResult = await tx.execute(
      sql`SELECT COUNT(*), AVG(rating) FROM reviews WHERE "productId" = ${productId}`,
    );

    const stats = statsResult.rows[0];
    const count = parseInt(stats.count);
    const average =
      count > 0 ? parseFloat(parseFloat(stats.avg).toFixed(1)) : 0;

    await tx
      .update(schema.products)
      .set({
        rating: average.toString(),
        reviewCount: count,
      })
      .where(eq(schema.products.id, productId));
  }
}
