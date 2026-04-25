import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, sql, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Service for managing product categories using Drizzle ORM.
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Retrieves all categories with parent relationship.
   */
  async findAll() {
    this.logger.log('Finding all categories');
    return await this.db.query.categories.findMany({
      with: {
        parent: true,
      },
      orderBy: [desc(schema.categories.name)],
    });
  }

  /**
   * Retrieves categories in a tree structure.
   */
  async getTree() {
    this.logger.log('Fetching category tree');
    const categories = await this.db.query.categories.findMany({
      orderBy: [desc(schema.categories.name)],
    });

    const map = new Map<string, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Helper to get all sub-category IDs recursively.
   */
  async getSubtreeIds(
    categoryId?: string,
    categorySlug?: string,
  ): Promise<string[]> {
    if (!categoryId && !categorySlug) return [];

    let rootCategory: any = null;
    if (categoryId) {
      rootCategory = await this.db.query.categories.findFirst({
        where: eq(schema.categories.id, categoryId),
      });
    } else if (categorySlug) {
      rootCategory = await this.db.query.categories.findFirst({
        where: eq(schema.categories.slug, categorySlug),
      });
    }

    if (!rootCategory) return [];

    const allCategories = await this.db.query.categories.findMany();
    const ids: string[] = [rootCategory.id];

    const findChildren = (parentId: string) => {
      allCategories
        .filter((c) => c.parentId === parentId)
        .forEach((child) => {
          ids.push(child.id);
          findChildren(child.id);
        });
    };

    findChildren(rootCategory.id);
    return ids;
  }

  /**
   * Retrieves a single category by ID.
   */
  async findOne(id: string) {
    this.logger.log(`Finding category by ID: ${id}`);
    const category = await this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
      with: {
        parent: true,
        children: true,
      },
    });
    if (!category) {
      this.logger.warn(`Category ${id} not found`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Creates a new category.
   */
  async create(data: CreateCategoryDto) {
    this.logger.log(`Creating category: ${data.name}`);
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    if (data.parentId) {
      const parent = await this.db.query.categories.findFirst({
        where: eq(schema.categories.id, data.parentId),
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${data.parentId} not found`,
        );
      }
    }

    try {
      const [newCategory] = await this.db
        .insert(schema.categories)
        .values({
          ...data,
          slug,
        })
        .returning();
      this.logger.log(`Category created with ID: ${newCategory.id}`);
      return newCategory;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A category with this slug already exists');
      }
      throw new BadRequestException('Failed to create category');
    }
  }

  /**
   * Updates an existing category.
   */
  async update(id: string, data: UpdateCategoryDto) {
    this.logger.log(`Updating category ${id}`);

    if (data.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    if (data.parentId) {
      const parent = await this.db.query.categories.findFirst({
        where: eq(schema.categories.id, data.parentId),
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${data.parentId} not found`,
        );
      }
      if (parent.parentId === id) {
        throw new BadRequestException('Circular relationship detected');
      }
    }

    try {
      const [updatedCategory] = await this.db
        .update(schema.categories)
        .set(data)
        .where(eq(schema.categories.id, id))
        .returning();

      if (!updatedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      this.logger.log(`Category ${id} updated successfully`);
      return updatedCategory;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A category with this slug already exists');
      }
      throw new BadRequestException('Failed to update category');
    }
  }

  /**
   * Deletes a category.
   */
  async delete(id: string) {
    this.logger.log(`Deleting category ${id}`);

    return await this.db.transaction(async (tx) => {
      const category = await tx.query.categories.findFirst({
        where: eq(schema.categories.id, id),
        with: {
          children: true,
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      if (category.children && category.children.length > 0) {
        throw new BadRequestException(
          'Cannot delete category with sub-categories',
        );
      }

      // Check for associated products
      const productCountResult = await tx.execute(
        sql`SELECT count(*) FROM products WHERE "categoryId" = ${id} AND "deletedAt" IS NULL`,
      );
      const productCount = parseInt((productCountResult.rows[0] as any).count);

      if (productCount > 0) {
        throw new BadRequestException('Cannot delete category with products');
      }

      await tx.delete(schema.categories).where(eq(schema.categories.id, id));
      this.logger.log(`Category ${id} deleted successfully`);
      return { success: true };
    });
  }
}
