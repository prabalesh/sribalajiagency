import { Controller, Get, Param, Post, Put, Delete, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('categoryId') categoryId?: string,
        @Query('categorySlug') categorySlug?: string,
        @Query('brandId') brandId?: string,
        @Query('brandSlug') brandSlug?: string,
        @Query('q') q?: string,
        @Query('isFeatured') isFeatured?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ) {
        return this.productsService.findAll(+page, +limit, {
            categoryId,
            categorySlug,
            brandId,
            brandSlug,
            q,
            isFeatured: isFeatured === 'true' ? true : (isFeatured === 'false' ? false : undefined),
            minPrice: minPrice ? +minPrice : undefined,
            maxPrice: maxPrice ? +maxPrice : undefined,
            sortBy,
            sortOrder
        });
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('CREATE_PRODUCT')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    create(@Body() data: CreateProductDto) {
        return this.productsService.createProduct(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_PRODUCT')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    update(@Param('id') id: string, @Body() data: UpdateProductDto) {
        return this.productsService.updateProduct(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('DELETE_PRODUCT')
    delete(@Param('id') id: string) {
        return this.productsService.deleteProduct(id);
    }

    // Image Uploads
    @Post(':id/images')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_PRODUCT')
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('isPrimary') isPrimary?: string
    ) {
        return this.productsService.addProductImage(id, file, isPrimary === 'true');
    }

    @Delete('images/:imageId')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_PRODUCT')
    removeImage(@Param('imageId') imageId: string) {
        return this.productsService.removeProductImage(imageId);
    }

    @Post('media/upload')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_PRODUCT')
    @UseInterceptors(FileInterceptor('file'))
    uploadMedia(@UploadedFile() file: Express.Multer.File) {
        return this.productsService.uploadGenericFile(file);
    }

    @Post('media/bulk-upload')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_PRODUCT')
    @UseInterceptors(FilesInterceptor('files'))
    bulkUploadMedia(@UploadedFiles() files: Array<Express.Multer.File>) {
        return this.productsService.uploadGenericFiles(files);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
}
