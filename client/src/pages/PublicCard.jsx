import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatPrice, waLink, digitsOnly, initial } from '../lib/format.js';
import { Icon } from '../lib/icons.jsx';

const PLATFORM_ICON = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  x: 'xSocial',
  twitter: 'xSocial',
  telegram: 'send',
  linkedin: 'link',
  website: 'globe',
  email: 'mail',
  phone: 'phone',
  whatsapp: 'whatsapp',
  other: 'link'
};

function track(slug, type, productId) {
  fetch('/api/public/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, type, productId }),
    keepalive: true
  }).catch(() => {});
}

function shade(hex, amount) {
  const clean = String(hex || '#0F3D7E').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.repeat(2) : clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function design(theme = {}) {
  const primary = theme.primary || '#0F3D7E';
  const secondary = theme.secondary || '#C9A227';
  const radius = theme.buttonStyle === 'pill' ? 999 : theme.buttonStyle === 'square' ? 6 : 14;
  const cardRadius = theme.cardStyle === 'flat' ? 10 : 20;
  const font =
    theme.fontStyle === 'classic'
      ? 'Georgia, "Times New Roman", serif'
      : theme.fontStyle === 'elegant'
        ? '"Palatino Linotype", "Book Antiqua", Palatino, serif'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const backgrounds = {
    royal: `radial-gradient(circle at 12% 0%, ${shade(primary, 46)} 0%, ${primary} 42%, ${shade(primary, -52)} 100%)`,
    gradient: `linear-gradient(160deg, ${primary} 0%, ${shade(primary, -46)} 100%)`,
    dark: `linear-gradient(170deg, #0a1120 0%, ${shade(primary, -60)} 100%)`,
    plain: '#eef2f9'
  };
  const cardBg =
    theme.cardStyle === 'glass'
      ? 'rgba(255,255,255,0.72)'
      : theme.cardStyle === 'outline'
        ? '#ffffff'
        : '#ffffff';
  const cardBorder = theme.cardStyle === 'outline' ? `1px solid ${shade(primary, 110)}` : '1px solid rgba(15,61,126,0.08)';
  const cardShadow = theme.cardStyle === 'elevated' ? '0 18px 40px rgba(8,24,48,0.12)' : 'none';
  return { primary, secondary, radius, cardRadius, font, background: backgrounds[theme.background] || backgrounds.royal, cardBg, cardBorder, cardShadow };
}

export default function PublicCard() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError('');
    api(`/public/card/${slug}`)
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((err) => {
        if (alive) setError(err.message || 'This business card is not available.');
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!data || seen.current) return;
    seen.current = true;
    const params = new URLSearchParams(window.location.search);
    track(slug, params.get('src') === 'qr' ? 'qr_scan' : 'card_view');
  }, [data, slug]);

  const business = data?.business;
  const products = data?.products || [];
  const socials = data?.socials || [];
  const look = useMemo(() => design(business?.theme), [business?.theme]);

  if (error) {
    return (
      <div className="pc-error">
        <span className="stat-ico gold" style={{ margin: '0 auto' }}>
          <Icon name="alert" size={20} />
        </span>
        <h1 style={{ fontSize: '1.35rem' }}>Card unavailable</h1>
        <p className="muted small">{error}</p>
        <Link className="btn btn-primary" to="/">
          Go to Digital vCard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <p>Loading business card…</p>
      </div>
    );
  }

  const waNumber = digitsOnly(business.whatsapp || business.phone);
  const defaultMessage = business.whatsappMessage || `Hello ${business.name}, I saw your digital vCard.`;
  const whatsappHref = waLink(waNumber, defaultMessage);
  const telHref = `tel:${(business.phone || business.whatsapp || '').replace(/\s/g, '')}`;
  const cardUrl = business.cardUrl || window.location.href;

  async function share() {
    track(slug, 'share');
    const payload = {
      title: business.name,
      text: business.tagline || business.description?.slice(0, 120) || business.name,
      url: cardUrl
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied('Link copied to clipboard');
      window.setTimeout(() => setCopied(''), 2500);
    } catch {
      setCopied('Copy this link: ' + cardUrl);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied('Card link copied');
      window.setTimeout(() => setCopied(''), 2500);
    } catch {
      setCopied(cardUrl);
    }
  }

  const actionStyle = {
    borderRadius: look.radius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 600,
    fontSize: '0.86rem',
    textDecoration: 'none',
    padding: '13px 14px',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: look.background,
        fontFamily: look.font,
        paddingBottom: 40
      }}
    >
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 0 24px' }}>
        <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
          {business.coverUrl ? (
            <img
              src={business.coverUrl}
              alt={`${business.name} cover`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(120deg, ${look.primary}, ${shade(look.primary, -50)})` }} />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(6,18,36,0.15) 0%, rgba(6,18,36,0.82) 100%)'
            }}
          />
          <button
            type="button"
            onClick={share}
            aria-label="Share card"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 40,
              height: 40,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(9,25,48,0.55)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <Icon name="share" size={17} />
          </button>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 14 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.68rem',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: look.secondary,
                fontWeight: 700
              }}
            >
              <Icon name="star" size={12} /> {business.category || 'Business'}
            </span>
          </div>
        </div>

        <div style={{ padding: '0 16px', marginTop: -46, position: 'relative' }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              background: '#fff',
              border: `3px solid ${look.secondary}`,
              boxShadow: '0 12px 26px rgba(6,18,36,0.22)',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              fontWeight: 800,
              color: look.primary,
              fontSize: '1.5rem'
            }}
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={`${business.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initial(business.name)
            )}
          </div>

          <h1 style={{ fontSize: '1.32rem', lineHeight: 1.25, margin: '14px 0 4px', color: '#fff' }}>
            {business.name}
          </h1>
          {business.tagline ? (
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>{business.tagline}</p>
          ) : null}
          <p style={{ margin: '6px 0 0', color: look.secondary, fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
            {business.deliveryInfo ? `• ${business.deliveryInfo}` : ''}
          </p>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => track(slug, 'whatsapp_click')}
              style={{ ...actionStyle, background: '#1f9d55', color: '#fff', gridColumn: '1 / -1' }}
            >
              <Icon name="whatsapp" size={18} /> Order on WhatsApp
            </a>
            <a
              href={telHref}
              onClick={() => track(slug, 'phone_click')}
              style={{ ...actionStyle, background: '#ffffff', color: look.primary, border: `1px solid ${shade(look.primary, 120)}` }}
            >
              <Icon name="phone" size={16} /> Call
            </a>
            <a
              href={`/api/public/card/${business.slug}/vcard`}
              style={{ ...actionStyle, background: look.secondary, color: '#20180a' }}
            >
              <Icon name="download" size={16} /> Save contact
            </a>
            <button
              type="button"
              onClick={share}
              style={{ ...actionStyle, background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Icon name="share" size={16} /> Share
            </button>
            <button
              type="button"
              onClick={() => setQrOpen((open) => !open)}
              style={{ ...actionStyle, background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Icon name="qr" size={16} /> QR code
            </button>
          </div>

          {copied ? (
            <p style={{ margin: '10px 0 0', color: '#ffe9a8', fontSize: '0.78rem', textAlign: 'center' }}>{copied}</p>
          ) : null}

          {qrOpen ? (
            <div style={{ marginTop: 14, background: '#fff', borderRadius: look.cardRadius, padding: 16, textAlign: 'center' }}>
              <img
                src={`/api/public/card/${business.slug}/qr.png?size=420`}
                alt="Business card QR code"
                style={{ width: 190, height: 190, display: 'block', margin: '0 auto' }}
              />
              <p className="small muted" style={{ margin: '8px 0 10px' }}>
                Scan to open this business card
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a className="btn btn-ghost btn-sm" href={`/api/public/card/${business.slug}/qr.png?size=1000`} download={`${business.slug}-qr.png`}>
                  <Icon name="download" size={14} /> Download
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink}>
                  <Icon name="copy" size={14} /> Copy link
                </button>
              </div>
            </div>
          ) : null}

          {business.description ? (
            <div
              style={{
                marginTop: 16,
                background: look.cardBg,
                border: look.cardBorder,
                boxShadow: look.cardShadow,
                borderRadius: look.cardRadius,
                padding: 16
              }}
            >
              <h2 style={{ fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: look.primary, margin: '0 0 8px' }}>
                About
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#33415a' }}>{business.description}</p>
            </div>
          ) : null}

          <div
            style={{
              marginTop: 14,
              background: look.cardBg,
              border: look.cardBorder,
              boxShadow: look.cardShadow,
              borderRadius: look.cardRadius,
              padding: 16,
              display: 'grid',
              gap: 12
            }}
          >
            {business.address ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: look.secondary, marginTop: 2 }}>
                  <Icon name="mapPin" size={16} />
                </span>
                <div>
                  <strong style={{ fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a879c', display: 'block' }}>
                    Address
                  </strong>
                  <span style={{ fontSize: '0.87rem', color: '#22314a' }}>{business.address}</span>
                </div>
              </div>
            ) : null}
            {business.openingHours ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: look.secondary, marginTop: 2 }}>
                  <Icon name="clock" size={16} />
                </span>
                <div>
                  <strong style={{ fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a879c', display: 'block' }}>
                    Opening hours
                  </strong>
                  <span style={{ fontSize: '0.87rem', color: '#22314a', whiteSpace: 'pre-line' }}>{business.openingHours}</span>
                </div>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: look.secondary, marginTop: 2 }}>
                <Icon name="phone" size={16} />
              </span>
              <div>
                <strong style={{ fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a879c', display: 'block' }}>
                  Contact
                </strong>
                <a href={telHref} onClick={() => track(slug, 'phone_click')} style={{ fontSize: '0.87rem', color: look.primary, textDecoration: 'none', display: 'block' }}>
                  {business.phone || business.whatsapp}
                </a>
                {business.email ? (
                  <a href={`mailto:${business.email}`} style={{ fontSize: '0.87rem', color: look.primary, textDecoration: 'none' }}>
                    {business.email}
                  </a>
                ) : null}
                {business.website ? (
                  <a href={business.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.87rem', color: look.primary, textDecoration: 'none', display: 'block' }}>
                    {business.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : null}
              </div>
            </div>
            {business.deliveryInfo ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: look.secondary, marginTop: 2 }}>
                  <Icon name="truck" size={16} />
                </span>
                <div>
                  <strong style={{ fontSize: '0.74rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a879c', display: 'block' }}>
                    Delivery
                  </strong>
                  <span style={{ fontSize: '0.87rem', color: '#22314a' }}>{business.deliveryInfo}</span>
                </div>
              </div>
            ) : null}
          </div>

          {socials.length ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: '1 1 40%',
                    minWidth: 130,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 12px',
                    borderRadius: look.radius,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <Icon name={PLATFORM_ICON[social.platform] || 'link'} size={16} />
                  {social.label || social.platform}
                </a>
              ))}
            </div>
          ) : null}

          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Products &amp; services</h2>
              <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)' }}>{products.length} items</span>
            </div>

            {products.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.86rem' }}>
                Products are being updated. Message us on WhatsApp for the latest catalogue.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {products.map((product) => {
                  const orderMessage =
                    product.orderMessage || `Hello, I want to order ${product.name} from ${business.name}.`;
                  return (
                    <article
                      key={product.id}
                      style={{
                        background: look.cardBg,
                        border: look.cardBorder,
                        boxShadow: look.cardShadow,
                        borderRadius: look.cardRadius,
                        overflow: 'hidden'
                      }}
                      onMouseEnter={() => {}}
                    >
                      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                        <div style={{ width: 116, flex: '0 0 116px', background: '#f2f5fb', position: 'relative' }}>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 128 }}
                            />
                          ) : (
                            <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: 128, color: '#9aa8bd' }}>
                              <Icon name="image" size={22} />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#14223a' }}>{product.name}</h3>
                            {product.badge ? (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  letterSpacing: '0.07em',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  color: '#5b4300',
                                  background: '#f7e7b5',
                                  borderRadius: 999,
                                  padding: '2px 7px'
                                }}
                              >
                                {product.badge}
                              </span>
                            ) : null}
                          </div>
                          <p style={{ margin: '3px 0 0', fontWeight: 700, color: look.primary, fontSize: '0.95rem' }}>
                            {formatPrice(product.price, product.currency || business.currency)}
                          </p>
                          {product.description ? (
                            <p style={{ margin: '6px 0 0', fontSize: '0.79rem', lineHeight: 1.5, color: '#5b6b85' }}>
                              {product.description}
                            </p>
                          ) : null}
                          <a
                            href={waLink(waNumber, orderMessage)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => track(slug, 'product_view', product.id)}
                            style={{
                              marginTop: 10,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '9px 12px',
                              borderRadius: look.radius,
                              background: '#1f9d55',
                              color: '#fff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <Icon name="whatsapp" size={14} /> Order on WhatsApp
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
              <Icon name="shield" size={13} /> Powered by Digital vCard Business Manager
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={copyLink} style={{ ...actionStyle, padding: '9px 12px', background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', fontSize: '0.76rem' }}>
                <Icon name="copy" size={14} /> Copy link
              </button>
              <a href={`/api/public/card/${business.slug}/vcard`} style={{ ...actionStyle, padding: '9px 12px', background: look.secondary, color: '#20180a', fontSize: '0.76rem' }}>
                <Icon name="download" size={14} /> vCard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
