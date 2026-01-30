import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Packaging' | 'Dispatched' | 'Delivered' | 'Cancelled';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ default: 'Pending' })
    status: OrderStatus;

    @Column({ nullable: true })
    paymentMethod: string;

    @Column({ type: 'text', nullable: true })
    deliveryAddress: string;

    @Column({ nullable: true })
    deliveryPhone: string;

    @Column({ type: 'text', nullable: true })
    deliveryNotes: string;

    @OneToMany(() => OrderStatusHistory, (history) => history.order, { cascade: true })
    statusHistory: OrderStatusHistory[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
