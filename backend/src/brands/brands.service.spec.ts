import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('BrandsService', () => {
    let service: BrandsService;
    let brandRepo: Repository<Brand>;
    let productRepo: Repository<Product>;
    let fileStorage: FileStorageService;

    const mockBrandRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockProductRepo = {
        count: jest.fn(),
        find: jest.fn(),
    };

    const mockFileStorage = {
        saveFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrandsService,
                { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: FileStorageService, useValue: mockFileStorage },
                { provide: DataSource, useValue: {} },
            ],
        }).compile();

        service = module.get<BrandsService>(BrandsService);
        brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        fileStorage = module.get<FileStorageService>(FileStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of brands', async () => {
            mockBrandRepo.find.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a brand if found', async () => {
            const brand = { id: '1', name: 'Brand' };
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            const result = await service.findOne('1');
            expect(result).toEqual(brand);
        });

        it('should throw NotFoundException if not found', async () => {
            mockBrandRepo.findOneBy.mockResolvedValue(null);
            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a brand', async () => {
            const dto = { name: 'New Brand', slug: 'new-brand' };
            mockBrandRepo.create.mockReturnValue(dto);
            mockBrandRepo.save.mockResolvedValue({ id: '1', ...dto });

            const result = await service.create(dto as any);
            expect(result.id).toBe('1');
        });

        it('should throw ConflictException on duplicate slug', async () => {
            mockBrandRepo.save.mockRejectedValue({ code: '23505' });
            await expect(service.create({} as any)).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should delete a brand if not used', async () => {
            const brand = { id: '1', name: 'Brand', image: null };
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.count.mockResolvedValue(0);
            mockBrandRepo.delete.mockResolvedValue({ affected: 1 });

            await service.delete('1');
            expect(mockBrandRepo.delete).toHaveBeenCalledWith('1');
        });

        it('should throw BadRequestException if brand has products', async () => {
            const brand = { id: '1', name: 'Brand' };
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.count.mockResolvedValue(5);

            await expect(service.delete('1')).rejects.toThrow(BadRequestException);
        });

        it('should delete brand image if it exists', async () => {
            const brand = { id: '1', name: 'Brand', image: '/uploads/img.jpg' };
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.count.mockResolvedValue(0);
            mockBrandRepo.delete.mockResolvedValue({ affected: 1 });

            await service.delete('1');
            expect(mockFileStorage.deleteFile).toHaveBeenCalled();
        });
    });

    describe('uploadImage', () => {
        it('should upload image and update brand', async () => {
            const brand = { id: '1', name: 'Brand', image: null };
            const file = { buffer: Buffer.from('test') } as any;
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockFileStorage.saveFile.mockResolvedValue('/uploads/new.jpg');
            mockBrandRepo.save.mockImplementation(b => b);

            const result = await service.uploadImage('1', file);
            expect(result.image).toBe('/uploads/new.jpg');
        });
    });
});
