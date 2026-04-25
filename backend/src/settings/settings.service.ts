import {
  Injectable,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { UpdateSettingsDto } from './dto/settings.dto';

/**
 * Service for managing site-wide settings using Drizzle ORM.
 */
@Injectable()
export class SettingsService {
  private readonly SETTING_ID = 1;
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves current site settings.
   */
  async getSettings() {
    try {
      this.logger.log(`Fetching settings with ID: ${this.SETTING_ID}`);

      const settings = await this.db.query.siteSettings.findFirst({
        where: eq(schema.siteSettings.id, this.SETTING_ID),
      });

      if (!settings) {
        this.logger.warn(`Settings not found, creating default settings`);
        const [newSettings] = await this.db
          .insert(schema.siteSettings)
          .values({ id: this.SETTING_ID })
          .onConflictDoNothing()
          .returning();

        if (newSettings) return newSettings;

        // If onConflictDoNothing returned nothing, fetch again
        return await this.db.query.siteSettings.findFirst({
          where: eq(schema.siteSettings.id, this.SETTING_ID),
        });
      }

      return settings;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to retrieve settings: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve settings');
    }
  }

  /**
   * Updates site settings.
   */
  async updateSettings(data: UpdateSettingsDto) {
    this.logger.log(`Updating settings with data: ${JSON.stringify(data)}`);

    try {
      return await this.db.transaction(async (tx) => {
        const settings = await tx.query.siteSettings.findFirst({
          where: eq(schema.siteSettings.id, this.SETTING_ID),
        });

        if (!settings) {
          await tx
            .insert(schema.siteSettings)
            .values({ id: this.SETTING_ID })
            .onConflictDoNothing();
        }

        const [updatedSettings] = await tx
          .update(schema.siteSettings)
          .set(data)
          .where(eq(schema.siteSettings.id, this.SETTING_ID))
          .returning();

        if (!updatedSettings) {
          throw new Error('Failed to update settings');
        }

        this.logger.log('Settings updated successfully');
        return updatedSettings;
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update settings: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to update settings');
    }
  }
}
