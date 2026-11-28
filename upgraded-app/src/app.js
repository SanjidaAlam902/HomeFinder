'use strict';
const express = require('express'), helmet = require('helmet'), rateLimit = require('express-rate-limit'), cookieParser = require('cookie-parser'),
  bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), multer = require('multer'), path = require('path'), fs = require('fs'), crypto = require('crypto');
const { saveImages, removeImages } = require('./images');

const AMENITIES = ['parking', 'furnished', 'pets', 'ac', 'wifi', 'gym', 'pool', 'balcony', 'garden', 'elevator', 'security', 'generator'];
const TYPES = ['house', 'apartment', 'room', 'other'], LT = ['rent', 'sale'], MAX_IMAGES = 8, MAX_LISTINGS_PER_OWNER = 50;
const COMMON_PASSWORDS = new Set(['password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyui', 'qwerty123', 'iloveyou1', 'admin123', 'welcome1', 'letmein123']);
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

function createApp({ db, config, mailer }) {
  const { jwtSecret, prod = false, uploadDir, publicDir, bcryptCost = 12, baseUrl = '', currency = 'BDT', mapCenter = [23.8103, 90.4125], mapZoom = 11 } = config;
  const cookieName = prod ? '__Host-token' : 'token';
  const app = express();
  app.set('trust proxy', config.trustProxy ?? 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], styleSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'], fontSrc: ["'self'"],
        connectSrc: ["'self'", 'https://nominatim.openstreetmap.org'], objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"],
        frameAncestors: ["'none'"], upgradeInsecureRequests: prod ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: prod ? { maxAge: 31536000, includeSubDomains: true } : false
  }));
  app.use((req, res, next) => { res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()'); next(); });
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  // ---------- helpers ----------
  const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
  const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  const str = (v, min, max) => { if (typeof v !== 'string') return null; const t = v.replace(CTRL, '').trim(); return t.length >= min && t.length <= max ? t : null; };
  const num = (v, min, max) => { if (v === '' || v == null || typeof v === 'object') return null; const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
  const oneOf = (v, list) => list.includes(v) ? v : null;
  const id = v => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2 ** 31 ? n : 0; };
  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  const arr = v => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } } return []; };
  const likeEsc = s => s.replace(/[!%_]/g, c => '!' + c);
  const limiter = (windowMs, max, extra = {}) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => bad(res, 'Too many attempts. Please wait a little and try again.', 429), ...extra });
  const byUser = req => req.user ? 'u' + req.user.id : req.ip;

  const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  const passwordProblem = (pw, email = '') => {
    if (typeof pw !== 'string' || pw.length < 8 || Buffer.byteLength(pw) > 72) return 'Password must be 8-72 characters';
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must include letters and numbers';
    if (COMMON_PASSWORDS.has(pw.toLowerCase()) || (email && pw.toLowerCase() === email.toLowerCase())) return 'That password is too easy to guess';
    return null;
  };
  const setToken = (res, u, remember = false) => {
    const ttl = remember ? 30 * 24 * 3600 : 24 * 3600;
    res.cookie(cookieName, jwt.sign({ id: u.id, tv: u.token_version || 0 }, jwtSecret, { expiresIn: ttl }), { httpOnly: true, sameSite: 'strict', secure: prod, path: '/', maxAge: ttl * 1000 });
  };
  const clearToken = res => res.clearCookie(cookieName, { httpOnly: true, sameSite: 'strict', secure: prod, path: '/' });
  const audit = (adminId, action, type, targetId, detail = null) =>
    db.execute('INSERT INTO audit_log (admin_id,action,target_type,target_id,detail,created_at) VALUES (?,?,?,?,?,?)', [adminId, action, type, targetId, detail, now()]);
  const origin = req => baseUrl || `${req.protocol}://${req.get('host')}`;

  // ---------- API-wide middleware ----------
  app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', limiter(60e3, 300));
  // CSRF defence in depth (the cookie is also SameSite=Strict): refuse cross-site state changes.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('sec-fetch-site') === 'cross-site') return bad(res, 'Cross-site request blocked', 403);
    const o = req.get('origin');
    if (o) { let host; try { host = new URL(o).host; } catch { return bad(res, 'Cross-site request blocked', 403); } if (host !== req.get('host')) return bad(res, 'Cross-site request blocked', 403); }
    next();
  });
  // Load the user on every request, so bans, role changes and "log out everywhere" take effect immediately.
  app.use('/api', h(async (req, res, next) => {
    const t = req.cookies[cookieName];
    if (t) try {
      const { id: uid, tv } = jwt.verify(t, jwtSecret, { algorithms: ['HS256'] });
      const [[u]] = await db.execute('SELECT id,name,email,role,is_banned,token_version FROM users WHERE id=?', [uid]);
      if (u && !u.is_banned && (u.token_version || 0) === (tv || 0)) req.user = u;
    } catch { /* invalid or expired token = anonymous */ }
    next();
  }));
  const need = (...roles) => (req, res, next) => !req.user ? bad(res, 'Please log in', 401) : roles.includes(req.user.role) ? next() : bad(res, 'Not allowed', 403);

  // ---------- public config & health ----------
  app.get('/api/config', (req, res) => res.json({ currency, mapCenter, mapZoom, amenities: AMENITIES, maxImages: MAX_IMAGES }));
  app.get('/api/health', h(async (req, res) => { await db.query('SELECT 1'); res.json({ ok: true }); }));

  // ---------- auth ----------
  const DUMMY = bcrypt.hashSync('timing-equaliser', bcryptCost);
  app.post('/api/auth/register', limiter(60 * 60e3, 20), h(async (req, res) => {
    const b = req.body, name = str(b.name, 2, 80), email = str(b.email, 5, 190)?.toLowerCase(), role = oneOf(b.role, ['seeker', 'owner']);
    if (!name) return bad(res, 'Enter your full name (2-80 characters)');
    if (!email || !EMAIL.test(email)) return bad(res, 'Enter a valid email address');
    if (!role) return bad(res, 'Choose an account type');
    const pw = passwordProblem(b.password, email); if (pw) return bad(res, pw);
    try {
      const [r] = await db.execute('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)', [name, email, await bcrypt.hash(b.password, bcryptCost), role, now()]);
      const u = { id: r.insertId, name, email, role, token_version: 0 }; setToken(res, u); res.status(201).json(pub(u));
    } catch (e) { if (e.code === 'ER_DUP_ENTRY' || /UNIQUE/i.test(e.message)) return bad(res, 'That email is already registered', 409); throw e; }
  }));
  // Two throttles on failures only: per IP, and per IP+email (stops password guessing without letting a stranger lock you out).
  const loginIp = limiter(15 * 60e3, 40, { skipSuccessfulRequests: true });
  const loginPair = limiter(15 * 60e3, 8, { skipSuccessfulRequests: true, keyGenerator: req => req.ip + '|' + String(req.body?.email || '').toLowerCase().slice(0, 190) });
  app.post('/api/auth/login', loginIp, loginPair, h(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase().slice(0, 190), pw = String(req.body.password || '').slice(0, 72);
    const [[u]] = await db.execute('SELECT * FROM users WHERE email=?', [email]);
    const ok = await bcrypt.compare(pw, u ? u.password_hash : DUMMY);
    if (!u || !ok || u.is_banned) return bad(res, 'Incorrect email or password', 401);
    setToken(res, u, !!req.body.remember); res.json(pub(u));
  }));
  app.post('/api/auth/logout', (req, res) => { clearToken(res); res.json({ ok: true }); });

  app.post('/api/auth/forgot', limiter(60 * 60e3, 6), h(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase().slice(0, 190);
    const done = () => res.json({ ok: true, message: 'If that email has an account, a reset link is on its way.' });
    if (!EMAIL.test(email)) return done();
    const [[u]] = await db.execute('SELECT id,email,is_banned FROM users WHERE email=?', [email]);
    if (!u || u.is_banned) return done();
    const token = crypto.randomBytes(32).toString('hex'), hash = crypto.createHash('sha256').update(token).digest('hex');
    await db.execute('UPDATE password_resets SET used=1 WHERE user_id=?', [u.id]);
    await db.execute('INSERT INTO password_resets (user_id,token_hash,expires_at,used) VALUES (?,?,?,0)', [u.id, hash, new Date(Date.now() + 3600e3).toISOString().slice(0, 19).replace('T', ' ')]);
    mailer.send({ to: u.email, subject: 'Reset your Home Finder password', text: `Use this link within one hour to choose a new password:\n\n${origin(req)}/reset?token=${token}\n\nIf you did not ask for this, you can ignore this email.` })
      .catch(e => console.error('Reset email failed:', e.message));
    done();
  }));
  app.post('/api/auth/reset', limiter(15 * 60e3, 20), h(async (req, res) => {
    const token = typeof req.body.token === 'string' ? req.body.token.slice(0, 200) : '';
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const [[r]] = await db.execute('SELECT id,user_id FROM password_resets WHERE token_hash=? AND used=0 AND expires_at>?', [hash, now()]);
    if (!r) return bad(res, 'This reset link is invalid or has expired. Request a new one.', 400);
    const pw = passwordProblem(req.body.password); if (pw) return bad(res, pw);
    await db.execute('UPDATE users SET password_hash=?, token_version=token_version+1 WHERE id=?', [await bcrypt.hash(req.body.password, bcryptCost), r.user_id]);
    await db.execute('UPDATE password_resets SET used=1 WHERE user_id=?', [r.user_id]);
    clearToken(res); res.json({ ok: true });
  }));
  app.post('/api/auth/password', need('seeker', 'owner', 'admin'), limiter(15 * 60e3, 10, { keyGenerator: byUser }), h(async (req, res) => {
    const [[u]] = await db.execute('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!(await bcrypt.compare(String(req.body.current || '').slice(0, 72), u.password_hash))) return bad(res, 'Your current password is not correct', 403);
    const pw = passwordProblem(req.body.password, u.email); if (pw) return bad(res, pw);
    await db.execute('UPDATE users SET password_hash=?, token_version=token_version+1 WHERE id=?', [await bcrypt.hash(req.body.password, bcryptCost), u.id]);
    setToken(res, { ...u, token_version: (u.token_version || 0) + 1 }); res.json({ ok: true });
  }));

  app.get('/api/me', h(async (req, res) => {
    if (!req.user) return res.json(null);
    const out = pub(req.user);
    if (req.user.role === 'owner') {
      const [[c]] = await db.execute('SELECT COUNT(*) n FROM inquiries i JOIN properties p ON p.id=i.property_id WHERE p.owner_id=? AND i.reply IS NULL', [req.user.id]);
      out.unanswered = c.n;
    }
    res.json(out);
  }));
  app.patch('/api/me', need('seeker', 'owner', 'admin'), h(async (req, res) => {
    const name = str(req.body.name, 2, 80); if (!name) return bad(res, 'Enter your full name (2-80 characters)');
    await db.execute('UPDATE users SET name=? WHERE id=?', [name, req.user.id]); res.json({ ...pub(req.user), name });
  }));
  app.delete('/api/me', need('seeker', 'owner'), limiter(15 * 60e3, 5, { keyGenerator: byUser }), h(async (req, res) => {
    const [[u]] = await db.execute('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    if (!(await bcrypt.compare(String(req.body.password || '').slice(0, 72), u.password_hash))) return bad(res, 'Password is not correct', 403);
    const [props] = await db.execute('SELECT images FROM properties WHERE owner_id=?', [req.user.id]);
    await db.execute('DELETE FROM users WHERE id=?', [req.user.id]);
    for (const p of props) await removeImages(arr(p.images), uploadDir);
    clearToken(res); res.json({ ok: true });
  }));

  // ---------- images ----------
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES, fields: 30, fieldSize: 20000 } });
  app.use('/uploads', (req, res, next) => { res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox"); res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
    express.static(uploadDir, { dotfiles: 'deny', index: false, maxAge: prod ? '30d' : 0, immutable: prod, fallthrough: false }));

  // ---------- properties ----------
  function readProperty(b) {
    const e = m => ({ error: m });
    const p = { title: str(b.title, 5, 120), description: str(b.description, 20, 5000), type: oneOf(b.type, TYPES), listing_type: oneOf(b.listing_type, LT),
      price: num(b.price, 1, 1e10), bedrooms: num(b.bedrooms, 0, 50), bathrooms: num(b.bathrooms, 0, 50), address: str(b.address, 5, 190), city: str(b.city, 2, 80),
      lat: num(b.lat, -90, 90), lng: num(b.lng, -180, 180) };
    const msg = { title: 'Title must be 5-120 characters', description: 'Description must be 20-5000 characters', type: 'Choose a property type', listing_type: 'Choose rent or sale',
      price: 'Enter a valid price', bedrooms: 'Enter the number of bedrooms (0-50)', bathrooms: 'Enter the number of bathrooms (0-50)', address: 'Enter the street address (5-190 characters)',
      city: 'Enter the city', lat: 'Pick the property location on the map', lng: 'Pick the property location on the map' };
    for (const k of Object.keys(msg)) if (p[k] === null) return e(msg[k]);
    if (b.area_sqft === '' || b.area_sqft == null) p.area_sqft = null; else { p.area_sqft = num(b.area_sqft, 10, 1e6); if (p.area_sqft === null) return e('Area must be between 10 and 1,000,000 sq ft'); }
    p.area_sqft = p.area_sqft === null ? null : Math.round(p.area_sqft);
    let a = b.amenities; if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = a.split(','); } }
    p.amenities = [...new Set((Array.isArray(a) ? a : []).map(String))].filter(x => AMENITIES.includes(x));
    return { p };
  }
  const SORTS = { newest: 'p.id DESC', price_asc: 'p.price ASC, p.id DESC', price_desc: 'p.price DESC, p.id DESC', beds: 'p.bedrooms DESC, p.id DESC', popular: 'p.views DESC, p.id DESC' };
  const LIST_COLS = 'p.id,p.title,p.type,p.listing_type,p.price,p.bedrooms,p.bathrooms,p.area_sqft,p.city,p.address,p.lat,p.lng,p.images,p.amenities,p.available,p.created_at';
  const card = r => ({ ...r, images: arr(r.images), amenities: arr(r.amenities) });

  app.get('/api/properties', h(async (req, res) => {
    const q = req.query, w = ["p.status='Approved'", 'p.available=1', 'u.is_banned=0'], a = [];
    const text = str(q.q, 1, 80);
    if (text) { w.push("(p.city LIKE ? ESCAPE '!' OR p.address LIKE ? ESCAPE '!' OR p.title LIKE ? ESCAPE '!')"); const l = `%${likeEsc(text)}%`; a.push(l, l, l); }
    if (oneOf(q.type, TYPES)) { w.push('p.type=?'); a.push(q.type); }
    if (oneOf(q.listing_type, LT)) { w.push('p.listing_type=?'); a.push(q.listing_type); }
    if (num(q.min, 0, 1e10) !== null) { w.push('p.price>=?'); a.push(+q.min); }
    if (num(q.max, 0, 1e10) !== null) { w.push('p.price<=?'); a.push(+q.max); }
    if (num(q.beds, 0, 50) !== null) { w.push('p.bedrooms>=?'); a.push(+q.beds); }
    if (num(q.baths, 0, 50) !== null) { w.push('p.bathrooms>=?'); a.push(+q.baths); }
    if (typeof q.amenities === 'string') for (const am of [...new Set(q.amenities.split(','))].filter(x => AMENITIES.includes(x))) { w.push('p.amenities LIKE ?'); a.push(`%"${am}"%`); }
    if (typeof q.bbox === 'string') {
      const [s, wst, n, e] = q.bbox.split(',').map(Number);
      if ([s, wst, n, e].every(Number.isFinite) && s >= -90 && n <= 90 && s < n) { w.push('p.lat BETWEEN ? AND ?', 'p.lng BETWEEN ? AND ?'); a.push(s, n, Math.max(-180, wst), Math.min(180, e)); }
    }
    const page = Math.min(1000, Math.max(1, parseInt(q.page) || 1)), size = 12, order = SORTS[q.sort] || SORTS.newest;
    const from = `FROM properties p JOIN users u ON u.id=p.owner_id WHERE ${w.join(' AND ')}`;
    const [rows] = await db.query(`SELECT ${LIST_COLS} ${from} ORDER BY ${order} LIMIT ${size} OFFSET ${(page - 1) * size}`, a);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total ${from}`, a);
    res.json({ rows: rows.map(card), total, page, pages: Math.ceil(total / size) });
  }));
  app.get('/api/cities', h(async (req, res) => {
    const [rows] = await db.query("SELECT DISTINCT p.city FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.status='Approved' AND u.is_banned=0 ORDER BY p.city LIMIT 200");
    res.json(rows.map(r => r.city));
  }));

  async function loadProperty(req, pid) {
    const [[p]] = await db.execute('SELECT p.*,u.name owner_name,u.is_banned owner_banned FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=?', [pid]);
    if (!p) return null;
    const mine = !!req.user && req.user.id === p.owner_id, admin = req.user?.role === 'admin';
    if (!mine && !admin && (p.status !== 'Approved' || p.owner_banned)) return null;
    return { p, mine, admin };
  }
  const detail = (p, mine, admin) => {
    const { owner_id, owner_banned, ...rest } = p;
    const out = { ...rest, images: arr(p.images), amenities: arr(p.amenities), is_mine: mine };
    if (!mine && !admin) delete out.reject_reason;
    return out;
  };
  app.get('/api/properties/:id', h(async (req, res) => {
    const pid = id(req.params.id), f = pid && await loadProperty(req, pid);
    if (!f) return bad(res, 'Property not found', 404);
    const { p, mine, admin } = f, out = detail(p, mine, admin);
    if (!mine && !admin && p.status === 'Approved') { await db.execute('UPDATE properties SET views=views+1 WHERE id=?', [pid]); out.views = (p.views || 0) + 1; }
    if (!mine && !admin) delete out.views;
    out.is_favorite = false;
    if (req.user?.role === 'seeker') { const [[fv]] = await db.execute('SELECT 1 x FROM favorites WHERE user_id=? AND property_id=?', [req.user.id, pid]); out.is_favorite = !!fv; }
    const [sim] = await db.query(`SELECT ${LIST_COLS} FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.status='Approved' AND p.available=1 AND u.is_banned=0 AND p.id<>? AND p.city=? AND p.listing_type=? ORDER BY p.id DESC LIMIT 4`, [pid, p.city, p.listing_type]);
    out.similar = sim.map(card);
    res.json(out);
  }));

  const writeLimit = limiter(60 * 60e3, 30, { keyGenerator: byUser });
  app.post('/api/properties', need('owner'), writeLimit, upload.array('images', MAX_IMAGES), h(async (req, res) => {
    const r = readProperty(req.body || {}); if (r.error) return bad(res, r.error);
    if (!req.files?.length) return bad(res, 'Add at least one JPG, PNG or WebP photo (max 5 MB each)');
    const [[c]] = await db.execute('SELECT COUNT(*) n FROM properties WHERE owner_id=?', [req.user.id]);
    if (c.n >= MAX_LISTINGS_PER_OWNER) return bad(res, `You can have up to ${MAX_LISTINGS_PER_OWNER} listings`, 403);
    const imgs = await saveImages(req.files, uploadDir), p = r.p;
    try {
      const [ins] = await db.execute(`INSERT INTO properties (owner_id,title,description,type,listing_type,price,bedrooms,bathrooms,area_sqft,amenities,address,city,lat,lng,images,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [req.user.id, p.title, p.description, p.type, p.listing_type, p.price, p.bedrooms, p.bathrooms, p.area_sqft, JSON.stringify(p.amenities), p.address, p.city, p.lat, p.lng, JSON.stringify(imgs), now(), now()]);
      res.status(201).json({ id: ins.insertId, status: 'Pending' });
    } catch (e) { await removeImages(imgs, uploadDir); throw e; }
  }));
  app.put('/api/properties/:id', need('owner'), writeLimit, upload.array('images', MAX_IMAGES), h(async (req, res) => {
    const pid = id(req.params.id), [[cur]] = await db.execute('SELECT id,images FROM properties WHERE id=? AND owner_id=?', [pid, req.user.id]);
    if (!cur) return bad(res, 'Property not found', 404);
    const r = readProperty(req.body || {}); if (r.error) return bad(res, r.error);
    const old = arr(cur.images), keep = req.body.keep === undefined ? old : arr(req.body.keep).filter(u => old.includes(u));
    const files = req.files || [];
    if (keep.length + files.length < 1) return bad(res, 'A listing needs at least one photo');
    if (keep.length + files.length > MAX_IMAGES) return bad(res, `A listing can have up to ${MAX_IMAGES} photos`);
    const added = files.length ? await saveImages(files, uploadDir) : [], imgs = [...keep, ...added], p = r.p;
    const avail = req.body.available === false || req.body.available === 'false' || req.body.available === '0' ? 0 : 1;
    try {
      await db.execute(`UPDATE properties SET title=?,description=?,type=?,listing_type=?,price=?,bedrooms=?,bathrooms=?,area_sqft=?,amenities=?,address=?,city=?,lat=?,lng=?,images=?,available=?,status='Pending',reject_reason=NULL,updated_at=? WHERE id=? AND owner_id=?`,
        [p.title, p.description, p.type, p.listing_type, p.price, p.bedrooms, p.bathrooms, p.area_sqft, JSON.stringify(p.amenities), p.address, p.city, p.lat, p.lng, JSON.stringify(imgs), avail, now(), pid, req.user.id]);
    } catch (e) { await removeImages(added, uploadDir); throw e; }
    await removeImages(old.filter(u => !keep.includes(u)), uploadDir);
    res.json({ ok: true, status: 'Pending' });
  }));
  // Marking a home rented/sold (or back on the market) does not need a fresh review.
  app.patch('/api/properties/:id/availability', need('owner'), h(async (req, res) => {
    const [r] = await db.execute('UPDATE properties SET available=? WHERE id=? AND owner_id=?', [req.body.available ? 1 : 0, id(req.params.id), req.user.id]);
    r.affectedRows ? res.json({ ok: true }) : bad(res, 'Property not found', 404);
  }));
  app.delete('/api/properties/:id', need('owner', 'admin'), h(async (req, res) => {
    const pid = id(req.params.id), isAdmin = req.user.role === 'admin';
    const [[cur]] = await db.execute(isAdmin ? 'SELECT id,title,images FROM properties WHERE id=?' : 'SELECT id,title,images FROM properties WHERE id=? AND owner_id=?', isAdmin ? [pid] : [pid, req.user.id]);
    if (!cur) return bad(res, 'Property not found', 404);
    await db.execute('DELETE FROM properties WHERE id=?', [pid]);
    await removeImages(arr(cur.images), uploadDir);
    if (isAdmin) await audit(req.user.id, 'delete_listing', 'property', pid, cur.title);
    res.json({ ok: true });
  }));
  app.get('/api/my/properties', need('owner'), h(async (req, res) => {
    const [rows] = await db.execute(`SELECT p.id,p.title,p.city,p.price,p.listing_type,p.status,p.reject_reason,p.available,p.images,p.views,
      (SELECT COUNT(*) FROM inquiries i WHERE i.property_id=p.id) inquiries, (SELECT COUNT(*) FROM favorites f WHERE f.property_id=p.id) saves
      FROM properties p WHERE p.owner_id=? ORDER BY p.id DESC`, [req.user.id]);
    res.json(rows.map(r => ({ ...r, images: arr(r.images) })));
  }));

  // ---------- favourites, inquiries, reports ----------
  app.get('/api/favorites', need('seeker'), h(async (req, res) => {
    const [rows] = await db.execute(`SELECT ${LIST_COLS} FROM favorites f JOIN properties p ON p.id=f.property_id JOIN users u ON u.id=p.owner_id WHERE f.user_id=? AND p.status='Approved' AND u.is_banned=0 ORDER BY p.id DESC`, [req.user.id]);
    res.json(rows.map(card));
  }));
  app.get('/api/favorites/ids', need('seeker'), h(async (req, res) => {
    const [rows] = await db.execute('SELECT property_id FROM favorites WHERE user_id=?', [req.user.id]); res.json(rows.map(r => r.property_id));
  }));
  app.post('/api/favorites/:id', need('seeker'), h(async (req, res) => {
    await db.execute(`INSERT IGNORE INTO favorites (user_id,property_id) SELECT ?, id FROM properties WHERE id=? AND status='Approved'`, [req.user.id, id(req.params.id)]); res.json({ ok: true });
  }));
  app.delete('/api/favorites/:id', need('seeker'), h(async (req, res) => {
    await db.execute('DELETE FROM favorites WHERE user_id=? AND property_id=?', [req.user.id, id(req.params.id)]); res.json({ ok: true });
  }));

  app.post('/api/properties/:id/inquiries', need('seeker'), limiter(60 * 60e3, 15, { keyGenerator: byUser }), h(async (req, res) => {
    const m = str(req.body.message, 5, 1000); if (!m) return bad(res, 'Write a message of 5-1000 characters');
    const pid = id(req.params.id);
    const [[p]] = await db.execute("SELECT p.id,p.available FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=? AND p.status='Approved' AND u.is_banned=0", [pid]);
    if (!p) return bad(res, 'Property not found', 404);
    if (!p.available) return bad(res, 'This home is no longer available', 409);
    const [[open]] = await db.execute('SELECT 1 x FROM inquiries WHERE property_id=? AND seeker_id=? AND reply IS NULL', [pid, req.user.id]);
    if (open) return bad(res, 'You already have an inquiry waiting for a reply on this home', 409);
    await db.execute('INSERT INTO inquiries (property_id,seeker_id,message,created_at) VALUES (?,?,?,?)', [pid, req.user.id, m, now()]);
    res.status(201).json({ ok: true });
  }));
  app.get('/api/inquiries', need('seeker', 'owner'), h(async (req, res) => {
    const owner = req.user.role === 'owner';
    const [rows] = await db.execute(`SELECT i.id,i.message,i.reply,i.created_at,i.replied_at,p.title,p.id property_id,s.name seeker_name FROM inquiries i JOIN properties p ON p.id=i.property_id JOIN users s ON s.id=i.seeker_id
      WHERE ${owner ? 'p.owner_id' : 'i.seeker_id'}=? ORDER BY i.id DESC LIMIT 200`, [req.user.id]);
    res.json(rows);
  }));
  app.post('/api/inquiries/:id/reply', need('owner'), h(async (req, res) => {
    const m = str(req.body.reply, 2, 1000); if (!m) return bad(res, 'Write a reply of 2-1000 characters');
    const [r] = await db.execute('UPDATE inquiries SET reply=?, replied_at=? WHERE id=? AND reply IS NULL AND property_id IN (SELECT id FROM properties WHERE owner_id=?)', [m, now(), id(req.params.id), req.user.id]);
    r.affectedRows ? res.json({ ok: true }) : bad(res, 'Inquiry not found or already answered', 404);
  }));
  app.post('/api/properties/:id/report', need('seeker', 'owner'), limiter(60 * 60e3, 10, { keyGenerator: byUser }), h(async (req, res) => {
    const m = str(req.body.reason, 5, 500); if (!m) return bad(res, 'Describe the problem in 5-500 characters');
    const pid = id(req.params.id), [[p]] = await db.execute("SELECT id,owner_id FROM properties WHERE id=? AND status='Approved'", [pid]);
    if (!p) return bad(res, 'Property not found', 404);
    if (p.owner_id === req.user.id) return bad(res, 'You cannot report your own listing', 403);
    const [[dup]] = await db.execute('SELECT 1 x FROM reports WHERE property_id=? AND reporter_id=? AND resolved=0', [pid, req.user.id]);
    if (dup) return bad(res, 'You have already reported this listing. Our team will review it.', 409);
    await db.execute('INSERT INTO reports (property_id,reporter_id,reason,created_at) VALUES (?,?,?,?)', [pid, req.user.id, m, now()]); res.status(201).json({ ok: true });
  }));

  // ---------- admin ----------
  const admin = need('admin');
  app.get('/api/admin/stats', admin, h(async (req, res) => {
    const [[s]] = await db.query(`SELECT (SELECT COUNT(*) FROM users) users,(SELECT COUNT(*) FROM properties) properties,(SELECT COUNT(*) FROM properties WHERE status='Pending') pending,
      (SELECT COUNT(*) FROM properties WHERE status='Approved') approved,(SELECT COUNT(*) FROM properties WHERE status='Rejected') rejected,
      (SELECT COUNT(*) FROM inquiries) inquiries,(SELECT COUNT(*) FROM reports WHERE resolved=0) open_reports`); res.json(s);
  }));
  app.get('/api/admin/users', admin, h(async (req, res) => {
    const w = [], a = [], t = str(req.query.q, 1, 80);
    if (t) { w.push("(name LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!')"); a.push(`%${likeEsc(t)}%`, `%${likeEsc(t)}%`); }
    const [r] = await db.query(`SELECT id,name,email,role,is_banned,created_at FROM users ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY id DESC LIMIT 100`, a); res.json(r);
  }));
  app.patch('/api/admin/users/:id', admin, h(async (req, res) => {
    const uid = id(req.params.id); if (uid === req.user.id) return bad(res, 'You cannot ban yourself');
    const ban = req.body.is_banned ? 1 : 0, [r] = await db.execute("UPDATE users SET is_banned=?, token_version=token_version+1 WHERE id=? AND role<>'admin'", [ban, uid]);
    if (!r.affectedRows) return bad(res, 'User not found (admins cannot be banned)', 404);
    await audit(req.user.id, ban ? 'ban_user' : 'unban_user', 'user', uid); res.json({ ok: true });
  }));
  app.get('/api/admin/properties', admin, h(async (req, res) => {
    const st = oneOf(req.query.status, ['Pending', 'Approved', 'Rejected']) || 'Pending';
    const [r] = await db.execute(`SELECT p.id,p.title,p.city,p.price,p.listing_type,p.status,p.reject_reason,p.images,p.created_at,u.name owner_name FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.status=? ORDER BY p.id DESC LIMIT 200`, [st]);
    res.json(r.map(x => ({ ...x, images: arr(x.images) })));
  }));
  app.patch('/api/admin/properties/:id', admin, h(async (req, res) => {
    const s = oneOf(req.body.status, ['Approved', 'Rejected']); if (!s) return bad(res, 'Invalid status');
    const reason = s === 'Rejected' ? str(req.body.reason, 5, 300) : null;
    if (s === 'Rejected' && !reason) return bad(res, 'Give the owner a reason (5-300 characters) so they can fix the listing');
    const pid = id(req.params.id), [r] = await db.execute('UPDATE properties SET status=?, reject_reason=? WHERE id=?', [s, reason, pid]);
    if (!r.affectedRows) return bad(res, 'Property not found', 404);
    await audit(req.user.id, s === 'Approved' ? 'approve_listing' : 'reject_listing', 'property', pid, reason); res.json({ ok: true });
  }));
  app.get('/api/admin/reports', admin, h(async (req, res) => {
    const [r] = await db.query('SELECT r.id,r.reason,r.property_id,r.created_at,p.title,u.name reporter_name FROM reports r JOIN properties p ON p.id=r.property_id JOIN users u ON u.id=r.reporter_id WHERE r.resolved=0 ORDER BY r.id DESC LIMIT 200'); res.json(r);
  }));
  app.patch('/api/admin/reports/:id', admin, h(async (req, res) => {
    const rid = id(req.params.id), [r] = await db.execute('UPDATE reports SET resolved=1 WHERE id=?', [rid]);
    if (!r.affectedRows) return bad(res, 'Report not found', 404);
    await audit(req.user.id, 'resolve_report', 'report', rid); res.json({ ok: true });
  }));
  app.get('/api/admin/audit', admin, h(async (req, res) => {
    const [r] = await db.query('SELECT a.id,a.action,a.target_type,a.target_id,a.detail,a.created_at,u.name admin_name FROM audit_log a JOIN users u ON u.id=a.admin_id ORDER BY a.id DESC LIMIT 100'); res.json(r);
  }));
  app.use('/api', (req, res) => bad(res, 'Not found', 404));

  // ---------- SEO: robots, sitemap, per-listing social tags ----------
  app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /api/\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${origin(req)}/sitemap.xml\n`));
  app.get('/sitemap.xml', h(async (req, res) => {
    const [rows] = await db.query("SELECT p.id,p.updated_at FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.status='Approved' AND u.is_banned=0 ORDER BY p.id DESC LIMIT 5000");
    const o = origin(req), day = v => { try { return new Date(v).toISOString().slice(0, 10); } catch { return null; } };
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${o}/</loc></url>\n${rows.map(r => `<url><loc>${o}/property/${r.id}</loc>${day(r.updated_at) ? `<lastmod>${day(r.updated_at)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`);
  }));

  // ---------- static + single-page app ----------
  const vendor = path.join(__dirname, '..', 'node_modules', 'leaflet', 'dist');
  if (fs.existsSync(vendor)) app.use('/vendor/leaflet', express.static(vendor, { index: false, maxAge: prod ? '7d' : 0 }));
  else console.warn('Leaflet is not installed: run "npm install" so maps load from this server.');
  app.use(express.static(publicDir, { index: false, maxAge: prod ? '1h' : 0 }));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const readIndex = () => fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  let indexCache = prod ? readIndex() : null;
  const metaTags = (title, desc, url, image) => `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Home Finder"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">${image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image">` : ''}`;
  app.get(/^\/(?!api\/|uploads\/|vendor\/)[^.]*$/, h(async (req, res) => {
    let title = 'Home Finder: find houses, apartments and rooms to rent or buy', desc = 'Search verified homes for rent and sale on an interactive map. Save favourites and message owners directly.', image = '';
    const m = req.path.match(/^\/property\/(\d+)\/?$/);
    if (m) {
      const [[p]] = await db.execute("SELECT p.title,p.city,p.description,p.images FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=? AND p.status='Approved' AND u.is_banned=0", [id(m[1])]);
      if (p) { title = `${p.title} in ${p.city} | Home Finder`; desc = p.description.replace(/\s+/g, ' ').slice(0, 160); const i = arr(p.images)[0]; if (i) image = origin(req) + i; }
    }
    const html = (indexCache || readIndex()).replace('<!--META-->', metaTags(title, desc, origin(req) + req.path, image)).replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    res.setHeader('Cache-Control', 'no-cache'); res.type('html').send(html);
  }));
  app.use((req, res) => res.status(404).type('text').send('Not found'));

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof multer.MulterError) return bad(res, err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller' : `Upload problem: up to ${MAX_IMAGES} photos, 5 MB each`);
    if (err.type === 'entity.parse.failed') return bad(res, 'Invalid JSON in request');
    if (err.type === 'entity.too.large') return bad(res, 'Request too large', 413);
    if (err.status && err.status < 500 && err.expose !== false) return bad(res, err.message, err.status);
    console.error(err); bad(res, 'Something went wrong. Please try again.', 500);
  });
  return app;
}

module.exports = { createApp, AMENITIES };
