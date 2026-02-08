import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, ILike } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

describe('ProductsService', () => {
    let service: ProductsService;
    let productRepo: Repository<Product>;
    let categoryRepo: Repository<Category>;
    let brandRepo: Repository<Brand>;
    let imageRepo: Repository<ProductImage>;
    let variantRepo: Repository<ProductVariant>;
    let fileStorageService: FileStorageService;

    const mockProductRepo = {
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockCategoryRepo = {
        findOneBy: jest.fn(),
    };

    const mockBrandRepo = {
        findOneBy: jest.fn(),
    };

    const mockImageRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOneBy: jest.fn(),
        delete: jest.fn(),
    };

    const mockVariantRepo = {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    const mockFileStorageService = {
        saveFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
                { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
                { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
                { provide: getRepositoryToken(ProductVariant), useValue: mockVariantRepo },
                { provide: FileStorageService, useValue: mockFileStorageService },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
        brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
        imageRepo = module.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
        variantRepo = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
        fileStorageService = module.get<FileStorageService>(FileStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated products', async () => {
            const items = [{ id: '1', name: 'Product 1' }];
            const total = 1;
            mockProductRepo.findAndCount.mockResolvedValue([items, total]);

            const result = await service.findAll(1, 10);

            expect(result).toEqual({ items, total, page: 1, limit: 10 });
            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
                take: 10,
                skip: 0,
            }));
        });

        it('should apply filters correctly', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, {
                categoryId: 'cat1',
                brandId: 'brand1',
                minPrice: 100,
                maxPrice: 500,
                q: 'test',
                isFeatured: true
            });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.arrayContaining([
                    expect.objectContaining({
                        category: { id: 'cat1' },
                        brand: { id: 'brand1' },
                        isFeatured: true,
                        price: Between(100, 500),
                        name: ILike('%test%'),
                    }),
                    expect.objectContaining({
                        category: { id: 'cat1' },
                        brand: { id: 'brand1' },
                        isFeatured: true,
                        price: Between(100, 500),
                        description: ILike('%test%'),
                    }),
                ]),
            }));
        });
    });

    describe('findOne', () => {
        it('should return a product', async () => {
            const product = { id: '1', name: 'Product 1' };
            mockProductRepo.findOne.mockResolvedValue(product);

            const result = await service.findOne('1');

            expect(result).toEqual(product);
            expect(mockProductRepo.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['category', 'brand', 'images', 'variants'],
            });
        });
    });

    describe('createProduct', () => {
        it('should create a product with variants', async () => {
            const createDto: CreateProductDto = {
                name: 'New Product',
                price: 100,
                categoryId: 'cat1',
                brandId: 'brand1',
                variants: [{ sku: 'v1', price: 110 }]
            } as any;

            const category = { id: 'cat1' };
            const brand = { id: 'brand1' };
            const savedProduct = { id: 'p1', name: 'New Product' };

            mockCategoryRepo.findOneBy.mockResolvedValue(category);
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.create.mockReturnValue(savedProduct);
            mockProductRepo.save.mockResolvedValue(savedProduct);
            mockVariantRepo.create.mockImplementation(v => v);
            jest.spyOn(service, 'findOne').mockResolvedValue(savedProduct as any);

            const result = await service.createProduct(createDto);

            expect(result).toEqual(savedProduct);
            expect(mockCategoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'cat1' });
            expect(mockBrandRepo.findOneBy).toHaveBeenCalledWith({ id: 'brand1' });
            expect(mockProductRepo.save).toHaveBeenCalled();
            expect(mockVariantRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if category not found', async () => {
            mockCategoryRepo.findOneBy.mockResolvedValue(null);

            await expect(service.createProduct({ categoryId: 'invalid' } as any))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProduct', () => {
        it('should update a product and replace variants', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Name',
                variants: [{ sku: 'v2', price: 120 }]
            } as any;

            mockProductRepo.findOneBy.mockResolvedValue({ id: 'p1' });
            mockProductRepo.update.mockResolvedValue({});
            mockVariantRepo.delete.mockResolvedValue({});
            mockVariantRepo.create.mockImplementation(v => v);
            jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1', name: 'Updated Name' } as any);

            const result = await service.updateProduct('p1', updateDto);

            expect(result?.name).toBe('Updated Name');
            expect(mockProductRepo.update).toHaveBeenCalledWith('p1', expect.any(Object));
            expect(mockVariantRepo.delete).toHaveBeenCalled();
            expect(mockVariantRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if product not found', async () => {
            mockProductRepo.findOneBy.mockResolvedValue(null);
            await expect(service.updateProduct('invalid', {} as any))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteProduct', () => {
        it('should delete product and its images', async () => {
            const product = {
                id: 'p1',
                images: [{ url: 'img1.webp' }]
            };
            jest.spyOn(service, 'findOne').mockResolvedValue(product as any);
            mockProductRepo.delete.mockResolvedValue({});

            await service.deleteProduct('p1');

            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('img1.webp');
            expect(mockProductRepo.delete).toHaveBeenCalledWith('p1');
        });
    });

    describe('image management', () => {
        it('should add product image', async () => {
            const file = { buffer: Buffer.from('test') } as Express.Multer.File;
            mockFileStorageService.saveFile.mockResolvedValue('new-img.webp');
            mockImageRepo.create.mockReturnValue({ url: 'new-img.webp' });
            mockImageRepo.save.mockResolvedValue({ url: 'new-img.webp' });

            const result = await service.addProductImage('p1', file, true);

            expect(result.url).toBe('new-img.webp');
            expect(mockFileStorageService.saveFile).toHaveBeenCalled();
            expect(mockImageRepo.save).toHaveBeenCalled();
        });

        it('should remove product image', async () => {
            mockImageRepo.findOneBy.mockResolvedValue({ id: 'i1', url: 'img.webp' });
            mockImageRepo.delete.mockResolvedValue({});

            await service.removeProductImage('i1');

            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('img.webp');
            expect(mockImageRepo.delete).toHaveBeenCalledWith('i1');
        });
    });
});
