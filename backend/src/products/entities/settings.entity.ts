import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'jsonb', default: ['online', 'cod'] })
    enabledPaymentMethods: string[];

    @Column({ default: true })
    allowCod: boolean;

    @Column({ default: true })
    allowOnline: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}
