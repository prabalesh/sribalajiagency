import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSettings } from './entities/settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([SiteSettings]),
    ],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService]
})
export class SettingsModule { }
