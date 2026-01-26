import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('location_restrictions')
export class LocationRestriction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    state: string;

    @Column({ nullable: true })
    city: string;

    @Column({ default: true })
    isAllowed: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
