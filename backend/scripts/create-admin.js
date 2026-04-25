const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, uuid, varchar, text, primaryKey } = require('drizzle-orm/pg-core');
const { eq, and } = require('drizzle-orm');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

// Define schema manually to avoid TS dependencies
const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
});

const roles = pgTable('roles', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
});

const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull(),
  permissionId: uuid('permission_id').notNull(),
});

const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
});

const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'sribalaji',
});

const db = drizzle(pool);

const permissionsList = [
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🚀 Starting Admin User Creation Tool (Production)...');
  console.log('📡 Connecting to database:', process.env.DB_NAME || 'sribalaji');

  try {
    // 1. Sync Permissions
    console.log('⏳ Syncing permissions...');
    for (const perm of permissionsList) {
      const [existing] = await db.select().from(permissions).where(eq(permissions.name, perm.name));
      if (!existing) {
        await db.insert(permissions).values(perm);
        console.log(`  + Created permission: ${perm.name}`);
      }
    }
    const allPerms = await db.select().from(permissions);

    // 2. Ensure Admin Role exists
    let [adminRole] = await db.select().from(roles).where(eq(roles.name, 'admin'));
    if (!adminRole) {
      console.log('⏳ Creating admin role...');
      [adminRole] = await db.insert(roles).values({
        name: 'admin',
        description: 'Full system access',
      }).returning();
      console.log('✅ Admin role created.');
    } else {
      console.log('ℹ️ Admin role already exists.');
    }

    // 3. Sync Admin Role Permissions
    console.log('⏳ Syncing admin role permissions...');
    const existingRolePerms = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    const existingPermIds = new Set(existingRolePerms.map(rp => rp.permissionId));

    for (const perm of allPerms) {
      if (!existingPermIds.has(perm.id)) {
        await db.insert(rolePermissions).values({
          roleId: adminRole.id,
          permissionId: perm.id,
        });
        console.log(`  + Linked permission: ${perm.name}`);
      }
    }
    console.log('✅ Admin role permissions synchronized.');

    // 4. Get User Input
    const name = await question('Enter Admin Name (Administrator): ') || 'Administrator';
    const email = (await question('Enter Admin Email: ')).toLowerCase().trim();
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email provided.');
    }
    
    const password = await question('Enter Admin Password: ');
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // 5. Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      // If user exists, we'll just assign the role if they don't have it
      console.log(`ℹ️ User with email ${email} already exists. Checking roles...`);
      const [existingUserRole] = await db.select().from(userRoles).where(
        and(eq(userRoles.userId, existingUser.id), eq(userRoles.roleId, adminRole.id))
      );
      if (!existingUserRole) {
        await db.insert(userRoles).values({
          userId: existingUser.id,
          roleId: adminRole.id,
        });
        console.log(`✅ Admin role assigned to existing user "${name}".`);
      } else {
        console.log(`ℹ️ User "${name}" already has admin role.`);
      }
    } else {
      // 6. Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
      }).returning();

      // 7. Assign role
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: adminRole.id,
      });

      console.log(`\n✨ Admin user "${name}" created successfully!`);
      console.log(`📧 Email: ${email}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    pool.end();
    rl.close();
  }
}

main();
