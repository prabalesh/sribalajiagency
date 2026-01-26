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

    findAll() {
        return this.productRepo.find({ relations: ['category', 'brand', 'images', 'variants'] });
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
        const { variants, ...productData } = data;
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
}

