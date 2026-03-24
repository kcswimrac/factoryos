/**
 * Database Migration Runner (MySQL)
 *
 * Runs automatically on server startup (first request) or via `node migrate.js`.
 *
 * How it works:
 * 1. Creates core tables (users, _migrations) - always runs, idempotent
 * 2. Reads migrations from migrations/ folder
 * 3. Runs new migrations in order (tracked in _migrations table)
 *
 * To create a new migration:
 *   Create a file in migrations/ with format: {timestamp}_{name}.js
 *   Example: migrations/1704067200000_add_products_table.js
 *
 * Migration file format:
 *   module.exports = {
 *     name: 'add_products_table',
 *     up: async (conn) => {
 *       await conn.query(`CREATE TABLE products (...)`);
 *     }
 *   };
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'factoryos',
    multipleStatements: true,
  });
}

async function migrate() {
  console.log('Running migrations...');

  const conn = await getConnection();
  try {
    // 1. Create migration tracking table (always first)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Core tables (idempotent - safe to run every time)
    await runCoreMigrations(conn);

    // 3. Run migrations from migrations/ folder
    await runFolderMigrations(conn);

    console.log('Migrations complete.');
  } finally {
    await conn.end();
  }
}

/**
 * Core tables that every app needs.
 * These use CREATE IF NOT EXISTS so they're safe to run repeatedly.
 */
async function runCoreMigrations(conn) {
  // Users table with subscription support
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      stripe_subscription_id VARCHAR(255),
      subscription_status VARCHAR(50),
      subscription_plan VARCHAR(255),
      subscription_expires_at TIMESTAMP NULL,
      subscription_updated_at TIMESTAMP NULL
    )
  `);

  // Unique index on email
  await conn.query(`
    CREATE PROCEDURE IF NOT EXISTS _ensure_users_email_idx()
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'users_email_unique_idx') THEN
        CREATE UNIQUE INDEX users_email_unique_idx ON users (email);
      END IF;
    END
  `).catch(() => {});
  // Simpler approach: just try to create, ignore if exists
  await conn.query(`
    CREATE UNIQUE INDEX users_email_unique_idx ON users (email)
  `).catch(() => {}); // ignore if already exists

  await conn.query(`
    CREATE INDEX users_stripe_subscription_id_idx ON users (stripe_subscription_id)
  `).catch(() => {}); // ignore if already exists
}

/**
 * Run migrations from migrations/ folder.
 * Each migration runs once and is tracked in _migrations table.
 */
async function runFolderMigrations(conn) {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  if (files.length === 0) {
    return;
  }

  // Get already-applied migrations
  const [applied] = await conn.query('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.map(r => r.name));

  // Run pending migrations
  for (const file of files) {
    const migration = require(path.join(migrationsDir, file));
    const name = migration.name || file.replace('.js', '');

    if (appliedNames.has(name)) {
      continue;
    }

    console.log(`Running migration: ${name}`);

    try {
      await conn.beginTransaction();
      await migration.up(conn);
      await conn.query('INSERT INTO _migrations (name) VALUES (?)', [name]);
      await conn.commit();
      console.log(`Migration complete: ${name}`);
    } catch (err) {
      await conn.rollback();
      throw new Error(`Migration failed (${name}): ${err.message}`);
    }
  }
}

// Export for use by server.js (lazy migration on first request)
module.exports = migrate;

// Run directly when called via `node migrate.js`
if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
}
