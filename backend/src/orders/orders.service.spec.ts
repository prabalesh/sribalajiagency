import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

describe('OrdersService', () => {
    let service: OrdersService;
    let orderRepo: Repository<Order>;
    let orderItemRepo: Repository<OrderItem>;
    let statusHistoryRepo: Repository<OrderStatusHistory>;
    let productRepo: Repository<Product>;
    let categoryRepo: Repository<Category>;
    let variantRepo: Repository<ProductVariant>;
    let dataSource: DataSource;

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

    const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        isReleased: false,
        manager: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockDataSource = {
        createQueryRunner: jest.fn(() => mockQueryRunner),
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
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
        orderItemRepo = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
        statusHistoryRepo = module.get<Repository<OrderStatusHistory>>(getRepositoryToken(OrderStatusHistory));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
        variantRepo = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
        dataSource = module.get<DataSource>(DataSource);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateTax', () => {
        it('should calculate IGST for inter-state orders (Karnataka)', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Karnataka'; // Different from Tamil Nadu

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: 18,
                category: null
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.subtotal).toBe(1000);
            expect(result.totalTax).toBe(180);
            expect(result.grandTotal).toBe(1180);
            expect(result.isInterState).toBe(true);
            expect(result.breakdown.igst).toBe(180);
            expect(result.breakdown.cgst).toBe(0);
            expect(result.breakdown.sgst).toBe(0);
        });

        it('should calculate CGST/SGST for intra-state orders (Tamil Nadu)', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu'; // Same as store state

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: 18,
                category: null
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.subtotal).toBe(1000);
            expect(result.totalTax).toBe(180);
            expect(result.grandTotal).toBe(1180);
            expect(result.isInterState).toBe(false);
            expect(result.breakdown.igst).toBe(0);
            expect(result.breakdown.cgst).toBe(90);
            expect(result.breakdown.sgst).toBe(90);
        });

        it('should handle case-insensitive state comparison', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'TAMIL NADU'; // Uppercase

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: 18,
                category: null
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.isInterState).toBe(false); // Should match Tamil Nadu
            expect(result.breakdown.cgst).toBe(90);
            expect(result.breakdown.sgst).toBe(90);
        });

        it('should use category GST rate when product rate is null', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: null,
                category: { gstRate: 12 }
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.totalTax).toBe(120); // 12% of 1000
            expect(result.grandTotal).toBe(1120);
        });

        it('should use category GST rate when product rate is undefined', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: undefined,
                category: { gstRate: 5 }
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.totalTax).toBe(50); // 5% of 1000
        });

        it('should use default 18% GST when both product and category rates are missing', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: null,
                category: { gstRate: null }
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.totalTax).toBe(180); // Default 18%
        });

        it('should calculate tax for multiple items', async () => {
            const items = [
                { productId: 'p1', quantity: 2 },
                { productId: 'p2', quantity: 1 }
            ];
            const state = 'Tamil Nadu';

            const mockProducts = [
                { id: 'p1', name: 'Product 1', price: 1000, gstRate: 18, category: null },
                { id: 'p2', name: 'Product 2', price: 500, gstRate: 12, category: null }
            ];

            mockProductRepo.find.mockResolvedValue(mockProducts);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            // p1: 1000 * 2 = 2000, tax = 360
            // p2: 500 * 1 = 500, tax = 60
            // Total: subtotal = 2500, tax = 420
            expect(result.subtotal).toBe(2500);
            expect(result.totalTax).toBe(420);
            expect(result.grandTotal).toBe(2920);
        });

        it('should use variant price when variantId is provided', async () => {
            const items = [
                { productId: 'p1', variantId: 'v1', quantity: 1 }
            ];
            const state = 'Tamil Nadu';

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000, // Base price
                gstRate: 18,
                category: null
            };

            const mockVariant = {
                id: 'v1',
                price: 1500, // Variant price (higher)
                name: 'Large'
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([mockVariant]);

            const result = await service.calculateTax(items, state);

            // Should use variant price 1500, not product price 1000
            expect(result.subtotal).toBe(1500);
            expect(result.totalTax).toBe(270); // 18% of 1500
            expect(result.grandTotal).toBe(1770);
        });

        it('should handle products with 0% GST rate', async () => {
            const items = [{ productId: 'p1', quantity: 1 }];
            const state = 'Tamil Nadu';

            const mockProduct = {
                id: 'p1',
                name: 'Essential Good',
                price: 1000,
                gstRate: 0, // Tax-exempt
                category: null
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.subtotal).toBe(1000);
            expect(result.totalTax).toBe(0);
            expect(result.grandTotal).toBe(1000);
        });

        it('should filter out items with missing products', async () => {
            const items = [
                { productId: 'p1', quantity: 1 },
                { productId: 'p2', quantity: 1 } // This product doesn't exist
            ];
            const state = 'Tamil Nadu';

            const mockProducts = [
                { id: 'p1', name: 'Product 1', price: 1000, gstRate: 18, category: null }
                // p2 is missing
            ];

            mockProductRepo.find.mockResolvedValue(mockProducts);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            // Should only calculate for p1
            expect(result.subtotal).toBe(1000);
            expect(result.totalTax).toBe(180);
        });

        it('should handle empty items array', async () => {
            const items = [];
            const state = 'Tamil Nadu';

            mockProductRepo.find.mockResolvedValue([]);
            mockVariantRepo.find.mockResolvedValue([]);

            const result = await service.calculateTax(items, state);

            expect(result.subtotal).toBe(0);
            expect(result.totalTax).toBe(0);
            expect(result.grandTotal).toBe(0);
        });
    });

    describe('create', () => {
        it('should successfully create an order with COD payment', async () => {
            const userId = 'user_123';
            const createDto: CreateOrderDto = {
                items: [
                    {
                        productId: 'p1',
                        quantity: 2,
                        productName: 'Product 1',
                        price: 1000
                    }
                ],
                deliveryState: 'Tamil Nadu',
                deliveryAddress: '123 Main St, Chennai',
                deliveryPhone: '+919876543210',
                paymentMethod: 'COD'
            };

            const mockProduct = {
                id: 'p1',
                name: 'Product 1',
                price: 1000,
                gstRate: 18,
                category: null
            };

            const mockOrderItem = {
                product: { id: 'p1' },
                productName: 'Product 1',
                price: 1000,
                quantity: 2
            };

            const savedOrder = {
                id: 'order_123',
                user: { id: userId },
                totalAmount: 2360,
                status: 'Pending'
            };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);
            mockOrderItemRepo.create.mockReturnValue(mockOrderItem);
            mockOrderRepo.create.mockReturnValue(savedOrder);
            mockOrderRepo.save.mockResolvedValue(savedOrder);
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue(savedOrder as any);

            const result = await service.create(userId, createDto);

            expect(result).toEqual(savedOrder);
            expect(mockOrderRepo.save).toHaveBeenCalled();
            expect(mockStatusHistoryRepo.save).toHaveBeenCalled();
            expect(service.findOne).toHaveBeenCalledWith('order_123');
        });

        it('should create order with multiple items', async () => {
            const userId = 'user_123';
            const createDto: CreateOrderDto = {
                items: [
                    { productId: 'p1', quantity: 1, productName: 'P1', price: 1000 },
                    { productId: 'p2', quantity: 2, productName: 'P2', price: 500 }
                ],
                deliveryState: 'Karnataka',
                deliveryAddress: 'Address',
                deliveryPhone: '1234567890',
                paymentMethod: 'Online'
            };

            const mockProducts = [
                { id: 'p1', name: 'P1', price: 1000, gstRate: 18, category: null },
                { id: 'p2', name: 'P2', price: 500, gstRate: 12, category: null }
            ];

            mockProductRepo.find.mockResolvedValue(mockProducts);
            mockVariantRepo.find.mockResolvedValue([]);
            mockOrderItemRepo.create.mockImplementation(data => data);
            mockOrderRepo.create.mockImplementation(data => data);
            mockOrderRepo.save.mockResolvedValue({ id: 'order_456' });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order_456' } as any);

            const result = await service.create(userId, createDto);

            expect(mockOrderItemRepo.create).toHaveBeenCalledTimes(2);
            expect(result?.id).toBe('order_456');
        });

        it('should create order with variant items', async () => {
            const userId = 'user_123';
            const createDto: CreateOrderDto = {
                items: [
                    {
                        productId: 'p1',
                        variantId: 'v1',
                        quantity: 1,
                        productName: 'P1',
                        variantName: 'Large',
                        price: 1500
                    }
                ],
                deliveryState: 'Tamil Nadu',
                deliveryAddress: 'Address',
                deliveryPhone: '1234567890',
                paymentMethod: 'COD'
            };

            const mockProduct = { id: 'p1', name: 'P1', price: 1000, gstRate: 18, category: null };
            const mockVariant = { id: 'v1', price: 1500, name: 'Large' };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([mockVariant]);
            mockOrderItemRepo.create.mockImplementation(data => data);
            mockOrderRepo.create.mockImplementation(data => data);
            mockOrderRepo.save.mockResolvedValue({ id: 'order_789' });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order_789' } as any);

            const result = await service.create(userId, createDto);

            expect(result?.id).toBe('order_789');
        });

        it('should include delivery notes if provided', async () => {
            const userId = 'user_123';
            const createDto: CreateOrderDto = {
                items: [{ productId: 'p1', quantity: 1, productName: 'P1', price: 1000 }],
                deliveryState: 'Tamil Nadu',
                deliveryAddress: 'Address',
                deliveryPhone: '1234567890',
                deliveryNotes: 'Leave at front door',
                paymentMethod: 'COD'
            };

            const mockProduct = { id: 'p1', name: 'P1', price: 1000, gstRate: 18, category: null };

            mockProductRepo.find.mockResolvedValue([mockProduct]);
            mockVariantRepo.find.mockResolvedValue([]);
            mockOrderItemRepo.create.mockImplementation(data => data);
            mockOrderRepo.create.mockImplementation(data => ({ ...data, id: 'order_notes' }));
            mockOrderRepo.save.mockResolvedValue({ id: 'order_notes' });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order_notes' } as any);

            await service.create(userId, createDto);

            expect(mockOrderRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    deliveryNotes: 'Leave at front door'
                })
            );
        });
    });

    describe('findAllByUser', () => {
        it('should return paginated orders for user', async () => {
            const userId = 'user_123';
            const mockOrders = [
                { id: 'o1', user: { id: userId }, totalAmount: 1000, status: 'Pending' },
                { id: 'o2', user: { id: userId }, totalAmount: 2000, status: 'Confirmed' }
            ];

            mockOrderRepo.findAndCount.mockResolvedValue([mockOrders, 2]);

            const result = await service.findAllByUser(userId, 1, 10);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { user: { id: userId } }
                })
            );
        });

        it('should filter by status when provided', async () => {
            const userId = 'user_123';
            const status: OrderStatus = 'Confirmed';

            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAllByUser(userId, 1, 10, status);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { user: { id: userId }, status: 'Confirmed' }
                })
            );
        });

        it('should cap limit to 50', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAllByUser('user_123', 1, 100);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });

        it('should calculate skip correctly for pagination', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAllByUser('user_123', 3, 20);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 40 }) // (3-1) * 20
            );
        });

        it('should return empty results when user has no orders', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.findAllByUser('user_new', 1, 10);

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    describe('findAll', () => {
        it('should return all orders paginated', async () => {
            const mockOrders = [
                { id: 'o1', totalAmount: 1000 },
                { id: 'o2', totalAmount: 2000 }
            ];

            mockOrderRepo.findAndCount.mockResolvedValue([mockOrders, 2]);

            const result = await service.findAll(1, 20);

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
                    order: { createdAt: 'DESC' }
                })
            );
        });

        it('should cap limit to 50', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 200);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });

        it('should handle pagination correctly', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(2, 25);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 25,
                    skip: 25 // (2-1) * 25
                })
            );
        });
    });

    describe('getOrdersByQueue', () => {
        it('should return orders queue (Pending, Confirmed, Packaging)', async () => {
            const mockOrders = [
                { id: 'o1', status: 'Pending' },
                { id: 'o2', status: 'Confirmed' },
                { id: 'o3', status: 'Packaging' }
            ];

            mockOrderRepo.findAndCount.mockResolvedValue([mockOrders, 3]);

            const result = await service.getOrdersByQueue('orders', 1, 20);

            expect(result.items).toHaveLength(3);
            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: In(['Pending', 'Confirmed', 'Packaging']) }
                })
            );
        });

        it('should return delivery queue (Dispatched)', async () => {
            const mockOrders = [
                { id: 'o4', status: 'Dispatched' }
            ];

            mockOrderRepo.findAndCount.mockResolvedValue([mockOrders, 1]);

            const result = await service.getOrdersByQueue('delivery', 1, 20);

            expect(result.items).toHaveLength(1);
            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: In(['Dispatched']) }
                })
            );
        });

        it('should cap limit to 50', async () => {
            mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.getOrdersByQueue('orders', 1, 100);

            expect(mockOrderRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });
    });

    describe('findOne', () => {
        it('should return order by id with all relations', async () => {
            const mockOrder = {
                id: 'order_123',
                user: { id: 'user_123' },
                items: [{ id: 'item_1' }],
                statusHistory: [{ status: 'Pending' }]
            };

            mockOrderRepo.findOne.mockResolvedValue(mockOrder);

            const result = await service.findOne('order_123');

            expect(result).toEqual(mockOrder);
            expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'order_123' },
                relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy']
            });
        });

        it('should return null if order not found', async () => {
            mockOrderRepo.findOne.mockResolvedValue(null);

            const result = await service.findOne('non_existent');

            expect(result).toBeNull();
        });
    });

    describe('updateStatus', () => {
        it('should update order status and create history', async () => {
            const orderId = 'order_123';
            const updateDto: UpdateOrderDto = {
                status: 'Confirmed' as OrderStatus
            };
            const userId = 'admin_456';

            mockOrderRepo.update.mockResolvedValue({ affected: 1 });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({
                id: orderId,
                status: 'Confirmed'
            } as any);

            const result = await service.updateStatus(orderId, updateDto, userId);

            expect(mockOrderRepo.update).toHaveBeenCalledWith(orderId, { status: 'Confirmed' });
            expect(mockStatusHistoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { id: orderId },
                    status: 'Confirmed',
                    changedBy: { id: userId }
                })
            );
            expect(mockStatusHistoryRepo.save).toHaveBeenCalled();
            expect(result?.id).toBe(orderId);
        });

        it('should add history with custom message', async () => {
            const orderId = 'order_123';
            const updateDto: UpdateOrderDto = {
                status: 'Packaging' as OrderStatus,
                message: 'Started packing items'
            };

            mockOrderRepo.update.mockResolvedValue({ affected: 1 });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({ id: orderId } as any);

            await service.updateStatus(orderId, updateDto);

            expect(mockStatusHistoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Started packing items'
                })
            );
        });

        it('should add history without status update (message only)', async () => {
            const orderId = 'order_123';
            const updateDto: UpdateOrderDto = {
                message: 'Customer called for delivery time'
            };

            mockOrderRepo.findOne.mockResolvedValue({ id: orderId, status: 'Dispatched' });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValueOnce({ status: 'Dispatched' } as any)
                .mockResolvedValueOnce({ id: orderId, status: 'Dispatched' } as any);

            await service.updateStatus(orderId, updateDto);

            expect(mockOrderRepo.update).not.toHaveBeenCalled();
            expect(mockStatusHistoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'Dispatched',
                    message: 'Customer called for delivery time'
                })
            );
        });

        it('should work without userId (system update)', async () => {
            const orderId = 'order_123';
            const updateDto: UpdateOrderDto = {
                status: 'Delivered' as OrderStatus
            };

            mockOrderRepo.update.mockResolvedValue({ affected: 1 });
            mockStatusHistoryRepo.create.mockImplementation(data => data);
            mockStatusHistoryRepo.save.mockResolvedValue({});

            jest.spyOn(service, 'findOne').mockResolvedValue({ id: orderId } as any);

            await service.updateStatus(orderId, updateDto);

            expect(mockStatusHistoryRepo.create).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    changedBy: expect.anything()
                })
            );
        });
    });

    describe('getOrderHistory', () => {
        it('should return order status history in chronological order', async () => {
            const orderId = 'order_123';
            const mockHistory = [
                {
                    id: 'h1',
                    status: 'Pending',
                    message: 'Order placed',
                    createdAt: new Date('2026-01-01')
                },
                {
                    id: 'h2',
                    status: 'Confirmed',
                    message: 'Order confirmed',
                    createdAt: new Date('2026-01-02')
                },
                {
                    id: 'h3',
                    status: 'Dispatched',
                    message: 'Out for delivery',
                    createdAt: new Date('2026-01-03')
                }
            ];

            mockStatusHistoryRepo.find.mockResolvedValue(mockHistory);

            const result = await service.getOrderHistory(orderId);

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockHistory);
            expect(mockStatusHistoryRepo.find).toHaveBeenCalledWith({
                where: { order: { id: orderId } },
                relations: ['changedBy'],
                order: { createdAt: 'ASC' }
            });
        });

        it('should return empty array if no history', async () => {
            mockStatusHistoryRepo.find.mockResolvedValue([]);

            const result = await service.getOrderHistory('new_order');

            expect(result).toEqual([]);
        });
    });
});