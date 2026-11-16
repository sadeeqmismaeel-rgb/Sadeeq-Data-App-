import { all, get, run, nowSql } from './db.js';
import { hashPassword } from './auth.js';
import { THEME_DEFAULT } from './model.js';

const THEME_SS = { ...THEME_DEFAULT, preset: 'royal-gold', primary: '#0F3D7E', secondary: '#C9A227' };
const THEME_TECH = {
  ...THEME_DEFAULT,
  preset: 'emerald',
  primary: '#0E4A46',
  secondary: '#5AD1B0',
  background: 'gradient'
};

function createUser({ name, email, password, role }) {
  return run('INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)', [
    name,
    email.toLowerCase(),
    hashPassword(password),
    role,
    nowSql()
  ]).lastId;
}

function createBusiness(ownerId, data) {
  const now = nowSql();
  const id = run(
    `INSERT INTO businesses (owner_id, slug, name, tagline, description, category, phone, whatsapp, email,
        address, opening_hours, delivery_info, website, logo_url, cover_url, status, theme, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    [
      ownerId,
      data.slug,
      data.name,
      data.tagline || '',
      data.description || '',
      data.category || '',
      data.phone || '',
      data.whatsapp || '',
      data.email || '',
      data.address || '',
      data.openingHours || '',
      data.deliveryInfo || '',
      data.website || '',
      data.logoUrl || '',
      data.coverUrl || '',
      JSON.stringify(data.theme || THEME_DEFAULT),
      now,
      now
    ]
  ).lastId;
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [id, 'whatsapp_message', data.whatsappMessage || '']);
  run('INSERT INTO settings (business_id, key, value) VALUES (?, ?, ?)', [id, 'currency', data.currency || 'NGN']);
  return id;
}

function addProducts(businessId, products) {
  products.forEach((product, index) => {
    run(
      `INSERT INTO products (business_id, name, price, currency, description, image_url, badge, order_message,
          sort_order, active, created_at, updated_at)
       VALUES (?, ?, ?, 'NGN', ?, ?, ?, '', ?, 1, ?, ?)`,
      [
        businessId,
        product.name,
        product.price,
        product.description,
        product.imageUrl,
        product.badge || '',
        (index + 1) * 10,
        nowSql(),
        nowSql()
      ]
    );
  });
}

function addSocials(businessId, socials) {
  socials.forEach((social, index) => {
    run('INSERT INTO social_links (business_id, platform, url, label, sort_order) VALUES (?, ?, ?, ?, ?)', [
      businessId,
      social.platform,
      social.url,
      social.label || social.platform,
      (index + 1) * 10
    ]);
  });
}

function seedEvents(businessId) {
  const now = new Date();
  const plan = [
    { type: 'card_view', per: 9 },
    { type: 'whatsapp_click', per: 4 },
    { type: 'qr_scan', per: 3 },
    { type: 'phone_click', per: 2 },
    { type: 'share', per: 1 },
    { type: 'product_view', per: 5 }
  ];
  const products = all('SELECT id FROM products WHERE business_id = ?', [businessId]);
  for (let day = 13; day >= 0; day -= 1) {
    const date = new Date(now.getTime() - day * 86400000);
    const stamp = date.toISOString().slice(0, 10);
    plan.forEach((entry, planIndex) => {
      const count = Math.max(0, entry.per + ((day * 3 + planIndex * 5) % 5) - 2);
      for (let i = 0; i < count; i += 1) {
        const hour = String(8 + ((i * 3 + planIndex) % 12)).padStart(2, '0');
        const minute = String((i * 7 + planIndex * 11) % 60).padStart(2, '0');
        const productId =
          entry.type === 'product_view' && products.length
            ? products[(i + day) % products.length].id
            : null;
        run(
          'INSERT INTO analytics_events (business_id, type, product_id, source, created_at) VALUES (?, ?, ?, ?, ?)',
          [businessId, entry.type, productId, day === 0 ? 'demo' : 'seed', `${stamp} ${hour}:${minute}:00`]
        );
      }
    });
  }
}

export function seed() {
  const existing = get('SELECT COUNT(*) AS c FROM users');
  if (Number(existing.c) > 0) return { seeded: false };

  createUser({ name: 'Platform Administrator', email: 'admin@digitalvcard.app', password: 'Admin2024!', role: 'admin' });

  const ssOwner = createUser({
    name: 'Sadiq Sani',
    email: 'owner@ssaminanjuna.com',
    password: 'Aminan2024!',
    role: 'owner'
  });
  const ssBusiness = createBusiness(ssOwner, {
    slug: 'ss-aminan-juna',
    name: 'S & S AMINAN JUNA – DUNIYAR JALLABIYA',
    tagline: 'Premium Jallabiya & Islamic Fashion',
    description:
      'S & S Aminan Juna – Duniyar Jallabiya is the home of premium, hand-finished Islamic fashion in Bauchi. We design Jallabiya, Kaftan, Alkalami, Babban Riga and Morocco styles using rich fabrics, elegant embroidery and careful tailoring for weddings, Eid and everyday elegance. Nationwide delivery available.',
    category: 'Fashion / Jallabiya',
    phone: '+2348146508373',
    whatsapp: '+2348146508373',
    email: 'orders@ssaminanjuna.com',
    address: 'Magaji Quarters, Opposite Armour Barrack, Bauchi, Nigeria',
    openingHours: 'Mon – Sat: 9:00 AM – 7:00 PM\nSunday: 12:00 PM – 5:00 PM',
    deliveryInfo: 'Nationwide delivery across Nigeria. Same-week dispatch to Bauchi, Abuja and Lagos.',
    logoUrl: '/assets/brand/ss-logo.svg',
    coverUrl: '/assets/brand/ss-cover.svg',
    theme: THEME_SS,
    whatsappMessage:
      'Assalamu Alaikum, na ga bayanan shagonku a Digital vCard. Ina son karin bayani.'
  });
  addProducts(ssBusiness, [
    {
      name: 'Jallabiya',
      price: 18500,
      badge: 'Best seller',
      description:
        'Premium cotton jallabiya with hand embroidery on the neckline and cuffs. Lightweight, breathable and finished with gold thread detail for Eid and Friday prayers.',
      imageUrl: '/assets/products/jallabiya.svg'
    },
    {
      name: 'Kaftan',
      price: 22000,
      badge: 'New',
      description:
        'Flowing kaftan cut from soft imported fabric with a clean minimal collar. Perfect for weddings, naming ceremonies and special guests.',
      imageUrl: '/assets/products/kaftan.svg'
    },
    {
      name: 'Alkalami',
      price: 25000,
      badge: '',
      description:
        'Classic Alkalami style with rich shoulder embroidery and a structured fit. Tailored to order in your preferred colour and size.',
      imageUrl: '/assets/products/alkalami.svg'
    },
    {
      name: 'Babban Riga',
      price: 35000,
      badge: 'Premium',
      description:
        'Our flagship Babban Riga with heavy hand embroidery, matching cap and premium finishing. Made for weddings and important occasions.',
      imageUrl: '/assets/products/babban-riga.svg'
    },
    {
      name: 'Morocco Style',
      price: 28000,
      badge: '',
      description:
        'Morocco-inspired jallabiya with a hood, fine trims and a relaxed drape. Available in cream, navy and deep emerald.',
      imageUrl: '/assets/products/morocco-style.svg'
    }
  ]);
  addSocials(ssBusiness, [
    { platform: 'instagram', url: 'https://instagram.com/ssaminanjuna', label: 'Instagram' },
    { platform: 'facebook', url: 'https://facebook.com/ssaminanjuna', label: 'Facebook' },
    { platform: 'tiktok', url: 'https://tiktok.com/@ssaminanjuna', label: 'TikTok' }
  ]);
  seedEvents(ssBusiness);

  const techOwner = createUser({
    name: 'Abu Ammara',
    email: 'owner@abuammara.tech',
    password: 'TechHub2024!',
    role: 'owner'
  });
  const techBusiness = createBusiness(techOwner, {
    slug: 'abu-ammara-tech-hub',
    name: 'Abu Ammara Tech Hub',
    tagline: 'Gadgets, Repairs & CCTV Installation',
    description:
      'Abu Ammara Tech Hub supplies quality phones, laptops and accessories and handles professional repairs, CCTV installation and networking across Bauchi.',
    category: 'Electronics / Repairs',
    phone: '+2348031234567',
    whatsapp: '+2348031234567',
    email: 'hello@abuammara.tech',
    address: 'Shop 12, Central Market Road, Bauchi, Nigeria',
    openingHours: 'Mon – Sat: 8:30 AM – 6:30 PM',
    deliveryInfo: 'Nationwide delivery on all gadgets.',
    logoUrl: '/assets/brand/techhub-logo.svg',
    coverUrl: '/assets/brand/techhub-cover.svg',
    theme: THEME_TECH,
    whatsappMessage: 'Hello Abu Ammara Tech Hub, I would like to make an enquiry.'
  });
  addProducts(techBusiness, [
    {
      name: 'POS Terminal',
      price: 85000,
      badge: 'Hot',
      description: 'Portable POS terminal with receipt printer, 4G SIM support and 12-month warranty.',
      imageUrl: '/assets/products/tech-pos.svg'
    },
    {
      name: 'CCTV Installation',
      price: 120000,
      badge: '',
      description: 'Four-camera HD CCTV package with installation, mobile monitoring and cabling.',
      imageUrl: '/assets/products/tech-cctv.svg'
    },
    {
      name: 'Laptop Repair',
      price: 15000,
      badge: '',
      description: 'Diagnostics and repair for laptops: keyboard, screen, battery and software.',
      imageUrl: '/assets/products/tech-laptop.svg'
    }
  ]);
  addSocials(techBusiness, [
    { platform: 'instagram', url: 'https://instagram.com/abuammaratech', label: 'Instagram' },
    { platform: 'x', url: 'https://x.com/abuammaratech', label: 'X (Twitter)' }
  ]);
  seedEvents(techBusiness);

  return { seeded: true, businesses: 2 };
}
