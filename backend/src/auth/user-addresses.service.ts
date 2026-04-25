import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';

/**
 * Service for managing user addresses using Drizzle ORM.
 */
@Injectable()
export class UserAddressesService {
  private readonly logger = new Logger(UserAddressesService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves all addresses for a user.
   */
  async findAll(user: { id: string }) {
    this.logger.log(`Finding all addresses for user ${user.id}`);
    return await this.db.query.userAddresses.findMany({
      where: eq(schema.userAddresses.userId, user.id),
      orderBy: [desc(schema.userAddresses.createdAt)],
    });
  }

  /**
   * Creates a new address for a user.
   */
  async create(user: { id: string }, data: any) {
    this.logger.log(`Creating address for user ${user.id}`);

    return await this.db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(schema.userAddresses)
          .set({ isDefault: false })
          .where(eq(schema.userAddresses.userId, user.id));
      }

      const [address] = await tx
        .insert(schema.userAddresses)
        .values({
          ...data,
          userId: user.id,
        })
        .returning();

      this.logger.log(
        `Address created with ID: ${address.id} for user ${user.id}`,
      );
      return address;
    });
  }

  /**
   * Updates an existing address for a user.
   */
  async update(user: { id: string }, id: string, data: any) {
    this.logger.log(`Updating address ${id} for user ${user.id}`);

    return await this.db.transaction(async (tx) => {
      const [existingAddress] = await tx
        .select()
        .from(schema.userAddresses)
        .where(
          and(
            eq(schema.userAddresses.id, id),
            eq(schema.userAddresses.userId, user.id),
          ),
        )
        .limit(1);

      if (!existingAddress) {
        this.logger.warn(`Address ${id} not found for user ${user.id}`);
        throw new NotFoundException('Address not found');
      }

      if (data.isDefault) {
        await tx
          .update(schema.userAddresses)
          .set({ isDefault: false })
          .where(eq(schema.userAddresses.userId, user.id));
      }

      const [updatedAddress] = await tx
        .update(schema.userAddresses)
        .set(data)
        .where(eq(schema.userAddresses.id, id))
        .returning();

      this.logger.log(`Address ${id} updated successfully for user ${user.id}`);
      return updatedAddress;
    });
  }

  /**
   * Removes an address for a user.
   */
  async remove(user: { id: string }, id: string) {
    this.logger.log(`Removing address ${id} for user ${user.id}`);

    const result = await this.db
      .delete(schema.userAddresses)
      .where(
        and(
          eq(schema.userAddresses.id, id),
          eq(schema.userAddresses.userId, user.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      this.logger.warn(
        `Address ${id} not found for deletion for user ${user.id}`,
      );
      throw new NotFoundException('Address not found');
    }

    this.logger.log(`Address ${id} removed successfully for user ${user.id}`);
  }

  /**
   * Sets an address as default for a user.
   */
  async setDefault(user: { id: string }, id: string) {
    this.logger.log(`Setting address ${id} as default for user ${user.id}`);

    return await this.db.transaction(async (tx) => {
      await tx
        .update(schema.userAddresses)
        .set({ isDefault: false })
        .where(eq(schema.userAddresses.userId, user.id));

      const [address] = await tx
        .update(schema.userAddresses)
        .set({ isDefault: true })
        .where(
          and(
            eq(schema.userAddresses.id, id),
            eq(schema.userAddresses.userId, user.id),
          ),
        )
        .returning();

      if (!address) {
        this.logger.warn(`Address ${id} not found for user ${user.id}`);
        throw new NotFoundException('Address not found');
      }

      this.logger.log(`Address ${id} set as default for user ${user.id}`);
      return address;
    });
  }
}
