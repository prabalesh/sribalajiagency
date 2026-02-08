import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { AuthGuard } from '@nestjs/passport';

describe('CartsController', () => {
    let controller: CartsController;
    let service: CartsService;

    const mockCartsService = {
        getUserCart: jest.fn(),
        updateUserCart: jest.fn(),
        validateCartItems: jest.fn(),
        mergeGuestCart: jest.fn(),
        clearUserCart: jest.fn(),
        cartToDto: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CartsController],
            providers: [
                {
                    provide: CartsService,
                    useValue: mockCartsService,
                },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<CartsController>(CartsController);
        service = module.get<CartsService>(CartsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCart', () => {
        it('should return user cart', async () => {
            const req = { user: { id: 'u1' } };
            const cart = { id: 'c1', items: [] };
            mockCartsService.getUserCart.mockResolvedValue(cart);
            mockCartsService.cartToDto.mockReturnValue([]);

            const result = await controller.getCart(req);

            expect(result).toEqual([]);
            expect(service.getUserCart).toHaveBeenCalledWith('u1');
        });
    });

    describe('updateCart', () => {
        it('should update user cart', async () => {
            const req = { user: { id: 'u1' } };
            const dto = { items: [{ productId: 'p1', quantity: 1 }] };
            mockCartsService.updateUserCart.mockResolvedValue({ items: [] });
            mockCartsService.cartToDto.mockReturnValue([]);

            const result = await controller.updateCart(req, dto);

            expect(result).toEqual([]);
            expect(service.updateUserCart).toHaveBeenCalledWith('u1', dto.items);
        });
    });

    describe('validateCart', () => {
        it('should validate items', async () => {
            const dto = { items: [] };
            mockCartsService.validateCartItems.mockResolvedValue([]);

            const result = await controller.validateCart(dto);

            expect(result).toEqual([]);
            expect(service.validateCartItems).toHaveBeenCalledWith([]);
        });
    });

    describe('mergeCart', () => {
        it('should merge guest cart', async () => {
            const req = { user: { id: 'u1' } };
            const dto = { guestCart: [] };
            mockCartsService.mergeGuestCart.mockResolvedValue({ items: [] });
            mockCartsService.cartToDto.mockReturnValue([]);

            const result = await controller.mergeCart(req, dto);

            expect(result).toEqual([]);
            expect(service.mergeGuestCart).toHaveBeenCalledWith('u1', []);
        });
    });

    describe('clearCart', () => {
        it('should clear user cart', async () => {
            const req = { user: { id: 'u1' } };
            const result = await controller.clearCart(req);

            expect(result).toEqual({ message: 'Cart cleared successfully' });
            expect(service.clearUserCart).toHaveBeenCalledWith('u1');
        });
    });
});
