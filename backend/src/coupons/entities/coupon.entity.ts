import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('coupons')
export class Coupon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    code: string;

    @Column({ type: 'enum', enum: ['percentage', 'flat'], default: 'percentage' })
    discountType: 'percentage' | 'flat';

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    discountValue: number;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    minOrderAmount: number;

    @Column({ type: 'int', nullable: true })
    maxDiscountAmount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
