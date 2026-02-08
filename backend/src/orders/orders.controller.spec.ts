import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('OrdersController', () => {
    let controller: OrdersController;
    let service: OrdersService;

    const mockOrdersService = {
        calculateTax: jest.fn(),
        create: jest.fn(),
        findAllByUser: jest.fn(),
        getOrdersByQueue: jest.fn(),
        findOne: jest.fn(),
        getOrderHistory: jest.fn(),
        findAll: jest.fn(),
        updateStatus: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                {
                    provide: OrdersService,
                    useValue: mockOrdersService,
                },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({ canActivate: () => true })
            .overrideGuard(PermissionsGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<OrdersController>(OrdersController);
        service = module.get<OrdersService>(OrdersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('calculateTax', () => {
        it('should call service.calculateTax', async () => {
            const data = { items: [{ productId: 'p1', quantity: 1 }], state: 'TN' };
            await controller.calculateTax(data);
            expect(service.calculateTax).toHaveBeenCalledWith(data.items, data.state);
        });
    });

    describe('create', () => {
        it('should call service.create', async () => {
            const req = { user: { id: 'u1' } };
            const dto = { items: [] } as any;
            await controller.create(req, dto);
            expect(service.create).toHaveBeenCalledWith('u1', dto);
        });
    });

    describe('findAllByUser', () => {
        it('should call service.findAllByUser with query params', async () => {
            const req = { user: { id: 'u1' } };
            await controller.findAllByUser(req, '2', '10', 'Pending');
            expect(service.findAllByUser).toHaveBeenCalledWith('u1', 2, 10, 'Pending');
        });
    });

    describe('getOrdersByQueue', () => {
        it('should call service.getOrdersByQueue', async () => {
            await controller.getOrdersByQueue('orders', '1', '20');
            expect(service.getOrdersByQueue).toHaveBeenCalledWith('orders', 1, 20);
        });
    });

    describe('updateStatus', () => {
        it('should call service.updateStatus', async () => {
            const req = { user: { id: 'admin1' } };
            const dto = { status: 'Confirmed' } as any;
            await controller.updateStatus('o1', dto, req);
            expect(service.updateStatus).toHaveBeenCalledWith('o1', dto, 'admin1');
        });
    });
});
