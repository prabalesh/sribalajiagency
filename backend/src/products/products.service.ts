import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  eq,
  and,
  ilike,
  or,
  desc,
  asc,
  sql,
  inArray,
  isNull,
  not,
} from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import { CategoriesService } from '../categories/categories.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

/**
 * Service for managing products using Drizzle ORM.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
    private categoriesService: CategoriesService,
    private fileStorageService: FileStorageService,
  ) {}

  /**
   * Retrieves paginated list of products with advanced filtering.
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: {
      categoryId?: string;
      categorySlug?: string;
      brandId?: string;
      brandSlug?: string;
      q?: string;
      isFeatured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {
    this.logger.log(
      `Finding products: page=${page}, limit=${limit}, filters=${JSON.stringify(filters)}`,
    );

    if (limit > 50) limit = 50;
    const offset = (page - 1) * limit;

    const whereConditions: any[] = [isNull(schema.products.deletedAt)];

    // Category filter
    if (filters.categoryId || filters.categorySlug) {
      const categoryIds = await this.categoriesService.getSubtreeIds(
        filters.categoryId,
        filters.categorySlug,
      );
      if (categoryIds.length > 0) {
        whereConditions.push(inArray(schema.products.categoryId, categoryIds));
      } else {
        // If category not found, return no results
        whereConditions.push(
          eq(schema.products.id, '00000000-0000-0000-0000-000000000000'),
        );
      }
    }

    // Brand filter
    if (filters.brandId) {
      whereConditions.push(eq(schema.products.brandId, filters.brandId));
    }

    // Featured filter
    if (filters.isFeatured !== undefined) {
      whereConditions.push(eq(schema.products.isFeatured, filters.isFeatured));
    }

    // Search query
    if (filters.q) {
      const keyword = `%${filters.q.trim().toLowerCase()}%`;
      whereConditions.push(
        or(
          ilike(schema.products.name, keyword),
          ilike(schema.products.description, keyword),
        ),
      );
    }

    // Sorting
    let orderBy: any = desc(schema.products.createdAt);
    if (filters.sortBy) {
      const column = (schema.products as any)[filters.sortBy];
      if (column) {
        orderBy = filters.sortOrder === 'DESC' ? desc(column) : asc(column);
      }
    }

    const items = await this.db.query.products.findMany({
      where: and(...whereConditions),
      limit,
      offset,
      with: {
        category: true,
        brand: true,
        variants: {
          with: {
            images: {
              orderBy: (img, { asc }) => [asc(img.sortOrder)],
            },
          },
        },
        images: {
          orderBy: (img, { asc }) => [asc(img.sortOrder)],
        },
      },
      orderBy: [orderBy],
    });

    // Get total count
    const totalResult = await this.db.execute(
      sql`SELECT count(*) FROM products WHERE "deletedAt" IS NULL`,
    );
    const total = parseInt((totalResult.rows[0] as any).count);

    return { items, total, page, limit };
  }

  /**
   * Retrieves a single product by ID.
   */
  async findOne(id: string) {
    this.logger.log(`Finding product by ID: ${id}`);
    return await this.db.query.products.findFirst({
      where: and(eq(schema.products.id, id), isNull(schema.products.deletedAt)),
      with: {
        category: true,
        brand: true,
        variants: {
          where: (v, { isNull }) => isNull(v.deletedAt),
          with: {
            images: {
              orderBy: (img, { asc }) => [asc(img.sortOrder)],
            },
          },
        },
        images: {
          orderBy: (img, { asc }) => [asc(img.sortOrder)],
        },
      },
    });
  }

  /**
   * Creates a new product with variants.
   */
  async createProduct(data: CreateProductDto) {
    const { variants, images, ...productData } = data as any;
    this.logger.log(`Creating product: ${productData.name}`);

    return await this.db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(schema.products)
        .values(productData)
        .returning();

      // Handle product-level images
      if (images && images.length > 0) {
        await tx.insert(schema.productImages).values(
          images.map((img: any) => ({
            ...img,
            productId: newProduct.id,
          })),
        );
      }

      if (variants && variants.length > 0) {
        for (const variantData of variants) {
          const { images: variantImages, ...vData } = variantData;
          const [newVariant] = await tx
            .insert(schema.productVariants)
            .values({
              ...vData,
              productId: newProduct.id,
            })
            .returning();

          if (variantImages && variantImages.length > 0) {
            await tx.insert(schema.productImages).values(
              variantImages.map((img: any) => ({
                ...img,
                productId: newProduct.id,
                variantId: newVariant.id,
              })),
            );
          }
        }
      } else {
        // Create a default variant
        await tx.insert(schema.productVariants).values({
          name: 'Default',
          price: '0.00',
          sku: `${newProduct.name.replace(/\s+/g, '-').toUpperCase()}-DEF`,
          stock: 0,
          productId: newProduct.id,
          isDefault: true,
        });
      }

      return await tx.query.products.findFirst({
        where: eq(schema.products.id, newProduct.id),
        with: {
          category: true,
          brand: true,
          variants: {
            with: {
              images: {
                orderBy: (img, { asc }) => [asc(img.sortOrder)],
              },
            },
          },
          images: {
            orderBy: (img, { asc }) => [asc(img.sortOrder)],
          },
        },
      });
    });
  }

  /**
   * Updates an existing product.
   */
  async updateProduct(id: string, data: UpdateProductDto) {
    const { variants, images, brand, category, ...productData } =
      data as any;
    this.logger.log(`Updating product: ${id}`);

    return await this.db.transaction(async (tx) => {
      const existingProduct = await tx.query.products.findFirst({
        where: eq(schema.products.id, id),
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await tx
        .update(schema.products)
        .set(productData)
        .where(eq(schema.products.id, id));

      // Handle product-level images
      if (images) {
        // Delete existing product-level images (where variantId is null)
        await tx
          .delete(schema.productImages)
          .where(
            and(
              eq(schema.productImages.productId, id),
              isNull(schema.productImages.variantId),
            ),
          );

        if (images.length > 0) {
          await tx.insert(schema.productImages).values(
            images.map((img: any) => ({
              ...img,
              productId: id,
            })),
          );
        }
      }

      if (variants) {
        const incomingVariantIds = variants
          .map((v: any) => v.id)
          .filter((vId: string) => !!vId && vId.length > 10); // Ensure it's a real UUID

        // 1. Soft delete variants that are NOT in the incoming request
        if (incomingVariantIds.length > 0) {
          await tx
            .update(schema.productVariants)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(schema.productVariants.productId, id),
                not(inArray(schema.productVariants.id, incomingVariantIds)),
              ),
            );
        } else {
          // If no existing variants in request, soft delete all for this product
          await tx
            .update(schema.productVariants)
            .set({ deletedAt: new Date() })
            .where(eq(schema.productVariants.productId, id));
        }

        // 2. Process each variant (Update or Insert)
        if (variants.length > 0) {
          for (const variantData of variants) {
            const { images: variantImages, id: vId, ...vData } = variantData;
            let currentVariantId: string;

            if (vId && vId.length > 10) {
              // Update existing variant
              const [updatedVariant] = await tx
                .update(schema.productVariants)
                .set({ ...vData, deletedAt: null }) // Restore if it was soft-deleted
                .where(eq(schema.productVariants.id, vId))
                .returning();
              currentVariantId = updatedVariant.id;
            } else {
              // Insert new variant
              const [newVariant] = await tx
                .insert(schema.productVariants)
                .values({
                  ...vData,
                  productId: id,
                })
                .returning();
              currentVariantId = newVariant.id;
            }

            // 3. Sync variant images (Delete existing and re-insert)
            if (variantImages) {
              await tx
                .delete(schema.productImages)
                .where(eq(schema.productImages.variantId, currentVariantId));

              if (variantImages.length > 0) {
                await tx.insert(schema.productImages).values(
                  variantImages.map((img: any) => ({
                    ...img,
                    productId: id,
                    variantId: currentVariantId,
                  })),
                );
              }
            }
          }
        }
      }

      return await tx.query.products.findFirst({
        where: eq(schema.products.id, id),
        with: {
          category: true,
          brand: true,
          variants: {
            where: (v, { isNull }) => isNull(v.deletedAt),
            with: {
              images: {
                orderBy: (img, { asc }) => [asc(img.sortOrder)],
              },
            },
          },
          images: {
            orderBy: (img, { asc }) => [asc(img.sortOrder)],
          },
        },
      });
    });
  }

  /**
   * Soft deletes a product.
   */
  async deleteProduct(id: string) {
    this.logger.log(`Deleting product: ${id}`);

    return await this.db.transaction(async (tx) => {
      // Soft delete product
      const [deletedProduct] = await tx
        .update(schema.products)
        .set({ deletedAt: new Date() })
        .where(eq(schema.products.id, id))
        .returning();

      if (!deletedProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Soft delete variants
      await tx
        .update(schema.productVariants)
        .set({ deletedAt: new Date() })
        .where(eq(schema.productVariants.productId, id));

      return { success: true };
    });
  }

  /**
   * Uploads a generic file.
   */
  async uploadGenericFile(file: Express.Multer.File) {
    this.logger.log(`Uploading generic file: ${file.originalname}`);
    try {
      const url = await this.fileStorageService.saveFile(
        file,
        `media/generic/${Date.now()}`,
      );
      return { url };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to upload generic file: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Uploads multiple generic files.
   */
  async uploadGenericFiles(files: Array<Express.Multer.File>) {
    this.logger.log(`Uploading ${files.length} generic files`);
    try {
      const uploadPromises = files.map((file) =>
        this.fileStorageService.saveFile(
          file,
          `media/generic/${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ),
      );
      const urls = await Promise.all(uploadPromises);
      return { urls };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to upload generic files: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException('Failed to upload files');
    }
  }
}
