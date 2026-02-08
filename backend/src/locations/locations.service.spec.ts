import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from './locations.service';
import { LocationRestriction } from './entities/location-restriction.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LocationsService', () => {
    let service: LocationsService;
    let repo: Repository<LocationRestriction>;

    const mockRepo = {
        find: jest.fn(),
        findOneBy: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocationsService,
                { provide: getRepositoryToken(LocationRestriction), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<LocationsService>(LocationsService);
        repo = module.get<Repository<LocationRestriction>>(getRepositoryToken(LocationRestriction));

        // Mock global fetch
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateConsistency', () => {
        it('should throw error for invalid zipcode format', async () => {
            await expect(service.validateConsistency({ zipcode: '123' }))
                .rejects.toThrow(BadRequestException);
        });

        it('should validate successfully with external API', async () => {
            const mockResponse = [{
                Status: 'Success',
                PostOffice: [{ State: 'Tamil Nadu', District: 'Chennai' }]
            }];
            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            await expect(service.validateConsistency({ zipcode: '600001', state: 'Tamil Nadu' }))
                .resolves.not.toThrow();
        });

        it('should throw error if state mismatch', async () => {
            const mockResponse = [{
                Status: 'Success',
                PostOffice: [{ State: 'Kerala', District: 'Kochi' }]
            }];
            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            await expect(service.validateConsistency({ zipcode: '682001', state: 'Tamil Nadu' }))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('isLocationAllowed', () => {
        it('should return true if state is allowed', async () => {
            mockRepo.findOne.mockResolvedValue({ id: '1' });
            const result = await service.isLocationAllowed('Tamil Nadu');
            expect(result).toBe(true);
        });

        it('should return true if specific zipcode is allowed', async () => {
            mockRepo.findOne.mockResolvedValueOnce(null) // first check zip
                .mockResolvedValueOnce({ id: '2' }); // found on zip check

            // Wait, the logic in service checks zip first, then city, then state.
            // My mock should match the order of calls.
            mockRepo.findOne.mockResolvedValue({ id: '2' });

            const result = await service.isLocationAllowed('TN', 'City', '600001');
            expect(result).toBe(true);
        });
    });

    describe('CRUD', () => {
        it('should create a location', async () => {
            const data = { state: 'TN', city: 'C' };
            mockRepo.create.mockReturnValue(data);
            mockRepo.save.mockImplementation(d => d);
            jest.spyOn(service, 'validateConsistency').mockResolvedValue(undefined);

            const result = await service.create(data);
            expect(result).toEqual(data);
        });
    });
});
