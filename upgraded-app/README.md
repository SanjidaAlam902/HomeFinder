# Home Finder (CSE451)

A property search platform: Node.js + Express + MySQL, a dependency-free JavaScript frontend, and Leaflet/OpenStreetMap maps.

## Quick start
1. Install Node 22.5+ and MySQL 8 (or MariaDB 10.5+). Create a MySQL user that can use the `homefinder` database.
2. `cp .env.example .env`, then fill in the DB details and a random `JWT_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. `npm install`
4. `npm run migrate` creates the database and tables, and upgrades an older install in place (safe to re-run).
5. `node seed.js admin@yourdomain.com 'LongPassword123'` creates the first admin.
   For a demo: `npm run seed-demo` adds 12 sample listings plus `owner@demo.test`, `seeker@demo.test`, `admin@demo.test` (password `DemoPass123`; refused when `NODE_ENV=production`).
6. `npm start`, then open http://localhost:3000

## Features
**Seekers:** search by keyword, buy/rent, type, price, bedrooms, bathrooms, features and map area; sort; pagination; interactive map with price pins; shareable URLs; saved homes; inquiries with replies; reporting; similar homes.
**Owners:** dashboard with views, inquiries and saves; create/edit listings with map pin-drop, address search and up to 8 photos; mark rented/sold; inbox with unanswered-count badge.
**Admins:** review queue with required rejection reasons (shown to the owner), reports, user search and bans, deletion, audit log.
**Everyone:** password reset by email, change password (signs out other devices), delete account, light/dark mode, keyboard and screen-reader support, responsive layout, SEO (sitemap, robots, per-listing social tags).

## Security in place
- Passwords: bcrypt (cost 12), 8-72 chars with letters and digits, common passwords refused.
- Sessions: JWT in an HttpOnly, SameSite=Strict cookie (`__Host-` prefix and Secure in production), HS256 only. The user is re-read from the DB on every request, so bans, role changes, password changes and resets take effect immediately.
- Login throttling per IP and per IP+email; separate limits on registration, reset, inquiries, reports and uploads; global API limit.
- CSRF: SameSite=Strict, plus Origin and Sec-Fetch-Site checks on all writes.
- SQL injection: parameterised queries only; LIKE wildcards escaped; sort columns whitelisted.
- XSS: all output escaped on the client; strict CSP (`script-src 'self'`, no third-party scripts, Leaflet served from this server); `nosniff`, no framing, Permissions-Policy, HSTS in production.
- Uploads: file type verified from the file's real bytes (not the client's MIME type), random server-chosen names, size/count limits, served with a sandboxing CSP, deleted from disk when photos or listings are removed.
- Authorisation on every route; owners can only touch their own listings and inquiries; reset tokens are stored hashed, single-use and expire in one hour; no user enumeration on login or reset.

## Configuration (`.env`)
See `.env.example`. Useful options: `BASE_URL`, `CURRENCY` (default BDT), `MAP_CENTER`, `MAP_ZOOM`, `TRUST_PROXY`, and `RESEND_API_KEY` + `MAIL_FROM` for real password-reset emails (without them, reset links are printed in the server console).

## Tests
`npm test` runs 18 API integration tests (auth, roles, IDOR, CSRF, uploads, search, moderation, reset flow, SEO). They run against an in-memory SQLite stand-in so no MySQL is needed; the app itself uses MySQL.

## Before going live
- Serve over HTTPS (NGINX/Caddy/your host) and set `NODE_ENV=production`, `BASE_URL`, and a real `DB_PASS`.
- Rate limits are kept in memory; if you run several server instances, move them to a shared store such as Redis.
- Photos are stored on local disk; for multiple servers or backups use shared storage or an object store.
- Have a lawyer review the Terms and Privacy pages (they are starting templates).
- Email verification, payments, and real-time chat are not included.
