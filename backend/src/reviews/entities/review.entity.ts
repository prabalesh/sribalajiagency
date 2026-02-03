import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    rating: number; // 1 to 5

    @Column({ type: 'text', nullable: true })
    comment: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: string;

    @CreateDateColumn()
    createdAt: Date;
}
