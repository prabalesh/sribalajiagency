import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { ColumnNumericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
    images: ProductImage[];

    @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
    variants: ProductVariant[];

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

    @Column({ default: false })
    isFeatured: boolean;

    @ManyToOne(() => Category)
    category: Category;

    @Column({ nullable: true })
    categoryId: string;

    @ManyToOne(() => Brand)
    brand: Brand;

    @Column({ nullable: true })
    brandId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

