/**
 * Seed admin user for Microsoft 365 sign-in
 * Usage: ADMIN_EMAIL=admin@yourorg.com node database/seedAdmin.js
 * Or add ADMIN_EMAIL to .env and run: node database/seedAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@biplatform.com';
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bi_platform',
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('Admin user already exists:', email);
      return;
    }

    await conn.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
       VALUES (?, '', ?, ?, 1)`,
      [email, firstName, lastName]
    );
    console.log('✓ Admin user created:', email);
    console.log('  Sign in with Microsoft using this email to link your account.');
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seedAdmin();
