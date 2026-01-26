import { Controller, Get, Param, Post, Put, Delete, Body, UseGuards, UseInterceptors, UploadedFile, ParseBoolPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Get()
    findAll() {
        return this.productsService.findAll();
    }

    @Get('categories')
    findAllCategories() {
        return this.productsService.findAllCategories();
    }

    @Get('brands')
    findAllBrands() {
        return this.productsService.findAllBrands();
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    create(@Body() data: any) {
        return this.productsService.createProduct(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    update(@Param('id') id: string, @Body() data: any) {
        return this.productsService.updateProduct(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    delete(@Param('id') id: string) {
        return this.productsService.deleteProduct(id);
    }

    // Image Uploads
    @Post(':id/images')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
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
    @Permissions('MANAGE_PRODUCTS')
    removeImage(@Param('imageId') imageId: string) {
        return this.productsService.removeProductImage(imageId);
    }

    @Post('categories')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    createCategory(@Body() data: any) {
        return this.productsService.createCategory(data);
    }

    @Put('categories/:id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    updateCategory(@Param('id') id: string, @Body() data: any) {
        return this.productsService.updateCategory(id, data);
    }

    @Delete('categories/:id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    deleteCategory(@Param('id') id: string) {
        return this.productsService.deleteCategory(id);
    }

    @Post('brands')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    createBrand(@Body() data: any) {
        return this.productsService.createBrand(data);
    }

    @Put('brands/:id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    updateBrand(@Param('id') id: string, @Body() data: any) {
        return this.productsService.updateBrand(id, data);
    }

    @Delete('brands/:id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    deleteBrand(@Param('id') id: string) {
        return this.productsService.deleteBrand(id);
    }

    @Post('brands/:id/image')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    @UseInterceptors(FileInterceptor('file'))
    uploadBrandImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.productsService.uploadBrandImage(id, file);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
}

