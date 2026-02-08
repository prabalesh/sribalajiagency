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
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import * as bcrypt from 'bcrypt';
import * as inquirer from 'inquirer';

// Dynamic import helper for ESM modules
const importDynamic = new Function('modulePath', 'return import(modulePath)');

interface SeederConfig {
    users: number;
    categories: number;
    brands: number;
    products: number;
    orders: number;
    quotations: number;
    coupons: number;
    highAvailability: boolean;
}

async function bootstrap() {
    const logger = new Logger('AdvancedSeeder');
    const { faker } = await importDynamic('@faker-js/faker');
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get all repositories
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const permRepo = app.get<Repository<Permission>>(getRepositoryToken(Permission));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
    const brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
    const productImageRepo = app.get<Repository<ProductImage>>(getRepositoryToken(ProductImage));
    const variantRepo = app.get<Repository<ProductVariant>>(getRepositoryToken(ProductVariant));
    const couponRepo = app.get<Repository<Coupon>>(getRepositoryToken(Coupon));
    const orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
    const orderItemRepo = app.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
    const orderHistoryRepo = app.get<Repository<OrderStatusHistory>>(getRepositoryToken(OrderStatusHistory));

    logger.log('🚀 Advanced Interactive Database Seeder Started');
    console.log('\n');

    // Interactive prompts
    const answers = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'entities',
            message: 'Select entities to seed:',
            choices: [
                { name: 'Permissions & Roles (Required)', value: 'permissions', checked: true },
                { name: 'Users', value: 'users' },
                { name: 'Categories', value: 'categories' },
                { name: 'Brands', value: 'brands' },
                { name: 'Products', value: 'products' },
                { name: 'Orders', value: 'orders' },
                { name: 'Quotations', value: 'quotations' },
                { name: 'Coupons', value: 'coupons' },
                { name: '🔧 Fix Missing Histories', value: 'fix_history' }
            ],
        },
    ]);

    const config: SeederConfig = {
        users: 0,
        categories: 0,
        brands: 0,
        products: 0,
        orders: 0,
        quotations: 0,
        coupons: 0,
        highAvailability: true,
    };

    // Ask for quantities
    if (answers.entities.includes('users')) {
        const userAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many users to create?',
                default: 50,
                validate: (value) => value > 0 && value <= 500 || 'Please enter a number between 1 and 500',
            },
        ]);
        config.users = userAnswer.count;
    }

    if (answers.entities.includes('categories')) {
        const catAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many categories to create?',
                default: 20,
                validate: (value) => value > 0 && value <= 100 || 'Please enter a number between 1 and 100',
            },
        ]);
        config.categories = catAnswer.count;
    }

    if (answers.entities.includes('brands')) {
        const brandAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many brands to create?',
                default: 30,
                validate: (value) => value > 0 && value <= 100 || 'Please enter a number between 1 and 100',
            },
        ]);
        config.brands = brandAnswer.count;
    }

    if (answers.entities.includes('products')) {
        const productAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many products to create?',
                default: 100,
                validate: (value) => value > 0 && value <= 1000 || 'Please enter a number between 1 and 1000',
            },
        ]);
        config.products = productAnswer.count;
    }

    if (answers.entities.includes('orders')) {
        const orderAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many orders to create?',
                default: 200,
                validate: (value) => value > 0 && value <= 1000 || 'Please enter a number between 1 and 1000',
            },
        ]);
        config.orders = orderAnswer.count;
    }

    if (answers.entities.includes('quotations')) {
        const quotationAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many quotations to create?',
                default: 50,
                validate: (value) => value > 0 && value <= 500 || 'Please enter a number between 1 and 500',
            },
        ]);
        config.quotations = quotationAnswer.count;
    }

    if (answers.entities.includes('coupons')) {
        const couponAnswer = await inquirer.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many coupons to create?',
                default: 20,
                validate: (value) => value > 0 && value <= 100 || 'Please enter a number between 1 and 100',
            },
        ]);
        config.coupons = couponAnswer.count;
    }

    const availabilityAnswer = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'highAvailability',
            message: 'Seed with high availability? (Majority of products in stock)',
            default: true,
        },
    ]);
    config.highAvailability = availabilityAnswer.highAvailability;

    console.log('\n📊 Seeding Configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n');

    // 1. Create Permissions (Always required)
    logger.log('📝 Creating Permissions...');
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
    logger.log(`✅ Created ${permissions.length} permissions`);

    // 2. Create Roles
    logger.log('👥 Creating Roles...');
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
    logger.log(`✅ Created ${roles.length} roles`);

    // 3. Create Admin User
    logger.log('👤 Creating Admin User...');
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
        logger.log('✅ Admin user created (email: admin@sribalaji.com, password: admin123)');
    }

    // 4. Create Users
    if (config.users > 0) {
        logger.log(`👥 Creating ${config.users} users...`);
        const userRole = await roleRepo.findOneBy({ name: 'user' });
        const staffRole = await roleRepo.findOneBy({ name: 'staff' });

        for (let i = 0; i < config.users; i++) {
            const email = faker.internet.email().toLowerCase();
            const exists = await userRepo.findOneBy({ email });
            if (!exists) {
                const password = await bcrypt.hash('password123', 10);
                const isStaff = i % 10 === 0; // Every 10th user is staff
                const user = userRepo.create({
                    name: faker.person.fullName(),
                    email,
                    password,
                    roles: [isStaff ? staffRole : userRole] as any
                } as any) as unknown as User;
                await userRepo.save(user);
            }
            if ((i + 1) % 50 === 0) logger.log(`  ⏳ Progress: ${i + 1}/${config.users} users created`);
        }
        logger.log(`✅ Created ${config.users} users`);
    }

    // 5. Create Categories
    if (config.categories > 0) {
        logger.log(`📁 Creating ${config.categories} categories...`);
        const categoryTypes = [
            'Lighting', 'Power Tools', 'Air Conditioners', 'Fans', 'Appliances',
            'Electrical Wiring', 'Switches & Sockets', 'Cables', 'Circuit Breakers',
            'Transformers', 'Generators', 'Solar Equipment', 'Pumps', 'Motors',
            'Batteries', 'Inverters', 'Stabilizers', 'Extension Cords', 'Timers',
            'Sensors', 'Smart Home', 'Security Systems', 'CCTV', 'Doorbells'
        ];

        for (let i = 0; i < config.categories; i++) {
            const baseName = i < categoryTypes.length ? categoryTypes[i] : faker.commerce.department();
            const name = `${baseName} ${i >= categoryTypes.length ? faker.number.int({ min: 1, max: 100 }) : ''}`.trim();
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const exists = await categoryRepo.findOneBy({ slug });
            if (!exists) {
                await categoryRepo.save(categoryRepo.create({
                    name,
                    slug,
                    description: faker.commerce.productDescription()
                } as any));
            }
        }
        logger.log(`✅ Created ${config.categories} categories`);
    }

    // 6. Create Brands
    if (config.brands > 0) {
        logger.log(`🏷️  Creating ${config.brands} brands...`);
        const popularBrands = [
            'Philips', 'Bosch', 'Samsung', 'Havells', 'LG', 'Orient', 'Crompton',
            'Bajaj', 'Usha', 'Anchor', 'Legrand', 'Schneider', 'Siemens', 'ABB',
            'Polycab', 'Finolex', 'KEI', 'RR Kabel', 'V-Guard', 'Luminous',
            'Microtek', 'Exide', 'Amaron', 'Su-Kam', 'Livguard'
        ];

        for (let i = 0; i < config.brands; i++) {
            const name = i < popularBrands.length ? popularBrands[i] : faker.company.name();
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const exists = await brandRepo.findOneBy({ slug });
            if (!exists) {
                await brandRepo.save(brandRepo.create({
                    name,
                    slug,
                    description: faker.company.catchPhrase()
                } as any));
            }
        }
        logger.log(`✅ Created ${config.brands} brands`);
    }

    // 7. Create Products
    if (config.products > 0) {
        logger.log(`📦 Creating ${config.products} products with images...`);
        const categories = await categoryRepo.find();
        const brands = await brandRepo.find();

        if (categories.length === 0 || brands.length === 0) {
            logger.warn('⚠️  No categories or brands found. Skipping product creation.');
        } else {
            for (let i = 0; i < config.products; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const brand = brands[Math.floor(Math.random() * brands.length)];
                const productName = `${brand.name} ${faker.commerce.productName()}`;

                const exists = await productRepo.findOneBy({ name: productName });
                if (!exists) {
                    const price = parseFloat(faker.commerce.price({ min: 100, max: 100000 }));
                    const product = await productRepo.save(productRepo.create({
                        name: productName,
                        description: faker.commerce.productDescription(),
                        price,
                        category: category as any,
                        brand: brand as any,
                        isAvailable: config.highAvailability ? faker.datatype.boolean(0.95) : faker.datatype.boolean(0.7),
                        isFeatured: faker.datatype.boolean(0.3), // 30% featured
                        allowedPaymentMethods: faker.helpers.arrayElements(['online', 'cod'], { min: 1, max: 2 }),
                        rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)),
                        reviewCount: Math.floor(Math.random() * (100 - 5) + 5)
                    } as any) as unknown as Product);

                    // Add 2-4 product images
                    const imageCount = faker.number.int({ min: 2, max: 4 });
                    const seed = faker.number.int({ min: 1, max: 10000 });
                    for (let j = 0; j < imageCount; j++) {
                        await productImageRepo.save(productImageRepo.create({
                            url: `https://picsum.photos/seed/${seed + j}/800/600`,
                            isPrimary: j === 0,
                            product: product as any
                        }));
                    }

                    // Add 1-3 variants
                    const variantCount = faker.number.int({ min: 1, max: 3 });
                    const variantNames = ['Standard', 'Premium', 'Deluxe', 'Economy', 'Pro'];
                    for (let k = 0; k < variantCount; k++) {
                        const stock = config.highAvailability
                            ? faker.number.int({ min: (i % 8 === 0) ? 0 : 5, max: 200 })
                            : faker.number.int({ min: 0, max: 100 });

                        await variantRepo.save(variantRepo.create({
                            name: variantNames[k % variantNames.length],
                            price: price + (k * 500),
                            sku: `${brand.name.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
                            stock,
                            product: product as any
                        } as any));
                    }
                }

                if ((i + 1) % 50 === 0) logger.log(`  ⏳ Progress: ${i + 1}/${config.products} products created`);
            }
            logger.log(`✅ Created ${config.products} products with images and variants`);
        }
    }

    // 8. Create Orders
    if (config.orders > 0) {
        logger.log(`🛒 Creating ${config.orders} orders...`);
        const users = await userRepo.find({ relations: ['roles'] });
        const products = await productRepo.find({ relations: ['variants'] });
        const customerUsers = users.filter(u => u.roles?.some(r => r.name === 'user'));

        if (customerUsers.length === 0 || products.length === 0) {
            logger.warn('⚠️  No users or products found. Skipping order creation.');
        } else {
            const statuses: any[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'];

            for (let i = 0; i < config.orders; i++) {
                const user = customerUsers[Math.floor(Math.random() * customerUsers.length)];
                const itemCount = faker.number.int({ min: 1, max: 5 });
                const orderProducts = faker.helpers.arrayElements(products, itemCount);

                let totalAmount = 0;
                const orderItems: any[] = [];

                for (const product of orderProducts) {
                    const quantity = faker.number.int({ min: 1, max: 3 });
                    const price = product.price || 0;
                    totalAmount += price * quantity;

                    orderItems.push({
                        product: product as any,
                        productName: product.name,
                        quantity,
                        price
                    });
                }

                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const order = await orderRepo.save(orderRepo.create({
                    user: user as any,
                    totalAmount,
                    status,
                    paymentMethod: faker.helpers.arrayElement(['online', 'cod']),
                    deliveryAddress: faker.location.streetAddress({ useFullAddress: true }),
                    deliveryPhone: faker.phone.number(),
                    deliveryNotes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
                    createdAt: faker.date.past({ years: 1 })
                } as any) as unknown as Order);

                // Create order items
                for (const item of orderItems) {
                    await orderItemRepo.save(orderItemRepo.create({
                        order: order as any,
                        ...item
                    }));
                }

                // Create status history
                // Create Status History Timeline
                const statusFlow: any[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered'];
                const currentStatusIndex = statusFlow.indexOf(status);

                if (status === 'Cancelled') {
                    // Simple history for cancelled
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Pending',
                        message: 'Order placed successfully',
                        changedBy: user as any,
                        createdAt: faker.date.past({ years: 1, refDate: order.createdAt })
                    }));
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Cancelled',
                        message: 'Order cancelled by user',
                        changedBy: user as any,
                        createdAt: order.createdAt
                    }));
                } else if (currentStatusIndex !== -1) {
                    // Generate history for each step up to current status
                    let previousDate = faker.date.past({ years: 1, refDate: order.createdAt });

                    // Ensure Pending is always first
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Pending',
                        message: 'Order placed successfully',
                        changedBy: user as any,
                        createdAt: previousDate
                    }));

                    for (let j = 1; j <= currentStatusIndex; j++) {
                        const stepStatus = statusFlow[j];
                        // Add 1-24 hours for each step
                        const stepDate = new Date(previousDate.getTime() + faker.number.int({ min: 3600000, max: 86400000 }));
                        previousDate = stepDate;

                        await orderHistoryRepo.save(orderHistoryRepo.create({
                            order: order as any,
                            status: stepStatus,
                            message: `Order ${stepStatus.toLowerCase()}`,
                            changedBy: j === 0 ? user : (Math.random() > 0.5 ? user : null) as any, // Mix user and system updates
                            createdAt: stepDate
                        }));
                    }

                    // Update order creation date to match the first history entry
                    await orderRepo.update(order.id, { createdAt: previousDate });
                }

                if ((i + 1) % 50 === 0) logger.log(`  ⏳ Progress: ${i + 1}/${config.orders} orders created`);
            }
            logger.log(`✅ Created ${config.orders} orders`);
        }
    }

    // 10. Create Coupons
    if (config.coupons > 0) {
        logger.log(`🎟️  Creating ${config.coupons} coupons...`);

        for (let i = 0; i < config.coupons; i++) {
            const code = faker.string.alphanumeric(8).toUpperCase();
            const exists = await couponRepo.findOneBy({ code });
            if (!exists) {
                const discountType = faker.helpers.arrayElement(['percentage', 'flat']);
                const discountValue = discountType === 'percentage'
                    ? faker.number.int({ min: 5, max: 50 })
                    : faker.number.int({ min: 100, max: 5000 });

                await couponRepo.save(couponRepo.create({
                    name: `${faker.commerce.productAdjective()} ${faker.number.int({ min: 10, max: 90 })}`,
                    code,
                    discountType: discountType as any,
                    discountValue,

                    startDate: faker.date.past(),
                    endDate: faker.date.future(),
                    isActive: faker.datatype.boolean(0.8), // 80% active
                    minOrderAmount: faker.number.int({ min: 500, max: 5000 })
                }));
            }
        }
        logger.log(`✅ Created ${config.coupons} coupons`);
    }

    // 11. Fix Missing Histories
    if (answers.entities.includes('fix_history')) {
        logger.log('🔧 Fixing missing order histories...');

        // Find orders with NO history
        const orders = await orderRepo.find({
            relations: ['items', 'statusHistory', 'user'],
        });

        let fixedCount = 0;

        for (const order of orders) {
            // Check if history is empty
            const historyCount = await orderHistoryRepo.count({ where: { order: { id: order.id } } });

            if (historyCount === 0) {
                const status = order.status;
                const statusFlow: any[] = ['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered'];
                const currentStatusIndex = statusFlow.indexOf(status);
                const user = order.user; // Use order owner for simplicity or system

                if (status === 'Cancelled') {
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Pending',
                        message: 'Order placed successfully',
                        changedBy: user as any,
                        createdAt: faker.date.past({ years: 1, refDate: order.createdAt })
                    }));
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Cancelled',
                        message: 'Order cancelled by user',
                        changedBy: user as any,
                        createdAt: order.createdAt
                    }));
                } else if (currentStatusIndex !== -1) {
                    let previousDate = faker.date.past({ years: 1, refDate: order.createdAt });

                    // Pending
                    await orderHistoryRepo.save(orderHistoryRepo.create({
                        order: order as any,
                        status: 'Pending',
                        message: 'Order placed successfully',
                        changedBy: user as any,
                        createdAt: previousDate
                    }));

                    for (let j = 1; j <= currentStatusIndex; j++) {
                        const stepStatus = statusFlow[j];
                        const stepDate = new Date(previousDate.getTime() + faker.number.int({ min: 3600000, max: 86400000 }));
                        previousDate = stepDate;

                        await orderHistoryRepo.save(orderHistoryRepo.create({
                            order: order as any,
                            status: stepStatus,
                            message: `Order ${stepStatus.toLowerCase()}`,
                            changedBy: user as any,
                            createdAt: stepDate
                        }));
                    }
                    // Update order date
                    await orderRepo.update(order.id, { createdAt: previousDate });
                }
                fixedCount++;
                if (fixedCount % 10 === 0) process.stdout.write('.');
            }
        }
        console.log('\n');
        logger.log(`✅ Fixed history for ${fixedCount} orders`);
    }

    logger.log('\n🎉 Advanced Seeding Process Completed Successfully!');
    logger.log('\n📊 Summary:');
    logger.log(`  - Permissions: ${permissions.length}`);
    logger.log(`  - Roles: ${roles.length}`);
    logger.log(`  - Users: ${config.users + 1} (including admin)`);
    logger.log(`  - Categories: ${config.categories}`);
    logger.log(`  - Brands: ${config.brands}`);
    logger.log(`  - Products: ${config.products}`);
    logger.log(`  - Orders: ${config.orders}`);
    logger.log(`  - Quotations: ${config.quotations}`);
    logger.log(`  - Coupons: ${config.coupons}`);
    logger.log('\n');

    await app.close();
}

bootstrap().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
