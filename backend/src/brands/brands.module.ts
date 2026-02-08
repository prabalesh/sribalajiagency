import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Brand, Product]),
        CommonModule
    ],
    controllers: [BrandsController],
    providers: [BrandsService],
    exports: [BrandsService]
})
export class BrandsModule { }
