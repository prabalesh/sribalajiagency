import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './entities/quotation.entity';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Quotation])],
    providers: [QuotationsService],
    controllers: [QuotationsController],
    exports: [QuotationsService],
})
export class QuotationsModule { }
