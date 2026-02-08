import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';

describe('ReviewsService', () => {
    let service: ReviewsService;
    let reviewsRepo: Repository<Review>;
    let productRepo: Repository<Product>;

    const mockReviewRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        remove: jest.fn(),
        find: jest.fn(),
    };

    const mockProductRepo = {
        findOne: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewsService,
                {
                    provide: getRepositoryToken(Review),
                    useValue: mockReviewRepo,
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockProductRepo,
                },
            ],
        }).compile();

        service = module.get<ReviewsService>(ReviewsService);
        reviewsRepo = module.get<Repository<Review>>(getRepositoryToken(Review));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto: CreateReviewDto = {
            productId: 'product-id',
            rating: 5,
            comment: 'Great product!',
        };
        const userId = 'user-id';

        it('should successfully create a review', async () => {
            const product = { id: 'product-id', name: 'Product' };
            mockProductRepo.findOne.mockResolvedValue(product);
            mockReviewRepo.findOne.mockResolvedValue(null);
            mockReviewRepo.create.mockReturnValue({ ...createDto, userId });
            mockReviewRepo.save.mockResolvedValue({ id: 'review-id', ...createDto, userId });

            // Mock updateProductRating internal find
            mockReviewRepo.find.mockResolvedValue([]);

            const result = await service.create(createDto, userId);

            expect(result).toBeDefined();
            expect(mockProductRepo.findOne).toHaveBeenCalledWith({ where: { id: createDto.productId } });
            expect(mockReviewRepo.create).toHaveBeenCalled();
            expect(mockReviewRepo.save).toHaveBeenCalled();
            expect(mockProductRepo.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if product not found', async () => {
            mockProductRepo.findOne.mockResolvedValue(null);

            return expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if user already reviewed', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'product-id' });
            mockReviewRepo.findOne.mockResolvedValue({ id: 'existing-review-id' });

            return expect(service.create(createDto, userId)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAllByProduct', () => {
        it('should return paginated reviews', async () => {
            const productId = 'product-id';
            const reviews = [{ id: '1', comment: 'Review 1' }];
            mockReviewRepo.findAndCount.mockResolvedValue([reviews, 1]);

            const result = await service.findAllByProduct(productId, 1, 5);

            expect(result.items.length).toBe(1);
            expect(result.total).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(mockReviewRepo.findAndCount).toHaveBeenCalled();
        });
    });

    describe('replyToReview', () => {
        it('should successfully save a reply', async () => {
            const reviewId = 'review-id';
            const reply = 'Thank you!';
            const review = { id: reviewId, comment: 'Great' };
            mockReviewRepo.findOne.mockResolvedValue(review);
            mockReviewRepo.save.mockResolvedValue({ ...review, reply });

            const result = await service.replyToReview(reviewId, reply);

            expect(result.reply).toBe(reply);
            expect(mockReviewRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if review not found', async () => {
            mockReviewRepo.findOne.mockResolvedValue(null);

            return expect(service.replyToReview('id', 'reply')).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should successfully delete a review', async () => {
            const reviewId = 'review-id';
            const userId = 'user-id';
            const review = { id: reviewId, userId, productId: 'product-id' };
            mockReviewRepo.findOne.mockResolvedValue(review);
            mockReviewRepo.find.mockResolvedValue([]); // For updateProductRating

            await service.remove(reviewId, userId);

            expect(mockReviewRepo.remove).toHaveBeenCalled();
            expect(mockProductRepo.update).toHaveBeenCalled();
        });

        it('should throw ForbiddenException if deleting other user review', async () => {
            const reviewId = 'review-id';
            const review = { id: reviewId, userId: 'other-user', productId: 'product-id' };
            mockReviewRepo.findOne.mockResolvedValue(review);

            return expect(service.remove(reviewId, 'user-id')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('updateProductRating', () => {
        it('should calculate average correctly', async () => {
            const productId = 'product-id';
            const reviews = [{ rating: 5 }, { rating: 4 }];
            mockReviewRepo.find.mockResolvedValue(reviews);

            await (service as any).updateProductRating(productId);

            expect(mockProductRepo.update).toHaveBeenCalledWith(productId, {
                rating: 4.5,
                reviewCount: 2
            });
        });

        it('should handle zero reviews', async () => {
            const productId = 'product-id';
            mockReviewRepo.find.mockResolvedValue([]);

            await (service as any).updateProductRating(productId);

            expect(mockProductRepo.update).toHaveBeenCalledWith(productId, {
                rating: 0,
                reviewCount: 0
            });
        });
    });
});
