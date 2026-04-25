import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'sribalaji',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Dropping all tables...');
    const res = await client.query(`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        `);

    for (const row of res.rows) {
      console.log(`Dropping table ${row.tablename}...`);
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
    }

    console.log('Dropping all enums...');
    const typeRes = await client.query(`
            SELECT n.nspname as schema, t.typname as type 
            FROM pg_type t 
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
            WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid)) 
            AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
            AND n.nspname = 'public'
        `);

    for (const row of typeRes.rows) {
      console.log(`Dropping type ${row.type}...`);
      await client.query(`DROP TYPE IF EXISTS "${row.type}" CASCADE`);
    }

    console.log('Database reset successfully');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDb();
