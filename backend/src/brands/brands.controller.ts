import { Controller, Get, Param, Post, Put, Delete, Body, UseGuards, UseInterceptors, UploadedFile, UsePipes, ValidationPipe, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandsService } from './brands.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Get()
    findAll() {
        return this.brandsService.findAll();
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.brandsService.findBySlug(slug);
    }

    @Get(':slug/categories')
    findCategoriesByBrand(@Param('slug') slug: string) {
        return this.brandsService.findCategoriesByBrand(slug);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.brandsService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('CREATE_BRAND')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    create(@Body() data: CreateBrandDto) {
        return this.brandsService.create(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_BRAND')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    update(@Param('id') id: string, @Body() data: UpdateBrandDto) {
        return this.brandsService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('DELETE_BRAND')
    delete(@Param('id') id: string) {
        return this.brandsService.delete(id);
    }

    @Post(':id/image')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard, ThrottlerGuard)
    @Permissions('UPDATE_BRAND')
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
                ],
            }),
        ) file: Express.Multer.File
    ) {
        return this.brandsService.uploadImage(id, file);
    }
}
