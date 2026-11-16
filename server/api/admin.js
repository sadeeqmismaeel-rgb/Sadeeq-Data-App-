import express from 'express';
import { get, all, run, nowSql } from '../db.js';
import { requireAdmin, hashPassword } from '../auth.js';
import { serializeBusiness, THEME_DEFAULT } from '../model.js';
import { slugify, uniqueSlug } from './auth.js';

const router = express.Router();
router.use(requireAdmin);

const str = (value, max) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIST_SQL = `
  SELECT b.*, u.name AS owner_name, u.email AS owner_email,
    (SELECT COUNT(*) FROM products p WHERE p.business_id = b.id) AS product_count,
    (SELECT COUNT(*) FROM analytics_events e WHERE e.business_id = b.id AND e.type = 'card_view') AS view_count,
    (SELECT COUNT(*) FROM analytics_events e WHERE e.business_id = b.id) AS event_count
  FROM businesses b JOIN users u ON u.id = b.owner_id`;

function adminBusiness(row) {
  return {
    ...serializeBusiness(row),
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    productCount: Number(row.product_count || 0),
    viewCount: Number(row.view_count || 0),
    eventCount: Number(row.event_count || 0)
  };
}

router.get('/overview', (req, res) => {
  const q = str(req.query.q, 80);
  const like = `%${q}%`;
  const rows = q
    ? all(`${LIST_SQL} WHERE b.name LIKE ? OR b.slug LIKE ? OR u.email LIKE ? ORDER BY b.created_at DESC`, [like, like, like])
    : all(`${LIST_SQL} ORDER BY b.created_at DESC`);

  const totals = get(`
    SELECT
      (SELECT COUNT(*) FROM businesses) AS businesses,
      (SELECT COUNT(*) FROM businesses WHERE status = 'active') AS active_businesses,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM analytics_events) AS events,
      (SELECT COUNT(*) FROM analytics_events WHERE type = 'card_view') AS views,
      (SELECT COUNT(*) FROM analytics_events WHERE type = 'whatsapp_click') AS whatsapp,
      (SELECT COUNT(*) FROM analytics_events WHERE type = 'qr_scan') AS qr_scans
  `);

  const users = all(
    `SELECT u.id, u.name, u.email, u.role, u.created_at AS createdAt,
       (SELECT COUNT(*) FROM businesses b WHERE b.owner_id = u.id) AS businesses
     FROM users u ORDER BY u.id ASC LIMIT 200`
  );

  res.json({
    totals: {
      businesses: Number(totals.businesses),
      activeBusinesses: Number(totals.active_businesses),
      users: Number(totals.users),
      admins: Number(totals.admins),
      products: Number(totals.products),
      events: Number(totals.events),
      views: Number(totals.views),
      whatsapp: Number(totals.whatsapp),
      qrScans: Number(totals.qr_scans)
    },
    businesses: rows.map(adminBusiness),
    users: users.map((u) => ({
      id: Number(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      businesses: Number(u.businesses)
    }))
  });
});

router.post('/businesses', (req, res) => {
  const body = req.body || {};
  const businessName = str(body.name, 120);
  const ownerName = str(body.ownerName, 80);
  const ownerEmail = str(body.ownerEmail, 160).toLowerCase();
  const ownerPassword = String(body.ownerPassword || '');
  if (businessName.length < 2) return res.status(400).json({ error: 'Business name is required.' });
  if (ownerName.length < 2) return res.status(400).json({ error: 'Owner name is required.' });
  if (!EMAIL_RE.test(ownerEmail)) return res.status(400).json({ error: 'Enter a valid owner email.' });
  if (ownerPassword.length < 8) return res.status(400).json({ error: 'Owner password must be at least 8 characters.' });
  if (get('SELECT id FROM users WHERE email = ?', [ownerEmail])) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }
  const now = nowSql();
  const userInsert = run('INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)', [
    ownerName,
    ownerEmail,
    hashPassword(ownerPassword),
    'owner',
    now
  ]);
  const slug = uniqueSlug(slugify(str(body.slug, 60) || businessName));
  const insert = run(
    `INSERT INTO businesses (owner_id, slug, name, tagline, description, category, phone, whatsapp, email,
       address, opening_hours, delivery_info, website, logo_url, cover_url, status, theme, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', 'active', ?, ?, ?)`,
    [
      userInsert.lastId,
      slug,
      businessName,
      str(body.tagline, 140),
      str(body.description, 2000),
      str(body.category, 80),
      str(body.phone, 40),
      str(body.whatsapp, 40),
      str(body.email, 160),
      str(body.address, 240),
      str(body.openingHours, 240),
      str(body.deliveryInfo, 240),
      str(body.website, 200),
      JSON.stringify(THEME_DEFAULT),
      now,
      now
    ]
  );
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [
    insert.lastId,
    'whatsapp_message',
    `Hello, I saw ${businessName} on Digital vCard and I would like to know more.`
  ]);
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [insert.lastId, 'currency', 'NGN']);
  const row = get(`${LIST_SQL} WHERE b.id = ?`, [insert.lastId]);
  res.status(201).json({ business: adminBusiness(row) });
});

