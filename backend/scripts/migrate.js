const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'sribalaji',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

async function runMigration() {
  console.log('--- Database Migration (Production) ---');
  console.log('Connecting to:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_NAME);

  try {
    const migrationsPath = path.join(__dirname, '../src/database/drizzle/migrations');
    console.log('Migrations folder:', migrationsPath);

    await migrate(db, {
      migrationsFolder: migrationsPath,
    });

    console.log('✅ Migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
