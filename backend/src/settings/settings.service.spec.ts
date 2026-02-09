import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, SelectQueryBuilder, InsertQueryBuilder } from 'typeorm';
import { SettingsService } from './settings.service';
import { SiteSettings } from './entities/settings.entity';

describe('SettingsService', () => {
    let service: SettingsService;
    let repo: Repository<SiteSettings>;
    let dataSource: DataSource;

    const mockSettings: SiteSettings = {
        id: 1,
        enabledPaymentMethods: ['online', 'cod'],
        allowCod: true,
        allowOnline: true,
        updatedAt: new Date(),
    };

    // Mock QueryRunner for transaction tests
    const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        isReleased: false,
        manager: {
            create: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
        },
    };

    // Mock InsertQueryBuilder for upsert operations
    const mockInsertQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn(),
    };

    const mockRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => mockInsertQueryBuilder),
    };

    const mockDataSource = {
        createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                {
                    provide: getRepositoryToken(SiteSettings),
                    useValue: mockRepo,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
        repo = module.get<Repository<SiteSettings>>(getRepositoryToken(SiteSettings));
        dataSource = module.get<DataSource>(DataSource);
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockQueryRunner.isReleased = false;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSettings', () => {
        it('should return existing settings if found', async () => {
            mockRepo.findOne.mockResolvedValue(mockSettings);

            const result = await service.getSettings();

            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(mockSettings);
        });

        it('should create settings using upsert if not found', async () => {
            // First call returns null (not found), second call returns created settings
            mockRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockSettings);
            
            mockRepo.create.mockReturnValue({ id: 1 });
            mockInsertQueryBuilder.execute.mockResolvedValue({ identifiers: [{ id: 1 }] });

            const result = await service.getSettings();

            expect(repo.findOne).toHaveBeenCalledTimes(2);
            expect(repo.create).toHaveBeenCalledWith({ id: 1 });
            expect(repo.createQueryBuilder).toHaveBeenCalled();
            expect(mockInsertQueryBuilder.insert).toHaveBeenCalled();
            expect(mockInsertQueryBuilder.orIgnore).toHaveBeenCalled();
            expect(mockInsertQueryBuilder.execute).toHaveBeenCalled();
            expect(result).toEqual(mockSettings);
        });

        it('should handle errors during settings retrieval', async () => {
            mockRepo.findOne.mockRejectedValue(new Error('Database error'));

            await expect(service.getSettings()).rejects.toThrow('Failed to retrieve settings');
        });
    });

    describe('updateSettings', () => {
        it('should update settings using transaction and upsert', async () => {
            const updateData = { allowCod: false };
            const updatedSettings = { ...mockSettings, ...updateData };

            // Mock transaction flow
            mockQueryRunner.manager.create.mockReturnValue({ id: 1, ...updateData });
            mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockInsertQueryBuilder);
            mockInsertQueryBuilder.execute.mockResolvedValue({ affected: 1 });
            mockQueryRunner.manager.findOne.mockResolvedValue(updatedSettings);

            const result = await service.updateSettings(updateData);

            // Verify transaction lifecycle
            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
                SiteSettings,
                expect.objectContaining({ id: 1, ...updateData })
            );
            expect(mockInsertQueryBuilder.orUpdate).toHaveBeenCalledWith(
                Object.keys(updateData),
                ['id']
            );
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
            expect(result).toEqual(updatedSettings);
        });

        it('should rollback transaction on error', async () => {
            const updateData = { allowCod: false };

            mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockInsertQueryBuilder);
            mockInsertQueryBuilder.execute.mockRejectedValue(new Error('Database error'));

            await expect(service.updateSettings(updateData)).rejects.toThrow('Failed to update settings');

            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should handle rollback failure gracefully', async () => {
            const updateData = { allowCod: false };

            mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockInsertQueryBuilder);
            mockInsertQueryBuilder.execute.mockRejectedValue(new Error('Database error'));
            mockQueryRunner.rollbackTransaction.mockRejectedValue(new Error('Rollback failed'));

            await expect(service.updateSettings(updateData)).rejects.toThrow('Failed to update settings');

            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });
    });
});
