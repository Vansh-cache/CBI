/**
 * Run a migration SQL file using the app's database connection
 * Usage: node database/runMigration.js migrations/add_azure_oid.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function runMigration() {
  const migrationFile = process.argv[2] || 'migrations/add_azure_oid.sql';
  const sqlPath = path.join(__dirname, migrationFile);

  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bi_platform',
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Connected to database:', config.database);

    for (const stmt of statements) {
      if (!stmt) continue;
      try {
        await conn.query(stmt);
        console.log('✓ Executed:', stmt.substring(0, 60) + (stmt.length > 60 ? '...' : ''));
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log('⊘ Skipped (already applied):', err.sqlMessage);
        } else if (err.code === 'ER_DUP_ENTRY') {
          console.log('⊘ Skipped (already exists):', err.sqlMessage);
        } else {
          throw err;
        }
      }
    }
    console.log('\n✓ Migration completed successfully');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

runMigration();
