import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { FileStorageService } from '../common/services/file-storage.service';

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

    createCategory(data: any) {
        const category = this.categoryRepo.create(data);
        return this.categoryRepo.save(category);
    }

    async updateCategory(id: string, data: any) {
        await this.categoryRepo.update(id, data);
        return this.categoryRepo.findOneBy({ id });
    }

    deleteCategory(id: string) {
        return this.categoryRepo.delete(id);
    }

    createBrand(data: any) {
        const brand = this.brandRepo.create(data);
        return this.brandRepo.save(brand);
    }

    async updateBrand(id: string, data: any) {
        await this.brandRepo.update(id, data);
        return this.brandRepo.findOneBy({ id });
    }

    async deleteBrand(id: string) {
        const brand = await this.brandRepo.findOneBy({ id });
        if (brand && brand.image) {
            await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
        }
        return this.brandRepo.delete(id);
    }

    async uploadBrandImage(brandId: string, file: Express.Multer.File) {
        const brand = await this.brandRepo.findOneBy({ id: brandId });
        if (!brand) throw new NotFoundException('Brand not found');

        if (brand.image) {
            await this.fileStorageService.deleteFile(brand.image.replace('/uploads/', ''));
        }

        const url = await this.fileStorageService.saveFile(file, `brands/${brandId}`);
        brand.image = url;
        return this.brandRepo.save(brand);
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

