import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('location_restrictions')
@Index(['state', 'city', 'zipcode'], { unique: true })
export class LocationRestriction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    state: string;

    @Column({ nullable: true })
    @Index()
    city: string;

    @Column({ nullable: true })
    @Index()
    zipcode: string;

    @Column({ default: true })
    isAllowed: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
