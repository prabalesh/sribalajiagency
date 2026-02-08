import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { FileStorageService } from '../common/services/file-storage.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
    constructor(
        @InjectRepository(Brand)
        private brandRepo: Repository<Brand>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        private fileStorageService: FileStorageService,
    ) { }

    findAll() {
        let brands = this.brandRepo.find({ order: { name: 'ASC' } });
        console.log(brands);
        return brands;
    }

    async findOne(id: string) {
        const brand = await this.brandRepo.findOneBy({ id });
        if (!brand) {
            throw new NotFoundException(`Brand with ID ${id} not found`);
        }
        return brand;
    }

    async findBySlug(slug: string) {
        return this.brandRepo.findOneBy({ slug });
    }

    async create(data: CreateBrandDto) {
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

    async update(id: string, data: UpdateBrandDto) {
        const brand = await this.findOne(id);

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

    async delete(id: string) {
        const brand = await this.findOne(id);

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

    async uploadImage(brandId: string, file: Express.Multer.File) {
        const brand = await this.findOne(brandId);

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
