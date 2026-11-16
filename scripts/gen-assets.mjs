import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'client', 'public', 'assets');
fs.mkdirSync(path.join(OUT, 'brand'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'products'), { recursive: true });

const star = (cx, cy, r, fill, opacity = 1) => {
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(angle) * rad).toFixed(1)},${(cy + Math.sin(angle) * rad).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${opacity}"/>`;
};

function pattern(accent, opacity) {
  return `
  <defs>
    <pattern id="grid" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M45 0 L90 45 L45 90 L0 45 Z" fill="none" stroke="${accent}" stroke-width="1.4" opacity="${opacity}"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>`;
}

function cover({ name, sub, accent = '#C9A227', deep = '#0A2A57', mid = '#123E7C', file }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${deep}"/>
      <stop offset="0.55" stop-color="${mid}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="32%" r="62%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="lattice" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.22"/>
      <circle cx="60" cy="60" r="4" fill="${accent}" opacity="0.28"/>
    </pattern>
  </defs>
  <rect width="1200" height="750" fill="url(#bg)"/>
  <rect width="1200" height="750" fill="url(#lattice)"/>
  <rect width="1200" height="750" fill="url(#glow)"/>
  <rect x="26" y="26" width="1148" height="698" rx="26" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.75"/>
  <rect x="42" y="42" width="1116" height="666" rx="18" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>
  <path d="M600 120 C720 120 810 210 810 330 L810 470 L390 470 L390 330 C390 210 480 120 600 120 Z" fill="none" stroke="${accent}" stroke-width="3" opacity="0.55"/>
  ${star(600, 300, 62, accent, 0.95)}
  <text x="600" y="560" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#FFFFFF" letter-spacing="2">${name}</text>
  <text x="600" y="620" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${accent}" letter-spacing="9">${sub}</text>
  <line x1="470" y1="655" x2="730" y2="655" stroke="${accent}" stroke-width="2" opacity="0.8"/>
</svg>`;
  fs.writeFileSync(path.join(OUT, 'brand', file), svg);
}

function logo({ initials, accent = '#C9A227', deep = '#0A2A57', mid = '#123E7C', file }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Business logo">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${mid}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
  </defs>
  <circle cx="200" cy="200" r="196" fill="url(#lg)"/>
  <circle cx="200" cy="200" r="176" fill="none" stroke="${accent}" stroke-width="4"/>
  <circle cx="200" cy="200" r="160" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.6"/>
  ${pattern(accent, 0.16)}
  ${star(200, 92, 20, accent, 0.9)}
  ${star(200, 308, 20, accent, 0.9)}
  <text x="200" y="238" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="120" fill="${accent}" letter-spacing="2">${initials}</text>
</svg>`;
  fs.writeFileSync(path.join(OUT, 'brand', file), svg);
}

const robe = (fill, stroke) => `
  <path d="M450 190 L352 250 L300 470 L368 486 L368 748 L532 748 L532 486 L600 470 L548 250 Z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M450 190 L450 330" stroke="${stroke}" stroke-width="4" opacity="0.7"/>
  <path d="M450 330 L400 748 M450 330 L500 748" stroke="${stroke}" stroke-width="3" opacity="0.35"/>
  <path d="M368 486 L300 470" stroke="${stroke}" stroke-width="4"/>`;

function product({ file, from, to, accent, garment = '#F4F6FA', garmentStroke = '#0A2A57' }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-label="Product image">
  <defs>
    <linearGradient id="pbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="pglow" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="pp" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="900" height="900" fill="url(#pbg)"/>
  <rect width="900" height="900" fill="url(#pp)"/>
  <rect width="900" height="900" fill="url(#pglow)"/>
  <rect x="34" y="34" width="832" height="832" rx="28" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.6"/>
  <ellipse cx="450" cy="790" rx="210" ry="34" fill="${accent}" opacity="0.18"/>
  ${robe(garment, garmentStroke)}
  ${star(450, 152, 34, accent, 0.9)}
</svg>`;
  fs.writeFileSync(path.join(OUT, 'products', file), svg);
}

cover({
  name: 'S &amp; S AMINAN JUNA',
  sub: 'DUNIYAR JALLABIYA',
  file: 'ss-cover.svg'
});
logo({ initials: 'S&amp;S', file: 'ss-logo.svg' });

const productSpecs = [
  ['jallabiya.svg', '#0A2A57', '#123E7C', '#C9A227'],
  ['kaftan.svg', '#123C63', '#0E2547', '#E2C275'],
  ['alkalami.svg', '#241E4E', '#0F3D7E', '#C9A227'],
  ['babban-riga.svg', '#0B3B45', '#0A2A57', '#D8B75A'],
  ['morocco-style.svg', '#3B1F3F', '#0F3D7E', '#E8CD7A']
];
productSpecs.forEach(([file, from, to, accent]) => product({ file, from, to, accent }));

cover({
  name: 'ABU AMMARA TECH HUB',
  sub: 'GADGETS &amp; REPAIRS',
  accent: '#5AD1B0',
  deep: '#062A2A',
  mid: '#0E4A46',
  file: 'techhub-cover.svg'
});
logo({ initials: 'AA', accent: '#5AD1B0', deep: '#062A2A', mid: '#0E4A46', file: 'techhub-logo.svg' });

[
  ['tech-pos.svg', '#06302E', '#0E4A46', '#5AD1B0'],
  ['tech-cctv.svg', '#0A2B33', '#0F3F4A', '#57C9E0'],
  ['tech-laptop.svg', '#1B2333', '#0E4A46', '#7FE0C6']
].forEach(([file, from, to, accent]) => product({ file, from, to, accent, garment: '#E8F6F3', garmentStroke: '#06302E' }));

console.log('Assets generated in', OUT);
