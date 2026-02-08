import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
    ) { }

    findAll() {
        return this.categoryRepo.find({ relations: ['parent', 'children'], order: { name: 'ASC' } });
    }

    async findOne(id: string) {
        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['parent', 'children']
        });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async create(data: CreateCategoryDto) {
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

    async update(id: string, data: UpdateCategoryDto) {
        const category = await this.findOne(id);

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

    async delete(id: string) {
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
        const productCount = await this.productRepo.count({
            where: { category: { id } }
        });

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
}