router.put('/businesses/:id', (req, res) => {
  const row = get('SELECT * FROM businesses WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Business not found.' });
  const body = req.body || {};
  const name = body.name === undefined ? row.name : str(body.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Business name is required.' });
  let slug = row.slug;
  if (body.slug !== undefined && str(body.slug, 60) !== row.slug) {
    slug = slugify(str(body.slug, 60));
    if (get('SELECT id FROM businesses WHERE slug = ? AND id <> ?', [slug, row.id])) {
      return res.status(409).json({ error: 'That public link is already taken.' });
    }
  }
  const status = ['active', 'suspended'].includes(body.status) ? body.status : row.status;
  run(
    `UPDATE businesses SET name = ?, slug = ?, tagline = ?, description = ?, category = ?, phone = ?,
       whatsapp = ?, email = ?, address = ?, opening_hours = ?, delivery_info = ?, website = ?, status = ?,
       updated_at = ? WHERE id = ?`,
    [
      name,
      slug,
      body.tagline === undefined ? row.tagline : str(body.tagline, 140),
      body.description === undefined ? row.description : str(body.description, 2000),
      body.category === undefined ? row.category : str(body.category, 80),
      body.phone === undefined ? row.phone : str(body.phone, 40),
      body.whatsapp === undefined ? row.whatsapp : str(body.whatsapp, 40),
      body.email === undefined ? row.email : str(body.email, 160),
      body.address === undefined ? row.address : str(body.address, 240),
      body.openingHours === undefined ? row.opening_hours : str(body.openingHours, 240),
      body.deliveryInfo === undefined ? row.delivery_info : str(body.deliveryInfo, 240),
      body.website === undefined ? row.website : str(body.website, 200),
      status,
      nowSql(),
      row.id
    ]
  );
  const updated = get(`${LIST_SQL} WHERE b.id = ?`, [row.id]);
  res.json({ business: adminBusiness(updated) });
});

router.post('/businesses/:id/status', (req, res) => {
  const row = get('SELECT * FROM businesses WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Business not found.' });
  const status = req.body && req.body.status === 'suspended' ? 'suspended' : 'active';
  run('UPDATE businesses SET status = ?, updated_at = ? WHERE id = ?', [status, nowSql(), row.id]);
  const updated = get(`${LIST_SQL} WHERE b.id = ?`, [row.id]);
  res.json({ business: adminBusiness(updated) });
});

router.delete('/businesses/:id', (req, res) => {
  const row = get('SELECT * FROM businesses WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Business not found.' });
  run('DELETE FROM businesses WHERE id = ?', [row.id]);
  const remaining = get('SELECT COUNT(*) AS c FROM businesses WHERE owner_id = ?', [row.owner_id]);
  if (Number(remaining.c) === 0) run('DELETE FROM users WHERE id = ? AND role = ?', [row.owner_id, 'owner']);
  res.json({ ok: true });
});

export default router;
