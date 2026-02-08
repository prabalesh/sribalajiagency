import { Test, TestingModule } from '@nestjs/testing';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';

describe('CMSController', () => {
    let controller: CMSController;
    let service: CMSService;

    const mockService = {
        getCMS: jest.fn(),
        updateCMS: jest.fn(),
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
        const data = { title: 'New' };
        await controller.updateCMS(data);
        expect(service.updateCMS).toHaveBeenCalledWith(data);
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
