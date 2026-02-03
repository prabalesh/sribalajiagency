import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    async create(createReviewDto: CreateReviewDto, userId: string) {
        const { productId, rating, comment } = createReviewDto;

        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if user already reviewed this product
        const existingReview = await this.reviewsRepository.findOne({
            where: { userId: userId, productId },
        });

        if (existingReview) {
            throw new ConflictException('You have already reviewed this product');
        }

        const review = this.reviewsRepository.create({
            rating,
            comment,
            userId: userId,
            productId,
        });

        await this.reviewsRepository.save(review);
        await this.updateProductRating(productId);

        return review;
    }

    async findAllByProduct(productId: string, page: number = 1, limit: number = 5) {
        const [items, total] = await this.reviewsRepository.findAndCount({
            where: { productId },
            order: { createdAt: 'DESC' },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async replyToReview(id: string, reply: string) {
        const review = await this.reviewsRepository.findOne({ where: { id } });
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        review.reply = reply;
        review.repliedAt = new Date();

        return this.reviewsRepository.save(review);
    }

    async remove(id: string, userId: string) {
        const review = await this.reviewsRepository.findOne({ where: { id } });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Only allow user to delete their own review (or admin - handled via roles/guards separately if needed)
        // For now, let's assume this method is called after checking permissions or by the user themselves
        if (review.userId !== userId) {
            // If we had an isAdmin flag on user, we could check that too
            // For strictness, let's say only owner can delete here. 
            // Admin deletion might need a separate method or expanded check.
            throw new ForbiddenException('You can only delete your own reviews');
        }

        await this.reviewsRepository.remove(review);
        await this.updateProductRating(review.productId);
    }

    private async updateProductRating(productId: string) {
        const reviews = await this.reviewsRepository.find({ where: { productId } });
        const count = reviews.length;

        if (count === 0) {
            await this.productRepository.update(productId, { rating: 0, reviewCount: 0 });
            return;
        }

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = parseFloat((sum / count).toFixed(1)); // Keep 1 decimal place

        await this.productRepository.update(productId, { rating: average, reviewCount: count });
    }
}
