import { all, get } from './db.js';

const DAY_MS = 86400000;

function rangeConfig(range) {
  switch (range) {
    case 'today':
      return { key: 'today', days: 1, since: "date(created_at) = date('now')", seriesSince: '-0 days' };
    case '30d':
      return { key: '30d', days: 30, since: "created_at >= date('now','-29 days')", seriesSince: '-29 days' };
    case 'all':
      return { key: 'all', days: 30, since: '1 = 1', seriesSince: '-29 days' };
    default:
      return { key: '7d', days: 7, since: "created_at >= date('now','-6 days')", seriesSince: '-6 days' };
  }
}

function dayKeys(days) {
  const today = new Date();
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(new Date(base - i * DAY_MS).toISOString().slice(0, 10));
  }
  return out;
}

export function analyticsSummary(businessId, range) {
  const cfg = rangeConfig(range);
  const totalsRows = all(
    `SELECT type, COUNT(*) AS total FROM analytics_events
      WHERE business_id = ? AND ${cfg.since} GROUP BY type`,
    [businessId]
  );
  const totals = {
    card_view: 0,
    whatsapp_click: 0,
    phone_click: 0,
    qr_scan: 0,
    product_view: 0,
    share: 0
  };
  totalsRows.forEach((row) => {
    if (row.type in totals) totals[row.type] = Number(row.total);
  });
  const totalEvents = Object.values(totals).reduce((sum, n) => sum + n, 0);

  const seriesRows = all(
    `SELECT date(created_at) AS day, type, COUNT(*) AS total FROM analytics_events
      WHERE business_id = ? AND created_at >= date('now', ?) GROUP BY day, type`,
    [businessId, cfg.seriesSince]
  );
  const byDay = new Map();
  seriesRows.forEach((row) => {
    const entry = byDay.get(row.day) || { card_view: 0, whatsapp_click: 0, qr_scan: 0, share: 0, phone_click: 0, product_view: 0 };
    if (row.type in entry) entry[row.type] = Number(row.total);
    byDay.set(row.day, entry);
  });
  const series = dayKeys(cfg.days).map((day) => {
    const entry = byDay.get(day) || { card_view: 0, whatsapp_click: 0, qr_scan: 0, share: 0, phone_click: 0, product_view: 0 };
    return {
      date: day,
      views: entry.card_view,
      whatsapp: entry.whatsapp_click,
      qr: entry.qr_scan,
      shares: entry.share,
      total: entry.card_view + entry.whatsapp_click + entry.qr_scan + entry.share + entry.phone_click + entry.product_view
    };
  });

  const productRows = all(
    `SELECT product_id AS productId, COUNT(*) AS total FROM analytics_events
      WHERE business_id = ? AND type = 'product_view' AND product_id IS NOT NULL AND ${cfg.since}
      GROUP BY product_id ORDER BY total DESC LIMIT 8`,
    [businessId]
  );
  const productViews = productRows.map((row) => {
    const product = get('SELECT name FROM products WHERE id = ?', [Number(row.productId)]);
    return { productId: Number(row.productId), name: product ? product.name : 'Removed product', views: Number(row.total) };
  });

  const recent = all(
    `SELECT type, product_id AS productId, created_at AS createdAt FROM analytics_events
      WHERE business_id = ? ORDER BY id DESC LIMIT 12`,
    [businessId]
  ).map((row) => ({
    type: row.type,
    productId: row.productId ? Number(row.productId) : null,
    createdAt: row.createdAt
  }));

  const allTime = get('SELECT COUNT(*) AS total FROM analytics_events WHERE business_id = ?', [businessId]);

  return {
    range: cfg.key,
    totals: { ...totals, events: totalEvents },
    allTimeEvents: Number(allTime ? allTime.total : 0),
    series,
    productViews,
    recent
  };
}
