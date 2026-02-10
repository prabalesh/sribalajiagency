import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '../auth/entities/role.entity';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseSeederService.name);

    constructor(
        @InjectRepository(Role)
        private roleRepo: Repository<Role>,
        @InjectRepository(Permission)
        private permRepo: Repository<Permission>,
    ) { }

    async onModuleInit() {
        await this.seedPermissionsAndRoles();
    }

    private async seedPermissionsAndRoles() {
        try {
            // Check if permissions already exist
            const existingPerms = await this.permRepo.count();
            if (existingPerms > 0) {
                this.logger.log('Permissions already seeded, skipping...');
                return;
            }

            this.logger.log('Seeding permissions and admin role...');

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

            const savedPermissions = await this.permRepo.save(
                permissions.map(p => this.permRepo.create(p))
            );

            this.logger.log(`Created ${savedPermissions.length} permissions`);

            // 2. Create Admin Role with all permissions
            const adminRole = this.roleRepo.create({
                name: 'admin',
                description: 'Full system access',
                permissions: savedPermissions
            });

            await this.roleRepo.save(adminRole);
            this.logger.log('Created admin role with all permissions');

            // 3. Create default user role (no permissions)
            const userRole = this.roleRepo.create({
                name: 'user',
                description: 'Regular customer',
                permissions: []
            });

            await this.roleRepo.save(userRole);
            this.logger.log('Created user role');

            this.logger.log('✅ Database seeding completed successfully!');
        } catch (error) {
            this.logger.error('Failed to seed database:', error.message);
            // Don't throw - let the app continue even if seeding fails
        }
    }
}
