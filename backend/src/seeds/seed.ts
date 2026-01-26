import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '../auth/entities/role.entity';
import { User } from '../auth/entities/user.entity';
import { Category } from '../products/entities/category.entity';
import { Brand } from '../products/entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const permRepo = app.get<Repository<Permission>>(getRepositoryToken(Permission));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
    const brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
    const variantRepo = app.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    const couponRepo = app.get<Repository<Coupon>>(getRepositoryToken(Coupon));

    console.log('Seed: Starting complex seeding process...');

    // 1. Create Permissions
    const permissions = [
        { name: 'MANAGE_PRODUCTS', description: 'Can create, edit, delete products' },
        { name: 'MANAGE_USERS', description: 'Can manage all users' },
        { name: 'VIEW_REPORTS', description: 'Can view business reports' },
        { name: 'MANAGE_ROLES', description: 'Can manage roles and permissions' },
    ];

    for (const p of permissions) {
        const exists = await permRepo.findOneBy({ name: p.name });
        if (!exists) await permRepo.save(permRepo.create(p));
    }

    // 2. Create Roles
    const adminPerms = permissions.map(p => p.name);
    const roles = [
        { name: 'admin', description: 'Full system access', perms: adminPerms },
        { name: 'staff', description: 'Staff access', perms: ['MANAGE_PRODUCTS'] },
        { name: 'user', description: 'Regular customer', perms: [] },
    ];

    for (const r of roles) {
        let role = await roleRepo.findOne({ where: { name: r.name }, relations: ['permissions'] });
        if (!role) {
            role = roleRepo.create({ name: r.name, description: r.description });
        }
        const rolePerms: Permission[] = [];
        for (const pName of r.perms) {
            const p = await permRepo.findOneBy({ name: pName });
            if (p) rolePerms.push(p);
        }
        role.permissions = rolePerms;
        await roleRepo.save(role);
    }

    // 3. Admin User
    const adminEmail = 'admin@sribalaji.com';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
        const password = await bcrypt.hash('admin123', 10);
        const adminRole = await roleRepo.findOneBy({ name: 'admin' });
        const newAdmin = userRepo.create({
            name: 'Super Admin',
            email: adminEmail,
            password,
            roles: [adminRole as any]
        } as any) as unknown as User;
        adminUser = await userRepo.save(newAdmin);
        console.log('Seed: Admin user created');
    }

    // 4. Categories & Brands
    const categoryData = [
        { name: 'Lighting', slug: 'lighting', desc: 'LEDs, Bulbs, Tubes' },
        { name: 'Power Tools', slug: 'power-tools', desc: 'Drills, Saws, Grinders' },
        { name: 'Air Conditioners', slug: 'hvac', desc: 'Split AC, Window AC, Inverters' },
        { name: 'Fans', slug: 'fans', desc: 'Ceiling, Pedestal, Exhaust' },
        { name: 'Appliances', slug: 'appliances', desc: 'Mixers, Grinders, Ovens' }
    ];

    for (const c of categoryData) {
        const exists = await categoryRepo.findOneBy({ slug: c.slug });
        if (!exists) await categoryRepo.save(categoryRepo.create({ name: c.name, slug: c.slug, description: c.desc } as any));
    }

    const brandData = [
        { name: 'Philips', desc: 'Global leader in lighting' },
        { name: 'Bosch', desc: 'Engineered power tools' },
        { name: 'Samsung', desc: 'Premium appliances' },
        { name: 'Havells', desc: 'Electrical excellence' },
        { name: 'LG', desc: 'Life\'s Good appliances' },
        { name: 'Orient', desc: 'Smart cooling solutions' }
    ];

    for (const b of brandData) {
        const exists = await brandRepo.findOneBy({ name: b.name });
        if (!exists) await brandRepo.save(brandRepo.create({ name: b.name, description: b.desc } as any));
    }

    // 5. Products & Variants (20 products)
    const catsList = await categoryRepo.find();
    const brandsList = await brandRepo.find();

    const productTemplates = [
        { name: 'LED Batten 20W', cat: 'Lighting', brand: 'Philips', price: 450 },
        { name: 'Smart Bulb 9W', cat: 'Lighting', brand: 'Philips', price: 650 },
        { name: 'Downlight 12W', cat: 'Lighting', brand: 'Havells', price: 900 },
        { name: 'Flood Light 50W', cat: 'Lighting', brand: 'Philips', price: 3200 },
        { name: 'Professional Drill GSB 600', cat: 'Power Tools', brand: 'Bosch', price: 4500 },
        { name: 'Angle Grinder GWS 600', cat: 'Power Tools', brand: 'Bosch', price: 2800 },
        { name: 'Hammer Drill GBH 220', cat: 'Power Tools', brand: 'Bosch', price: 8500 },
        { name: 'Jigsaw PST 650', cat: 'Power Tools', brand: 'Bosch', price: 3500 },
        { name: 'Split AC 1.5 Ton 5 Star', cat: 'Air Conditioners', brand: 'Samsung', price: 45000 },
        { name: 'Window AC 1.0 Ton', cat: 'Air Conditioners', brand: 'LG', price: 28000 },
        { name: 'Hot & Cold AC 1.5 Ton', cat: 'Air Conditioners', brand: 'Samsung', price: 52000 },
        { name: 'Ceiling Fan - Aeroquiet', cat: 'Fans', brand: 'Orient', price: 8200 },
        { name: 'Stand Fan - Windpro', cat: 'Fans', brand: 'Havells', price: 3500 },
        { name: 'Exhaust Fan 12 Inch', cat: 'Fans', brand: 'Orient', price: 1800 },
        { name: 'Designer Fan Crystal', cat: 'Fans', brand: 'Havells', price: 12000 },
        { name: 'Mixer Grinder 750W', cat: 'Appliances', brand: 'Philips', price: 5800 },
        { name: 'Microwave Oven 28L', cat: 'Appliances', brand: 'Samsung', price: 14500 },
        { name: 'Juicer Mixer Grinder', cat: 'Appliances', brand: 'Havells', price: 4200 },
        { name: 'Electric Kettle 1.5L', cat: 'Appliances', brand: 'Philips', price: 1200 },
        { name: 'Induction Cooktop 2000W', cat: 'Appliances', brand: 'Philips', price: 3200 }
    ];

    for (const pTemp of productTemplates) {
        let product = await productRepo.findOneBy({ name: pTemp.name });
        if (!product) {
            const cat = catsList.find(c => c.name === pTemp.cat);
            const brand = brandsList.find(b => b.name === pTemp.brand);
            if (cat && brand) {
                const newProduct = productRepo.create({
                    name: pTemp.name,
                    description: `High performance ${pTemp.name} by ${pTemp.brand}`,
                    price: pTemp.price,
                    category: cat as any,
                    brand: brand as any,
                    isAvailable: true,
                    isFeatured: Math.random() > 0.5
                } as any) as unknown as Product;
                product = await productRepo.save(newProduct);

                // Add at least one variant
                await variantRepo.save(variantRepo.create({
                    name: 'Standard',
                    price: pTemp.price,
                    sku: `${pTemp.brand.substring(0, 3)}-${Math.floor(Math.random() * 10000)}`,
                    stock: 50 + Math.floor(Math.random() * 100),
                    product: product as any
                } as any));
            }
        }
    }

    console.log(`Seed: Created ${productTemplates.length} products with variants.`);

    // 6. Coupons
    const coupons = [
        { name: 'WELCOME20', code: 'WELCOME20', type: 'percentage', val: 20 },
        { name: 'FLAT500', code: 'FLAT500', type: 'flat', val: 500 }
    ];

    for (const c of coupons) {
        const exists = await couponRepo.findOneBy({ code: c.code });
        if (!exists) {
            await couponRepo.save(couponRepo.create({
                name: c.name,
                code: c.code,
                discountType: c.type as any,
                discountValue: c.val,
                startDate: new Date(),
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                isActive: true,
                minOrderAmount: 1000
            }));
        }
    }

    console.log('Seed: Process completed successfully!');
    await app.close();
}

bootstrap();
