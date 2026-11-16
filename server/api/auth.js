import express from 'express';
import { get, run, nowSql } from '../db.js';
import { hashPassword, verifyPassword, createSession, destroySession } from '../auth.js';
import { serializeBusiness, sanitizeTheme, THEME_DEFAULT } from '../model.js';

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function slugify(input) {
  const slug = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'business';
}

export function uniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (get('SELECT id FROM businesses WHERE slug = ?', [slug])) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

function userPayload(user, business) {
  return {
    user: { id: Number(user.id), name: user.name, email: user.email, role: user.role },
    business: business ? serializeBusiness(business) : null
  };
}

router.post('/register', (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const businessName = String(body.businessName || '').trim();

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Enter your full name (2-80 characters).' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (businessName.length < 2 || businessName.length > 120) {
    return res.status(400).json({ error: 'Enter a business name (2-120 characters).' });
  }
  if (get('SELECT id FROM users WHERE email = ?', [email])) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const now = nowSql();
  const userInsert = run(
    'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashPassword(password), 'owner', now]
  );
  const userId = userInsert.lastId;
  const slug = uniqueSlug(slugify(businessName));
  const theme = { ...THEME_DEFAULT };
  const businessInsert = run(
    `INSERT INTO businesses (owner_id, slug, name, tagline, description, category, phone, whatsapp,
        email, address, opening_hours, delivery_info, website, logo_url, cover_url, status, theme,
        created_at, updated_at)
     VALUES (?, ?, ?, '', '', ?, '', '', ?, '', '', '', '', '', '', 'active', ?, ?, ?)`,
    [userId, slug, businessName, String(body.category || '').trim(), email, JSON.stringify(theme), now, now]
  );
  const businessId = businessInsert.lastId;
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [
    businessId,
    'whatsapp_message',
    `Hello, I saw ${businessName} on Digital vCard and I would like to know more.`
  ]);
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [businessId, 'currency', 'NGN']);

  createSession(userId, req, res);
  const user = get('SELECT * FROM users WHERE id = ?', [userId]);
  const business = get('SELECT * FROM businesses WHERE id = ?', [businessId]);
  return res.status(201).json(userPayload(user, business));
});

router.post('/login', (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  createSession(Number(user.id), req, res);
  const business = user.role === 'owner'
    ? get('SELECT * FROM businesses WHERE owner_id = ? ORDER BY id LIMIT 1', [user.id])
    : null;
  return res.json(userPayload(user, business));
});

router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const business = user.role === 'owner'
    ? get('SELECT * FROM businesses WHERE owner_id = ? ORDER BY id LIMIT 1', [user.id])
    : null;
  return res.json(userPayload(user, business));
});

export default router;
