import { Test, TestingModule } from '@nestjs/testing';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';

describe('CMSController', () => {
    let controller: CMSController;
    let service: CMSService;

    const mockService = {
        getCMS: jest.fn(),
        updateCMS: jest.fn(),
        updateHero: jest.fn(),
        updateAbout: jest.fn(),
        updateSocialLinks: jest.fn(),
        updateVisibility: jest.fn(),
        uploadImage: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CMSController],
            providers: [
                { provide: CMSService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<CMSController>(CMSController);
        service = module.get<CMSService>(CMSService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should get CMS', async () => {
        mockService.getCMS.mockResolvedValue({});
        await controller.getCMS();
        expect(service.getCMS).toHaveBeenCalled();
    });

    it('should update CMS', async () => {
        const data = { heroTitle: 'New' };
        await controller.updateCMS(data);
        expect(service.updateCMS).toHaveBeenCalledWith(data);
    });

    it('should update hero', async () => {
        const data = { heroType: 'split' as any };
        await controller.updateHero(data);
        expect(service.updateHero).toHaveBeenCalledWith(data);
    });

    it('should update about', async () => {
        const data = { aboutTitle: 'New' };
        await controller.updateAbout(data);
        expect(service.updateAbout).toHaveBeenCalledWith(data);
    });

    it('should update social links', async () => {
        const data = { socialLinks: [] };
        await controller.updateSocialLinks(data);
        expect(service.updateSocialLinks).toHaveBeenCalledWith(data);
    });

    it('should update visibility', async () => {
        const data = { showFeatured: false };
        await controller.updateVisibility(data);
        expect(service.updateVisibility).toHaveBeenCalledWith(data);
    });

    it('should upload image', async () => {
        const file = {} as any;
        await controller.uploadImage(file);
        expect(service.uploadImage).toHaveBeenCalledWith(file);
    });

    it('should delete file', async () => {
        const url = 'http://test.com';
        await controller.deleteFile(url);
        expect(service.deleteFile).toHaveBeenCalledWith(url);
    });
});
