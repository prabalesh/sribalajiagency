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
 * - Thread-safe through database transactions and upsert operations
 * - Handles concurrent initialization requests safely
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
     * default values defined in the SiteSettings entity. Uses upsert to
     * prevent duplicate key violations during concurrent initialization.
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
    async getSettings(): Promise<SiteSettings> {
        try {
            this.logger.log(`Fetching settings with ID: ${this.SETTING_ID}`);
            
            let settings = await this.settingsRepo.findOne({ 
                where: { id: this.SETTING_ID } 
            });
            
            if (!settings) {
                this.logger.warn(`Settings not found, creating default settings with ID: ${this.SETTING_ID}`);
                
                // Use upsert to handle race conditions during concurrent initialization
                // If another request creates the record first, this will just retrieve it
                settings = await this.ensureSettingsExist();
                
                this.logger.log(`Default settings initialized successfully`);
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
     * Ensures settings record exists using upsert operation.
     * 
     * This method is race-condition safe and can be called concurrently.
     * Uses INSERT ... ON CONFLICT DO NOTHING pattern to prevent duplicate
     * key constraint violations when multiple requests try to create the
     * initial settings record simultaneously.
     * 
     * @returns Promise resolving to the SiteSettings entity
     * @private
     * 
     * @remarks
     * This uses TypeORM's upsert functionality which translates to:
     * - PostgreSQL: INSERT ... ON CONFLICT DO NOTHING
     * - MySQL: INSERT IGNORE
     * - SQLite: INSERT OR IGNORE
     */
    private async ensureSettingsExist(): Promise<SiteSettings> {
        try {
            // Create default settings object
            const defaultSettings = this.settingsRepo.create({ 
                id: this.SETTING_ID 
            });

            // Upsert: Insert if not exists, ignore if exists (handles race condition)
            await this.settingsRepo
                .createQueryBuilder()
                .insert()
                .into(SiteSettings)
                .values(defaultSettings)
                .orIgnore() // On conflict, do nothing
                .execute();

            // Fetch the record (either newly created or existing from concurrent request)
            const settings = await this.settingsRepo.findOne({
                where: { id: this.SETTING_ID }
            });

            if (!settings) {
                throw new Error('Failed to create or retrieve settings after upsert');
            }

            return settings;
        } catch (error) {
            this.logger.error(
                `Failed to ensure settings exist: ${error.message}`,
                error.stack
            );
            throw error;
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
    async updateSettings(data: UpdateSettingsDto): Promise<SiteSettings> {
        const queryRunner = this.dataSource.createQueryRunner();
        
        // Track transaction state to avoid rolling back non-existent transactions
        let isTransactionActive = false;

        try {
            // Establish database connection for transaction
            await queryRunner.connect();
            this.logger.debug('Query runner connected');
            
            // Start transaction - only after successful connection
            await queryRunner.startTransaction();
            isTransactionActive = true;
            this.logger.debug('Transaction started');

            this.logger.log(`Updating settings with data: ${JSON.stringify(data)}`);
            
            // Use upsert within transaction to handle race condition
            // If settings don't exist during update, create them atomically
            const defaultSettings = queryRunner.manager.create(SiteSettings, {
                id: this.SETTING_ID,
                ...data, // Apply updates to defaults
            });

            // Upsert with conflict resolution - update if exists, insert if not
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(SiteSettings)
                .values(defaultSettings)
                .orUpdate(
                    // Columns to update on conflict
                    Object.keys(data),
                    // Conflict target (primary key)
                    ['id']
                )
                .execute();

            // Fetch the updated record
            const updatedSettings = await queryRunner.manager.findOne(SiteSettings, {
                where: { id: this.SETTING_ID }
            });

            if (!updatedSettings) {
                throw new Error('Failed to retrieve settings after upsert');
            }
            
            // Commit transaction on success
            await queryRunner.commitTransaction();
            isTransactionActive = false;
            this.logger.log(`Settings updated successfully: ${JSON.stringify(updatedSettings)}`);
            
            // TODO: Emit SettingsUpdatedEvent here for event-driven architecture
            
            return updatedSettings;
        } catch (error) {
            // Only rollback if transaction was actually started
            if (isTransactionActive) {
                try {
                    await queryRunner.rollbackTransaction();
                    this.logger.warn('Transaction rolled back due to error');
                } catch (rollbackError) {
                    // Log rollback failure but don't throw - original error is more important
                    this.logger.error(
                        `Failed to rollback transaction: ${rollbackError.message}`,
                        rollbackError.stack
                    );
                }
            }
            
            this.logger.error(
                `Failed to update settings: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Failed to update settings");
        } finally {
            // Always release query runner to prevent connection leaks
            // Check if queryRunner is still connected before releasing
            if (queryRunner.isReleased === false) {
                await queryRunner.release();
                this.logger.debug('Query runner released');
            }
        }
    }
}
