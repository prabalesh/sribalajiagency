import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/drizzle/schema';
import { DRIZZLE_DB } from '../../database/drizzle/drizzle.module';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Injectable()
export class VariantTypesService {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createVariantTypeDto: CreateVariantTypeDto) {
    try {
      const [variantType] = await this.db
        .insert(schema.variantTypes)
        .values(createVariantTypeDto)
        .returning();
      return variantType;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Variant type with this name already exists',
        );
      }
      throw error;
    }
  }

  async findAll() {
    return await this.db.query.variantTypes.findMany({
      orderBy: [asc(schema.variantTypes.name)],
      where: (vt, { isNull }) => isNull(vt.deletedAt),
    });
  }

  async findOne(id: string) {
    const variantType = await this.db.query.variantTypes.findFirst({
      where: eq(schema.variantTypes.id, id),
    });
    if (!variantType || variantType.deletedAt) {
      throw new NotFoundException(`Variant type with ID "${id}" not found`);
    }
    return variantType;
  }

  async update(id: string, updateVariantTypeDto: UpdateVariantTypeDto) {
    await this.findOne(id);
    try {
      const [updated] = await this.db
        .update(schema.variantTypes)
        .set(updateVariantTypeDto)
        .where(eq(schema.variantTypes.id, id))
        .returning();
      return updated;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Variant type with this name already exists',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const [result] = await this.db
      .update(schema.variantTypes)
      .set({ deletedAt: new Date() })
      .where(eq(schema.variantTypes.id, id))
      .returning();
    if (!result) {
      throw new NotFoundException(`Variant type with ID "${id}" not found`);
    }
  }
}
