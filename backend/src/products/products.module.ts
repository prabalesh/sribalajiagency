import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { HomeCMS } from './entities/home-cms.entity';
import { ProductsController } from './products.controller';
import { HomeCMSController } from './home-cms.controller';
import { SettingsController } from './settings.controller';
import { SiteSettings } from './entities/settings.entity';
import { ProductsService } from './products.service';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category, Brand, ProductImage, ProductVariant, HomeCMS, SiteSettings]),
        CommonModule
    ],
    controllers: [ProductsController, HomeCMSController, SettingsController],
    providers: [ProductsService],
    exports: [ProductsService]
})
export class ProductsModule { }
