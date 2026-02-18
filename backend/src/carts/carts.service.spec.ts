import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CartsService } from './carts.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartItemDto, ValidatedCartItemDto } from './dto/cart.dto';

describe('CartsService', () => {
    let service: CartsService;
    let cartRepo: Repository<Cart>;
    let cartItemRepo: Repository<CartItem>;
    let productRepo: Repository<Product>;
    let variantRepo: Repository<ProductVariant>;

    const mockCartRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockCartItemRepo = {
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
    };

    const mockProductRepo = {
        findOne: jest.fn(),
    };

    const mockVariantRepo = {
        findOne: jest.fn(),
    };
    const mockDataSource = {
        manager: {
            transaction: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartsService,
                {
                    provide: getRepositoryToken(Cart),
                    useValue: mockCartRepo,
                },
                {
                    provide: getRepositoryToken(CartItem),
                    useValue: mockCartItemRepo,
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockProductRepo,
                },
                {
                    provide: getRepositoryToken(ProductVariant),
                    useValue: mockVariantRepo,
                },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<CartsService>(CartsService);
        cartRepo = module.get<Repository<Cart>>(getRepositoryToken(Cart));
        cartItemRepo = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        variantRepo = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserCart', () => {
        it('should return existing cart', async () => {
            const userId = 'user-1';
            const existingCart = { id: 'cart-1', userId, items: [] };
            mockCartRepo.findOne.mockResolvedValue(existingCart);

            const result = await service.getUserCart(userId);

            expect(result).toEqual(existingCart);
            expect(mockCartRepo.findOne).toHaveBeenCalledWith({
                where: { userId },
                relations: ['items', 'items.product', 'items.variant'],
            });
        });

        it('should create and return new cart if not found', async () => {
            const userId = 'user-2';
            mockCartRepo.findOne.mockResolvedValue(null);
            mockCartRepo.create.mockReturnValue({ userId, items: [] });
            mockCartRepo.save.mockResolvedValue({ id: 'new-cart', userId, items: [] });

            const result = await service.getUserCart(userId);

            expect(result.userId).toBe(userId);
            expect(mockCartRepo.create).toHaveBeenCalled();
            expect(mockCartRepo.save).toHaveBeenCalled();
        });
    });

    describe('updateUserCart', () => {
        it('should replace items in user cart', async () => {
            const userId = 'user-1';
            const cart = { id: 'cart-1', userId, items: [{ id: 'old-item' }] };
            const newItems: CartItemDto[] = [{ productId: 'p1', quantity: 2 }];

            mockCartRepo.findOne.mockResolvedValue(cart);
            mockCartItemRepo.remove.mockResolvedValue(null);
            mockCartItemRepo.create.mockReturnValue({ productId: 'p1', quantity: 2 });
            mockCartItemRepo.save.mockResolvedValue([{ productId: 'p1', quantity: 2 }]);
            mockCartRepo.save.mockResolvedValue({ ...cart, items: [{ productId: 'p1', quantity: 2 }] });

            const oldItems = [...cart.items];
            const result = await service.updateUserCart(userId, newItems);

            expect(mockCartItemRepo.remove).toHaveBeenCalledWith(oldItems);
            expect(mockCartItemRepo.create).toHaveBeenCalled();
            expect(mockCartRepo.save).toHaveBeenCalled();
        });
    });

    describe('mergeGuestCart', () => {
        it('should merge guest items into user cart', async () => {
            const userId = 'user-1';
            const userCart = {
                id: 'cart-1',
                userId,
                items: [
                    { productId: 'p1', quantity: 1, variantId: null }
                ]
            };
            const guestCart: CartItemDto[] = [
                { productId: 'p1', quantity: 2, variantId: null },
                { productId: 'p2', quantity: 1, variantId: null }
            ];

            mockCartRepo.findOne.mockResolvedValue(userCart);
            mockCartItemRepo.save.mockResolvedValue(null);
            mockCartItemRepo.create.mockReturnValue({ productId: 'p2', quantity: 1 });

            await service.mergeGuestCart(userId, guestCart);

            // Matches existing p1, quantity becomes 1 + 2 = 3
            expect(userCart.items[0].quantity).toBe(3);
            expect(mockCartItemRepo.save).toHaveBeenCalled();
            expect(mockCartItemRepo.create).toHaveBeenCalled();
        });
    });

    describe('validateCartItems', () => {
        it('should validate and adjust items', async () => {
            const items: CartItemDto[] = [
                { productId: 'p1', quantity: 10 }
            ];
            const product = {
                id: 'p1',
                name: 'Product 1',
                price: 100,
                isAvailable: true,
                isShowcaseOnly: false,
                images: [{ url: 'img1' }],
                variants: [{ id: 'v1', stock: 5 }]
            };

            mockProductRepo.findOne.mockResolvedValue(product);

            const result = await service.validateCartItems(items);

            expect(result[0].productName).toBe('Product 1');
            expect(result[0].available).toBe(true);
            expect(result[0].quantity).toBe(5); // Adjusted to stock
            expect(result[0].quantityAdjusted).toBe(true);
        });

        it('should mark as unavailable if product not found', async () => {
            const items: CartItemDto[] = [{ productId: 'missing', quantity: 1 }];
            mockProductRepo.findOne.mockResolvedValue(null);

            const result = await service.validateCartItems(items);

            expect(result[0].available).toBe(false);
            expect(result[0].productName).toBe('Product not found');
        });

        it('should handle variants', async () => {
            const items: CartItemDto[] = [{ productId: 'p1', variantId: 'v1', quantity: 2 }];
            const product = {
                id: 'p1',
                name: 'Product 1',
                isAvailable: true,
                isShowcaseOnly: false
            };
            const variant = { id: 'v1', name: 'Size M', price: 120, stock: 10 };

            mockProductRepo.findOne.mockResolvedValue(product);
            mockVariantRepo.findOne.mockResolvedValue(variant);

            const result = await service.validateCartItems(items);

            expect(result[0].variantName).toBe('Size M');
            expect(result[0].price).toBe(120);
        });
    });

    describe('clearUserCart', () => {
        it('should remove all items from cart', async () => {
            const cart = { id: 'c1', items: [{ id: 'item1' }] };
            mockCartRepo.findOne.mockResolvedValue(cart);

            await service.clearUserCart('user-1');

            expect(mockCartItemRepo.remove).toHaveBeenCalledWith(cart.items);
        });
    });
});
