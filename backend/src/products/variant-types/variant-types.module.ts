import { Module } from '@nestjs/common';
import { VariantTypesService } from './variant-types.service';
import { VariantTypesController } from './variant-types.controller';

@Module({
  imports: [],
  controllers: [VariantTypesController],
  providers: [VariantTypesService],
  exports: [VariantTypesService],
})
export class VariantTypesModule {}
