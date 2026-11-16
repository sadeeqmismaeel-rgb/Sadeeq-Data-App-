import crypto from 'node:crypto';
import { get, run, nowSql } from './db.js';

const SESSION_COOKIE = 'dvc_session';
const SESSION_DAYS = 30;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  const expected = Buffer.from(hash, 'hex');
  const test = crypto.scryptSync(String(password), salt, 64);
  return test.length === expected.length && crypto.timingSafeEqual(test, expected);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    if (!key) return;
    out[key] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

export function isHttps(req) {
  return req.secure || String(req.headers['x-forwarded-proto'] || '').includes('https');
}

export function createSession(userId, req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const created = nowSql();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [
    token,
    userId,
    created,
    nowSql(expires)
  ]);
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DAYS * 86400}`
  ];
  if (isHttps(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
  return token;
}

export function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) run('DELETE FROM sessions WHERE token = ?', [token]);
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isHttps(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function attachUser(req, res, next) {
  req.user = null;
  req.business = null;
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) {
    const row = get(
      `SELECT s.token AS token, s.expires_at AS expires_at, u.id AS id, u.name AS name,
              u.email AS email, u.role AS role
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?`,
      [token, nowSql()]
    );
    if (row) {
      req.user = { id: Number(row.id), name: row.name, email: row.email, role: row.role };
      if (row.role === 'owner') {
        req.business = get('SELECT * FROM businesses WHERE owner_id = ? ORDER BY id LIMIT 1', [row.id]);
      }
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireOwner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner account required' });
  if (!req.business) return res.status(404).json({ error: 'No business linked to this account' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}
