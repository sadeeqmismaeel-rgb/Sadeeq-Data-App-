import express from 'express';
import QRCode from 'qrcode';
import { get, all, run, nowSql } from '../db.js';
import { requireOwner, hashPassword, verifyPassword } from '../auth.js';
import {
  listProducts,
  listSocials,
  serializeBusiness,
  serializeProduct,
  serializeSocial,
  sanitizeTheme,
  parseTheme,
  getSetting,
  defaultOrderMessage
} from '../model.js';
import { analyticsSummary } from '../analytics.js';
import { slugify, uniqueSlug } from './auth.js';

const router = express.Router();
router.use(requireOwner);

const str = (value, max) => String(value === undefined || value === null ? '' : value).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function businessPayload(businessId) {
  const row = get('SELECT * FROM businesses WHERE id = ?', [businessId]);
  return {
    business: serializeBusiness(row),
    products: listProducts(businessId),
    socials: listSocials(businessId),
    whatsappMessage: getSetting(businessId, 'whatsapp_message', ''),
    currency: getSetting(businessId, 'currency', 'NGN')
  };
}

router.get('/business', (req, res) => {
  res.json(businessPayload(req.business.id));
});

router.put('/business', (req, res) => {
  const b = req.business;
  const body = req.body || {};
  const name = str(body.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Business name is required.' });
  const email = str(body.email, 160);
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const website = str(body.website, 200);
  if (website && !/^https?:\/\//i.test(website)) {
    return res.status(400).json({ error: 'Website must start with http:// or https://' });
  }
  let slug = b.slug;
  if (body.slug !== undefined && str(body.slug, 60) !== b.slug) {
    const candidate = slugify(str(body.slug, 60));
    if (candidate.length < 3) return res.status(400).json({ error: 'Public link must be at least 3 characters.' });
    if (get('SELECT id FROM businesses WHERE slug = ? AND id <> ?', [candidate, b.id])) {
      return res.status(409).json({ error: 'That public link is already taken.' });
    }
    slug = candidate;
  }
  run(
    `UPDATE businesses SET name = ?, tagline = ?, description = ?, category = ?, phone = ?, whatsapp = ?,
       email = ?, address = ?, opening_hours = ?, delivery_info = ?, website = ?, logo_url = ?,
       cover_url = ?, slug = ?, updated_at = ? WHERE id = ?`,
    [
      name,
      str(body.tagline, 140),
      str(body.description, 2000),
      str(body.category, 80),
      str(body.phone, 40),
      str(body.whatsapp, 40),
      email,
      str(body.address, 240),
      str(body.openingHours, 240),
      str(body.deliveryInfo, 240),
      website,
      str(body.logoUrl, 3000000),
      str(body.coverUrl, 3000000),
      slug,
      nowSql(),
      b.id
    ]
  );
  res.json(businessPayload(b.id));
});

router.put('/appearance', (req, res) => {
  const theme = sanitizeTheme(req.body);
  run('UPDATE businesses SET theme = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify(theme),
    nowSql(),
    req.business.id
  ]);
  res.json({ theme: parseTheme(JSON.stringify(theme)) });
});

router.put('/whatsapp', (req, res) => {
  const body = req.body || {};
  const number = str(body.whatsapp, 40);
  const digits = number.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return res.status(400).json({ error: 'Enter a valid WhatsApp number with country code.' });
  }
  const message = str(body.message, 600);
  run('UPDATE businesses SET whatsapp = ?, updated_at = ? WHERE id = ?', [number, nowSql(), req.business.id]);
  run(
    `INSERT INTO settings (business_id, key, value) VALUES (?, 'whatsapp_message', ?)
     ON CONFLICT(business_id, key) DO UPDATE SET value = excluded.value`,
    [req.business.id, message]
  );
  res.json({ whatsapp: number, message });
});

