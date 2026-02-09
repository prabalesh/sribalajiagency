import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

/**
 * Service for managing product brands.
 * 
 * Handles brand operations including:
 * - CRUD operations for brands
 * - Brand image management
 * - Brand-category relationship queries
 * - Slug-based brand lookup
 * 
 * @remarks
 * - Enforces unique slug constraint
 * - Prevents deletion of brands with associated products
 * - Manages brand image uploads and deletions
 * - Provides brand-category mapping
 * 
 * @example
 * ```typescript
 * const brand = await brandsService.create({
 *   name: 'Samsung',
 *   slug: 'samsung',
 *   description: 'South Korean electronics brand'
 * });
 * 
 * await brandsService.uploadImage(brand.id, imageFile);
 * const categories = await brandsService.findCategoriesByBrand('samsung');
 * ```
 * 
 * TODO: Add caching layer for brand data (Redis)
 * TODO: Add brand popularity/ranking
 * TODO: Add brand featured flag
 * TODO: Add brand analytics (product count, sales)
 * TODO: Add brand page SEO metadata
 * TODO: Add brand social media links
 * TODO: Add brand story/history field
 * TODO: Add bulk brand operations
 */
@Injectable()
export class BrandsService {
    /** Logger instance for service-level logging */
    private readonly logger = new Logger(BrandsService.name);

    /**
     * Initializes the brands service with required dependencies
     * 
     * @param brandRepo - Repository for Brand entity
     * @param productRepo - Repository for Product entity
     * @param fileStorageService - Service for file upload/deletion operations
     * @param dataSource - TypeORM DataSource for transaction management
     */
    constructor(
        @InjectRepository(Brand)
        private brandRepo: Repository<Brand>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        private fileStorageService: FileStorageService,
        private dataSource: DataSource,
    ) { }

    /**
     * Retrieves all brands sorted alphabetically by name.
     * 
     * @returns Promise resolving to array of Brand entities
     * 
     * @example
     * ```typescript
     * const brands = await brandsService.findAll();
     * ```
     * 
     * FIXME: Missing await - returns Promise instead of resolved value
     * FIXME: console.log in production code
     * FIXME: No pagination - can return huge dataset
     * 
     * TODO: Add await keyword
     * TODO: Remove console.log or use logger
     * TODO: Add pagination support
     * TODO: Add filtering options (active/inactive)
     * TODO: Add search functionality
     * TODO: Add product count per brand
     * TODO: Cache brand list
     * TODO: Add sorting options
     */
    findAll() {
        this.logger.log('Finding all brands');
        // FIXME: Missing await - this returns a Promise, not the data
        let brands = this.brandRepo.find({ order: { name: 'ASC' } });
        // FIXME: console.log should be removed or use logger
        console.log(brands);
        return brands;
    }

    /**
     * Retrieves a single brand by ID.
     * 
     * @param id - Brand ID
     * @returns Promise resolving to Brand entity
     * @throws {NotFoundException} If brand doesn't exist
     * 
     * @example
     * ```typescript
     * const brand = await brandsService.findOne('brand_123');
     * ```
     * 
     * TODO: Add caching for frequently accessed brands
     * TODO: Add product count to response
     * TODO: Validate UUID format
     * TODO: Include category list in response
     */
    async findOne(id: string) {
        this.logger.log(`Finding brand by ID: ${id}`);
        const brand = await this.brandRepo.findOneBy({ id });
        if (!brand) {
            this.logger.warn(`Brand ${id} not found`);
            throw new NotFoundException(`Brand with ID ${id} not found`);
        }
        this.logger.debug(`Brand retrieved: ${brand.name}`);
        return brand;
    }

