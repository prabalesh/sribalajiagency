import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeCMS } from './entities/home-cms.entity';
import { CMSService } from './cms.service';
import { CMSController } from './cms.controller';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([HomeCMS]),
        CommonModule
    ],
    controllers: [CMSController],
    providers: [CMSService],
    exports: [CMSService]
})
export class CMSModule { }
