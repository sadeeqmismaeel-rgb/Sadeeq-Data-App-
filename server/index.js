import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, get } from './db.js';
import { seed } from './seed.js';
import { attachUser } from './auth.js';
import authRoutes from './api/auth.js';
import publicRoutes from './api/public.js';
import ownerRoutes from './api/owner.js';
import adminRoutes from './api/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
app.use(attachUser);

app.get('/api/health', (req, res) => {
  const businesses = get('SELECT COUNT(*) AS c FROM businesses');
  res.json({ ok: true, businesses: Number(businesses.c), uptime: Math.round(process.uptime()) });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send('Client build missing. Run "npm run build" then restart the server.');
  });
}

app.use((err, req, res, next) => {
  console.error('[server]', err && err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = Number(process.env.PORT || 3000);

initDb()
  .then(() => {
    seed();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Digital vCard Business Manager running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
