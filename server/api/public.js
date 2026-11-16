import express from 'express';
import QRCode from 'qrcode';
import { get, all, run } from '../db.js';
import { EVENT_TYPES, publicCard, defaultOrderMessage } from '../model.js';

const router = express.Router();

const hits = new Mapp();

class Mapp {
  constructor() {
    this.store = new MappStore();
  }
  take(key) {
    const now = Date.now();
    const bucket = this.store.get(key) || { count: 0, start: now };
    if (now - bucket.start > 60000) {
      bucket.count = 0;
      bucket.start = now;
    }
    bucket.count += 1;
    this.store.set(key, bucket);
    return bucket.count;
  }
}

class MappStore {
  constructor() {
    this.mapp = new MappMap();
  }
  get(key) {
    return this.mapp.get(key);
  }
  set(key, value) {
    if (this.mapp.size > 4000) this.mapp.clear();
    this.mapp.set(key, value);
  }
}

function findActive(slug) {
  const business = get('SELECT * FROM businesses WHERE slug = ?', [String(slug || '').toLowerCase()]);
  if (!business) return { business: null, code: 404 };
  if (business.status !== 'active') return { business: null, code: 403 };
  return { business, code: 200 };
}

function whatsappLink(business, message) {
  const digits = String(business.whatsapp || '').replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

router.get('/card/:slug', (req, res) => {
  const found = findActive(req.params.slug);
  if (!found.business) {
    return res.status(found.code).json({
      error: found.code === 403
        ? 'This business card is currently unavailable.'
        : 'Business card not found.'
    });
  }
  const payload = publicCard(found.business.id);
  payload.business.cardUrl = `${baseUrl(req)}/card/${found.business.slug}`;
  payload.business.whatsappLink = whatsappLink(found.business, payload.business.whatsappMessage);
  res.json(payload);
});

router.post('/track', (req, res) => {
  const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown');
  if (hits.take(ip) > 180) return res.status(429).json({ error: 'Too many requests' });
  const body = req.body || {};
  const type = String(body.type || '');
  if (!EVENT_TYPES.includes(type)) return res.status(400).json({ error: 'Unknown event type' });
  const found = findActive(body.slug);
  if (!found.business) return res.status(404).json({ error: 'Business not found' });
  let productId = null;
  if (body.productId) {
    const product = get('SELECT id FROM products WHERE id = ? AND business_id = ?', [
      Number(body.productId),
      found.business.id
    ]);
    if (product) productId = Number(product.id);
  }
  run('INSERT INTO analytics_events (business_id, type, product_id, source, created_at) VALUES (?, ?, ?, ?, ?)', [
    found.business.id,
    type,
    productId,
    String(body.source || '').slice(0, 40) || null,
    nowSql()
  ]);
  res.status(204).end();
});

router.get('/card/:slug/vcard', (req, res) => {
  const found = findActive(req.params.slug);
  if (!found.business) return res.status(404).type('text/plain').send('Business card not found.');
  const b = found.business;
  const cardUrl = `${baseUrl(req)}/card/${b.slug}`;
  const phone = String(b.phone || b.whatsapp || '').trim();
  const whatsapp = String(b.whatsapp || '').trim();
  const escape = (value) =>
    String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${escape(b.name)};;;`,
    `FN:${escape(b.name)}`,
    `ORG:${escape(b.name)}`,
    `TITLE:${escape(b.category || '')}`,
    `NOTE:${escape((b.description || '').slice(0, 500))}`,
    phone ? `TEL;TYPE=WORK,VOICE:${phone}` : null,
    whatsapp && whatsapp !== phone ? `TEL;TYPE=CEL:${whatsapp}` : null,
    b.email ? `EMAIL;TYPE=WORK:${escape(b.email)}` : null,
    b.address ? `ADR;TYPE=WORK:;;${escape(b.address)};;;;` : null,
    b.website ? `URL:${escape(b.website)}` : null,
    `URL:${cardUrl}`,
    'END:VCARD'
  ].filter(Boolean);

  const filename = `${b.slug}.vcf`;
  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`${lines.join('\r\n')}\r\n`);
});

router.get('/card/:slug/qr.png', async (req, res) => {
  const found = findActive(req.params.slug);
  if (!found.business) return res.status(404).json({ error: 'Business card not found' });
  const b = found.business;
  const type = req.query.type === 'whatsapp' ? 'whatsapp' : 'card';
  const size = Math.min(Math.max(Number(req.query.size) || 640, 200), 1400);
  const message = get('SELECT value FROM settings WHERE business_id = ? AND key = ?', [b.id, 'whatsapp_message']);
  const target = type === 'whatsapp'
    ? whatsappLink(b, message ? message.value : '')
    : `${baseUrl(req)}/card/${b.slug}?src=qr`;
  const buffer = await QRCode.toBuffer(target, {
    type: 'png',
    width: size,
    margin: 2,
    color: { dark: '#0F3D7E', light: '#FFFFFFFF' },
    errorCorrectionLevel: 'M'
  });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(buffer);
});

router.get('/directory', (req, res) => {
  const rows = all(
    `SELECT b.name, b.slug, b.category, b.tagline, b.logo_url AS logoUrl, b.status
       FROM businesses b WHERE b.status = 'active' ORDER BY b.created_at DESC LIMIT 24`
  );
  res.json({ businesses: rows });
});

export default router;
