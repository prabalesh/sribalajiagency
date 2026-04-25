import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, sql, desc, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

/**
 * Service for managing product brands using Drizzle ORM.
 */
@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
    private fileStorageService: FileStorageService,
  ) {}

  /**
   * Retrieves all brands sorted alphabetically.
   */
  async findAll() {
    this.logger.log('Finding all brands');
    return await this.db.query.brands.findMany({
      orderBy: [desc(schema.brands.name)],
    });
  }

  /**
   * Retrieves a single brand by ID.
   */
  async findOne(id: string) {
    this.logger.log(`Finding brand by ID: ${id}`);
    const brand = await this.db.query.brands.findFirst({
      where: eq(schema.brands.id, id),
    });
    if (!brand) {
      this.logger.warn(`Brand ${id} not found`);
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  /**
   * Retrieves a brand by slug.
   */
  async findBySlug(slug: string) {
    this.logger.log(`Finding brand by slug: ${slug}`);
    return await this.db.query.brands.findFirst({
      where: eq(schema.brands.slug, slug),
    });
  }

  /**
   * Creates a new brand.
   */
  async create(data: CreateBrandDto) {
    this.logger.log(`Creating brand: ${data.name}`);
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    try {
      const [newBrand] = await this.db
        .insert(schema.brands)
        .values({
          ...data,
          slug,
        })
        .returning();
      this.logger.log(`Brand created with ID: ${newBrand.id}`);
      return newBrand;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A brand with this slug already exists');
      }
      throw new BadRequestException('Failed to create brand');
    }
  }

  /**
   * Updates an existing brand.
   */
  async update(id: string, data: UpdateBrandDto) {
    this.logger.log(`Updating brand ${id}`);

    try {
      const [updatedBrand] = await this.db
        .update(schema.brands)
        .set(data)
        .where(eq(schema.brands.id, id))
        .returning();

      if (!updatedBrand) {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }

      this.logger.log(`Brand ${id} updated successfully`);
      return updatedBrand;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A brand with this slug already exists');
      }
      throw new BadRequestException('Failed to update brand');
    }
  }

  /**
   * Deletes a brand.
   */
  async delete(id: string) {
    this.logger.log(`Deleting brand ${id}`);

    return await this.db.transaction(async (tx) => {
      const brand = await tx.query.brands.findFirst({
        where: eq(schema.brands.id, id),
      });

      if (!brand) {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }

      // Check for associated products
      const productCountResult = await tx.execute(
        sql`SELECT count(*) FROM products WHERE "brandId" = ${id} AND "deletedAt" IS NULL`,
      );
      const productCount = parseInt((productCountResult.rows[0] as any).count);

      if (productCount > 0) {
        throw new BadRequestException(
          'Cannot delete brand with associated products',
        );
      }

      // Delete brand image if exists
      if (brand.image) {
        try {
          await this.fileStorageService.deleteFile(
            brand.image.replace('/uploads/', ''),
          );
        } catch (error: any) {
          this.logger.error(`Failed to delete brand image: ${error.message}`);
        }
      }

      await tx.delete(schema.brands).where(eq(schema.brands.id, id));
      this.logger.log(`Brand ${id} deleted successfully`);
      return { success: true };
    });
  }

  /**
   * Uploads or replaces brand image.
   */
  async uploadImage(brandId: string, file: Express.Multer.File) {
    this.logger.log(`Uploading image for brand ${brandId}`);

    const brand = await this.findOne(brandId);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (brand.image) {
      try {
        await this.fileStorageService.deleteFile(
          brand.image.replace('/uploads/', ''),
        );
      } catch (error: any) {
        this.logger.error(`Failed to delete old brand image: ${error.message}`);
      }
    }

    try {
      const url = await this.fileStorageService.saveFile(
        file,
        `brands/${brandId}`,
      );
      const [updatedBrand] = await this.db
        .update(schema.brands)
        .set({ image: url })
        .where(eq(schema.brands.id, brandId))
        .returning();

      this.logger.log(`Brand image uploaded successfully: ${url}`);
      return updatedBrand;
    } catch (error) {
      throw new BadRequestException('Failed to upload brand image');
    }
  }

  /**
   * Retrieves unique categories associated with a brand.
   */
  async findCategoriesByBrand(brandSlug: string) {
    this.logger.log(`Finding categories for brand: ${brandSlug}`);

    const brand = await this.findBySlug(brandSlug);
    if (!brand) {
      throw new NotFoundException(`Brand with slug ${brandSlug} not found`);
    }

    const result = await this.db
      .selectDistinct({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
        image: schema.categories.image,
      })
      .from(schema.products)
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(
        and(
          eq(schema.products.brandId, brand.id),
          isNull(schema.products.deletedAt),
        ),
      );

    this.logger.log(
      `Found ${result.length} unique categories for brand ${brandSlug}`,
    );
    return result;
  }
}
