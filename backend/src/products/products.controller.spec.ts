import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

describe('ProductsController', () => {
    let controller: ProductsController;
    let service: ProductsService;

    const mockProductsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        createProduct: jest.fn(),
        updateProduct: jest.fn(),
        deleteProduct: jest.fn(),
        addProductImage: jest.fn(),
        removeProductImage: jest.fn(),
        uploadGenericFile: jest.fn(),
        uploadGenericFiles: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                { provide: ProductsService, useValue: mockProductsService },
            ],
        }).compile();

        controller = module.get<ProductsController>(ProductsController);
        service = module.get<ProductsService>(ProductsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should call service.findAll with correct params', async () => {
            const result = { items: [], total: 0, page: 1, limit: 20 };
            mockProductsService.findAll.mockResolvedValue(result);

            expect(await controller.findAll('1', '20', 'cat1', undefined, 'brand1')).toEqual(result);
            expect(service.findAll).toHaveBeenCalledWith(1, 20, expect.objectContaining({
                categoryId: 'cat1',
                brandId: 'brand1',
            }));
        });
    });

    describe('findOne', () => {
        it('should call service.findOne', async () => {
            const product = { id: '1', name: 'P1' };
            mockProductsService.findOne.mockResolvedValue(product);

            expect(await controller.findOne('1')).toEqual(product);
            expect(service.findOne).toHaveBeenCalledWith('1');
        });
    });

    describe('create', () => {
        it('should call service.createProduct', async () => {
            const dto: CreateProductDto = { name: 'P1', price: 100 } as any;
            mockProductsService.createProduct.mockResolvedValue({ id: '1', ...dto });

            expect(await controller.create(dto)).toEqual({ id: '1', ...dto });
            expect(service.createProduct).toHaveBeenCalledWith(dto);
        });
    });

    describe('update', () => {
        it('should call service.updateProduct', async () => {
            const dto: UpdateProductDto = { name: 'P1 Updated' } as any;
            mockProductsService.updateProduct.mockResolvedValue({ id: '1', ...dto });

            expect(await controller.update('1', dto)).toEqual({ id: '1', ...dto });
            expect(service.updateProduct).toHaveBeenCalledWith('1', dto);
        });
    });

    describe('delete', () => {
        it('should call service.deleteProduct', async () => {
            mockProductsService.deleteProduct.mockResolvedValue({ affected: 1 });

            expect(await controller.delete('1')).toEqual({ affected: 1 });
            expect(service.deleteProduct).toHaveBeenCalledWith('1');
        });
    });

    describe('Image Uploads', () => {
        it('should upload image', async () => {
            const file = { originalname: 'test.jpg' } as Express.Multer.File;
            mockProductsService.addProductImage.mockResolvedValue({ id: 'img1' });

            expect(await controller.uploadImage('p1', file, 'true')).toEqual({ id: 'img1' });
            expect(service.addProductImage).toHaveBeenCalledWith('p1', file, true);
        });

        it('should remove image', async () => {
            mockProductsService.removeProductImage.mockResolvedValue({});

            expect(await controller.removeImage('img1')).toEqual({});
            expect(service.removeProductImage).toHaveBeenCalledWith('img1');
        });
    });

    describe('Generic Uploads', () => {
        it('should upload generic file', async () => {
            const file = {} as any;
            mockProductsService.uploadGenericFile.mockResolvedValue({ url: 'u1' });

            expect(await controller.uploadMedia(file)).toEqual({ url: 'u1' });
            expect(service.uploadGenericFile).toHaveBeenCalledWith(file);
        });

        it('should bulk upload files', async () => {
            const files = [{}, {}] as any;
            mockProductsService.uploadGenericFiles.mockResolvedValue({ urls: ['u1', 'u2'] });

            expect(await controller.bulkUploadMedia(files)).toEqual({ urls: ['u1', 'u2'] });
            expect(service.uploadGenericFiles).toHaveBeenCalledWith(files);
        });
    });
});