router.put('/account', (req, res) => {
  const body = req.body || {};
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const name = str(body.name, 80);
  const email = str(body.email, 160).toLowerCase();
  if (name.length < 2) return res.status(400).json({ error: 'Name is required.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (get('SELECT id FROM users WHERE email = ? AND id <> ?', [email, user.id])) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }
  let passwordHash = user.password_hash;
  const newPassword = String(body.newPassword || '');
  if (newPassword) {
    if (!verifyPassword(String(body.currentPassword || ''), user.password_hash)) {
      return res.status(403).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    passwordHash = hashPassword(newPassword);
  }
  run('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [
    name,
    email,
    passwordHash,
    user.id
  ]);
  res.json({ user: { id: user.id, name, email, role: user.role } });
});

router.get('/products', (req, res) => {
  res.json({ products: listProducts(req.business.id) });
});

router.post('/products', (req, res) => {
  const body = req.body || {};
  const name = str(body.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Product name is required.' });
  const price = body.price === '' || body.price === null || body.price === undefined ? null : Number(body.price);
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }
  const count = get('SELECT COUNT(*) AS c FROM products WHERE business_id = ?', [req.business.id]);
  const insert = run(
    `INSERT INTO products (business_id, name, price, currency, description, image_url, badge, order_message,
        sort_order, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.business.id,
      name,
      price,
      str(body.currency, 6) || 'NGN',
      str(body.description, 800),
      str(body.imageUrl, 3000000),
      str(body.badge, 40),
      str(body.orderMessage, 400),
      Number(count.c) * 10 + 10,
      body.active === false ? 0 : 1,
      nowSql(),
      nowSql()
    ]
  );
  const row = get('SELECT * FROM products WHERE id = ?', [insert.lastId]);
  res.status(201).json({ product: serializeProduct(row) });
});

function ownedProduct(req, res) {
  const product = get('SELECT * FROM products WHERE id = ? AND business_id = ?', [
    Number(req.params.id),
    req.business.id
  ]);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return null;
  }
  return product;
}

router.put('/products/:id', (req, res) => {
  const product = ownedProduct(req, res);
  if (!product) return undefined;
  const body = req.body || {};
  const name = body.name === undefined ? product.name : str(body.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Product name is required.' });
  let price = product.price;
  if (body.price !== undefined) {
    price = body.price === '' || body.price === null ? null : Number(body.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }
  }
  run(
    `UPDATE products SET name = ?, price = ?, currency = ?, description = ?, image_url = ?, badge = ?,
       order_message = ?, active = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
    [
      name,
      price,
      str(body.currency, 6) || product.currency,
      body.description === undefined ? product.description : str(body.description, 800),
      body.imageUrl === undefined ? product.image_url : str(body.imageUrl, 3000000),
      body.badge === undefined ? product.badge : str(body.badge, 40),
      body.orderMessage === undefined ? product.order_message : str(body.orderMessage, 400),
      body.active === undefined ? product.active : body.active ? 1 : 0,
      body.sortOrder === undefined ? product.sort_order : Number(body.sortOrder) || 0,
      nowSql(),
      product.id
    ]
  );
  res.json({ product: serializeProduct(get('SELECT * FROM products WHERE id = ?', [product.id])) });
});

router.delete('/products/:id', (req, res) => {
  const product = ownedProduct(req, res);
  if (!product) return undefined;
  run('DELETE FROM products WHERE id = ?', [product.id]);
  res.json({ ok: true });
});

router.get('/socials', (req, res) => {
  res.json({ socials: listSocials(req.business.id) });
});

router.post('/socials', (req, res) => {
  const body = req.body || {};
  const platform = str(body.platform, 30).toLowerCase();
  const url = str(body.url, 300);
  if (!platform) return res.status(400).json({ error: 'Choose a platform.' });
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return res.status(400).json({ error: 'Enter a valid link starting with http:// or https://' });
  }
  const insert = run(
    'INSERT INTO social_links (business_id, platform, url, label, sort_order) VALUES (?, ?, ?, ?, ?)',
    [req.business.id, platform, url, str(body.label, 60), Number(body.sortOrder) || 0]
  );
  res.status(201).json({ social: serializeSocial(get('SELECT * FROM social_links WHERE id = ?', [insert.lastId])) });
});

router.put('/socials/:id', (req, res) => {
  const social = get('SELECT * FROM social_links WHERE id = ? AND business_id = ?', [
    Number(req.params.id),
    req.business.id
  ]);
  if (!social) return res.status(404).json({ error: 'Social link not found.' });
  const body = req.body || {};
  const url = body.url === undefined ? social.url : str(body.url, 300);
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return res.status(400).json({ error: 'Enter a valid link starting with http:// or https://' });
  }
  run('UPDATE social_links SET platform = ?, url = ?, label = ?, sort_order = ? WHERE id = ?', [
    body.platform === undefined ? social.platform : str(body.platform, 30).toLowerCase(),
    url,
    body.label === undefined ? social.label : str(body.label, 60),
    body.sortOrder === undefined ? social.sort_order : Number(body.sortOrder) || 0,
    social.id
  ]);
  res.json({ social: serializeSocial(get('SELECT * FROM social_links WHERE id = ?', [social.id])) });
});

router.delete('/socials/:id', (req, res) => {
  const social = get('SELECT * FROM social_links WHERE id = ? AND business_id = ?', [
    Number(req.params.id),
    req.business.id
  ]);
  if (!social) return res.status(404).json({ error: 'Social link not found.' });
  run('DELETE FROM social_links WHERE id = ?', [social.id]);
  res.json({ ok: true });
});

router.get('/analytics', (req, res) => {
  res.json(analyticsSummary(req.business.id, String(req.query.range || '7d')));
});

router.get('/qr', async (req, res) => {
  const business = req.business;
  const type = req.query.type === 'whatsapp' ? 'whatsapp' : 'card';
  const base = `${req.protocol}://${req.get('host')}`;
  const message = getSetting(business.id, 'whatsapp_message', '');
  const digits = String(business.whatsapp || '').replace(/\D/g, '');
  const target = type === 'whatsapp'
    ? `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : `${base}/card/${business.slug}?src=qr`;
  const dataUrl = await QRCode.toDataURL(target, {
    width: 720,
    margin: 2,
    color: { dark: '#0F3D7E', light: '#FFFFFFFF' }
  });
  res.json({ type, target, dataUrl, cardUrl: `${base}/card/${business.slug}` });
});

router.post('/order-message', (req, res) => {
  const body = req.body || {};
  res.json({ message: defaultOrderMessage(str(body.productName, 120), req.business.name) });
});

export default router;
