import { Controller, Get, Post, Put, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeCMS } from './entities/home-cms.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FileStorageService } from '../common/services/file-storage.service';

@Controller('home-cms')
export class HomeCMSController {
    constructor(
        @InjectRepository(HomeCMS)
        private cmsRepo: Repository<HomeCMS>,
        private fileStorageService: FileStorageService,
    ) { }

    @Get()
    async getCMS() {
        let cms = await this.cmsRepo.findOne({ where: {} });
        if (!cms) {
            cms = this.cmsRepo.create({
                heroType: 'standard',
                heroBadge: 'AUTHORIZED DEALER',
                heroTitle: 'Experience the Future of Home Technology',
                heroSubtitle: 'Premium selection of global brands including Sony, Samsung, and Bosch. Engineered for excellence, delivered with care.',
                heroImage: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=2000',
                heroLink: '/products',
                heroLinkText: 'Explore Collection',
                heroSlides: [
                    {
                        title: 'Elite Home Cinema Experience',
                        subtitle: 'Transform your living space with the latest Sony Bravia XR technologies. Cinema-grade visuals, right at home.',
                        badge: 'AUTHORIZED SONY PARTNER',
                        image: 'https://images.unsplash.com/photo-1593784991095-a205039470b6?q=80&w=2000',
                        link: '/products',
                        linkText: 'Explore Collection'
                    },
                    {
                        title: 'The Future of Smart Cooking',
                        subtitle: 'Experience the precision of Bosch German engineering. Smart appliances for a smarter kitchen.',
                        badge: 'BOSCH EXCLUSIVE',
                        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000',
                        link: '/products',
                        linkText: 'Discover Bosch'
                    }
                ],
                showCategories: true,
                showFeatured: true,
                showBrands: true,
                showTrustMarkers: true,
                aboutTitle: 'About Sri Balaji Agency',
                aboutContent: 'With over two decades of excellence, Sri Balaji Agency has been at the forefront of providing premium electronic solutions. We pride ourselves on representing global giants and delivering unmatched customer service.',
                socialLinks: [
                    { platform: 'Facebook', url: '#', icon: 'fb' },
                    { platform: 'Instagram', url: '#', icon: 'ig' }
                ]
            });
            await this.cmsRepo.save(cms);
        }
        return cms;
    }

    @Put()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    async updateCMS(@Body() data: any) {
        let cms = await this.getCMS();
        Object.assign(cms, data);
        return this.cmsRepo.save(cms);
    }

    @Post('upload')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        const url = await this.fileStorageService.saveFile(file, 'cms');
        return { url };
    }

    @Post('delete-file')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    async deleteFile(@Body('url') url: string) {
        if (url) {
            await this.fileStorageService.deleteFile(url.replace('/uploads/', ''));
        }
        return { success: true };
    }
}
