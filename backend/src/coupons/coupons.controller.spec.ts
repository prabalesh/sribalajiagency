import { Test, TestingModule } from '@nestjs/testing';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

describe('CouponsController', () => {
    let controller: CouponsController;
    let service: CouponsService;

    const mockCoupon = { id: 'uuid', name: 'Test', code: 'TEST10' };

    const mockService = {
        findAll: jest.fn().mockResolvedValue([mockCoupon]),
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        create: jest.fn().mockResolvedValue(mockCoupon),
        update: jest.fn().mockResolvedValue(mockCoupon),
        delete: jest.fn().mockResolvedValue({ success: true }),
        validateCoupon: jest.fn().mockResolvedValue(mockCoupon),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CouponsController],
            providers: [
                {
                    provide: CouponsService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<CouponsController>(CouponsController);
        service = module.get<CouponsService>(CouponsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all coupons', async () => {
            expect(await controller.findAll()).toEqual([mockCoupon]);
        });
    });

    describe('create', () => {
        it('should create a coupon', async () => {
            const dto: any = { name: 'New', code: 'NEW10' };
            expect(await controller.create(dto)).toEqual(mockCoupon);
            expect(service.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('validate', () => {
        it('should validate a coupon', async () => {
            expect(await controller.validate('TEST10', '100')).toEqual(mockCoupon);
            expect(service.validateCoupon).toHaveBeenCalledWith('TEST10', 100);
        });
    });
});
