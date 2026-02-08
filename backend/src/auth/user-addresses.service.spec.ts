import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddressesService } from './user-addresses.service';
import { UserAddress } from './entities/user-address.entity';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserAddressesService', () => {
    let service: UserAddressesService;
    let repo: Repository<UserAddress>;

    const mockAddressRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUser = { id: 'u1' } as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAddressesService,
                { provide: getRepositoryToken(UserAddress), useValue: mockAddressRepo },
            ],
        }).compile();

        service = module.get<UserAddressesService>(UserAddressesService);
        repo = module.get<Repository<UserAddress>>(getRepositoryToken(UserAddress));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all addresses for a user', async () => {
            mockAddressRepo.find.mockResolvedValue([]);
            const result = await service.findAll(mockUser);
            expect(result).toEqual([]);
            expect(mockAddressRepo.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { user: { id: mockUser.id } }
            }));
        });
    });

    describe('create', () => {
        it('should create a new address and set as default if requested', async () => {
            const data = { street: 'Main St', isDefault: true };
            const savedAddress = { id: 'a1', ...data };

            mockAddressRepo.update.mockResolvedValue({ affected: 1 });
            mockAddressRepo.create.mockReturnValue(savedAddress);
            mockAddressRepo.save.mockResolvedValue(savedAddress);

            const result = await service.create(mockUser, data as any);

            expect(result).toEqual(savedAddress);
            expect(mockAddressRepo.update).toHaveBeenCalled(); // Should clear other defaults
        });
    });

    describe('update', () => {
        it('should update an existing address', async () => {
            const address = { id: 'a1', street: 'Old St', user: mockUser };
            mockAddressRepo.findOne.mockResolvedValue(address);
            mockAddressRepo.save.mockImplementation(a => a);

            const result = await service.update(mockUser, 'a1', { street: 'New St' });
            expect(result.street).toBe('New St');
        });

        it('should throw NotFoundException if address does not exist', async () => {
            mockAddressRepo.findOne.mockResolvedValue(null);
            await expect(service.update(mockUser, 'a1', {}))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete the address', async () => {
            mockAddressRepo.delete.mockResolvedValue({ affected: 1 });
            await service.remove(mockUser, 'a1');
            expect(mockAddressRepo.delete).toHaveBeenCalled();
        });

        it('should throw NotFoundException if nothing was deleted', async () => {
            mockAddressRepo.delete.mockResolvedValue({ affected: 0 });
            await expect(service.remove(mockUser, 'a1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('setDefault', () => {
        it('should set an address as default', async () => {
            const address = { id: 'a1', isDefault: false };
            mockAddressRepo.findOne.mockResolvedValue(address);
            mockAddressRepo.save.mockImplementation(a => a);

            const result = await service.setDefault(mockUser, 'a1');
            expect(result.isDefault).toBe(true);
            expect(mockAddressRepo.update).toHaveBeenCalled();
        });
    });
});
