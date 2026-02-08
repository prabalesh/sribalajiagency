import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
    let controller: LocationsController;
    let service: LocationsService;

    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        isLocationAllowed: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LocationsController],
            providers: [
                { provide: LocationsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<LocationsController>(LocationsController);
        service = module.get<LocationsService>(LocationsService);
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

    it('should call check', async () => {
        mockService.isLocationAllowed.mockResolvedValue(true);
        await controller.check('TN', 'City', '600');
        expect(service.isLocationAllowed).toHaveBeenCalledWith('TN', 'City', '600');
    });

    it('should call create', async () => {
        const data = { state: 'TN' };
        await controller.create(data);
        expect(service.create).toHaveBeenCalledWith(data);
    });

    it('should call update', async () => {
        const data = { state: 'TN2' };
        await controller.update('1', data);
        expect(service.update).toHaveBeenCalledWith('1', data);
    });

    it('should call delete', async () => {
        await controller.delete('1');
        expect(service.delete).toHaveBeenCalledWith('1');
    });
});
