import { Test, TestingModule } from '@nestjs/testing';
import { UserAddressesController } from './user-addresses.controller';
import { UserAddressesService } from './user-addresses.service';

describe('UserAddressesController', () => {
    let controller: UserAddressesController;
    let service: UserAddressesService;

    const mockService = {
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        setDefault: jest.fn(),
    };

    const mockUser = { id: 'u1' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserAddressesController],
            providers: [
                { provide: UserAddressesService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<UserAddressesController>(UserAddressesController);
        service = module.get<UserAddressesService>(UserAddressesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call findAll', async () => {
        mockService.findAll.mockResolvedValue([]);
        await controller.findAll({ user: mockUser });
        expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should call create', async () => {
        const data = { street: 'Main' };
        await controller.create({ user: mockUser }, data as any);
        expect(service.create).toHaveBeenCalledWith(mockUser, data);
    });

    it('should call update', async () => {
        const data = { street: 'New' };
        await controller.update({ user: mockUser }, 'a1', data as any);
        expect(service.update).toHaveBeenCalledWith(mockUser, 'a1', data);
    });

    it('should call remove', async () => {
        await controller.remove({ user: mockUser }, 'a1');
        expect(service.remove).toHaveBeenCalledWith(mockUser, 'a1');
    });

    it('should call setDefault', async () => {
        await controller.setDefault({ user: mockUser }, 'a1');
        expect(service.setDefault).toHaveBeenCalledWith(mockUser, 'a1');
    });
});
