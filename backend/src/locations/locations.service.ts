import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { eq, and, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CreateLocationRestrictionDto } from './dto/create-location-restriction.dto';
import { UpdateLocationRestrictionDto } from './dto/update-location-restriction.dto';

/**
 * Service for managing delivery location restrictions using Drizzle ORM.
 */
@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves all location restrictions.
   */
  async findAll() {
    this.logger.log('Finding all location restrictions');
    return await this.db.query.locationRestrictions.findMany();
  }

  /**
   * Retrieves a single location restriction.
   */
  async findOne(id: string) {
    this.logger.log(`Finding location restriction by ID: ${id}`);
    const location = await this.db.query.locationRestrictions.findFirst({
      where: eq(schema.locationRestrictions.id, id),
    });
    if (!location) {
      this.logger.warn(`Location restriction ${id} not found`);
      throw new NotFoundException('Location restriction not found');
    }
    return location;
  }

  /**
   * Creates a new location restriction.
   */
  async create(data: CreateLocationRestrictionDto) {
    this.logger.log(`Creating location restriction for ${data.state}`);

    try {
      const [newRestriction] = await this.db
        .insert(schema.locationRestrictions)
        .values({
          ...data,
          city: data.city || null,
          zipcode: data.zipcode || null,
        })
        .returning();

      this.logger.log(
        `Location restriction created with ID: ${newRestriction.id}`,
      );
      return newRestriction;
    } catch (error) {
      throw new BadRequestException('Failed to create location restriction');
    }
  }

  /**
   * Updates an existing location restriction.
   */
  async update(id: string, data: UpdateLocationRestrictionDto) {
    this.logger.log(`Updating location restriction ${id}`);

    try {
      const [updatedRestriction] = await this.db
        .update(schema.locationRestrictions)
        .set({
          ...data,
          city: data.city === '' ? null : data.city,
          zipcode: data.zipcode === '' ? null : data.zipcode,
        })
        .where(eq(schema.locationRestrictions.id, id))
        .returning();

      if (!updatedRestriction) {
        throw new NotFoundException(
          `Location restriction with ID ${id} not found`,
        );
      }

      this.logger.log(`Location restriction ${id} updated successfully`);
      return updatedRestriction;
    } catch (error) {
      throw new BadRequestException('Failed to update location restriction');
    }
  }

  /**
   * Deletes a location restriction.
   */
  async delete(id: string) {
    this.logger.log(`Deleting location restriction ${id}`);
    const result = await this.db
      .delete(schema.locationRestrictions)
      .where(eq(schema.locationRestrictions.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        `Location restriction with ID ${id} not found`,
      );
    }
    return { success: true };
  }

  /**
   * Checks if delivery is allowed to a specific location.
   */
  async isLocationAllowed(
    state: string,
    city?: string,
    zipcode?: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Checking if location is allowed: state=${state}, city=${city}, zipcode=${zipcode}`,
    );

    const sCity = city?.trim() || null;
    const sZip = zipcode?.trim() || null;

    const results = await this.db.query.locationRestrictions.findMany({
      where: eq(schema.locationRestrictions.state, state),
    });

    if (results.length === 0) return false;

    // Hierarchical matching: Zipcode > City > State

    // 1. Check zipcode level
    if (sZip) {
      const zipRule = results.find((r) => r.zipcode === sZip);
      if (zipRule) return zipRule.isAllowed;
    }

    // 2. Check city level
    if (sCity) {
      const cityRule = results.find((r) => r.city === sCity && !r.zipcode);
      if (cityRule) return cityRule.isAllowed;
    }

    // 3. Check state level
    const stateRule = results.find((r) => !r.city && !r.zipcode);
    if (stateRule) return stateRule.isAllowed;

    return false;
  }
}
