'use strict';
// Create the first admin:   node seed.js admin@example.com 'LongPassword123'
// Load sample data (dev):   node seed.js --demo
require('dotenv').config();
const mysql = require('mysql2/promise'), bcrypt = require('bcryptjs');
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const DEMO_PASSWORD = 'DemoPass123';
const D = (n) => `/img/demo-${n}.svg`;
const HOMES = [
  ['Bright 3-bed flat in Gulshan 2', 'Spacious corner apartment with lake views, a wide balcony and 24/7 security. Five minutes from restaurants, banks and embassies. Gas, lift and generator backup included.', 'apartment', 'rent', 95000, 3, 3, 1850, 'Road 41, Gulshan 2', 'Dhaka', 23.7925, 90.4078, ['apt1', 'apt2'], ['parking', 'elevator', 'security', 'generator', 'balcony', 'ac']],
  ['Cosy 2-bed near Dhanmondi Lake', 'Renovated second-floor flat steps from the lake and Rabindra Sarobar. Quiet street, great light, close to schools and Dhanmondi 27 shops.', 'apartment', 'rent', 42000, 2, 2, 1100, 'Road 8A, Dhanmondi', 'Dhaka', 23.7461, 90.3742, ['apt2', 'room1'], ['wifi', 'balcony', 'security']],
  ['Modern duplex house in Uttara Sector 7', 'Family duplex with a private garden, covered parking for two cars and a rooftop terrace. Ideal for a family or a small office.', 'house', 'sale', 28500000, 5, 4, 3200, 'Sector 7, Uttara', 'Dhaka', 23.8759, 90.3795, ['house1', 'house2'], ['parking', 'garden', 'security', 'generator', 'pets']],
  ['Furnished room in Mirpur 10', 'Private furnished room with attached bath in a friendly shared flat. Wi-Fi and utilities included. Walk to the metro station.', 'room', 'rent', 12000, 1, 1, 180, 'Section 10, Mirpur', 'Dhaka', 23.8069, 90.3687, ['room1'], ['furnished', 'wifi', 'ac']],
  ['Family home in Bashundhara R/A', 'Well-kept 4-bedroom home in a gated block with wide roads and a community park. Separate guest room and servant quarter.', 'house', 'rent', 120000, 4, 4, 2600, 'Block D, Bashundhara R/A', 'Dhaka', 23.8193, 90.4256, ['house2', 'house1'], ['parking', 'garden', 'security', 'generator', 'pets', 'ac']],
  ['Hill-view apartment in Khulshi', 'Peaceful 3-bedroom apartment with hill views and a large veranda. Close to schools and the Zakir Hossain Road cafes.', 'apartment', 'sale', 9800000, 3, 2, 1600, 'Zakir Hossain Road, Khulshi', 'Chattogram', 22.3569, 91.8002, ['apt1', 'apt2'], ['elevator', 'parking', 'balcony', 'security']],
  ['Seaside villa near Laboni Beach', 'Rare villa a short walk from the beach: six bedrooms, a pool and a landscaped garden. Perfect as a guest house or holiday home.', 'house', 'sale', 45000000, 6, 6, 4800, 'Kolatoli Road', "Cox's Bazar", 21.4272, 91.9822, ['villa', 'house1'], ['pool', 'garden', 'parking', 'ac', 'generator', 'security']],
  ['Quiet 2-bed in Zindabazar', 'Ground-floor apartment in the centre of Sylhet, close to the market, banks and the bus station. Includes a small courtyard.', 'apartment', 'rent', 28000, 2, 1, 950, 'Zindabazar', 'Sylhet', 24.8949, 91.8687, ['apt2', 'apt1'], ['garden', 'pets']],
  ['Studio flat in Banani', 'Compact studio for a single professional: kitchenette, fast fibre internet and a shared rooftop. Next to Banani 11 offices.', 'apartment', 'rent', 38000, 1, 1, 520, 'Road 11, Banani', 'Dhaka', 23.7937, 90.4043, ['room1', 'apt2'], ['furnished', 'wifi', 'ac', 'elevator', 'security']],
  ['Spacious 4-bed in Agrabad', 'High-floor apartment in the commercial heart of Chattogram with port views. Two parking spaces and a generator.', 'apartment', 'rent', 70000, 4, 3, 2100, 'Sheikh Mujib Road, Agrabad', 'Chattogram', 22.3250, 91.8100, ['apt1', 'apt2'], ['elevator', 'parking', 'generator', 'security', 'ac']],
  ['Lalmatia garden flat', 'Ground-floor flat with its own garden, lovingly maintained, in a leafy residential block popular with families.', 'apartment', 'sale', 14500000, 3, 2, 1500, 'Block B, Lalmatia', 'Dhaka', 23.7550, 90.3680, ['apt1', 'house2'], ['garden', 'parking', 'pets']],
  ['Budget room in Mohammadpur', 'Clean, bright room in a family house. Shared kitchen, separate entrance, and a 3-minute walk to the bus stop.', 'room', 'rent', 7500, 1, 1, 140, 'Tajmahal Road, Mohammadpur', 'Dhaka', 23.7662, 90.3589, ['room1'], ['wifi']]
];

(async () => {
  const args = process.argv.slice(2);
  const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: +process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME || 'homefinder' });
  if (args[0] === '--demo') {
    if (process.env.NODE_ENV === 'production') { console.error('Refusing to create demo accounts with a known password in production.'); process.exit(1); }
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12), ids = {};
    for (const [name, email, role] of [['Demo Owner', 'owner@demo.test', 'owner'], ['Demo Seeker', 'seeker@demo.test', 'seeker'], ['Demo Admin', 'admin@demo.test', 'admin']]) {
      await db.execute('INSERT IGNORE INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)', [name, email, hash, role, now()]);
      [[{ id: ids[role] }]] = await db.execute('SELECT id FROM users WHERE email=?', [email]);
    }
    const [[{ n }]] = await db.execute('SELECT COUNT(*) n FROM properties WHERE owner_id=?', [ids.owner]);
    if (!n) for (const [title, description, type, lt, price, bd, ba, area, address, city, lat, lng, imgs, am] of HOMES)
      await db.execute(`INSERT INTO properties (owner_id,title,description,type,listing_type,price,bedrooms,bathrooms,area_sqft,amenities,address,city,lat,lng,images,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Approved',?,?)`,
        [ids.owner, title, description, type, lt, price, bd, ba, area, JSON.stringify(am), address, city, lat, lng, JSON.stringify(imgs.map(D)), now(), now()]);
    console.log(`Demo data ready (${n ? 'listings already existed' : HOMES.length + ' listings added'}).\nLog in with owner@demo.test, seeker@demo.test or admin@demo.test, password: ${DEMO_PASSWORD}`);
  } else {
    const [email, pw] = args;
    if (!email || !pw || pw.length < 10 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { console.error("Usage: node seed.js <email> <password>\nThe password needs 10+ characters with letters and numbers.  Or: node seed.js --demo"); process.exit(1); }
    try { await db.execute("INSERT INTO users (name,email,password_hash,role,created_at) VALUES ('Administrator',?,?,'admin',?)", [email.toLowerCase(), await bcrypt.hash(pw, 12), now()]); console.log('Admin created.'); }
    catch (e) { if (e.code === 'ER_DUP_ENTRY') console.error('That email already has an account.'); else throw e; process.exitCode = 1; }
  }
  await db.end();
})().catch(e => { console.error(e.message); process.exit(1); });
