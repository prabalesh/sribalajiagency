import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SiteSettings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/settings.dto';

/**
 * Service responsible for managing site-wide settings.
 * 
 * This service handles retrieval and updates of application settings stored
 * in the database. It uses a singleton pattern where only one settings record
 * (ID=1) exists in the database.
 * 
 * @remarks
 * - Uses transactions for atomic updates
 * - Automatically creates default settings if none exist
 * - Thread-safe through database transactions
 * 
 * @example
 * ```typescript
 * const settings = await settingsService.getSettings();
 * await settingsService.updateSettings({ allowCod: false });
 * ```
 */
@Injectable()
export class SettingsService {
    /** The fixed ID for the singleton settings record */
    private readonly SETTING_ID = 1;

    /** Logger instance with service context for tracing */
    private readonly logger = new Logger(SettingsService.name);

    /**
     * Initializes the settings service with required dependencies
     * 
     * @param settingsRepo - TypeORM repository for SiteSettings entity
     * @param dataSource - TypeORM DataSource for transaction management
     */
    constructor(
        @InjectRepository(SiteSettings)
        private settingsRepo: Repository<SiteSettings>,
        private dataSource: DataSource,
    ) { }

    /**
     * Retrieves the current site settings.
     * 
     * If settings don't exist in the database, creates a new record with
     * default values defined in the SiteSettings entity.
     * 
     * @returns Promise resolving to the SiteSettings entity
     * @throws {InternalServerErrorException} If database operation fails
     * 
     * @example
     * ```typescript
     * const settings = await settingsService.getSettings();
     * console.log(settings.allowCod); // true
     * ```
     * 
     * TODO: Add caching layer (Redis) to reduce database hits
     * TODO: Consider adding settings validation on retrieval
     */
    async getSettings() {
        try {
            this.logger.log(`Fetching settings with ID: ${this.SETTING_ID}`);

            let settings = await this.settingsRepo.findOne({
                where: { id: this.SETTING_ID }
            });

            if (!settings) {
                this.logger.warn(`Settings not found, creating default settings with ID: ${this.SETTING_ID}`);
                settings = this.settingsRepo.create({ id: this.SETTING_ID });
                settings = await this.settingsRepo.save(settings);
                this.logger.log(`Default settings created successfully`);
            } else {
                this.logger.log(`Settings retrieved successfully`);
            }

            return settings;
        } catch (error) {
            this.logger.error(
                `Failed to retrieve settings: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Failed to retrieve settings");
        }
    }

    /**
     * Updates site settings with the provided data.
     * 
     * Uses a database transaction to ensure atomic updates. If the transaction
     * fails, all changes are rolled back. Creates default settings if none exist.
     * 
     * @param data - Partial settings data to update
     * @returns Promise resolving to the updated SiteSettings entity
     * @throws {InternalServerErrorException} If update or transaction fails
     * 
     * @example
     * ```typescript
     * await settingsService.updateSettings({
     *   allowCod: false,
     *   enabledPaymentMethods: ['online']
     * });
     * ```
     * 
     * TODO: Add audit logging to track who changed settings and when
     * TODO: Implement settings history/versioning for rollback capability
     * TODO: Add cache invalidation when settings are updated
     * TODO: Consider adding optimistic locking to prevent concurrent update conflicts
     * TODO: Add webhook/event emission for settings changes (notify other services)
     */
    async updateSettings(data: UpdateSettingsDto) {
        const queryRunner = this.dataSource.createQueryRunner();

        // Establish database connection for transaction
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            this.logger.log(`Updating settings with data: ${JSON.stringify(data)}`);

            // Find existing settings within transaction scope
            let settings = await queryRunner.manager.findOne(SiteSettings, {
                where: { id: this.SETTING_ID }
            });

            // Create default settings if not found
            if (!settings) {
                this.logger.warn(`Settings not found during update, creating new settings`);
                settings = queryRunner.manager.create(SiteSettings, {
                    id: this.SETTING_ID
                });
            }

            // Merge incoming data with existing settings
            Object.assign(settings, data);
            const updatedSettings = await queryRunner.manager.save(settings);

            // Commit transaction on success
            await queryRunner.commitTransaction();
            this.logger.log(`Settings updated successfully: ${JSON.stringify(updatedSettings)}`);

            // TODO: Emit SettingsUpdatedEvent here for event-driven architecture

            return updatedSettings;
        } catch (error) {
            // Rollback transaction on any error
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Failed to update settings: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Failed to update settings");
        } finally {
            // Always release query runner to prevent connection leaks
            await queryRunner.release();
            this.logger.debug(`Query runner released`);
        }
    }
}
