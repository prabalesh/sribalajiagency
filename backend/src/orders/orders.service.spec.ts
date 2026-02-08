import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
    let service: OrdersService;
    let orderRepo: Repository<Order>;
    let orderItemRepo: Repository<OrderItem>;
    let statusHistoryRepo: Repository<OrderStatusHistory>;
    let productRepo: Repository<Product>;
    let variantRepo: Repository<ProductVariant>;

    const mockOrderRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
    };

    const mockOrderItemRepo = {
        create: jest.fn(),
    };

    const mockStatusHistoryRepo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    const mockProductRepo = {
        find: jest.fn(),
    };

    const mockCategoryRepo = {
        find: jest.fn(),
    };

    const mockVariantRepo = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
                { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
                { provide: getRepositoryToken(OrderStatusHistory), useValue: mockStatusHistoryRepo },
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
                { provide: getRepositoryToken(ProductVariant), useValue: mockVariantRepo },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
        orderItemRepo = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
        statusHistoryRepo = module.get<Repository<OrderStatusHistory>>(getRepositoryToken(OrderStatusHistory));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        variantRepo = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateTax', () => {
        it('should calculate IGST for inter-state orders', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Karnataka'; // Different from STORE_STATE (Tamil Nadu)
            const mockProduct = { id: 'p1', price: 1000, gstRate: 18, name: 'P1' };

            mockProductRepo.find.mockResolvedValue([mockProduct]);

            const result = await service.calculateTax(items, state);

            expect(result.grandTotal).toBe(1180);
            expect(result.totalTax).toBe(180);
            expect(result.isInterState).toBe(true);
            expect(result.breakdown.igst).toBe(180);
            expect(result.breakdown.cgst).toBe(0);
        });

        it('should calculate CGST/SGST for intra-state orders', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';
            const mockProduct = { id: 'p1', price: 1000, gstRate: 18, name: 'P1' };

            mockProductRepo.find.mockResolvedValue([mockProduct]);

            const result = await service.calculateTax(items, state);

            expect(result.grandTotal).toBe(1180);
            expect(result.totalTax).toBe(180);
            expect(result.isInterState).toBe(false);
            expect(result.breakdown.cgst).toBe(90);
            expect(result.breakdown.sgst).toBe(90);
        });

        it('should use category GST rate if product rate is null', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';
            const mockProduct = {
                id: 'p1',
                price: 1000,
                gstRate: null,
                category: { gstRate: 12 },
                name: 'P1'
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);

            const result = await service.calculateTax(items, state);

            expect(result.totalTax).toBe(120);
        });
    });

    describe('create', () => {
        it('should successfully create an order', async () => {
            const userId = 'u1';
            const createDto: CreateOrderDto = {
                items: [{ productId: 'p1', quantity: 1, productName: 'P1', price: 1000 }],
                deliveryState: 'Tamil Nadu',
                deliveryAddress: 'Addr',
                deliveryPhone: '123',
                paymentMethod: 'COD'
            };

            const mockProduct = { id: 'p1', price: 1000, gstRate: 18, name: 'P1' };
            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockOrderItemRepo.create.mockImplementation(d => d);
            mockOrderRepo.create.mockImplementation(d => d);
            mockOrderRepo.save.mockResolvedValue({ id: 'o1' });
            mockStatusHistoryRepo.create.mockImplementation(d => d);

            // We need to spy on findOne since create calls it
            const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'o1' } as any);

            const result = await service.create(userId, createDto);

            expect(result).toBeDefined();
            expect(mockOrderRepo.save).toHaveBeenCalled();
            expect(mockStatusHistoryRepo.save).toHaveBeenCalled();
            expect(findOneSpy).toHaveBeenCalledWith('o1');
        });
    });

    describe('findAllByUser', () => {
        it('should return paginated orders for user', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);
            const result = await service.findAllByUser('u1', 1, 10);
            expect(result.items).toBeDefined();
            expect(result.total).toBe(0);
        });
    });

    describe('updateStatus', () => {
        it('should update status and add history', async () => {
            const orderId = 'o1';
            const dto = { status: 'Confirmed' as OrderStatus, message: 'Great' };

            mockOrderRepo.update.mockResolvedValue({});
            mockStatusHistoryRepo.create.mockImplementation(d => d);
            jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'o1', status: 'Confirmed' } as any);

            const result = await service.updateStatus(orderId, dto, 'admin1');

            expect(mockOrderRepo.update).toHaveBeenCalledWith(orderId, { status: 'Confirmed' });
            expect(mockStatusHistoryRepo.save).toHaveBeenCalled();
        });
    });
});