    /**
     * Retrieves a brand by slug.
     * 
     * @param slug - Brand slug
     * @returns Promise resolving to Brand entity or null
     * 
     * @example
     * ```typescript
     * const brand = await brandsService.findBySlug('samsung');
     * ```
     * 
     * FIXME: Returns null instead of throwing NotFoundException
     * 
     * TODO: Consider throwing NotFoundException for consistency
     * TODO: Add caching by slug
     * TODO: Case-insensitive slug matching
     * TODO: Add product count to response
     */
    async findBySlug(slug: string) {
        this.logger.log(`Finding brand by slug: ${slug}`);
        // FIXME: Returns null instead of throwing error - inconsistent with findOne
        const brand = await this.brandRepo.findOneBy({ slug });
        if (brand) {
            this.logger.debug(`Brand found: ${brand.name}`);
        } else {
            this.logger.warn(`Brand not found for slug: ${slug}`);
        }
        return brand;
    }

    /**
     * Creates a new brand.
     * 
     * @param data - Brand creation data
     * @returns Promise resolving to created Brand entity
     * @throws {BadRequestException} If slug already exists
     * 
     * @example
     * ```typescript
     * const brand = await brandsService.create({
     *   name: 'Sony',
     *   slug: 'sony',
     *   description: 'Japanese electronics brand'
     * });
     * ```
     * 
     * FIXME: No slug validation or auto-generation
     * FIXME: Error code check is PostgreSQL-specific
     * FIXME: No authorization check
     * FIXME: Generic error re-throw loses context
     * 
     * TODO: Add slug auto-generation if not provided
     * TODO: Validate slug format (lowercase, alphanumeric, hyphens)
     * TODO: Handle database-agnostic duplicate key errors
     * TODO: Add authorization check (admin only)
     * TODO: Emit BrandCreatedEvent
     * TODO: Clear brand cache after creation
     * TODO: Add audit logging
     * TODO: Validate name is unique
     * TODO: Sanitize description HTML
     */
    async create(data: CreateBrandDto) {
        this.logger.log(`Creating brand: ${data.name}`);

        // TODO: Generate slug if not provided
        // TODO: Validate slug format
        // TODO: Add authorization check

        try {
            const brand = this.brandRepo.create(data);
            const saved = await this.brandRepo.save(brand);
            this.logger.log(`Brand created with ID: ${saved.id}`);
            // TODO: Emit BrandCreatedEvent
            // TODO: Clear cache
            return saved;
        } catch (error) {
            // FIXME: PostgreSQL-specific error code
            if (error.code === '23505') { // Unique constraint violation
                this.logger.warn(`Duplicate brand slug: ${data.slug}`);
                throw new ConflictException('A brand with this slug already exists');
            }
            this.logger.error(`Failed to create brand: ${error.message}`, error.stack);
            // FIXME: Generic re-throw loses error context
            throw error;
        }
    }

    /**
     * Updates an existing brand.
     * 
     * @param id - Brand ID to update
     * @param data - Partial brand update data
     * @returns Promise resolving to updated Brand entity
     * @throws {NotFoundException} If brand doesn't exist
     * @throws {BadRequestException} If slug already exists
     * 
     * @example
     * ```typescript
     * const updated = await brandsService.update('brand_123', {
     *   description: 'Updated description'
     * });
     * ```
     * 
     * FIXME: Validates brand exists but doesn't use it
     * FIXME: Error code check is PostgreSQL-specific
     * FIXME: No authorization check
     * FIXME: Generic error re-throw loses context
     * 
     * TODO: Use the fetched brand instead of fetching again
     * TODO: Handle database-agnostic errors
     * TODO: Add authorization check (admin only)
     * TODO: Add change tracking/audit logging
     * TODO: Emit BrandUpdatedEvent
     * TODO: Clear brand cache after update
     * TODO: Validate slug format if being updated
     * TODO: Add transaction support
     */
    async update(id: string, data: UpdateBrandDto) {
        this.logger.log(`Updating brand ${id}`);

        // FIXME: Fetches brand but doesn't use it
        const brand = await this.findOne(id);

        // TODO: Add authorization check

        try {
            await this.brandRepo.update(id, data);
            this.logger.log(`Brand ${id} updated successfully`);
            // TODO: Emit BrandUpdatedEvent
            // TODO: Clear cache
            // FIXME: Fetches again instead of using the one from validation
            return await this.brandRepo.findOneBy({ id });
        } catch (error) {
            // FIXME: PostgreSQL-specific error code
            if (error.code === '23505') { // Unique constraint violation
                this.logger.warn(`Duplicate brand slug during update of brand ${id}`);
                throw new ConflictException('A brand with this slug already exists');
            }
            this.logger.error(`Failed to update brand ${id}: ${error.message}`, error.stack);
            // FIXME: Generic re-throw loses error context
            throw error;
        }
    }

