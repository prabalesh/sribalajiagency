import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

describe('BrandsController', () => {
    let controller: BrandsController;
    let service: BrandsService;

    const mockService = {
        findAll: jest.fn(),
        findBySlug: jest.fn(),
        findOne: jest.fn(),
        findCategoriesByBrand: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        uploadImage: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BrandsController],
            providers: [
                { provide: BrandsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<BrandsController>(BrandsController);
        service = module.get<BrandsService>(BrandsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call findAll', async () => {
        mockService.findAll.mockResolvedValue([]);
        await controller.findAll();
        expect(service.findAll).toHaveBeenCalled();
    });

    it('should call findBySlug', async () => {
        mockService.findBySlug.mockResolvedValue({});
        await controller.findBySlug('slug');
        expect(service.findBySlug).toHaveBeenCalledWith('slug');
    });

    it('should call create', async () => {
        const dto = { name: 'B' };
        await controller.create(dto as any);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should call update', async () => {
        const dto = { name: 'B2' };
        await controller.update('1', dto as any);
        expect(service.update).toHaveBeenCalledWith('1', dto);
    });

    it('should call delete', async () => {
        await controller.delete('1');
        expect(service.delete).toHaveBeenCalledWith('1');
    });

    it('should call uploadImage', async () => {
        const file = {} as any;
        await controller.uploadImage('1', file);
        expect(service.uploadImage).toHaveBeenCalledWith('1', file);
    });
});
