import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, DeleteDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { VariantType } from './variant-type.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('product_variants')
export class ProductVariant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // e.g., 'Large', 'Blue'

    @Index()
    @Column({ type: 'decimal', precision: 12, scale: 2, transformer: new ColumnNumericTransformer() })
    price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: new ColumnNumericTransformer() })
    comparisonPrice: number;

    @Index()
    @Column({ nullable: true })
    sku: string;

    @Column('jsonb', { nullable: true })
    specifications: any;

    @Column({ default: 0 })
    stock: number;

    @Column({ nullable: true })
    image: string; // Keep for backward compatibility or primary variant image

    @Column('text', { array: true, default: [] })
    images: string[];

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index()
    @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
    product: Product;

    @Column({ nullable: true })
    variantTypeId: string;

    @ManyToOne(() => VariantType, (variantType) => variantType.variants, { nullable: true })
    variantType: VariantType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Index()
    @DeleteDateColumn()
    deletedAt: Date;
}
