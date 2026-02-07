import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAdminRoleAndPermissions1738890000000 implements MigrationInterface {
    name = 'SeedAdminRoleAndPermissions1738890000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insert Permissions
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
            await queryRunner.query(
                `INSERT INTO permissions (name, description) 
                 VALUES ($1, $2) 
                 ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
                [p.name, p.description]
            );
        }

        // 2. Insert Admin Role
        const adminRoleName = 'admin';
        const adminRoleDesc = 'Full system access';

        await queryRunner.query(
            `INSERT INTO roles (name, description) 
             VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
            [adminRoleName, adminRoleDesc]
        );

        // 3. Get Role and Permission IDs to link them
        const adminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = $1`, [adminRoleName]);
        const roleId = adminRole[0].id;

        const allPermissions = await queryRunner.query(`SELECT id FROM permissions`);

        // 4. Map Permissions to Admin Role
        for (const perm of allPermissions) {
            await queryRunner.query(
                `INSERT INTO role_permissions (role_id, permission_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT DO NOTHING`,
                [roleId, perm.id]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We probably don't want to break the system on rollback if it's core data, 
        // but for completeness, we could delete the role and its mappings.
        // However, usually "up" only is safer for seeding via migrations if not sure about dependencies.
        const adminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = $1`, ['admin']);
        if (adminRole.length > 0) {
            const roleId = adminRole[0].id;
            await queryRunner.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
            await queryRunner.query(`DELETE FROM roles WHERE id = $1`, [roleId]);
        }
        // We avoid deleting permissions as other roles might use them
    }
}
