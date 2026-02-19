import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantType } from '../entities/variant-type.entity';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Injectable()
export class VariantTypesService {
    constructor(
        @InjectRepository(VariantType)
        private variantTypeRepository: Repository<VariantType>,
    ) { }

    async create(createVariantTypeDto: CreateVariantTypeDto): Promise<VariantType> {
        try {
            const variantType = this.variantTypeRepository.create(createVariantTypeDto);
            return await this.variantTypeRepository.save(variantType);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Variant type with this name already exists');
            }
            throw error;
        }
    }

    async findAll(): Promise<VariantType[]> {
        return await this.variantTypeRepository.find({
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<VariantType> {
        const variantType = await this.variantTypeRepository.findOne({ where: { id } });
        if (!variantType) {
            throw new NotFoundException(`Variant type with ID "${id}" not found`);
        }
        return variantType;
    }

    async update(id: string, updateVariantTypeDto: UpdateVariantTypeDto): Promise<VariantType> {
        const variantType = await this.findOne(id);
        Object.assign(variantType, updateVariantTypeDto);
        try {
            return await this.variantTypeRepository.save(variantType);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Variant type with this name already exists');
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const result = await this.variantTypeRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Variant type with ID "${id}" not found`);
        }
    }
}
