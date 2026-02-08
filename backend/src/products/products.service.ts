import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

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

        let order: any = {};
        if (filters.sortBy) {
            order[filters.sortBy] = filters.sortOrder || 'ASC';
        } else {
            order = { isAvailable: 'DESC', name: 'ASC' };
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

    // CRUD operations
    async createProduct(data: CreateProductDto) {
        const { variants, ...productData } = data as any;

        // Verify Category and Brand existence if IDs provided
        if (productData.categoryId) {
            const category = await this.categoryRepo.findOneBy({ id: productData.categoryId });
            if (!category) throw new NotFoundException(`Category with ID ${productData.categoryId} not found`);
            productData.category = category; // Set relation
        }

        if (productData.brandId) {
            const brand = await this.brandRepo.findOneBy({ id: productData.brandId });
            if (!brand) throw new NotFoundException(`Brand with ID ${productData.brandId} not found`);
            productData.brand = brand; // Set relation
        }

        try {
            const product = this.productRepo.create(productData);
            const savedProduct = await this.productRepo.save(product) as any;

            if (variants && variants.length > 0) {
                const variantEntities = variants.map(v => this.variantRepo.create({ ...v, product: savedProduct }));
                await this.variantRepo.save(variantEntities);
            }

            return this.findOne(savedProduct.id);
        } catch (error) {
            console.error('Error creating product:', error);
            throw new BadRequestException('Failed to create product. Check data fields.');
        }
    }

    async updateProduct(id: string, data: UpdateProductDto) {
        const { variants, images, brand, category, ...productData } = data as any;

        const existingProduct = await this.productRepo.findOneBy({ id });
        if (!existingProduct) throw new NotFoundException(`Product with ID ${id} not found`);

        if (productData.categoryId) {
            const cat = await this.categoryRepo.findOneBy({ id: productData.categoryId });
            if (!cat) throw new NotFoundException(`Category with ID ${productData.categoryId} not found`);
            productData.category = cat;
        }

        if (productData.brandId) {
            const b = await this.brandRepo.findOneBy({ id: productData.brandId });
            if (!b) throw new NotFoundException(`Brand with ID ${productData.brandId} not found`);
            productData.brand = b;
        }

        try {
            await this.productRepo.update(id, productData);

            if (variants) {
                // Simple replacement for now
                await this.variantRepo.delete({ product: { id } });
                const variantEntities = variants.map(v => this.variantRepo.create({ ...v, product: { id } }));
                await this.variantRepo.save(variantEntities);
            }

            return this.findOne(id);
        } catch (error) {
            throw new BadRequestException('Failed to update product');
        }
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
}
