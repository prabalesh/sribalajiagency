import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/settings.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('settings')
export class SettingsController {
    constructor(
        @InjectRepository(SiteSettings)
        private settingsRepo: Repository<SiteSettings>,
    ) { }

    @Get()
    async getSettings() {
        let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = this.settingsRepo.create({ id: 1 });
            await this.settingsRepo.save(settings);
        }
        return settings;
    }

    @Put()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_SETTINGS') // Using product permission for now
    async updateSettings(@Body() data: any) {
        let settings = await this.getSettings();
        Object.assign(settings, data);
        return this.settingsRepo.save(settings);
    }
}
