// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      time INTEGER DEFAULT 0,
      kills INTEGER DEFAULT 0,
      freezes INTEGER DEFAULT 0,
      hooks INTEGER DEFAULT 0,
      fires INTEGER DEFAULT 0
    );
    -- Optional: index to speed up lookups
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);
}

module.exports = { pool, init };
