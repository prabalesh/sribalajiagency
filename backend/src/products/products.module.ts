import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';

import { ProductVariant } from './entities/product-variant.entity';
import { VariantType } from './entities/variant-type.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CommonModule } from '../common/common.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            Category,
            Brand,
            ProductVariant,
            VariantType
        ]),
        CommonModule,
        CategoriesModule
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService]
})
export class ProductsModule { }
