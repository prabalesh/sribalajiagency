import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
    private readonly SETTING_ID = 1;

    constructor(
        @InjectRepository(SiteSettings)
        private settingsRepo: Repository<SiteSettings>,
    ) { }

    async getSettings() {
        try {
            let settings = await this.settingsRepo.findOne({ where: { id: this.SETTING_ID } });
            if (!settings) {
                settings = this.settingsRepo.create({ id: this.SETTING_ID });
                settings = await this.settingsRepo.save(settings);
            }
            return settings;
        } catch (error) {
            throw new InternalServerErrorException("Failed to retrieve settings");
        }
    }

    async updateSettings(data: UpdateSettingsDto) {
        try {
            let settings = await this.getSettings();
            Object.assign(settings, data);
            return this.settingsRepo.save(settings);
        } catch (error) {
            throw new InternalServerErrorException("Failed to update settings");
        }
    }
}
