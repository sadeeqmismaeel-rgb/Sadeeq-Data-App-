import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

const features = [
  {
    icon: 'card',
    title: 'Public digital vCard',
    text: 'A fast, mobile-first business page with WhatsApp ordering, click-to-call, save contact and QR sharing.'
  },
  {
    icon: 'box',
    title: 'Product catalogue',
    text: 'Add products with photos, prices and descriptions. Every product gets its own WhatsApp order button.'
  },
  {
    icon: 'qr',
    title: 'QR codes',
    text: 'Download or share a card QR code and a WhatsApp QR code straight from the dashboard.'
  },
  {
    icon: 'chart',
    title: 'Live analytics',
    text: 'Track card views, WhatsApp clicks, phone clicks, QR scans, product views and shares.'
  },
  {
    icon: 'palette',
    title: 'Professional themes',
    text: 'Premium blue and gold presets, custom colours, fonts, button and card styles.'
  },
  {
    icon: 'users',
    title: 'Multi-business ready',
    text: 'Every business owner has a private workspace with its own products, branding and analytics.'
  }
];

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="row" style={{ gap: 10 }}>
          <div className="brand-mark">DV</div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Digital vCard</strong>
            <span className="tiny muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Business Manager
            </span>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">
            Owner login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Create card
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div>
          <span className="badge gold">
            <Icon name="sparkle" size={12} /> Multi-business platform
          </span>
          <h1 style={{ marginTop: 14 }}>
            Professional digital business cards that <span>sell for you</span>.
          </h1>
          <p className="lead">
            Create a beautiful vCard for your shop, list your products, take orders on WhatsApp and
            follow every view, click and scan — all from your phone.
          </p>
          <div className="row" style={{ marginTop: 22, gap: 10 }}>
            <Link to="/register" className="btn btn-primary">
              <Icon name="plus" size={16} /> Create your free card
            </Link>
            <a className="btn btn-ghost" href="/card/ss-aminan-juna">
              <Icon name="eye" size={16} /> See a live card
            </a>
          </div>
          <div className="row" style={{ marginTop: 22, gap: 16 }}>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>5</strong>
              <p className="tiny muted">Demo products ready</p>
            </div>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>6</strong>
              <p className="tiny muted">Tracked events</p>
            </div>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>0</strong>
              <p className="tiny muted">Apps to install</p>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div
            className="hc-cover"
            style={{ backgroundImage: "url('/assets/brand/ss-cover.svg')" }}
          />
          <div className="hc-logo" style={{ backgroundImage: "url('/assets/brand/ss-logo.svg')" }} />
          <h3>S &amp; S AMINAN JUNA</h3>
          <p className="hc-sub">DUNIYAR JALLABIYA · Fashion / Jallabiya</p>
          <div className="hc-actions">
            <span>WhatsApp</span>
            <span>Call</span>
            <span>Save</span>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: '#c9d8ee'
              }}
            >
              <span>Jallabiya · Kaftan · Babban Riga</span>
              <span style={{ color: '#ffe9a8' }}>₦</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ fontSize: '0.72rem', color: '#c9d8ee' }}>
              <Icon name="truck" size={13} /> Nationwide delivery
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article className="feature" key={feature.title}>
            <span className="stat-ico gold">
              <Icon name={feature.icon} size={18} />
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        Digital vCard Business Manager · Built for shops, tailors, boutiques and service businesses.
      </footer>
    </div>
  );
}
