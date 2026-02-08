import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

describe('ReviewsController', () => {
    let controller: ReviewsController;
    let service: ReviewsService;

    const mockReviewsService = {
        create: jest.fn(),
        findAllByProduct: jest.fn(),
        replyToReview: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReviewsController],
            providers: [
                {
                    provide: ReviewsService,
                    useValue: mockReviewsService,
                },
            ],
        }).compile();

        controller = module.get<ReviewsController>(ReviewsController);
        service = module.get<ReviewsService>(ReviewsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should call service.create', async () => {
            const dto: CreateReviewDto = { productId: 'p1', rating: 5, comment: 'test' };
            const req = { user: { id: 'u1' } };
            mockReviewsService.create.mockResolvedValue({ id: 'r1', ...dto });

            const result = await controller.create(dto, req);

            expect(result).toBeDefined();
            expect(service.create).toHaveBeenCalledWith(dto, 'u1');
        });
    });

    describe('findAllByProduct', () => {
        it('should call service.findAllByProduct with defaults', async () => {
            const productId = 'p1';
            await controller.findAllByProduct(productId);
            expect(service.findAllByProduct).toHaveBeenCalledWith(productId, 1, 5);
        });

        it('should call service.findAllByProduct with provided queries', async () => {
            const productId = 'p1';
            await controller.findAllByProduct(productId, 2, 10);
            expect(service.findAllByProduct).toHaveBeenCalledWith(productId, 2, 10);
        });
    });

    describe('reply', () => {
        it('should call service.replyToReview', async () => {
            const id = 'r1';
            const reply = 'thanks';
            await controller.reply(id, reply);
            expect(service.replyToReview).toHaveBeenCalledWith(id, reply);
        });
    });

    describe('remove', () => {
        it('should call service.remove', async () => {
            const id = 'r1';
            const req = { user: { id: 'u1' } };
            await controller.remove(id, req);
            expect(service.remove).toHaveBeenCalledWith(id, 'u1');
        });
    });
});
