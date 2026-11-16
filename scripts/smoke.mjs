/**
 * Functional smoke test: boots the real server on a temp database and exercises
 * auth, multi-business isolation, public card, product CRUD, tracking and admin APIs.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 4310;
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vcard-test-'));

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function makeClient() {
  let cookie = '';
  return async function call(pathname, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(BASE + pathname, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual'
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 200) };
    }
    return { status: res.status, data };
  };
}

const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverLog += chunk.toString();
});

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function main() {
  const up = await waitForServer();
  if (!up) {
    console.error('Server did not start.\n' + serverLog);
    process.exit(1);
  }

  const owner = makeClient();
  const other = makeClient();
  const admin = makeClient();
  const visitor = makeClient();

  console.log('Public card');
  const card = await visitor('/api/public/card/ss-aminan-juna');
  check('GET public card 200', card.status === 200, `status ${card.status}`);
  check('business name seeded', card.data?.business?.name?.includes('S & S AMINAN JUNA'));
  check('whatsapp number seeded', card.data?.business?.whatsapp === '+2348146508373');
  check('five demo products', card.data?.products?.length === 5, `got ${card.data?.products?.length}`);
  check('whatsapp message seeded', /Assalamu Alaikum/.test(card.data?.business?.whatsappMessage || ''));
  check('social links seeded', (card.data?.socials || []).length === 3);
  check('theme is blue + gold', card.data?.business?.theme?.primary === '#0F3D7E' && card.data?.business?.theme?.secondary === '#C9A227');
  check('suspended/unknown slug 404', (await visitor('/api/public/card/does-not-exist')).status === 404);

  console.log('Public assets');
  const vcf = await fetch(`${BASE}/api/public/card/ss-aminan-juna/vcard`);
  const vcfText = await vcf.text();
  check('vcard download 200', vcf.status === 200, `status ${vcf.status}`);
  check('vcard has contact details', vcfText.includes('BEGIN:VCARD') && vcfText.includes('+2348146508373'));
  const qr = await fetch(`${BASE}/api/public/card/ss-aminan-juna/qr.png`);
  check('QR png served', qr.status === 200 && (qr.headers.get('content-type') || '').includes('image/png'));

  console.log('Tracking + analytics');
  for (const type of ['card_view', 'whatsapp_click', 'phone_click', 'qr_scan', 'share']) {
    const res = await visitor('/api/public/track', {
      method: 'POST',
      body: { slug: 'ss-aminan-juna', type }
    });
    check(`track ${type}`, res.status === 204, `status ${res.status}`);
  }
  check('invalid event rejected', (await visitor('/api/public/track', { method: 'POST', body: { slug: 'ss-aminan-juna', type: 'bogus' } })).status === 400);

  console.log('Auth + isolation');
  check('anonymous dashboard blocked', (await owner('/api/owner/business')).status === 401);
  const badLogin = await owner('/api/auth/login', { method: 'POST', body: { email: 'owner@ssaminanjuna.com', password: 'wrong-pass' } });
  check('wrong password rejected', badLogin.status === 401, `status ${badLogin.status}`);
  const login = await owner('/api/auth/login', { method: 'POST', body: { email: 'owner@ssaminanjuna.com', password: 'Aminan2024!' } });
  check('owner login', login.status === 200 && login.data?.user?.role === 'owner', JSON.stringify(login.data));
  check('owner business payload', login.data?.business?.slug === 'ss-aminan-juna');
  await other('/api/auth/login', { method: 'POST', body: { email: 'owner@abuammara.tech', password: 'TechHub2024!' } });
  await admin('/api/auth/login', { method: 'POST', body: { email: 'admin@digitalvcard.app', password: 'Admin2024!' } });

  const analytics = await owner('/api/owner/analytics?range=7d');
  check('analytics 200', analytics.status === 200);
  check('analytics totals present', Number(analytics.data?.totals?.card_view) > 0);
  check('analytics series present', Array.isArray(analytics.data?.series) && analytics.data.series.length === 7);
  check('analytics has product views', Number(analytics.data?.totals?.product_view) >= 0);

  console.log('Owner profile update');
  const profile = await owner('/api/owner/business', {
    method: 'PUT',
    body: {
      name: 'S & S Aminan Juna – Duniyar Jallabiya',
      tagline: 'Premium Jallabiya & Islamic Fashion',
      description: 'Updated description for smoke test.',
      category: 'Fashion / Jallabiya',
      phone: '+2348146508373',
      whatsapp: '+2348146508373',
      email: 'orders@ssaminanjuna.com',
      address: 'Magaji Quarters, Opposite Armour Barrack, Bauchi, Nigeria',
      openingHours: 'Mon – Sat: 9:00 AM – 7:00 PM',
      deliveryInfo: 'Nationwide Delivery'
    }
  });
  check('profile update 200', profile.status === 200, JSON.stringify(profile.data));
  const publicAfter = await visitor('/api/public/card/ss-aminan-juna');
  check('public card reflects update', publicAfter.data?.business?.description === 'Updated description for smoke test.');

  console.log('Products CRUD');
  const created = await owner('/api/owner/products', {
    method: 'POST',
    body: { name: 'Test Kaftan', price: 21000, description: 'Smoke test product', imageUrl: '/assets/products/kaftan.svg' }
  });
  check('create product 200', created.status === 200 || created.status === 201, JSON.stringify(created.data));
  const productId = created.data?.product?.id;
  check('product id returned', Boolean(productId));
  const updated = await owner(`/api/owner/products/${productId}`, {
    method: 'PUT',
    body: { name: 'Test Kaftan Deluxe', price: 23500, description: 'Updated', active: true }
  });
  check('update product', updated.status === 200 && updated.data?.product?.name === 'Test Kaftan Deluxe', JSON.stringify(updated.data));
  const otherProducts = await other('/api/owner/products');
  check('other business cannot see product', !(otherProducts.data?.products || []).some((p) => p.id === productId));
  const foreignEdit = await other(`/api/owner/products/${productId}`, { method: 'PUT', body: { name: 'Hijacked' } });
  check('cross-business edit blocked', foreignEdit.status === 404 || foreignEdit.status === 403, `status ${foreignEdit.status}`);
  const del = await owner(`/api/owner/products/${productId}`, { method: 'DELETE' });
  check('delete product', del.status === 200);
  const afterDelete = await visitor('/api/public/card/ss-aminan-juna');
  check('deleted product gone from public card', !(afterDelete.data?.products || []).some((p) => p.id === productId));

  console.log('Appearance + WhatsApp settings');
  const appearance = await owner('/api/owner/appearance', {
    method: 'PUT',
    body: { preset: 'midnight', primary: '#123456', secondary: '#abcdef', background: 'dark', buttonStyle: 'pill', cardStyle: 'glass', fontStyle: 'classic' }
  });
  check('appearance saved', appearance.status === 200 && appearance.data?.theme?.primary === '#123456', JSON.stringify(appearance.data));
  const appearanceBad = await owner('/api/owner/appearance', { method: 'PUT', body: { primary: 'javascript:alert(1)' } });
  check('invalid colour sanitised', appearanceBad.status === 200 && /^#[0-9a-f]{6}$/i.test(appearanceBad.data?.theme?.primary));
  const wa = await owner('/api/owner/whatsapp', {
    method: 'PUT',
    body: { whatsapp: '+2348146508373', whatsappMessage: 'Assalamu Alaikum, ina son yin oda.' }
  });
  check('whatsapp message saved', wa.status === 200 && /ina son/.test(wa.data?.message || ''));

  console.log('QR + owner analytics');
  const qrOwner = await owner('/api/owner/qr');
  check('owner QR payload', qrOwner.status === 200 && String(qrOwner.data?.cardUrl || '').includes('/card/ss-aminan-juna'), JSON.stringify(qrOwner.data).slice(0, 160));

  console.log('Admin');
  check('admin dashboard blocked for owner', (await owner('/api/admin/overview')).status === 403);
  const overview = await admin('/api/admin/overview');
  check('admin overview 200', overview.status === 200);
  check('admin sees multiple businesses', (overview.data?.totals?.businesses || 0) >= 2, JSON.stringify(overview.data?.totals));
  check('admin business list', (overview.data?.businesses || []).length >= 2);
  const search = await admin('/api/admin/overview?q=abu');
  check('admin search filters', (search.data?.businesses || []).every((b) => /abu/i.test(`${b.name} ${b.slug} ${b.category}`)));
  const suspend = await admin('/api/admin/businesses/2/status', { method: 'POST', body: { status: 'suspended' } });
  check('admin suspend', suspend.status === 200);
  check('suspended card hidden', (await visitor('/api/public/card/abu-ammara-tech-hub')).status === 404);
  const resume = await admin('/api/admin/businesses/2/status', { method: 'POST', body: { status: 'active' } });
  check('admin reactivate', resume.status === 200);
  check('reactivated card public', (await visitor('/api/public/card/abu-ammara-tech-hub')).status === 200);

  console.log('Registration');
  const reg = await makeClient()('/api/auth/register', {
    method: 'POST',
    body: { name: 'New Owner', email: 'new.owner@example.com', password: 'Password123', businessName: 'Example Fashion', category: 'Fashion' }
  });
  check('register new owner', reg.status === 200 || reg.status === 201, JSON.stringify(reg.data));
  check('new business slug', reg.data?.business?.slug === 'example-fashion', reg.data?.business?.slug);
  check('new card public', (await visitor('/api/public/card/example-fashion')).status === 200);
  const dupe = await makeClient()('/api/auth/register', {
    method: 'POST',
    body: { name: 'New Owner', email: 'new.owner@example.com', password: 'Password123', businessName: 'Another' }
  });
  check('duplicate email rejected', dupe.status === 400 || dupe.status === 409, `status ${dupe.status}`);

  console.log('Logout');
  const out = await owner('/api/auth/logout', { method: 'POST' });
  check('logout', out.status === 200);
  check('session invalidated', (await owner('/api/owner/business')).status === 401);

  if (failures) {
    console.error(`\n${failures} check(s) failed`);
    console.error(serverLog.slice(-1500));
    process.exitCode = 1;
  } else {
    console.log('\nAll smoke checks passed');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill('SIGTERM');
    setTimeout(() => {
      fs.rmSync(dataDir, { recursive: true, force: true });
      process.exit(process.exitCode || 0);
    }, 300);
  });
