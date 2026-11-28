'use strict';
// Creates the database/tables if missing and upgrades older installs. Safe to run any number of times:  npm run migrate
require('dotenv').config();
const fs = require('fs'), path = require('path'), mysql = require('mysql2/promise');
const ident = s => '`' + String(s).replace(/`/g, '') + '`';

// Columns added after the first release: [table, column, definition]
const ADD_COLUMNS = [
  ['users', 'token_version', 'INT NOT NULL DEFAULT 0'],
  ['properties', 'area_sqft', 'INT NULL'], ['properties', 'amenities', 'TEXT NULL'], ['properties', 'reject_reason', 'VARCHAR(300) NULL'],
  ['properties', 'views', 'INT NOT NULL DEFAULT 0'], ['properties', 'updated_at', 'DATETIME NULL'],
  ['inquiries', 'replied_at', 'DATETIME NULL']
];
const ADD_INDEXES = [['properties', 'idx_geo', '(status, lat, lng)'], ['inquiries', 'idx_seeker', '(seeker_id)']];

(async () => {
  const dbName = process.env.DB_NAME || 'homefinder';
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: +process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASS, multipleStatements: true, charset: 'utf8mb4' });
  try { await conn.query(`CREATE DATABASE IF NOT EXISTS ${ident(dbName)} CHARACTER SET utf8mb4`); } catch (e) { console.warn('Could not create the database (it may already exist):', e.message); }
  await conn.query(`USE ${ident(dbName)}`);
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').replace(/^\s*(CREATE DATABASE|USE)\b[^;]*;/gim, '');
  await conn.query(sql);
  for (const [t, c, def] of ADD_COLUMNS) {
    const [[r]] = await conn.query('SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?', [dbName, t, c]);
    if (!r.n) { await conn.query(`ALTER TABLE ${ident(t)} ADD COLUMN ${ident(c)} ${def}`); console.log(`Added ${t}.${c}`); }
  }
  for (const [t, ix, cols] of ADD_INDEXES) {
    const [[r]] = await conn.query('SELECT COUNT(*) n FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=?', [dbName, t, ix]);
    if (!r.n) { await conn.query(`ALTER TABLE ${ident(t)} ADD INDEX ${ident(ix)} ${cols}`); console.log(`Added index ${ix}`); }
  }
  console.log('Database is up to date.'); await conn.end();
})().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
