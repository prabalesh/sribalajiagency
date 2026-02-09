import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, ILike, DataSource } from 'typeorm';
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
    let dataSource: DataSource;

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
                ProductsService,
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
                { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
                { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
                { provide: getRepositoryToken(ProductVariant), useValue: mockVariantRepo },
                { provide: FileStorageService, useValue: mockFileStorageService },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
        productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
        categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
        brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
        imageRepo = module.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
        variantRepo = module.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
        fileStorageService = module.get<FileStorageService>(FileStorageService);
        dataSource = module.get<DataSource>(DataSource);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated products with default params', async () => {
            const items = [
                { id: '1', name: 'Product 1', price: 100 },
                { id: '2', name: 'Product 2', price: 200 }
            ];
            const total = 2;
            mockProductRepo.findAndCount.mockResolvedValue([items, total]);

            const result = await service.findAll(1, 20);

            expect(result).toEqual({ items, total, page: 1, limit: 20 });
            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: ['category', 'brand', 'images', 'variants'],
                    order: { isAvailable: 'DESC', name: 'ASC' },
                    take: 20,
                    skip: 0,
                })
            );
        });

        it('should cap limit to 50', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 100);

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });

        it('should calculate skip correctly for pagination', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(3, 20);

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 40 }) // (3-1) * 20 = 40
            );
        });

        it('should filter by categoryId', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { categoryId: 'cat1' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        category: { id: 'cat1' }
                    })
                })
            );
        });

        it('should filter by categorySlug', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { categorySlug: 'electronics' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        category: { slug: 'electronics' }
                    })
                })
            );
        });

        it('should filter by brandId', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { brandId: 'brand1' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brand: { id: 'brand1' }
                    })
                })
            );
        });

        it('should filter by brandSlug', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { brandSlug: 'samsung' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brand: { slug: 'samsung' }
                    })
                })
            );
        });

        it('should filter by isFeatured true', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { isFeatured: true });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isFeatured: true
                    })
                })
            );
        });

        it('should filter by isFeatured false', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { isFeatured: false });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isFeatured: false
                    })
                })
            );
        });

        it('should filter by price range (min and max)', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { minPrice: 100, maxPrice: 500 });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        price: Between(100, 500)
                    })
                })
            );
        });

        it('should filter by minPrice only', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { minPrice: 100 });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        price: MoreThanOrEqual(100)
                    })
                })
            );
        });

        it('should filter by maxPrice only', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { maxPrice: 500 });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        price: LessThanOrEqual(500)
                    })
                })
            );
        });

        it('should search by query in name and description', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { q: 'laptop' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.arrayContaining([
                        expect.objectContaining({
                            name: ILike('%laptop%')
                        }),
                        expect.objectContaining({
                            description: ILike('%laptop%')
                        })
                    ])
                })
            );
        });

        it('should apply multiple filters together', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, {
                categoryId: 'cat1',
                brandId: 'brand1',
                minPrice: 100,
                maxPrice: 500,
                isFeatured: true,
                q: 'test'
            });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
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
                })
            );
        });

        it('should sort by custom field ASC', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { sortBy: 'price', sortOrder: 'ASC' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { price: 'ASC' }
                })
            );
        });

        it('should sort by custom field DESC', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { sortBy: 'price', sortOrder: 'DESC' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { price: 'DESC' }
                })
            );
        });

        it('should use default sort order if sortOrder not provided', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(1, 10, { sortBy: 'name' });

            expect(mockProductRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { name: 'ASC' }
                })
            );
        });

        it('should return empty results when no products found', async () => {
            mockProductRepo.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.findAll(1, 10);

            expect(result).toEqual({ items: [], total: 0, page: 1, limit: 10 });
        });
    });

    describe('findOne', () => {
        it('should return a product by id', async () => {
            const product = {
                id: '1',
                name: 'Product 1',
                price: 100,
                category: { id: 'cat1', name: 'Category 1' },
                brand: { id: 'brand1', name: 'Brand 1' },
                images: [{ id: 'img1', url: 'img1.jpg' }],
                variants: [{ id: 'var1', sku: 'SKU1' }]
            };
            mockProductRepo.findOne.mockResolvedValue(product);

            const result = await service.findOne('1');

            expect(result).toEqual(product);
            expect(mockProductRepo.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['category', 'brand', 'images', 'variants'],
            });
        });

        it('should return null if product not found', async () => {
            mockProductRepo.findOne.mockResolvedValue(null);

            const result = await service.findOne('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('createProduct', () => {
        it('should create a product without variants', async () => {
            const createDto: CreateProductDto = {
                name: 'New Product',
                price: 100,
                description: 'Description',
                categoryId: 'cat1',
                brandId: 'brand1',
            } as any;

            const category = { id: 'cat1', name: 'Category 1' };
            const brand = { id: 'brand1', name: 'Brand 1' };
            const savedProduct = { id: 'p1', name: 'New Product', price: 100 };

            mockCategoryRepo.findOneBy.mockResolvedValue(category);
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.create.mockReturnValue(savedProduct);
            mockProductRepo.save.mockResolvedValue(savedProduct);
            jest.spyOn(service, 'findOne').mockResolvedValue(savedProduct as any);

            const result = await service.createProduct(createDto);

            expect(result).toEqual(savedProduct);
            expect(mockCategoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'cat1' });
            expect(mockBrandRepo.findOneBy).toHaveBeenCalledWith({ id: 'brand1' });
            expect(mockProductRepo.create).toHaveBeenCalled();
            expect(mockProductRepo.save).toHaveBeenCalled();
            expect(service.findOne).toHaveBeenCalledWith('p1');
        });

        it('should create a product with variants', async () => {
            const createDto: CreateProductDto = {
                name: 'New Product',
                price: 100,
                categoryId: 'cat1',
                brandId: 'brand1',
                variants: [
                    { sku: 'v1', name: 'Variant 1', price: 110, stock: 10 },
                    { sku: 'v2', name: 'Variant 2', price: 120, stock: 5 }
                ]
            } as any;

            const category = { id: 'cat1' };
            const brand = { id: 'brand1' };
            const savedProduct = { id: 'p1', name: 'New Product' };

            mockCategoryRepo.findOneBy.mockResolvedValue(category);
            mockBrandRepo.findOneBy.mockResolvedValue(brand);
            mockProductRepo.create.mockReturnValue(savedProduct);
            mockProductRepo.save.mockResolvedValue(savedProduct);
            mockVariantRepo.create.mockImplementation((v) => v);
            mockVariantRepo.save.mockResolvedValue([]);
            jest.spyOn(service, 'findOne').mockResolvedValue(savedProduct as any);

            const result = await service.createProduct(createDto);

            expect(result).toEqual(savedProduct);
            expect(mockVariantRepo.create).toHaveBeenCalledTimes(2);
            expect(mockVariantRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if category not found', async () => {
            const createDto: CreateProductDto = {
                name: 'Product',
                price: 100,
                categoryId: 'invalid-cat',
            } as any;

            mockCategoryRepo.findOneBy.mockResolvedValue(null);

            await expect(service.createProduct(createDto))
                .rejects
                .toThrow(NotFoundException);

            expect(mockCategoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'invalid-cat' });
        });

        it('should throw NotFoundException if brand not found', async () => {
            const createDto: CreateProductDto = {
                name: 'Product',
                price: 100,
                categoryId: 'cat1',
                brandId: 'invalid-brand',
            } as any;

            const category = { id: 'cat1' };
            mockCategoryRepo.findOneBy.mockResolvedValue(category);
            mockBrandRepo.findOneBy.mockResolvedValue(null);

            await expect(service.createProduct(createDto))
                .rejects
                .toThrow(NotFoundException);

            expect(mockBrandRepo.findOneBy).toHaveBeenCalledWith({ id: 'invalid-brand' });
        });

        it('should create product without category if not provided', async () => {
            const createDto: CreateProductDto = {
                name: 'Product',
                price: 100,
            } as any;

            const savedProduct = { id: 'p1', name: 'Product' };
            mockProductRepo.create.mockReturnValue(savedProduct);
            mockProductRepo.save.mockResolvedValue(savedProduct);
            jest.spyOn(service, 'findOne').mockResolvedValue(savedProduct as any);

            const result = await service.createProduct(createDto);

            expect(result).toEqual(savedProduct);
            expect(mockCategoryRepo.findOneBy).not.toHaveBeenCalled();
        });

        it('should create product without brand if not provided', async () => {
            const createDto: CreateProductDto = {
                name: 'Product',
                price: 100,
                categoryId: 'cat1',
            } as any;

            const category = { id: 'cat1' };
            const savedProduct = { id: 'p1', name: 'Product' };

            mockCategoryRepo.findOneBy.mockResolvedValue(category);
            mockProductRepo.create.mockReturnValue(savedProduct);
            mockProductRepo.save.mockResolvedValue(savedProduct);
            jest.spyOn(service, 'findOne').mockResolvedValue(savedProduct as any);

            const result = await service.createProduct(createDto);

            expect(result).toEqual(savedProduct);
            expect(mockBrandRepo.findOneBy).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException on save error', async () => {
            const createDto: CreateProductDto = {
                name: 'Product',
                price: 100,
            } as any;

            mockProductRepo.create.mockReturnValue({});
            mockProductRepo.save.mockRejectedValue(new Error('Database error'));

            await expect(service.createProduct(createDto))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('updateProduct', () => {
        it('should update a product without variants', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Name',
                price: 150,
            } as any;

            const existingProduct = { id: 'p1', name: 'Old Name', price: 100 };
            const updatedProduct = { id: 'p1', name: 'Updated Name', price: 150 };

            mockProductRepo.findOneBy.mockResolvedValue(existingProduct);
            mockProductRepo.update.mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'findOne').mockResolvedValue(updatedProduct as any);

            const result = await service.updateProduct('p1', updateDto);

            expect(result).toEqual(updatedProduct);
            expect(mockProductRepo.findOneBy).toHaveBeenCalledWith({ id: 'p1' });
            expect(mockProductRepo.update).toHaveBeenCalledWith('p1', expect.any(Object));
            expect(service.findOne).toHaveBeenCalledWith('p1');
        });

        it('should update a product and replace variants', async () => {
            const updateDto: UpdateProductDto = {
                name: 'Updated Name',
                variants: [
                    { sku: 'v2', name: 'New Variant', price: 120, stock: 15 }
                ]
            } as any;

            const existingProduct = { id: 'p1' };
            const updatedProduct = { id: 'p1', name: 'Updated Name' };

            mockProductRepo.findOneBy.mockResolvedValue(existingProduct);
            mockProductRepo.update.mockResolvedValue({ affected: 1 } as any);
            mockVariantRepo.delete.mockResolvedValue({ affected: 1 } as any);
            mockVariantRepo.create.mockImplementation((v) => v);
            mockVariantRepo.save.mockResolvedValue([]);
            jest.spyOn(service, 'findOne').mockResolvedValue(updatedProduct as any);

            const result = await service.updateProduct('p1', updateDto);

            expect(result).toEqual(updatedProduct);
            expect(mockVariantRepo.delete).toHaveBeenCalledWith({ product: { id: 'p1' } });
            expect(mockVariantRepo.create).toHaveBeenCalled();
            expect(mockVariantRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if product not found', async () => {
            mockProductRepo.findOneBy.mockResolvedValue(null);

            await expect(service.updateProduct('invalid', {} as any))
                .rejects
                .toThrow(NotFoundException);
        });

        it('should update category if categoryId provided', async () => {
            const updateDto: UpdateProductDto = {
                categoryId: 'cat2',
            } as any;

            const existingProduct = { id: 'p1' };
            const newCategory = { id: 'cat2', name: 'New Category' };
            const updatedProduct = { id: 'p1', category: newCategory };

            mockProductRepo.findOneBy.mockResolvedValue(existingProduct);
            mockCategoryRepo.findOneBy.mockResolvedValue(newCategory);
            mockProductRepo.update.mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'findOne').mockResolvedValue(updatedProduct as any);

            const result = await service.updateProduct('p1', updateDto);

            expect(mockCategoryRepo.findOneBy).toHaveBeenCalledWith({ id: 'cat2' });
            expect(result).toEqual(updatedProduct);
        });

        it('should throw NotFoundException if new category not found', async () => {
            const updateDto: UpdateProductDto = {
                categoryId: 'invalid-cat',
            } as any;

            mockProductRepo.findOneBy.mockResolvedValue({ id: 'p1' });
            mockCategoryRepo.findOneBy.mockResolvedValue(null);

            await expect(service.updateProduct('p1', updateDto))
                .rejects
                .toThrow(NotFoundException);
        });

        it('should update brand if brandId provided', async () => {
            const updateDto: UpdateProductDto = {
                brandId: 'brand2',
            } as any;

            const existingProduct = { id: 'p1' };
            const newBrand = { id: 'brand2', name: 'New Brand' };
            const updatedProduct = { id: 'p1', brand: newBrand };

            mockProductRepo.findOneBy.mockResolvedValue(existingProduct);
            mockBrandRepo.findOneBy.mockResolvedValue(newBrand);
            mockProductRepo.update.mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'findOne').mockResolvedValue(updatedProduct as any);

            const result = await service.updateProduct('p1', updateDto);

            expect(mockBrandRepo.findOneBy).toHaveBeenCalledWith({ id: 'brand2' });
            expect(result).toEqual(updatedProduct);
        });

        it('should throw NotFoundException if new brand not found', async () => {
            const updateDto: UpdateProductDto = {
                brandId: 'invalid-brand',
            } as any;

            mockProductRepo.findOneBy.mockResolvedValue({ id: 'p1' });
            mockBrandRepo.findOneBy.mockResolvedValue(null);

            await expect(service.updateProduct('p1', updateDto))
                .rejects
                .toThrow(NotFoundException);
        });

        it('should throw BadRequestException on update error', async () => {
            mockProductRepo.findOneBy.mockResolvedValue({ id: 'p1' });
            mockProductRepo.update.mockRejectedValue(new Error('Database error'));

            await expect(service.updateProduct('p1', { name: 'Test' } as any))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('deleteProduct', () => {
        it('should delete product without images', async () => {
            const product = { id: 'p1', name: 'Product 1', images: [] };

            jest.spyOn(service, 'findOne').mockResolvedValue(product as any);
            mockProductRepo.delete.mockResolvedValue({ affected: 1 } as any);

            const result = await service.deleteProduct('p1');

            expect(service.findOne).toHaveBeenCalledWith('p1');
            expect(mockFileStorageService.deleteFile).not.toHaveBeenCalled();
            expect(mockProductRepo.delete).toHaveBeenCalledWith('p1');
            expect(result).toEqual({ affected: 1 });
        });

        it('should delete product and its images', async () => {
            const product = {
                id: 'p1',
                images: [
                    { id: 'img1', url: 'img1.webp' },
                    { id: 'img2', url: 'img2.webp' }
                ]
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(product as any);
            mockFileStorageService.deleteFile.mockResolvedValue(undefined);
            mockProductRepo.delete.mockResolvedValue({ affected: 1 } as any);

            await service.deleteProduct('p1');

            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('img1.webp');
            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('img2.webp');
            expect(mockFileStorageService.deleteFile).toHaveBeenCalledTimes(2);
            expect(mockProductRepo.delete).toHaveBeenCalledWith('p1');
        });

        it('should continue deletion even if image deletion fails', async () => {
            const product = {
                id: 'p1',
                images: [{ id: 'img1', url: 'img1.webp' }]
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(product as any);
            mockFileStorageService.deleteFile.mockRejectedValue(new Error('File not found'));
            mockProductRepo.delete.mockResolvedValue({ affected: 1 } as any);

            await service.deleteProduct('p1');

            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('img1.webp');
            expect(mockProductRepo.delete).toHaveBeenCalledWith('p1');
        });

        it('should handle product not found gracefully', async () => {
            jest.spyOn(service, 'findOne').mockResolvedValue(null);
            mockProductRepo.delete.mockResolvedValue({ affected: 0 } as any);

            const result = await service.deleteProduct('non-existent');

            expect(result).toEqual({ affected: 0 });
        });
    });

    describe('addProductImage', () => {
        it('should add product image', async () => {
            const file = {
                originalname: 'test.jpg',
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg'
            } as Express.Multer.File;

            const savedImage = {
                id: 'img1',
                url: 'products/p1/test.webp',
                isPrimary: false,
                product: { id: 'p1' }
            };

            mockFileStorageService.saveFile.mockResolvedValue('products/p1/test.webp');
            mockImageRepo.create.mockReturnValue(savedImage);
            mockImageRepo.save.mockResolvedValue(savedImage);

            const result = await service.addProductImage('p1', file, false);

            expect(mockFileStorageService.saveFile).toHaveBeenCalledWith(file, 'products/p1');
            expect(mockImageRepo.create).toHaveBeenCalledWith({
                url: 'products/p1/test.webp',
                isPrimary: false,
                product: { id: 'p1' }
            });
            expect(mockImageRepo.save).toHaveBeenCalled();
            expect(result).toEqual(savedImage);
        });

        it('should add primary product image', async () => {
            const file = {
                originalname: 'test.jpg',
                buffer: Buffer.from('test')
            } as Express.Multer.File;

            const savedImage = {
                id: 'img1',
                url: 'products/p1/test.webp',
                isPrimary: true,
                product: { id: 'p1' }
            };

            mockFileStorageService.saveFile.mockResolvedValue('products/p1/test.webp');
            mockImageRepo.create.mockReturnValue(savedImage);
            mockImageRepo.save.mockResolvedValue(savedImage);

            const result = await service.addProductImage('p1', file, true);

            expect(mockImageRepo.create).toHaveBeenCalledWith({
                url: 'products/p1/test.webp',
                isPrimary: true,
                product: { id: 'p1' }
            });
            expect(result.isPrimary).toBe(true);
        });

        it('should throw BadRequestException on file upload error', async () => {
            const file = { originalname: 'test.jpg' } as Express.Multer.File;

            mockFileStorageService.saveFile.mockRejectedValue(new Error('Upload failed'));

            await expect(service.addProductImage('p1', file, false))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should throw BadRequestException on save error', async () => {
            const file = { originalname: 'test.jpg' } as Express.Multer.File;

            mockFileStorageService.saveFile.mockResolvedValue('url');
            mockImageRepo.create.mockReturnValue({});
            mockImageRepo.save.mockRejectedValue(new Error('Database error'));

            await expect(service.addProductImage('p1', file, false))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('removeProductImage', () => {
        it('should remove product image', async () => {
            const image = {
                id: 'img1',
                url: 'products/p1/image.webp'
            };

            mockImageRepo.findOneBy.mockResolvedValue(image);
            mockFileStorageService.deleteFile.mockResolvedValue(undefined);
            mockImageRepo.delete.mockResolvedValue({ affected: 1 } as any);

            await service.removeProductImage('img1');

            expect(mockImageRepo.findOneBy).toHaveBeenCalledWith({ id: 'img1' });
            expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('products/p1/image.webp');
            expect(mockImageRepo.delete).toHaveBeenCalledWith('img1');
        });

        it('should not throw error if image not found', async () => {
            mockImageRepo.findOneBy.mockResolvedValue(null);

            await expect(service.removeProductImage('non-existent'))
                .resolves
                .not.toThrow();

            expect(mockFileStorageService.deleteFile).not.toHaveBeenCalled();
            expect(mockImageRepo.delete).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException on storage deletion error', async () => {
            const image = { id: 'img1', url: 'image.webp' };

            mockImageRepo.findOneBy.mockResolvedValue(image);
            mockFileStorageService.deleteFile.mockRejectedValue(new Error('Delete failed'));

            await expect(service.removeProductImage('img1'))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should throw BadRequestException on database deletion error', async () => {
            const image = { id: 'img1', url: 'image.webp' };

            mockImageRepo.findOneBy.mockResolvedValue(image);
            mockFileStorageService.deleteFile.mockResolvedValue(undefined);
            mockImageRepo.delete.mockRejectedValue(new Error('Database error'));

            await expect(service.removeProductImage('img1'))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('uploadGenericFile', () => {
        it('should upload generic file', async () => {
            const file = {
                originalname: 'document.pdf',
                buffer: Buffer.from('test'),
                mimetype: 'application/pdf'
            } as Express.Multer.File;

            const uploadedUrl = 'media/generic/1234567890/document.pdf';
            mockFileStorageService.saveFile.mockResolvedValue(uploadedUrl);

            const result = await service.uploadGenericFile(file);

            expect(mockFileStorageService.saveFile).toHaveBeenCalledWith(
                file,
                expect.stringContaining('media/generic/')
            );
            expect(result).toEqual({ url: uploadedUrl });
        });

        it('should throw BadRequestException on upload error', async () => {
            const file = { originalname: 'test.pdf' } as Express.Multer.File;

            mockFileStorageService.saveFile.mockRejectedValue(new Error('Upload failed'));

            await expect(service.uploadGenericFile(file))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('uploadGenericFiles', () => {
        it('should upload multiple generic files', async () => {
            const files = [
                { originalname: 'file1.jpg', buffer: Buffer.from('test1') },
                { originalname: 'file2.jpg', buffer: Buffer.from('test2') },
                { originalname: 'file3.jpg', buffer: Buffer.from('test3') }
            ] as Express.Multer.File[];

            const urls = ['url1.jpg', 'url2.jpg', 'url3.jpg'];
            mockFileStorageService.saveFile
                .mockResolvedValueOnce(urls[0])
                .mockResolvedValueOnce(urls[1])
                .mockResolvedValueOnce(urls[2]);

            const result = await service.uploadGenericFiles(files);

            expect(mockFileStorageService.saveFile).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ urls });
        });

        it('should handle empty files array', async () => {
            const result = await service.uploadGenericFiles([]);

            expect(result).toEqual({ urls: [] });
            expect(mockFileStorageService.saveFile).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if any upload fails', async () => {
            const files = [
                { originalname: 'file1.jpg' },
                { originalname: 'file2.jpg' }
            ] as Express.Multer.File[];

            mockFileStorageService.saveFile
                .mockResolvedValueOnce('url1.jpg')
                .mockRejectedValueOnce(new Error('Upload failed'));

            await expect(service.uploadGenericFiles(files))
                .rejects
                .toThrow(BadRequestException);
        });
    });
});