import { Controller, Get, Post, Put, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CMSService } from './cms.service';
import { UpdateHomeCmsDto } from './dto/update-home-cms.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('home-cms')
export class CMSController {
    constructor(private readonly cmsService: CMSService) { }

    @Get()
    async getCMS() {
        return this.cmsService.getCMS();
    }

    @Put()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_CMS')
    async updateCMS(@Body() data: UpdateHomeCmsDto) {
        return this.cmsService.updateCMS(data);
    }

    @Post('upload')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPLOAD_CMS_ASSETS')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        return this.cmsService.uploadImage(file);
    }

    @Post('delete-file')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_CMS')
    async deleteFile(@Body('url') url: string) {
        return this.cmsService.deleteFile(url);
    }
}
