import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '../auth/entities/role.entity';
import { User } from '../auth/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const logger = new Logger('Seed');
    const app = await NestFactory.createApplicationContext(AppModule);

    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const permRepo = app.get<Repository<Permission>>(getRepositoryToken(Permission));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
    const brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
    const productImageRepo = app.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
    const variantRepo = app.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    const couponRepo = app.get<Repository<Coupon>>(getRepositoryToken(Coupon));

    logger.log('Seed: Starting complex seeding process...');

    // 1. Create Permissions
    const permissions = [
        // Users
        { name: 'CREATE_USER', description: 'Can create new users' },
        { name: 'VIEW_USERS', description: 'Can view user list and details' },
        { name: 'UPDATE_USER', description: 'Can update user information' },
        { name: 'DELETE_USER', description: 'Can delete users' },

        // Products
        { name: 'CREATE_PRODUCT', description: 'Can create new products' },
        { name: 'VIEW_PRODUCTS', description: 'Can view product list and details' },
        { name: 'UPDATE_PRODUCT', description: 'Can update product information' },
        { name: 'DELETE_PRODUCT', description: 'Can delete products' },

        // Categories
        { name: 'CREATE_CATEGORY', description: 'Can create new categories' },
        { name: 'VIEW_CATEGORIES', description: 'Can view category list and details' },
        { name: 'UPDATE_CATEGORY', description: 'Can update category information' },
        { name: 'DELETE_CATEGORY', description: 'Can delete categories' },

        // Brands
        { name: 'CREATE_BRAND', description: 'Can create new brands' },
        { name: 'VIEW_BRANDS', description: 'Can view brand list and details' },
        { name: 'UPDATE_BRAND', description: 'Can update brand information' },
        { name: 'DELETE_BRAND', description: 'Can delete brands' },

        // Orders
        { name: 'CREATE_ORDER', description: 'Can place new orders' },
        { name: 'VIEW_ORDERS', description: 'Can view and track orders' },
        { name: 'UPDATE_ORDER', description: 'Can update order status and details' },
        { name: 'DELETE_ORDER', description: 'Can delete orders' },

        // Quotations
        { name: 'CREATE_QUOTATION', description: 'Can request quotations' },
        { name: 'VIEW_QUOTATIONS', description: 'Can view quotation requests' },
        { name: 'UPDATE_QUOTATION', description: 'Can update quotation status' },
        { name: 'DELETE_QUOTATION', description: 'Can delete quotation requests' },

        // Coupons
        { name: 'CREATE_COUPON', description: 'Create and issue discount codes' },
        { name: 'VIEW_COUPONS', description: 'Access list of active coupons' },
        { name: 'UPDATE_COUPON', description: 'Modify discount values and dates' },
        { name: 'DELETE_COUPON', description: 'Remove coupons from system' },

        // Locations
        { name: 'CREATE_LOCATION', description: 'Define new delivery zones' },
        { name: 'VIEW_LOCATIONS', description: 'View current delivery restrictions' },
        { name: 'UPDATE_LOCATION', description: 'Modify zone parameters' },
        { name: 'DELETE_LOCATION', description: 'Remove delivery zones' },

        // Home CMS
        { name: 'VIEW_CMS', description: 'Preview home page content' },
        { name: 'UPDATE_CMS', description: 'Publish changes to home page' },
        { name: 'UPLOAD_CMS_ASSETS', description: 'Upload hero images and banners' },

        // Settings
        { name: 'VIEW_SETTINGS', description: 'Access global system settings' },
        { name: 'UPDATE_SETTINGS', description: 'Modify operational parameters' },

        // Others
        { name: 'ACCESS_DASHBOARD', description: 'Can access the management dashboard' },
        { name: 'MANAGE_ROLES', description: 'Can manage roles and permissions' },
        { name: 'VIEW_REPORTS', description: 'Can view business reports' },
    ];

    for (const p of permissions) {
        const exists = await permRepo.findOneBy({ name: p.name });
        if (!exists) await permRepo.save(permRepo.create(p));
    }

    // 2. Create Roles
    const adminPerms = permissions.map(p => p.name);
    const roles = [
        { name: 'admin', description: 'Full system access', perms: adminPerms },
        {
            name: 'staff',
            description: 'Staff access',
            perms: [
                'ACCESS_DASHBOARD',
                'VIEW_PRODUCTS', 'CREATE_PRODUCT', 'UPDATE_PRODUCT',
                'VIEW_ORDERS', 'UPDATE_ORDER',
                'VIEW_QUOTATIONS', 'UPDATE_QUOTATION',
                'VIEW_CATEGORIES', 'VIEW_BRANDS'
            ]
        },
        { name: 'delivery', description: 'Delivery personnel access', perms: ['ACCESS_DASHBOARD', 'VIEW_ORDERS', 'UPDATE_ORDER'] },
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
        logger.log('Seed: Admin user created');
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
        { name: 'Philips', slug: 'philips', desc: 'Global leader in lighting' },
        { name: 'Bosch', slug: 'bosch', desc: 'Engineered power tools' },
        { name: 'Samsung', slug: 'samsung', desc: 'Premium appliances' },
        { name: 'Havells', slug: 'havells', desc: 'Electrical excellence' },
        { name: 'LG', slug: 'lg', desc: 'Life\'s Good appliances' },
        { name: 'Orient', slug: 'orient', desc: 'Smart cooling solutions' }
    ];

    for (const b of brandData) {
        const exists = await brandRepo.findOneBy({ slug: b.slug });
        if (!exists) await brandRepo.save(brandRepo.create({ name: b.name, slug: b.slug, description: b.desc } as any));
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
                    isFeatured: Math.random() > 0.5,
                    rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)),
                    reviewCount: Math.floor(Math.random() * (100 - 5) + 5)
                } as any) as unknown as Product;
                product = await productRepo.save(newProduct);

                // Add product images (2-3 images per product)
                const imageCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 images
                const randomSeed = Math.floor(Math.random() * 1000);
                for (let i = 0; i < imageCount; i++) {
                    await productImageRepo.save(productImageRepo.create({
                        url: `https://picsum.photos/seed/${randomSeed + i}/800/600`,
                        isPrimary: i === 0, // First image is primary
                        product: product as any
                    }));
                }

                // Add at least one variant
                await variantRepo.save(variantRepo.create({
                    name: 'Standard',
                    price: pTemp.price,
                    sku: `${pTemp.brand.substring(0, 3)}-${Math.floor(Math.random() * 10000)}`,
                    stock: 50 + Math.floor(Math.random() * 100),
                    product: product as any
                } as any));
            }
        } else {
            if (!product.rating || product.rating === 0) {
                product.rating = parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1));
                product.reviewCount = Math.floor(Math.random() * (100 - 5) + 5);
                await productRepo.save(product);
            }
        }
    }

    logger.log(`Seed: Created ${productTemplates.length} products with variants.`);

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

    logger.log('Seed: Process completed successfully!');
    await app.close();
}

bootstrap();
