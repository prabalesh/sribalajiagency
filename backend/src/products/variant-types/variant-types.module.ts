import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantType } from '../entities/variant-type.entity';
import { VariantTypesService } from './variant-types.service';
import { VariantTypesController } from './variant-types.controller';

@Module({
    imports: [TypeOrmModule.forFeature([VariantType])],
    controllers: [VariantTypesController],
    providers: [VariantTypesService],
    exports: [VariantTypesService],
})
export class VariantTypesModule { }
