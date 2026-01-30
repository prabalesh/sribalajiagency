import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.statusHistory)
    order: Order;

    @Column()
    status: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @ManyToOne(() => User, { nullable: true })
    changedBy: User;

    @CreateDateColumn()
    createdAt: Date;
}
