import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }

    @Put()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_SETTINGS')
    async updateSettings(@Body() data: any) {
        return this.settingsService.updateSettings(data);
    }
}
