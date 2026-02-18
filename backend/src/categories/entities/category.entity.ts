import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true })
    image?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 18 })
    gstRate: number;

    @ManyToOne(() => Category, (category) => category.children)
    @JoinColumn({ name: 'parentId' })
    parent?: Category;

    @Index()
    @Column({ nullable: true })
    parentId?: string;

    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
