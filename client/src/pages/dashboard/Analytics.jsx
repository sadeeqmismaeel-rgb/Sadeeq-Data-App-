import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { BarChart, Breakdown } from '../../components/charts.jsx';
import { Card, CardHead, Spinner, StatCard, useToast } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';
import { timeAgo } from '../../lib/format.js';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' }
];

const EVENT_LABEL = {
  card_view: 'Card views',
  whatsapp_click: 'WhatsApp clicks',
  phone_click: 'Phone clicks',
  qr_scan: 'QR scans',
  product_view: 'Product views',
  share: 'Shares'
};

export default function Analytics() {
  const { error } = useToast();
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api(`/owner/analytics?range=${range}`)
      .then((payload) => alive && setData(payload))
      .catch((err) => alive && error(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range, error]);

  const totals = data?.totals || {};
  const series = (data?.series || []).map((point) => ({ date: point.date, count: point.total }));
  const breakdown = Object.keys(EVENT_LABEL)
    .map((key) => ({ key, label: EVENT_LABEL[key], count: Number(totals[key] || 0) }))
    .filter((item) => item.count > 0);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Analytics</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {Number(totals.events || 0).toLocaleString()} events in this period · {Number(data?.allTimeEvents || 0).toLocaleString()} all time
          </p>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`btn btn-sm ${range === item.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading analytics…" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <StatCard label="Card views" value={Number(totals.card_view || 0).toLocaleString()} icon="eye" />
            <StatCard label="WhatsApp clicks" value={Number(totals.whatsapp_click || 0).toLocaleString()} icon="whatsapp" tone="green" />
            <StatCard label="Phone clicks" value={Number(totals.phone_click || 0).toLocaleString()} icon="phone" />
            <StatCard label="QR scans" value={Number(totals.qr_scan || 0).toLocaleString()} icon="qr" tone="gold" />
            <StatCard label="Product views" value={Number(totals.product_view || 0).toLocaleString()} icon="box" />
            <StatCard label="Shares" value={Number(totals.share || 0).toLocaleString()} icon="share" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <Card>
              <CardHead title="Traffic over time" sub={RANGES.find((r) => r.key === range)?.label} />
              <BarChart series={series} />
            </Card>
            <Card>
              <CardHead title="What visitors do" sub="All tracked interactions" />
              {breakdown.length ? (
                <Breakdown items={breakdown} />
              ) : (
                <p className="muted small">No interactions recorded yet for this period.</p>
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <Card>
              <CardHead title="Most viewed products" sub="Ranked by order-button taps" />
              {(data?.productViews || []).length ? (
                <div className="stack" style={{ gap: 10 }}>
                  {data.productViews.slice(0, 6).map((item) => (
                    <div key={item.id || item.name} className="row-between" style={{ gap: 8 }}>
                      <span className="small">{item.name}</span>
                      <span className="badge gold">{Number(item.views || 0)} views</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted small">No product interactions yet.</p>
              )}
            </Card>

            <Card>
              <CardHead title="Recent activity" sub="Newest first" />
              {(data?.recent || []).length ? (
                <div className="stack" style={{ gap: 8 }}>
                  {data.recent.slice(0, 8).map((event, index) => (
                    <div key={index} className="row-between" style={{ gap: 8 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="stat-ico" style={{ width: 28, height: 28 }}>
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
                                      : event.type === 'product_view'
                                        ? 'box'
                                        : 'eye'
                            }
                            size={13}
                          />
                        </span>
                        <span className="small">{EVENT_LABEL[event.type] || event.type}</span>
                      </div>
                      <span className="tiny muted">{timeAgo(event.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted small">No activity yet.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
