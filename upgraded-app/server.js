'use strict';
require('dotenv').config();
const path = require('path'), fs = require('fs'), mysql = require('mysql2/promise');
const { createApp } = require('./src/app'), { createMailer } = require('./src/mail');

const env = process.env, prod = env.NODE_ENV === 'production';
if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) { console.error('Set JWT_SECRET (32+ random characters) in .env. Generate one with:\n  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'); process.exit(1); }
if (prod && (!env.DB_PASS || env.DB_PASS === 'change-me')) { console.error('Set a real DB_PASS before running in production.'); process.exit(1); }
if (prod && !env.BASE_URL) console.warn('BASE_URL is not set: emailed links and the sitemap will use the request host. Set BASE_URL=https://your-domain in production.');

const pool = mysql.createPool({ host: env.DB_HOST || 'localhost', port: +env.DB_PORT || 3306, user: env.DB_USER, password: env.DB_PASS, database: env.DB_NAME || 'homefinder',
  connectionLimit: 10, decimalNumbers: true, charset: 'utf8mb4', timezone: 'Z' });
pool.pool.on('connection', c => c.query("SET time_zone='+00:00'"));

const uploadDir = path.join(__dirname, 'uploads'); fs.mkdirSync(uploadDir, { recursive: true });
const center = (env.MAP_CENTER || '23.8103,90.4125').split(',').map(Number);
const app = createApp({ db: pool, mailer: createMailer(), config: {
  jwtSecret: env.JWT_SECRET, prod, uploadDir, publicDir: path.join(__dirname, 'public'), baseUrl: (env.BASE_URL || '').replace(/\/$/, ''),
  currency: env.CURRENCY || 'BDT', mapCenter: center.length === 2 && center.every(Number.isFinite) ? center : [23.8103, 90.4125], mapZoom: +env.MAP_ZOOM || 11,
  trustProxy: env.TRUST_PROXY === undefined ? 1 : (isNaN(+env.TRUST_PROXY) ? env.TRUST_PROXY : +env.TRUST_PROXY)
} });

(async () => {
  try { await pool.query('SELECT 1 FROM users LIMIT 1'); }
  catch (e) { console.error(`Cannot use the database (${e.code || e.message}). Check .env, then run: npm run migrate`); process.exit(1); }
  const port = +env.PORT || 3000, server = app.listen(port, () => console.log(`Home Finder running on http://localhost:${port}${prod ? ' (production)' : ''}`));
  const stop = () => { console.log('Shutting down...'); server.close(() => pool.end().finally(() => process.exit(0))); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
})();
process.on('unhandledRejection', e => console.error('Unhandled rejection:', e));
