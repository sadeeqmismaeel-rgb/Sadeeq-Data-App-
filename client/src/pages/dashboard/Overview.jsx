import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { BarChart } from '../../components/charts.jsx';
import { Card, CardHead, StatCard, Spinner, useToast } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';
import { timeAgo } from '../../lib/format.js';

const EVENT_LABEL = {
  card_view: 'Card view',
  whatsapp_click: 'WhatsApp click',
  phone_click: 'Phone click',
  qr_scan: 'QR scan',
  product_view: 'Product view',
  share: 'Profile share'
};

export default function Overview() {
  const { business, user } = useAuth();
  const { success, error } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api('/owner/analytics?range=7d'), api('/owner/products')])
      .then(([stats, list]) => {
        if (!alive) return;
        setAnalytics(stats);
        setProducts(list.products || []);
      })
      .catch((err) => alive && error(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [error]);

  if (loading) return <Spinner text="Loading dashboard…" />;

  const totals = analytics?.totals || {};
  const cardUrl = business ? `${window.location.origin}/card/${business.slug}` : '';
  const series = (analytics?.series || []).map((point) => ({ date: point.date, count: point.total }));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      success('Public card link copied');
    } catch {
      error('Could not copy. Link: ' + cardUrl);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Assalamu Alaikum, {user?.name?.split(' ')[0]}</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Here is how {business?.name} is performing in the last 7 days.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink}>
            <Icon name="copy" size={15} /> Copy card link
          </button>
          <a className="btn btn-primary btn-sm" href={`/card/${business?.slug}`} target="_blank" rel="noreferrer">
            <Icon name="external" size={15} /> Open public card
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard label="Total card views" value={Number(totals.card_view || 0).toLocaleString()} icon="eye" />
        <StatCard label="WhatsApp clicks" value={Number(totals.whatsapp_click || 0).toLocaleString()} icon="whatsapp" tone="green" />
        <StatCard label="QR scans" value={Number(totals.qr_scan || 0).toLocaleString()} icon="qr" tone="gold" />
        <StatCard label="Products" value={products.length} icon="box" hint={`${products.filter((p) => p.active).length} active`} />
        <StatCard label="Profile shares" value={Number(totals.share || 0).toLocaleString()} icon="share" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card>
          <CardHead
            title="Activity — last 7 days"
            sub={`${Number(totals.events || 0).toLocaleString()} tracked events`}
            right={
              <Link className="btn btn-ghost btn-sm" to="/dashboard/analytics">
                Details <Icon name="chevronRight" size={14} />
              </Link>
            }
          />
          <BarChart series={series} />
        </Card>

        <Card>
          <CardHead title="Recent activity" sub="Latest visitor actions" />
          {(analytics?.recent || []).length === 0 ? (
            <p className="muted small">No activity yet. Share your card link or QR code to start collecting data.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {analytics.recent.slice(0, 6).map((event, index) => (
                <div key={index} className="row-between" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="stat-ico" style={{ width: 30, height: 30 }}>
                      <Icon
                        name={
                          event.type === 'whatsapp_click'
                            ? 'whatsapp'
                            : event.type === 'phone_click'
                              ? 'phone'
                              : event.type === 'qr_scan'
                                ? 'qr'
                                : event.type === 'share'
                                  ? 'share'
                                  : 'eye'
                        }
                        size={14}
                      />
                    </span>
                    <span className="small">{EVENT_LABEL[event.type] || event.type}</span>
                  </div>
                  <span className="tiny muted">{timeAgo(event.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { to: '/dashboard/products', icon: 'box', title: 'Add a product', text: 'Grow your catalogue with photos and prices.' },
          { to: '/dashboard/qr', icon: 'qr', title: 'Share your QR', text: 'Download the card or WhatsApp QR code.' },
          { to: '/dashboard/appearance', icon: 'palette', title: 'Match your brand', text: 'Blue + gold is active — try other presets.' },
          { to: '/dashboard/whatsapp', icon: 'whatsapp', title: 'WhatsApp message', text: 'Set the greeting customers send you.' }
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <span className="stat-ico gold">
              <Icon name={item.icon} size={17} />
            </span>
            <strong style={{ display: 'block', marginTop: 10, fontSize: '0.92rem' }}>{item.title}</strong>
            <span className="tiny muted">{item.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
