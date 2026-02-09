import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CouponsService', () => {
    let service: CouponsService;
    let repo: Repository<Coupon>;

    const mockCoupon = {
        id: 'uuid',
        name: 'Test Coupon',
        code: 'TEST20',
        discountType: 'percentage',
        discountValue: 20,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        isActive: true,
        minOrderAmount: 100,
        maxDiscountAmount: 50,
    };

    const mockRepo = {
        find: jest.fn().mockResolvedValue([mockCoupon]),
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        findOneBy: jest.fn().mockResolvedValue(mockCoupon),
        create: jest.fn().mockReturnValue(mockCoupon),
        save: jest.fn().mockResolvedValue(mockCoupon),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CouponsService,
                {
                    provide: getRepositoryToken(Coupon),
                    useValue: mockRepo,
                },
            ],
        }).compile();

        service = module.get<CouponsService>(CouponsService);
        repo = module.get<Repository<Coupon>>(getRepositoryToken(Coupon));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of coupons', async () => {
            const result = await service.findAll();
            expect(result).toEqual([mockCoupon]);
            expect(repo.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a coupon if found', async () => {
            const result = await service.findOne('uuid');
            expect(result).toEqual(mockCoupon);
            expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'uuid' });
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepo.findOneBy.mockResolvedValueOnce(null);
            await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a coupon', async () => {
            const dto: any = { name: 'New', code: 'NEW10', discountType: 'flat', discountValue: 10 };
            const result = await service.create(dto);
            expect(result).toEqual(mockCoupon);
            expect(repo.create).toHaveBeenCalledWith(dto);
            expect(repo.save).toHaveBeenCalled();
        });
    });

    describe('validateCoupon', () => {
        it('should return coupon if valid', async () => {
            const result = await service.validateCoupon('TEST20', 150);
            expect(result.coupon).toEqual(mockCoupon);
            expect(result.discount).toBe(30); // 20% of 150
            expect(result.finalAmount).toBe(120);
        });

        it('should throw BadRequestException if coupon not found', async () => {
            mockRepo.findOneBy.mockResolvedValueOnce(null);
            await expect(service.validateCoupon('INVALID', 100)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if coupon is inactive', async () => {
            mockRepo.findOneBy.mockResolvedValueOnce(null); // findByCode uses { isActive: true }
            await expect(service.validateCoupon('TEST20', 100)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if amount is less than minOrderAmount', async () => {
            await expect(service.validateCoupon('TEST20', 50)).rejects.toThrow(BadRequestException);
        });
    });
});
