import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, ILike, DataSource, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';
import { Brand } from '../brands/entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

/**
 * Service for managing products in the e-commerce system.
 * 
 * Handles CRUD operations for products, including:
 * - Product listing with advanced filtering and pagination
 * - Product creation with variants and images
 * - Product updates with relation management
 * - Image and file upload management
 * - Product deletion with cleanup
 * 
 * @remarks
 * - Supports complex filtering (category, brand, price range, search)
 * - Manages product variants (size, color, etc.)
 * - Handles image uploads and deletions
 * - Validates relations (category, brand) before operations
 * 
 * @example
 * ```typescript
 * const products = await productsService.findAll(1, 20, { categorySlug: 'electronics' });
 * const product = await productsService.createProduct(createDto);
 * ```
 * 
 * TODO: Add transaction support for product creation/update with variants
 * TODO: Add caching layer for product listings (Redis)
 * TODO: Add search indexing (Elasticsearch) for better full-text search
 * TODO: Add inventory management integration
 * TODO: Add product import/export functionality (CSV/Excel)
 * TODO: Add product duplication feature
 * TODO: Implement soft delete for products
 * TODO: Add product activity/audit logging
 */
@Injectable()
export class ProductsService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(ProductsService.name);

    /**
     * Initializes the products service with required dependencies
     * 
     * @param productRepo - Repository for Product entity
     * @param categoryRepo - Repository for Category entity
     * @param brandRepo - Repository for Brand entity
     * @param imageRepo - Repository for ProductImage entity
     * @param variantRepo - Repository for ProductVariant entity
     * @param fileStorageService - Service for file upload/deletion operations
     * @param dataSource - TypeORM DataSource for transaction management
     */
    constructor(
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(Brand)
        private brandRepo: Repository<Brand>,
        @InjectRepository(ProductImage)
        private imageRepo: Repository<ProductImage>,
        @InjectRepository(ProductVariant)
        private variantRepo: Repository<ProductVariant>,
        private categoriesService: CategoriesService,
        private fileStorageService: FileStorageService,
        private dataSource: DataSource,
    ) { }

    /**
     * Retrieves paginated list of products with advanced filtering.
     * 
     * Supports multiple filter combinations:
     * - Category/Brand filtering (by ID or slug)
     * - Price range filtering
     * - Search by name or description
     * - Featured products filter
     * - Custom sorting
     * 
     * @param page - Page number (1-indexed, default: 1)
     * @param limit - Items per page (default: 20, max: 50)
     * @param filters - Object containing filter criteria
     * @returns Promise resolving to paginated product results with relations
     * 
     * @example
     * ```typescript
     * // Get featured products in electronics category
     * const result = await productsService.findAll(1, 20, {
     *   categorySlug: 'electronics',
     *   isFeatured: true,
     *   minPrice: 1000,
     *   maxPrice: 50000,
     *   sortBy: 'price',
     *   sortOrder: 'ASC'
     * });
     * 
     * // Search products
     * const searchResult = await productsService.findAll(1, 10, {
     *   q: 'laptop'
     * });
     * ```
     * 
     * TODO: Add validation for filter parameters (positive numbers, valid sort fields)
     * TODO: Implement query builder for more complex filters
     * TODO: Add faceted search (count products by category/brand/price range)
     * TODO: Cache popular filter combinations (Redis)
     * TODO: Add support for multiple category/brand filters (e.g., categoryIds: [])
     * TODO: Add stock availability filter
     * TODO: Add discount/sale filter
     * TODO: Add rating filter (e.g., minRating: 4)
     * TODO: Optimize query performance with indexes
     * TODO: Add query execution time logging
     * TODO: Consider using Elasticsearch for complex search queries
     * TODO: Add support for custom fields filtering (attributes)
     */
    async findAll(
        page: number = 1,
        limit: number = 20,
        filters: {
            categoryId?: string,
            categorySlug?: string,
            brandId?: string,
            brandSlug?: string,
            q?: string,
            isFeatured?: boolean,
            minPrice?: number,
            maxPrice?: number,
            sortBy?: string,
            sortOrder?: 'ASC' | 'DESC'
        } = {}
    ) {
        this.logger.log(`Finding products: page=${page}, limit=${limit}, filters=${JSON.stringify(filters)}`);

        // Cap limit to prevent performance issues
        // TODO: Make max limit configurable
        if (limit > 50) {
            this.logger.warn(`Limit ${limit} exceeds maximum, capping to 50`);
            limit = 50;
        }

        // TODO: Validate page and limit are positive integers
        const skip = (page - 1) * limit;

        // Build sort order
        let order: any = {};
        if (filters.sortBy) {
            // TODO: Whitelist allowed sort fields to prevent SQL injection
            order[filters.sortBy] = filters.sortOrder || 'ASC';
        } else {
            // Default sorting: available products first, then by name
            order = { isAvailable: 'DESC', name: 'ASC' };
        }

        // Build where clause
        const where: any = {};

        // Category filter (including subtree)
        if (filters.categoryId || filters.categorySlug) {
            const categoryIds = await this.categoriesService.getSubtreeIds(
                filters.categoryId,
                filters.categorySlug
            );
            if (categoryIds.length > 0) {
                where.category = { id: In(categoryIds) };
            } else {
                // If category requested but not found, return nothing
                where.category = { id: '00000000-0000-0000-0000-000000000000' };
            }
        }

        // Brand filter (by ID or slug)
        if (filters.brandId) where.brand = { id: filters.brandId };
        if (filters.brandSlug) where.brand = { slug: filters.brandSlug };

        // Featured filter
        if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

        // Price range filtering
        // TODO: Consider using separate priceMin/priceMax fields for better indexing
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            where.price = Between(filters.minPrice, filters.maxPrice);
        } else if (filters.minPrice !== undefined) {
            where.price = MoreThanOrEqual(filters.minPrice);
        } else if (filters.maxPrice !== undefined) {
            where.price = LessThanOrEqual(filters.maxPrice);
        }

        // Search query (name or description)
        // TODO: Replace with full-text search or Elasticsearch for better performance
        let whereClause = where;
        if (filters.q) {
            // Search in both name and description
            whereClause = [
                { ...where, name: ILike(`%${filters.q}%`) },
                { ...where, description: ILike(`%${filters.q}%`) }
            ];
        }

        // TODO: Add query timing for performance monitoring
        const [items, total] = await this.productRepo.findAndCount({
            relations: ['category', 'brand', 'images', 'variants'],
            order,
            take: limit,
            skip: skip,
            where: whereClause
        });

        this.logger.log(`Found ${total} products, returning page ${page} with ${items.length} items`);

        // TODO: Transform response to exclude sensitive data
        // TODO: Add metadata (availableFilters, priceRange, etc.)
        return { items, total, page, limit };
    }

    /**
     * Retrieves a single product by ID with all relations.
     * 
     * Loads product with category, brand, images, and variants.
     * 
     * @param id - Product ID
     * @returns Promise resolving to Product entity or null if not found
     * 
     * @example
     * ```typescript
     * const product = await productsService.findOne('prod_123');
     * if (!product) throw new NotFoundException('Product not found');
     * ```
     * 
     * TODO: Add caching for frequently accessed products
     * TODO: Add view count tracking
     * TODO: Add related products retrieval
     * TODO: Add stock availability check
     * TODO: Add discount calculation
     * TODO: Transform response to exclude internal fields
     * TODO: Add support for slug-based lookup
     */
    findOne(id: string) {
        this.logger.log(`Finding product by ID: ${id}`);

        // TODO: Add error handling for invalid UUID format
        return this.productRepo.findOne({
            where: { id },
            relations: ['category', 'brand', 'images', 'variants'],
        });
    }

    /**
     * Creates a new product with optional variants.
     * 
     * Validates category and brand existence before creation.
     * Supports creating product variants in a single operation.
     * 
     * @param data - Product creation data including variants
     * @returns Promise resolving to created Product entity with relations
     * 
     * @throws {NotFoundException} If category or brand doesn't exist
     * @throws {BadRequestException} If product creation fails
     * 
     * @example
     * ```typescript
     * const product = await productsService.createProduct({
     *   name: 'Gaming Laptop',
     *   price: 75000,
     *   categoryId: 'cat_123',
     *   brandId: 'brand_456',
     *   variants: [
     *     { name: '16GB RAM', sku: 'LAP-16GB', price: 75000, stock: 10 },
     *     { name: '32GB RAM', sku: 'LAP-32GB', price: 85000, stock: 5 }
     *   ]
     * });
     * ```
     * 
     * TODO: Add transaction support to ensure atomic creation (product + variants)
     * TODO: Add SKU uniqueness validation
     * TODO: Add slug auto-generation from product name
     * TODO: Add input sanitization for HTML content
     * TODO: Validate price is positive
     * TODO: Add stock validation for variants
     * TODO: Emit ProductCreatedEvent for analytics/notifications
     * TODO: Add support for bulk product creation
     * TODO: Add image upload support during creation
     * TODO: Add error recovery mechanism
     * TODO: Add duplicate product name check within category
     */
    async createProduct(data: CreateProductDto) {
        const { variants, ...productData } = data as any;

        this.logger.log(`Creating product: ${productData.name}`);

        // Verify Category existence if provided
        if (productData.categoryId) {
            const category = await this.categoryRepo.findOneBy({ id: productData.categoryId });
            if (!category) {
                this.logger.warn(`Category ${productData.categoryId} not found`);
                throw new NotFoundException(`Category with ID ${productData.categoryId} not found`);
            }
            productData.category = category; // Set relation
        }

        // Verify Brand existence if provided
        if (productData.brandId) {
            const brand = await this.brandRepo.findOneBy({ id: productData.brandId });
            if (!brand) {
                this.logger.warn(`Brand ${productData.brandId} not found`);
                throw new NotFoundException(`Brand with ID ${productData.brandId} not found`);
            }
            productData.brand = brand; // Set relation
        }

        // TODO: Add transaction wrapper for atomic operation
        try {
            // Create product
            const product = this.productRepo.create(productData);
            const savedProduct = await this.productRepo.save(product) as any;

            this.logger.log(`Product created with ID: ${savedProduct.id}`);

            // Create variants if provided
            if (variants && variants.length > 0) {
                // TODO: Validate variant SKUs are unique
                const variantEntities = variants.map(v =>
                    this.variantRepo.create({ ...v, product: savedProduct })
                );
                await this.variantRepo.save(variantEntities);
                this.logger.log(`Created ${variants.length} variants for product ${savedProduct.id}`);
            } else {
                // Creates a default variant for simple products
                const defaultVariant = this.variantRepo.create({
                    name: 'Default',
                    price: savedProduct.price,
                    comparisonPrice: savedProduct.comparisonPrice,
                    sku: `${savedProduct.name.replace(/\s+/g, '-').toUpperCase()}-DEF`,
                    stock: 0, // Default to 0, admin will update via variant
                    product: savedProduct
                });
                await this.variantRepo.save(defaultVariant);
                this.logger.log(`Created default variant for product ${savedProduct.id}`);
            }

            // TODO: Emit ProductCreatedEvent
            // TODO: Clear related caches

            // Return product with all relations
            return this.findOne(savedProduct.id);
        } catch (error) {
            this.logger.error(`Error creating product: ${error.message}`, error.stack);
            // TODO: Provide more specific error messages based on error type
            throw new BadRequestException('Failed to create product. Check data fields.');
        }
    }

    /**
     * Updates an existing product with optional variants.
     * 
     * Validates category and brand existence before update.
     * Supports updating product variants (replaces all existing variants).
     * 
     * @param id - Product ID to update
     * @param data - Partial product update data
     * @returns Promise resolving to updated Product entity
     * 
     * @throws {NotFoundException} If product, category, or brand doesn't exist
     * @throws {BadRequestException} If update fails
     * 
     * @example
     * ```typescript
     * const updated = await productsService.updateProduct('prod_123', {
     *   price: 65000,
     *   isAvailable: true,
     *   variants: [
     *     { name: '16GB RAM', sku: 'LAP-16GB-V2', price: 65000, stock: 15 }
     *   ]
     * });
     * ```
     * 
     * TODO: Add transaction support for atomic updates
     * TODO: Implement partial variant updates instead of full replacement
     * TODO: Add optimistic locking to prevent concurrent update conflicts
     * TODO: Add validation that price matches variant prices
     * TODO: Add change tracking/audit logging
     * TODO: Emit ProductUpdatedEvent
     * TODO: Clear product cache after update
     * TODO: Add support for updating only specific fields
     * TODO: Add slug regeneration on name change
     * TODO: Validate stock levels for variants
     */
    async updateProduct(id: string, data: UpdateProductDto) {
        const { variants, images, brand, category, ...productData } = data as any;

        this.logger.log(`Updating product: ${id}`);

        // Check product existence
        const existingProduct = await this.productRepo.findOneBy({ id });
        if (!existingProduct) {
            this.logger.warn(`Product ${id} not found for update`);
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Verify Category if updating
        if (productData.categoryId) {
            const cat = await this.categoryRepo.findOneBy({ id: productData.categoryId });
            if (!cat) {
                this.logger.warn(`Category ${productData.categoryId} not found`);
                throw new NotFoundException(`Category with ID ${productData.categoryId} not found`);
            }
            productData.category = cat;
        }

        // Verify Brand if updating
        if (productData.brandId) {
            const b = await this.brandRepo.findOneBy({ id: productData.brandId });
            if (!b) {
                this.logger.warn(`Brand ${productData.brandId} not found`);
                throw new NotFoundException(`Brand with ID ${productData.brandId} not found`);
            }
            productData.brand = b;
        }

        // TODO: Wrap in transaction
        try {
            // Update product
            await this.productRepo.update(id, productData);
            this.logger.log(`Product ${id} updated successfully`);

            // Update variants if provided (complete replacement)
            // TODO: Implement smarter variant updates (add/update/delete individually)
            if (variants) {
                // Delete all existing variants
                await this.variantRepo.delete({ product: { id } });

                // Create new variants
                const variantEntities = variants.map(v =>
                    this.variantRepo.create({ ...v, product: { id } })
                );
                await this.variantRepo.save(variantEntities);

                this.logger.log(`Updated variants for product ${id}`);
            }

            // TODO: Emit ProductUpdatedEvent
            // TODO: Invalidate cache

            return this.findOne(id);
        } catch (error) {
            this.logger.error(`Error updating product ${id}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to update product');
        }
    }

    /**
     * Deletes a product and its associated images.
     * 
     * Removes product images from storage before deleting the product.
     * Cascades deletion to variants and images through database relations.
     * 
     * @param id - Product ID to delete
     * @returns Promise resolving to deletion result
     * 
     * @example
     * ```typescript
     * await productsService.deleteProduct('prod_123');
     * ```
     * 
     * TODO: Implement soft delete instead of hard delete
     * TODO: Add transaction support
     * TODO: Check for existing orders before deletion
     * TODO: Archive product data before deletion
     * TODO: Add authorization check (only admin can delete)
     * TODO: Emit ProductDeletedEvent
     * TODO: Add bulk delete functionality
     * TODO: Add undo functionality for accidental deletions
     * TODO: Add grace period before permanent deletion
     * TODO: Handle file deletion errors gracefully
     */
    async deleteProduct(id: string) {
        this.logger.log(`Deleting product: ${id}`);

        // TODO: Add transaction wrapper

        // Find product with images
        const product = await this.findOne(id);

        // TODO: Check if product has any orders before deletion

        // Delete associated images from storage
        if (product && product.images) {
            for (const image of product.images) {
                try {
                    await this.fileStorageService.deleteFile(image.url);
                    this.logger.debug(`Deleted image: ${image.url}`);
                } catch (error) {
                    this.logger.error(`Failed to delete image ${image.url}: ${error.message}`);
                    // TODO: Decide whether to continue or abort deletion
                }
            }
        }

        // TODO: Use soft delete instead
        const result = await this.productRepo.delete(id);

        this.logger.log(`Product ${id} deleted successfully`);

        // TODO: Emit ProductDeletedEvent
        // TODO: Clear product cache

        return result;
    }

    /**
     * Adds an image to a product.
     * 
     * Uploads image to storage and creates ProductImage record.
     * Supports marking image as primary (main product image).
     * 
     * @param productId - Product ID to add image to
     * @param file - Uploaded image file
     * @param isPrimary - Whether this is the primary product image
     * @returns Promise resolving to created ProductImage entity
     * 
     * @example
     * ```typescript
     * const image = await productsService.addProductImage(
     *   'prod_123',
     *   uploadedFile,
     *   true
     * );
     * ```
     * 
     * TODO: Validate file type (only images allowed)
     * TODO: Validate file size (max 5MB)
     * TODO: Generate thumbnails for different sizes
     * TODO: Add image optimization/compression
     * TODO: If isPrimary=true, unset other primary images
     * TODO: Add transaction support
     * TODO: Add image metadata (dimensions, file size)
     * TODO: Add alt text support for accessibility
     * TODO: Validate product exists before upload
     * TODO: Add rollback on storage failure
     */
    async addProductImage(productId: string, file: Express.Multer.File, isPrimary: boolean = false) {
        this.logger.log(`Adding image to product ${productId}, isPrimary: ${isPrimary}`);

        // Check existing images count
        const count = await this.imageRepo.count({ where: { product: { id: productId } } });
        if (count >= 10) {
            throw new BadRequestException('Maximum of 10 images allowed per product variant');
        }

        // Validate product exists
        // TODO: Validate product exists
        // TODO: Validate file type and size
        // TODO: If isPrimary, unset existing primary images

        try {
            // Upload file to storage
            const url = await this.fileStorageService.saveFile(file, `products/${productId}`);

            // Create image record
            const image = this.imageRepo.create({
                url,
                isPrimary,
                product: { id: productId }
            });

            const saved = await this.imageRepo.save(image);
            this.logger.log(`Image added successfully: ${saved.id}`);

            // TODO: Generate thumbnails
            // TODO: Emit ImageAddedEvent

            return saved;
        } catch (error) {
            this.logger.error(`Failed to add image to product ${productId}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to upload product image');
        }
    }

    /**
     * Removes a product image.
     * 
     * Deletes image from storage and removes database record.
     * 
     * @param imageId - ProductImage ID to remove
     * 
     * @example
     * ```typescript
     * await productsService.removeProductImage('img_123');
     * ```
     * 
     * TODO: Add validation to prevent removing last image
     * TODO: Add authorization check
     * TODO: Add transaction support
     * TODO: Handle storage deletion failures gracefully
     * TODO: If removing primary image, set another as primary
     * TODO: Delete associated thumbnails
     * TODO: Emit ImageRemovedEvent
     */
    async removeProductImage(imageId: string) {
        this.logger.log(`Removing product image: ${imageId}`);

        const image = await this.imageRepo.findOneBy({ id: imageId });

        if (image) {
            try {
                // Delete from storage
                await this.fileStorageService.deleteFile(image.url);

                // Delete from database
                await this.imageRepo.delete(imageId);

                this.logger.log(`Image ${imageId} removed successfully`);

                // TODO: If was primary, set another image as primary
                // TODO: Delete thumbnails
                // TODO: Emit ImageRemovedEvent
            } catch (error) {
                this.logger.error(`Failed to remove image ${imageId}: ${error.message}`, error.stack);
                throw new BadRequestException('Failed to remove product image');
            }
        }
    }

    /**
     * Adds an image to a product via an external URL.
     * 
     * @param productId - Product ID to add image to
     * @param url - External image URL
     * @param isPrimary - Whether this is the primary product image
     * @returns Promise resolving to created ProductImage entity
     */
    async addProductImageLink(productId: string, url: string, isPrimary: boolean = false) {
        this.logger.log(`Adding image link to product ${productId}, url: ${url}, isPrimary: ${isPrimary}`);

        try {
            // Create image record directly with the URL
            const image = this.imageRepo.create({
                url,
                isPrimary,
                product: { id: productId }
            });

            const saved = await this.imageRepo.save(image);
            this.logger.log(`Image link added successfully: ${saved.id}`);

            return saved;
        } catch (error) {
            this.logger.error(`Failed to add image link to product ${productId}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to add product image link');
        }
    }

    /**
     * Uploads a generic file (not associated with a product).
     * 
     * Useful for CMS content, descriptions, or temporary uploads.
     * 
     * @param file - File to upload
     * @returns Promise resolving to object with file URL
     * 
     * @example
     * ```typescript
     * const { url } = await productsService.uploadGenericFile(file);
     * ```
     * 
     * TODO: Add file type validation
     * TODO: Add file size limits
     * TODO: Add virus scanning
     * TODO: Add expiration/cleanup for unused files
     * TODO: Add metadata tracking (who uploaded, when)
     * TODO: Consider moving to dedicated FileService
     */
    async uploadGenericFile(file: Express.Multer.File) {
        this.logger.log(`Uploading generic file: ${file.originalname}`);

        // TODO: Validate file type and size
        // TODO: Generate unique filename to prevent collisions

        try {
            const url = await this.fileStorageService.saveFile(file, `media/generic/${Date.now()}`);
            this.logger.log(`Generic file uploaded: ${url}`);
            return { url };
        } catch (error) {
            this.logger.error(`Failed to upload generic file: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to upload file');
        }
    }

    /**
     * Uploads multiple generic files.
     * 
     * Batch upload utility for multiple files.
     * 
     * @param files - Array of files to upload
     * @returns Promise resolving to object with array of file URLs
     * 
     * @example
     * ```typescript
     * const { urls } = await productsService.uploadGenericFiles(files);
     * ```
     * 
     * TODO: Add concurrent upload limit
     * TODO: Add progress tracking
     * TODO: Add partial failure handling (return success + failed)
     * TODO: Add file type validation
     * TODO: Add total size limit
     * TODO: Consider moving to dedicated FileService
     */
    async uploadGenericFiles(files: Array<Express.Multer.File>) {
        this.logger.log(`Uploading ${files.length} generic files`);

        // TODO: Validate total file count and size
        // TODO: Add concurrent upload limit (e.g., max 5 at a time)

        try {
            const uploadPromises = files.map(file =>
                this.fileStorageService.saveFile(
                    file,
                    `media/generic/${Date.now()}_${Math.random().toString(36).substring(7)}`
                )
            );

            const urls = await Promise.all(uploadPromises);
            this.logger.log(`Uploaded ${urls.length} files successfully`);

            return { urls };
        } catch (error) {
            this.logger.error(`Failed to upload generic files: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to upload files');
        }
    }
}
