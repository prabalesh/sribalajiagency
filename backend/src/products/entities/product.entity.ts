import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, DeleteDateColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
    images: ProductImage[];

    @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
    variants: ProductVariant[];

    @Index()
    @Column({ default: true })
    isAvailable: boolean;


    @Column({ nullable: true })
    maxOrderQuantity: number;

    @Column({ default: false })
    isShowcaseOnly: boolean;

    @Column({ type: 'jsonb', nullable: true })
    allowedPaymentMethods: string[]; // e.g., ['online', 'cod']

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 18, transformer: new ColumnNumericTransformer() })
    gstRate: number;

    @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, default: 0, transformer: new ColumnNumericTransformer() })
    rating: number;

    @Column({ default: 0 })
    reviewCount: number;

    @Index()
    @Column({ default: false })
    isFeatured: boolean;

    @ManyToOne(() => Category)
    category: Category;

    @Index()
    @Column({ nullable: true })
    categoryId: string;

    @ManyToOne(() => Brand)
    brand: Brand;

    @Index()
    @Column({ nullable: true })
    brandId: string;

    @Index()
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Index()
    @DeleteDateColumn()
    deletedAt: Date;
}

