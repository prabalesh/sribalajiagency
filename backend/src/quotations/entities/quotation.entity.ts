import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('quotations')
export class Quotation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: true })
    user?: User;

    @Column()
    customerName: string;

    @Column()
    email: string;

    @Column()
    phone: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ nullable: true })
    productName?: string;

    @Column({ default: 'Open' })
    status: 'Open' | 'Closed';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
