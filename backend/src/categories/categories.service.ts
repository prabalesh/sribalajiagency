import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Service for managing product categories.
 * 
 * Handles hierarchical category structure with parent-child relationships,
 * slug-based URLs, and product association management.
 * 
 * @remarks
 * - Supports nested categories (parent-child)
 * - Automatic slug generation from category name
 * - Prevents deletion of categories with products or subcategories
 * - Enforces unique slug constraint
 * 
 * TODO: Add caching layer for category tree (Redis)
 * TODO: Add category tree view/hierarchy endpoint
 * TODO: Add bulk operations (create/update/delete multiple)
 * TODO: Add category ordering/sorting functionality
 * TODO: Add SEO metadata (meta title, description, keywords)
 */
@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    constructor(
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        private dataSource: DataSource,
    ) { }

    /**
     * Retrieves all categories with parent-child relationships.
     * 
     * @returns Promise resolving to array of Category entities
     * 
     * FIXME: No pagination - can return huge dataset
     * FIXME: Loads all relations which can be expensive
     * 
     * TODO: Add pagination support
     * TODO: Add filtering by parent (root categories only)
     * TODO: Cache category tree structure
     * TODO: Add product count per category
     */
    findAll() {
        this.logger.log('Finding all categories');
        return this.categoryRepo.find({ relations: ['parent', 'children'], order: { name: 'ASC' } });
    }

    /**
     * Retrieves a single category by ID with relationships.
     * 
     * @param id - Category ID
     * @returns Promise resolving to Category entity
     * @throws {NotFoundException} If category doesn't exist
     * 
     * TODO: Add caching for frequently accessed categories
     * TODO: Add product count to response
     * TODO: Validate UUID format
     */
    async findOne(id: string) {
        this.logger.log(`Finding category by ID: ${id}`);
        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['parent', 'children']
        });
        if (!category) {
            this.logger.warn(`Category ${id} not found`);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    /**
     * Creates a new category with automatic slug generation.
     * 
     * @param data - Category creation data
     * @returns Promise resolving to created Category entity
     * @throws {BadRequestException} If slug already exists
     * 
     * FIXME: No validation that parent category exists
     * FIXME: No check for circular parent-child relationships
     * FIXME: No authorization check
     * FIXME: Mutates input DTO (data.slug modification)
     * FIXME: Error code check is PostgreSQL-specific (won't work for MySQL)
     * FIXME: No validation for maximum nesting depth
     * 
     * TODO: Validate parent category exists before creation
     * TODO: Add circular reference detection
     * TODO: Add authorization check (admin only)
     * TODO: Don't mutate input DTO - create new object
     * TODO: Handle database-agnostic duplicate key errors
     * TODO: Add maximum nesting depth validation (e.g., max 3 levels)
     * TODO: Emit CategoryCreatedEvent
     * TODO: Clear category cache after creation
     */
    async create(data: CreateCategoryDto) {
        this.logger.log(`Creating category: ${data.name}`);

        // Simple slug generation if not provided
        if (!data.slug && data.name) {
            data.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            this.logger.debug(`Auto-generated slug: ${data.slug}`);
        }

        try {
            const category = this.categoryRepo.create(data);
            const saved = await this.categoryRepo.save(category);
            this.logger.log(`Category created with ID: ${saved.id}`);
            return saved;
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation (postgres code)
                this.logger.warn(`Duplicate slug: ${data.slug}`);
                throw new ConflictException('A category with this slug already exists');
            }
            this.logger.error(`Failed to create category: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to create category');
        }
    }

    /**
     * Updates an existing category.
     * 
     * @param id - Category ID to update
     * @param data - Partial category update data
     * @returns Promise resolving to updated Category entity
     * @throws {NotFoundException} If category doesn't exist
     * @throws {BadRequestException} If slug already exists
     * 
     * FIXME: Validates category exists but doesn't use it
     * FIXME: No validation if changing parent creates circular reference
     * FIXME: No authorization check
     * FIXME: Error code check is PostgreSQL-specific
     * FIXME: Can change parent to self
     * 
     * TODO: Use the fetched category instead of fetching again
     * TODO: Validate parent change doesn't create circular reference
     * TODO: Add authorization check (admin only)
     * TODO: Prevent setting self as parent
     * TODO: Add change tracking/audit logging
     * TODO: Emit CategoryUpdatedEvent
     * TODO: Clear category cache after update
     */
    async update(id: string, data: UpdateCategoryDto) {
        this.logger.log(`Updating category ${id}`);
        const category = await this.findOne(id);

        try {
            await this.categoryRepo.update(id, data);
            this.logger.log(`Category ${id} updated successfully`);
            return await this.categoryRepo.findOneBy({ id });
        } catch (error) {
            if (error.code === '23505') {
                this.logger.warn(`Duplicate slug during update of category ${id}`);
                throw new ConflictException('A category with this slug already exists');
            }
            this.logger.error(`Failed to update category ${id}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to update category');
        }
    }

    /**
     * Deletes a category with validation.
     * 
     * Validates before deletion:
     * - Category has no subcategories
     * - Category has no associated products
     * 
     * @param id - Category ID to delete
     * @returns Promise resolving to deletion result
     * @throws {NotFoundException} If category doesn't exist
     * @throws {BadRequestException} If category has subcategories or products
     * 
     * FIXME: No authorization check
     * FIXME: Hard delete - no audit trail
     * FIXME: No transaction - product count check and delete are separate
     * FIXME: Race condition - products can be added between check and delete
     * 
     * TODO: Add authorization check (admin only)
     * TODO: Implement soft delete instead of hard delete
     * TODO: Wrap validation and deletion in transaction
     * TODO: Add audit logging (who deleted what)
     * TODO: Emit CategoryDeletedEvent
     * TODO: Clear category cache after deletion
     * TODO: Add option to reassign products before deletion
     * TODO: Add option to reassign subcategories before deletion
     */
    async delete(id: string) {
        this.logger.log(`Deleting category ${id}`);

        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['children']
        });

        if (!category) {
            this.logger.warn(`Category ${id} not found for deletion`);
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Check for subcategories
        if (category.children && category.children.length > 0) {
            this.logger.warn(`Cannot delete category ${id} - has ${category.children.length} subcategories`);
            throw new BadRequestException(
                `Cannot delete category "${category.name}" because it has ${category.children.length} sub-category(ies). Please delete or move them first.`
            );
        }

        // Check for associated products
        const productCount = await this.productRepo.count({
            where: { category: { id } }
        });

        if (productCount > 0) {
            this.logger.warn(`Cannot delete category ${id} - has ${productCount} products`);
            throw new BadRequestException(
                `Cannot delete category "${category.name}" because it contains ${productCount} product(s). Please remove or reassign these products first.`
            );
        }

        try {
            const result = await this.categoryRepo.delete(id);
            this.logger.log(`Category ${id} deleted successfully`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete category ${id}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to delete category');
        }
    }
}