    /**
     * Deletes a brand with validation.
     * 
     * Validates before deletion:
     * - Brand has no associated products
     * - Deletes brand image from storage
     * 
     * @param id - Brand ID to delete
     * @returns Promise resolving to deletion result
     * @throws {NotFoundException} If brand doesn't exist
     * @throws {BadRequestException} If brand has products or deletion fails
     * 
     * @example
     * ```typescript
     * await brandsService.delete('brand_123');
     * ```
     * 
     * FIXME: No transaction - image delete and brand delete are separate
     * FIXME: Race condition - products can be added between check and delete
     * FIXME: console.error in production code
     * FIXME: No authorization check
     * FIXME: Hard delete - no audit trail
     * FIXME: Uses brandId field instead of brand relation
     * 
     * TODO: Wrap in transaction for atomicity
     * TODO: Add race condition protection
     * TODO: Remove console.error, use logger
     * TODO: Add authorization check (admin only)
     * TODO: Implement soft delete instead
     * TODO: Use proper relation query (brand: { id })
     * TODO: Emit BrandDeletedEvent
     * TODO: Clear brand cache after deletion
     * TODO: Add audit logging
     * TODO: Add confirmation requirement for brands with data
     */
    async delete(id: string) {
        this.logger.log(`Deleting brand ${id}`);

        // TODO: Add authorization check

        const brand = await this.findOne(id);

        // FIXME: No transaction - check and delete are separate
        // Check if brand is being used by any products
        // FIXME: Uses brandId instead of brand relation
        const productsUsingBrand = await this.productRepo.count({
            where: { brandId: id }
        });

        if (productsUsingBrand > 0) {
            this.logger.warn(`Cannot delete brand ${id} - used by ${productsUsingBrand} products`);
            throw new BadRequestException(
                `Cannot delete brand "${brand.name}" because it is being used by ${productsUsingBrand} product(s). Please remove or reassign these products first.`
            );
        }

        // Delete brand image if exists
        if (brand.image) {
            try {
                await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
                this.logger.debug(`Brand image deleted: ${brand.image}`);
            } catch (error) {
                // FIXME: console.error should use logger
                // Log error but don't fail the deletion if image deletion fails
                console.error('Failed to delete brand image:', error);
                this.logger.error(`Failed to delete brand image: ${error.message}`, error.stack);
            }
        }

        try {
            const result = await this.brandRepo.delete(id);
            this.logger.log(`Brand ${id} deleted successfully`);
            // TODO: Emit BrandDeletedEvent
            // TODO: Clear cache
            return result;
        } catch (error) {
            // Handle any other database errors
            if (error.code === '23503') { // Foreign key constraint violation
                this.logger.error(`Foreign key constraint violation for brand ${id}`);
                throw new BadRequestException(
                    `Cannot delete this brand because it is referenced by other records in the system.`
                );
            }
            this.logger.error(`Failed to delete brand ${id}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to delete brand. Please try again.');
        }
    }

    /**
     * Uploads or replaces brand image.
     * 
     * Deletes old image (if exists) and uploads new one.
     * 
     * @param brandId - Brand ID
     * @param file - Image file to upload
     * @returns Promise resolving to updated Brand entity with new image URL
     * @throws {NotFoundException} If brand doesn't exist
     * @throws {BadRequestException} If no file provided or upload fails
     * 
     * @example
     * ```typescript
     * const updated = await brandsService.uploadImage('brand_123', imageFile);
     * console.log(updated.image); // URL to uploaded image
     * ```
     * 
     * FIXME: No transaction - old image delete and new upload are separate
     * FIXME: No file type validation
     * FIXME: No file size validation
     * FIXME: No authorization check
     * FIXME: console.error in production code
     * FIXME: Path manipulation with string replace is unsafe
     * 
     * TODO: Wrap in transaction
     * TODO: Validate file type (only images)
     * TODO: Validate file size (max 5MB)
     * TODO: Add authorization check (admin only)
     * TODO: Remove console.error, use logger
     * TODO: Use proper path parsing
     * TODO: Add image optimization/compression
     * TODO: Generate thumbnails
     * TODO: Clear cache after upload
     * TODO: Emit BrandImageUpdatedEvent
     * TODO: Add virus scanning
     * TODO: Validate image dimensions
     */
    async uploadImage(brandId: string, file: Express.Multer.File) {
        this.logger.log(`Uploading image for brand ${brandId}`);

        const brand = await this.findOne(brandId);

        if (!file) {
            this.logger.warn('No file provided for brand image upload');
            throw new BadRequestException('No file provided');
        }

        // TODO: Validate file type and size
        // TODO: Add authorization check

        // Delete old image if exists
        if (brand.image) {
            try {
                // FIXME: String replace is unsafe - use proper path parsing
                await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
                this.logger.debug(`Old brand image deleted: ${brand.image}`);
            } catch (error) {
                // FIXME: console.error should use logger
                // Log error but continue with upload
                console.error('Failed to delete old brand image:', error);
                this.logger.error(`Failed to delete old brand image: ${error.message}`, error.stack);
            }
        }

        try {
            const url = await this.fileStorageService.saveFile(file, `brands/${brandId}`);
            brand.image = url;
            const saved = await this.brandRepo.save(brand);
            this.logger.log(`Brand image uploaded successfully: ${url}`);
            // TODO: Emit BrandImageUpdatedEvent
            // TODO: Clear cache
            return saved;
        } catch (error) {
            this.logger.error(`Failed to upload brand image: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to upload brand image');
        }
    }

    /**
     * Retrieves categories associated with a brand.
     * 
     * Finds all products for the brand and extracts unique categories.
     * 
     * @param brandSlug - Brand slug
     * @returns Promise resolving to array of unique Category entities
     * 
     * @example
     * ```typescript
     * const categories = await brandsService.findCategoriesByBrand('samsung');
     * // Returns categories that have Samsung products
     * ```
     * 
     * FIXME: Inefficient - loads all products to get categories
     * FIXME: Manual deduplication is complex and error-prone
     * FIXME: No validation that brand exists
     * FIXME: Returns empty array if brand doesn't exist (no error)
     * FIXME: Can return undefined in array if category is null
     * 
     * TODO: Optimize query - use GROUP BY to get categories directly
     * TODO: Validate brand exists before query
     * TODO: Throw NotFoundException if brand doesn't exist
     * TODO: Handle null categories properly
     * TODO: Add caching
     * TODO: Add product count per category
     * TODO: Add sorting options
     * TODO: Use query builder for better performance
     */
    async findCategoriesByBrand(brandSlug: string) {
        this.logger.log(`Finding categories for brand: ${brandSlug}`);

        // FIXME: No validation that brand exists
        // TODO: Validate brand exists first

        // FIXME: Inefficient - loads all products just to get categories
        // TODO: Use optimized query with GROUP BY
        const result = await this.productRepo.find({
            where: { brand: { slug: brandSlug } },
            relations: ['category']
        });

        this.logger.debug(`Found ${result.length} products for brand ${brandSlug}`);

        // FIXME: Manual deduplication is inefficient and complex
        const categories = result.map(p => p.category);
        const uniqueCategories = Array.from(new Set(categories.map(c => c.id)))
            .map(id => categories.find(c => c.id === id));

        this.logger.log(`Found ${uniqueCategories.length} unique categories for brand ${brandSlug}`);
        return uniqueCategories;
    }
}
