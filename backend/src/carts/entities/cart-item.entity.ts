import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
    cart: Cart;

    @Index()
    @Column()
    productId: string;

    @ManyToOne(() => Product, { eager: true })
    product: Product;

    @Index()
    @Column({ nullable: true })
    variantId: string;

    @ManyToOne(() => ProductVariant, { nullable: true, eager: true })
    variant: ProductVariant;

    @Column({ type: 'int' })
    quantity: number;
}
