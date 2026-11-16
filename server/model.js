import { get, all } from './db.js';

export const THEME_DEFAULT = {
  preset: 'royal-gold',
  primary: '#0F3D7E',
  secondary: '#C9A227',
  background: 'royal',
  buttonStyle: 'rounded',
  cardStyle: 'elevated',
  fontStyle: 'modern'
};

export const EVENT_TYPES = [
  'card_view',
  'whatsapp_click',
  'phone_click',
  'qr_scan',
  'product_view',
  'share'
];

export function parseTheme(raw) {
  let parsed = {};
  try {
    parsed = JSON.parse(raw || '{}');
  } catch {
    parsed = {};
  }
  return { ...THEME_DEFAULT, ...parsed };
}

export function sanitizeTheme(input) {
  const src = input && typeof input === 'object' ? input : {};
  const color = (value, fallback) =>
    typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
  const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);
  return {
    preset: oneOf(src.preset, ['royal-gold', 'emerald', 'midnight', 'rose', 'sunset', 'slate'], 'royal-gold'),
    primary: color(src.primary, THEME_DEFAULT.primary),
    secondary: color(src.secondary, THEME_DEFAULT.secondary),
    background: oneOf(src.background, ['royal', 'plain', 'gradient', 'dark'], 'royal'),
    buttonStyle: oneOf(src.buttonStyle, ['rounded', 'pill', 'square'], 'rounded'),
    cardStyle: oneOf(src.cardStyle, ['elevated', 'flat', 'outline', 'glass'], 'elevated'),
    fontStyle: oneOf(src.fontStyle, ['modern', 'classic', 'elegant'], 'modern')
  };
}

export function serializeBusiness(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    ownerId: Number(row.owner_id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline || '',
    description: row.description || '',
    category: row.category || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    address: row.address || '',
    openingHours: row.opening_hours || '',
    deliveryInfo: row.delivery_info || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    coverUrl: row.cover_url || '',
    status: row.status,
    theme: parseTheme(row.theme),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function serializeProduct(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    businessId: Number(row.business_id),
    name: row.name,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency || 'NGN',
    description: row.description || '',
    imageUrl: row.image_url || '',
    badge: row.badge || '',
    orderMessage: row.order_message || '',
    sortOrder: Number(row.sort_order || 0),
    active: Number(row.active) === 1,
    createdAt: row.created_at
  };
}

export function serializeSocial(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    platform: row.platform,
    url: row.url,
    label: row.label || row.platform,
    sortOrder: Number(row.sort_order || 0)
  };
}

export function getSetting(businessId, key, fallback = null) {
  const row = get('SELECT value FROM settings WHERE business_id = ? AND key = ?', [businessId, key]);
  return row ? row.value : fallback;
}

export function listProducts(businessId, { onlyActive = false } = {}) {
  const rows = all(
    `SELECT * FROM products WHERE business_id = ? ${onlyActive ? 'AND active = 1' : ''}
      ORDER BY sort_order ASC, id ASC`,
    [businessId]
  );
  return rows.map(serializeProduct);
}

export function listSocials(businessId) {
  return all('SELECT * FROM social_links WHERE business_id = ? ORDER BY sort_order ASC, id ASC', [
    businessId
  ]).map(serializeSocial);
}

export function publicCard(businessId) {
  const row = get('SELECT * FROM businesses WHERE id = ?', [businessId]);
  if (!row) return null;
  const business = serializeBusiness(row);
  delete business.ownerId;
  return {
    business: {
      ...business,
      whatsappMessage: getSetting(businessId, 'whatsapp_message', ''),
      currency: getSetting(businessId, 'currency', 'NGN')
    },
    products: listProducts(businessId, { onlyActive: true }),
    socials: listSocials(businessId)
  };
}

export function defaultOrderMessage(productName, businessName) {
  return `Hello, I want to order ${productName} from ${businessName}.`;
}
