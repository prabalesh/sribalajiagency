import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class ProductsService {
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
        private fileStorageService: FileStorageService,
    ) { }

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
        if (limit > 50) limit = 50;
        const skip = (page - 1) * limit;

        const { Between, MoreThanOrEqual, LessThanOrEqual, ILike } = require('typeorm');

        let order: any = { isAvailable: 'DESC' }; // Prioritize in-stock/available products
        if (filters.sortBy) {
            order[filters.sortBy] = filters.sortOrder || 'ASC';
        } else {
            order.name = 'ASC';
        }

        const where: any = {};

        if (filters.categoryId) where.category = { id: filters.categoryId };
        if (filters.categorySlug) where.category = { slug: filters.categorySlug };
        if (filters.brandId) where.brand = { id: filters.brandId };
        if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
        if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

        // Price Filtering
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            where.price = Between(filters.minPrice, filters.maxPrice);
        } else if (filters.minPrice !== undefined) {
            where.price = MoreThanOrEqual(filters.minPrice);
        } else if (filters.maxPrice !== undefined) {
            where.price = LessThanOrEqual(filters.maxPrice);
        }

        let whereClause = where;
        if (filters.q) {
            whereClause = [
                { ...where, name: ILike(`%${filters.q}%`) },
                { ...where, description: ILike(`%${filters.q}%`) }
            ];
        }

        const [items, total] = await this.productRepo.findAndCount({
            relations: ['category', 'brand', 'images', 'variants'],
            order,
            take: limit,
            skip: skip,
            where: whereClause
        });

        return { items, total, page, limit };
    }

    findOne(id: string) {
        return this.productRepo.findOne({
            where: { id },
            relations: ['category', 'brand', 'images', 'variants'],
        });
    }

    findAllCategories() {
        return this.categoryRepo.find({ relations: ['parent', 'children'] });
    }

    findAllBrands() {
        return this.brandRepo.find();
    }

    // CRUD operations
    async createProduct(data: any) {
        const { variants, ...productData } = data;
        const product = this.productRepo.create(productData);
        const savedProduct = await this.productRepo.save(product) as any;

        if (variants && variants.length > 0) {
            const variantEntities = variants.map(v => this.variantRepo.create({ ...v, product: savedProduct }));
            await this.variantRepo.save(variantEntities);
        }

        return this.findOne(savedProduct.id);
    }

    async updateProduct(id: string, data: any) {
        const { variants, images, brand, category, ...productData } = data;
        await this.productRepo.update(id, productData);

        if (variants) {
            // Simple replacement for now, or more complex diffing logic
            await this.variantRepo.delete({ product: { id } });
            const variantEntities = variants.map(v => this.variantRepo.create({ ...v, product: { id } }));
            await this.variantRepo.save(variantEntities);
        }

        return this.findOne(id);
    }

    async deleteProduct(id: string) {
        const product = await this.findOne(id);
        if (product && product.images) {
            for (const image of product.images) {
                await this.fileStorageService.deleteFile(image.url);
            }
        }
        return this.productRepo.delete(id);
    }

    // Image Management
    async addProductImage(productId: string, file: Express.Multer.File, isPrimary: boolean = false) {
        const url = await this.fileStorageService.saveFile(file, `products/${productId}`);
        const image = this.imageRepo.create({
            url,
            isPrimary,
            product: { id: productId }
        });
        return this.imageRepo.save(image);
    }

    async removeProductImage(imageId: string) {
        const image = await this.imageRepo.findOneBy({ id: imageId });
        if (image) {
            await this.fileStorageService.deleteFile(image.url);
            await this.imageRepo.delete(imageId);
        }
    }

    async uploadGenericFile(file: Express.Multer.File) {
        const url = await this.fileStorageService.saveFile(file, `media/generic/${Date.now()}`);
        return { url };
    }

    async uploadGenericFiles(files: Array<Express.Multer.File>) {
        const uploadPromises = files.map(file =>
            this.fileStorageService.saveFile(file, `media/generic/${Date.now()}_${Math.random().toString(36).substring(7)}`)
        );
        const urls = await Promise.all(uploadPromises);
        return { urls };
    }

    async createCategory(data: any) {
        // Simple slug generation if not provided
        if (!data.slug && data.name) {
            data.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        try {
            const category = this.categoryRepo.create(data);
            return await this.categoryRepo.save(category);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation (postgres code)
                throw new BadRequestException('A category with this slug already exists');
            }
            throw new BadRequestException('Failed to create category');
        }
    }

    async updateCategory(id: string, data: any) {
        const category = await this.categoryRepo.findOneBy({ id });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // If updating slug, check if new slug is different and available (though DB unique constraint handles availability)
        if (data.slug && data.slug !== category.slug) {
            // Logic to check could go here, or rely on DB catch
        }

        try {
            await this.categoryRepo.update(id, data);
            return await this.categoryRepo.findOneBy({ id });
        } catch (error) {
            if (error.code === '23505') {
                throw new BadRequestException('A category with this slug already exists');
            }
            throw new BadRequestException('Failed to update category');
        }
    }

    async deleteCategory(id: string) {
        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['children']
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Check for subcategories
        if (category.children && category.children.length > 0) {
            throw new BadRequestException(
                `Cannot delete category "${category.name}" because it has ${category.children.length} sub-category(ies). Please delete or move them first.`
            );
        }

        // Check for associated products
        // Note: If 'products' relation is not eager/loaded, we might need a separate count query if strict check is needed.
        // Let's do a explicit check to be safe if relations map isn't perfect
        const productCount = await this.productRepo.count({ where: { category: { id } } });

        if (productCount > 0) {
            throw new BadRequestException(
                `Cannot delete category "${category.name}" because it contains ${productCount} product(s). Please remove or reassign these products first.`
            );
        }

        try {
            return await this.categoryRepo.delete(id);
        } catch (error) {
            throw new BadRequestException('Failed to delete category');
        }
    }

    async createBrand(data: CreateBrandDto) {
        try {
            const brand = this.brandRepo.create(data);
            return await this.brandRepo.save(brand);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new BadRequestException('A brand with this slug already exists');
            }
            throw error;
        }
    }

    async updateBrand(id: string, data: UpdateBrandDto) {
        const brand = await this.brandRepo.findOneBy({ id });
        if (!brand) {
            throw new NotFoundException(`Brand with ID ${id} not found`);
        }

        try {
            await this.brandRepo.update(id, data);
            return await this.brandRepo.findOneBy({ id });
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new BadRequestException('A brand with this slug already exists');
            }
            throw error;
        }
    }

    async deleteBrand(id: string) {
        const brand = await this.brandRepo.findOneBy({ id });
        if (!brand) {
            throw new NotFoundException(`Brand with ID ${id} not found`);
        }

        // Check if brand is being used by any products
        const productsUsingBrand = await this.productRepo.count({
            where: { brandId: id }
        });

        if (productsUsingBrand > 0) {
            throw new BadRequestException(
                `Cannot delete brand "${brand.name}" because it is being used by ${productsUsingBrand} product(s). Please remove or reassign these products first.`
            );
        }

        // Delete brand image if exists
        if (brand.image) {
            try {
                await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
            } catch (error) {
                // Log error but don't fail the deletion if image deletion fails
                console.error('Failed to delete brand image:', error);
            }
        }

        try {
            return await this.brandRepo.delete(id);
        } catch (error) {
            // Handle any other database errors
            if (error.code === '23503') { // Foreign key constraint violation
                throw new BadRequestException(
                    `Cannot delete this brand because it is referenced by other records in the system.`
                );
            }
            throw new BadRequestException('Failed to delete brand. Please try again.');
        }
    }

    async uploadBrandImage(brandId: string, file: Express.Multer.File) {
        const brand = await this.brandRepo.findOneBy({ id: brandId });
        if (!brand) {
            throw new NotFoundException(`Brand with ID ${brandId} not found`);
        }

        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Delete old image if exists
        if (brand.image) {
            try {
                await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
            } catch (error) {
                // Log error but continue with upload
                console.error('Failed to delete old brand image:', error);
            }
        }

        try {
            const url = await this.fileStorageService.saveFile(file, `brands/${brandId}`);
            brand.image = url;
            return await this.brandRepo.save(brand);
        } catch (error) {
            throw new BadRequestException('Failed to upload brand image');
        }
    }

    async getBrandBySlug(slug: string) {
        return this.brandRepo.findOneBy({ slug });
    }

    async findCategoriesByBrand(brandSlug: string) {
        const result = await this.productRepo.find({
            where: { brand: { slug: brandSlug } },
            relations: ['category']
        });

        const categories = result.map(p => p.category);
        const uniqueCategories = Array.from(new Set(categories.map(c => c.id)))
            .map(id => categories.find(c => c.id === id));

        return uniqueCategories;
    }
}

