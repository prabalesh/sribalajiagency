import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let categoryRepo: Repository<Category>;
    let productRepo: Repository<Product>;

    const mockCategoryRepo = {
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
    };
    const mockDataSource = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of categories', async () => {
            mockCategoryRepo.find.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a category if found', async () => {
            const category = { id: '1', name: 'Cat' };
            mockCategoryRepo.findOne.mockResolvedValue(category);
            const result = await service.findOne('1');
            expect(result).toEqual(category);
        });

        it('should throw NotFoundException if not found', async () => {
            mockCategoryRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a category and generate slug', async () => {
            const dto = { name: 'Test Category' };
            const savedCategory = { id: '1', name: 'Test Category', slug: 'test-category' };

            mockCategoryRepo.create.mockReturnValue(savedCategory);
            mockCategoryRepo.save.mockResolvedValue(savedCategory);

            const result = await service.create(dto as any);
            expect(result.slug).toBe('test-category');
        });

        it('should throw ConflictException on duplicate slug', async () => {
            mockCategoryRepo.save.mockRejectedValue({ code: '23505' });
            await expect(service.create({ name: 'Dup', slug: 'dup' } as any)).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should delete a category if empty', async () => {
            const category = { id: '1', name: 'Cat', children: [] };
            mockCategoryRepo.findOne.mockResolvedValue(category);
            productRepo.count = jest.fn().mockResolvedValue(0);
            mockCategoryRepo.delete.mockResolvedValue({ affected: 1 });

            await service.delete('1');
            expect(mockCategoryRepo.delete).toHaveBeenCalledWith('1');
        });

        it('should throw BadRequestException if category has subcategories', async () => {
            const category = { id: '1', children: [{ id: '2' }] };
            mockCategoryRepo.findOne.mockResolvedValue(category);

            await expect(service.delete('1')).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if category has products', async () => {
            const category = { id: '1', children: [] };
            mockCategoryRepo.findOne.mockResolvedValue(category);
            productRepo.count = jest.fn().mockResolvedValue(10);

            await expect(service.delete('1')).rejects.toThrow(BadRequestException);
        });
    });
});
