import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SiteSettings)
        private settingsRepo: Repository<SiteSettings>,
    ) { }

    async getSettings() {
        let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = this.settingsRepo.create({ id: 1 });
            settings = await this.settingsRepo.save(settings);
        }
        return settings;
    }

    async updateSettings(data: UpdateSettingsDto) {
        let settings = await this.getSettings();
        Object.assign(settings, data);
        return this.settingsRepo.save(settings);
    }
}
