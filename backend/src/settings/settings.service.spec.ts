import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { SiteSettings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/settings.dto';

describe('SettingsService', () => {
    let service: SettingsService;
    let repo: Repository<SiteSettings>;

    const mockSettings: SiteSettings = {
        id: 1,
        enabledPaymentMethods: ['online', 'cod'],
        allowCod: true,
        allowOnline: true,
        updatedAt: new Date(),
    };

    const mockRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                {
                    provide: getRepositoryToken(SiteSettings),
                    useValue: mockRepo,
                },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
        repo = module.get<Repository<SiteSettings>>(getRepositoryToken(SiteSettings));
    });

    afterEach(() => {
        jest.clearAllMocks();
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

        it('should create and save new settings if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            mockRepo.create.mockReturnValue({ id: 1 });
            mockRepo.save.mockResolvedValue(mockSettings);

            const result = await service.getSettings();

            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(repo.create).toHaveBeenCalledWith({ id: 1 });
            expect(repo.save).toHaveBeenCalled();
            expect(result).toEqual(mockSettings);
        });
    });

    describe('updateSettings', () => {
        it('should update and save settings', async () => {
            const updateData = { allowCod: false };
            const existingSettings = { ...mockSettings };
            const updatedSettings = { ...mockSettings, ...updateData };

            jest.spyOn(service, 'getSettings').mockResolvedValue(existingSettings as any);
            mockRepo.save.mockResolvedValue(updatedSettings);

            const result = await service.updateSettings(updateData);

            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining(updateData));
            expect(result).toEqual(updatedSettings);
        });
    });
});
