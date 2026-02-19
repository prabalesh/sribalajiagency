import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('variant_types')
export class VariantType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // e.g., 'Color', 'Size'

    @Column({ nullable: true })
    displayName: string;

    @OneToMany(() => ProductVariant, (variant) => variant.variantType)
    variants: ProductVariant[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
