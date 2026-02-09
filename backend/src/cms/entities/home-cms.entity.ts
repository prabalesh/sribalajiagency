import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('home_cms')
export class HomeCMS {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'classic' })
    heroType: 'classic' | 'carousel' | 'split' | 'overlay' | 'classic-carousel';

    @Column({ default: 'BESTSELLER 2026' })
    heroBadge: string;

    @Column({ default: 'Experience the future of Home Tech.' })
    heroTitle: string;

    @Column({ type: 'text', default: 'Premium selection of global brands including Sony, Samsung, and Bosch. Engineered for excellence, delivered with care.' })
    heroSubtitle: string;

    @Column({ nullable: true })
    heroImage: string;

    @Column({ default: '/products' })
    heroLink: string;

    @Column({ default: 'Explore All' })
    heroLinkText: string;

    @Column({ default: 'center' })
    heroContentAlignment: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

    @Column({ type: 'json', nullable: true })
    heroSlides: {
        title: string;
        subtitle: string;
        badge: string;
        image: string;
        link: string;
        linkText: string;
        alignment?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    }[];

    @Column({ default: true })
    showCategories: boolean;

    @Column({ default: true })
    showFeatured: boolean;

    @Column({ default: true })
    showBrands: boolean;

    @Column({ default: true })
    showTrustMarkers: boolean;

    @Column({ default: 'Engineering Your Comfort' })
    aboutTitle: string;

    @Column({ type: 'text', nullable: true })
    aboutContent: string;

    @Column({ nullable: true })
    aboutImage: string;

    @Column({ type: 'json', nullable: true })
    socialLinks: { platform: string; url: string; icon: string }[];

    @UpdateDateColumn()
    updatedAt: Date;
}
