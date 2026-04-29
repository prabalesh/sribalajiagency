import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { CMSService } from './cms.service';
import {
  UpdateHomeCmsDto,
  UpdateHeroDto,
  UpdateAboutDto,
  UpdateSocialLinksDto,
  UpdateVisibilityDto,
  UpdateContactDto,
} from './dto/update-home-cms.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('home-cms')
export class CMSController {
  constructor(private readonly cmsService: CMSService) {}

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

  @Patch('hero')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async updateHero(@Body() data: UpdateHeroDto) {
    return this.cmsService.updateHero(data);
  }

  @Patch('about')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async updateAbout(@Body() data: UpdateAboutDto) {
    return this.cmsService.updateAbout(data);
  }

  @Patch('social-links')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async updateSocialLinks(@Body() data: UpdateSocialLinksDto) {
    return this.cmsService.updateSocialLinks(data);
  }

  @Patch('visibility')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async updateVisibility(@Body() data: UpdateVisibilityDto) {
    return this.cmsService.updateVisibility(data);
  }

  @Patch('contact')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async updateContact(@Body() data: UpdateContactDto) {
    return this.cmsService.updateContact(data);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPLOAD_CMS_ASSETS')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 30 * 1024 * 1024 }), // 30MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.cmsService.uploadImage(file);
  }

  @Post('delete-file')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_CMS')
  async deleteFile(@Body('url') url: string) {
    return this.cmsService.deleteFile(url);
  }
}
