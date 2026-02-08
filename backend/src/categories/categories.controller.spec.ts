import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;

    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                { provide: CategoriesService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);
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

    it('should call findOne', async () => {
        mockService.findOne.mockResolvedValue({});
        await controller.findOne('1');
        expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should call create', async () => {
        const dto = { name: 'C' };
        await controller.create(dto as any);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should call update', async () => {
        const dto = { name: 'C2' };
        await controller.update('1', dto as any);
        expect(service.update).toHaveBeenCalledWith('1', dto);
    });

    it('should call delete', async () => {
        await controller.delete('1');
        expect(service.delete).toHaveBeenCalledWith('1');
    });
});
