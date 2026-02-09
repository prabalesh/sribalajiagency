import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CMSService } from './cms.service';
import { HomeCMS } from './entities/home-cms.entity';
import { FileStorageService } from '../common/services/file-storage.service';

describe('CMSService', () => {
    let service: CMSService;
    let cmsRepo: Repository<HomeCMS>;
    let fileStorage: FileStorageService;

    const mockCMSRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockFileStorage = {
        saveFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CMSService,
                { provide: getRepositoryToken(HomeCMS), useValue: mockCMSRepo },
                { provide: FileStorageService, useValue: mockFileStorage },
            ],
        }).compile();

        service = module.get<CMSService>(CMSService);
        cmsRepo = module.get<Repository<HomeCMS>>(getRepositoryToken(HomeCMS));
        fileStorage = module.get<FileStorageService>(FileStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCMS', () => {
        it('should return existing CMS data', async () => {
            const cms = { heroTitle: 'Home' };
            mockCMSRepo.findOne.mockResolvedValue(cms);
            const result = await service.getCMS();
            expect(result).toEqual(cms);
        });

        it('should create and return default CMS data if not found', async () => {
            mockCMSRepo.findOne.mockResolvedValue(null);
            mockCMSRepo.create.mockReturnValue({ heroTitle: 'Default' });
            mockCMSRepo.save.mockImplementation(c => c);

            const result = await service.getCMS();
            expect(result.heroTitle).toBe('Default');
            expect(mockCMSRepo.create).toHaveBeenCalled();
        });
    });

    describe('updateCMS', () => {
        it('should update and save CMS data', async () => {
            const existing = { heroTitle: 'Old' };
            mockCMSRepo.findOne.mockResolvedValue(existing);
            mockCMSRepo.save.mockImplementation(c => c);

            const result = await service.updateCMS({ heroTitle: 'New' });
            expect(result.heroTitle).toBe('New');
        });
    });

    describe('modular updates', () => {
        beforeEach(() => {
            mockCMSRepo.findOne.mockResolvedValue({ id: '1' });
            mockCMSRepo.save.mockImplementation(c => c);
        });

        it('should update hero section', async () => {
            const data = { heroType: 'split' as any, heroTitle: 'New Hero' };
            const result = await service.updateHero(data);
            expect(result.heroTitle).toBe('New Hero');
            expect(result.heroType).toBe('split');
        });

        it('should update about section', async () => {
            const data = { aboutTitle: 'New About' };
            const result = await service.updateAbout(data);
            expect(result.aboutTitle).toBe('New About');
        });

        it('should update social links', async () => {
            const data = { socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com', icon: 'tw' }] };
            const result = await service.updateSocialLinks(data);
            expect(result.socialLinks).toHaveLength(1);
            expect(result.socialLinks[0].platform).toBe('Twitter');
        });

        it('should update visibility', async () => {
            const data = { showFeatured: false };
            const result = await service.updateVisibility(data);
            expect(result.showFeatured).toBe(false);
        });
    });

    describe('uploadImage', () => {
        it('should upload a file and return url', async () => {
            const file = {
                originalname: '1.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                buffer: Buffer.from([]),
            } as any;
            mockFileStorage.saveFile.mockResolvedValue('/uploads/cms/1.jpg');
            const result = await service.uploadImage(file);
            expect(result.url).toBe('/uploads/cms/1.jpg');
        });
    });

    describe('deleteFile', () => {
        it('should delete file if url exists', async () => {
            await service.deleteFile('/uploads/test.jpg');
            expect(mockFileStorage.deleteFile).toHaveBeenCalledWith('test.jpg');
        });

        it('should throw BadRequestException if no url', async () => {
            await expect(service.deleteFile('')).rejects.toThrow(BadRequestException);
            expect(mockFileStorage.deleteFile).not.toHaveBeenCalled();
        });
    });
});
