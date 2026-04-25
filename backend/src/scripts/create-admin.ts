import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/drizzle/schema';
import * as bcrypt from 'bcrypt';
import * as inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'sribalaji',
});

const db = drizzle(pool, { schema });

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
  {
    name: 'VIEW_CATEGORIES',
    description: 'Can view category list and details',
  },
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
  {
    name: 'ACCESS_DASHBOARD',
    description: 'Can access the management dashboard',
  },
  { name: 'MANAGE_ROLES', description: 'Can manage roles and permissions' },
  { name: 'VIEW_REPORTS', description: 'Can view business reports' },
];

async function createAdmin() {
  console.log('🚀 Starting Admin User Creation Tool...');

  try {
    // 1. Ensure Permissions exist
    const existingPerms = await db.query.permissions.findMany();

    if (existingPerms.length === 0) {
      console.log('⏳ Seeding permissions...');
      await db.insert(schema.permissions).values(permissionsList);
      console.log(`✅ Created permissions.`);
    } else {
      console.log('ℹ️ Permissions already exist.');
    }

    const allPerms = await db.query.permissions.findMany();

    // 2. Ensure Admin Role exists
    let adminRole = await db.query.roles.findFirst({
      where: eq(schema.roles.name, 'admin'),
    });

    if (!adminRole) {
      console.log('⏳ Creating admin role...');
      const [newRole] = await db
        .insert(schema.roles)
        .values({
          name: 'admin',
          description: 'Full system access',
        })
        .returning();
      adminRole = newRole;

      // Link permissions
      await db.insert(schema.rolePermissions).values(
        allPerms.map((p) => ({
          roleId: adminRole!.id,
          permissionId: p.id,
        })),
      );
      console.log('✅ Admin role created.');
    } else {
      console.log('ℹ️ Admin role already exists.');
    }

    // 3. Prompt for user info
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter Admin Name:',
        default: 'Administrator',
      },
      {
        type: 'input',
        name: 'email',
        message: 'Enter Admin Email:',
        validate: (input) =>
          input.includes('@') || 'Please enter a valid email.',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter Admin Password:',
        mask: '*',
        validate: (input) =>
          input.length >= 6 || 'Password must be at least 6 characters.',
      },
    ]);

    // 4. Check if user already exists
    const email = answers.email.toLowerCase();
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existingUser) {
      console.error(`❌ Error: User with email ${email} already exists.`);
      process.exit(1);
    }

    // 5. Create user
    const hashedPassword = await bcrypt.hash(answers.password, 10);
    const [newUser] = await db
      .insert(schema.users)
      .values({
        name: answers.name,
        email: email,
        password: hashedPassword,
      })
      .returning();

    // 6. Assign role
    await db.insert(schema.userRoles).values({
      userId: newUser.id,
      roleId: adminRole.id,
    });

    console.log(`\n✨ Admin user "${answers.name}" created successfully!`);
    console.log(`📧 Email: ${email}`);
  } catch (error: any) {
    console.error('❌ Failed to create admin user:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createAdmin();
