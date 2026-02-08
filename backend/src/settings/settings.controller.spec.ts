import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UpdateSettingsDto } from './dto/settings.dto';

describe('SettingsController', () => {
    let controller: SettingsController;
    let service: SettingsService;

    const mockSettings = {
        id: 1,
        enabledPaymentMethods: ['online', 'cod'],
        allowCod: true,
        allowOnline: true,
    };

    const mockSettingsService = {
        getSettings: jest.fn(),
        updateSettings: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SettingsController],
            providers: [
                {
                    provide: SettingsService,
                    useValue: mockSettingsService,
                },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({ canActivate: () => true })
            .overrideGuard(PermissionsGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<SettingsController>(SettingsController);
        service = module.get<SettingsService>(SettingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getSettings', () => {
        it('should return settings from service', async () => {
            mockSettingsService.getSettings.mockResolvedValue(mockSettings);

            const result = await controller.getSettings();

            expect(service.getSettings).toHaveBeenCalled();
            expect(result).toEqual(mockSettings);
        });
    });

    describe('updateSettings', () => {
        it('should call service updateSettings with data', async () => {
            const updateData = { allowCod: false };
            mockSettingsService.updateSettings.mockResolvedValue({ ...mockSettings, ...updateData });

            const result = await controller.updateSettings(updateData);

            expect(service.updateSettings).toHaveBeenCalledWith(updateData);
            expect(result).toEqual({ ...mockSettings, ...updateData });
        });
    });
});
