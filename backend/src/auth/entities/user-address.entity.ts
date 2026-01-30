import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    name: string; // e.g., "Home", "Office"

    @Column()
    type: string; // "Home", "Work", "Warehouse", etc.

    @Column()
    street: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    zip: string;

    @Column({ nullable: true })
    phonePrimary: string;

    @Column({ nullable: true })
    phoneSecondary: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    lat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    lng: number;

    @Column({ default: false })
    isDefault: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
