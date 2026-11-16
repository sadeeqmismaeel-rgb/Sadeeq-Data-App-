import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Card, CardHead, Spinner, useToast } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function QRCodePage() {
  const { success, error } = useToast();
  const [codes, setCodes] = useState({ card: null, whatsapp: null });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('card');

  useEffect(() => {
    let alive = true;
    Promise.all([api('/owner/qr?type=card'), api('/owner/qr?type=whatsapp')])
      .then(([card, whatsapp]) => {
        if (!alive) return;
        setCodes({ card, whatsapp });
      })
      .catch((err) => alive && error(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [error]);

  const active = codes[tab];

  async function copyLink() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.target);
      success(tab === 'card' ? 'Public card link copied' : 'WhatsApp link copied');
    } catch {
      error('Could not copy the link automatically.');
    }
  }

  async function shareCode() {
    if (!active) return;
    const payload = {
      title: tab === 'card' ? 'My digital business card' : 'Chat with me on WhatsApp',
      text: tab === 'card' ? 'Scan or tap to view my digital business card.' : 'Scan or tap to chat with me on WhatsApp.',
      url: active.target
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
  }

  if (loading) return <Spinner text="Generating QR codes…" />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>QR code</h2>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Print it on your flyer, shop banner or WhatsApp status. Scans are tracked in analytics.
        </p>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button type="button" className={`btn btn-sm ${tab === 'card' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('card')}>
          <Icon name="card" size={15} /> Card QR
        </button>
        <button type="button" className={`btn btn-sm ${tab === 'whatsapp' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('whatsapp')}>
          <Icon name="whatsapp" size={15} /> WhatsApp QR
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card style={{ textAlign: 'center' }}>
          <CardHead
            title={tab === 'card' ? 'Digital card QR' : 'WhatsApp QR'}
            sub={tab === 'card' ? 'Opens your public vCard and records a QR scan' : 'Opens a WhatsApp chat with your default message'}
          />
          {active ? (
            <>
              <div style={{ background: '#fff', borderRadius: 18, padding: 12, display: 'inline-block', border: '1px solid var(--line)' }}>
                <img src={active.dataUrl} alt={tab === 'card' ? 'Digital card QR code' : 'WhatsApp QR code'} style={{ width: 220, height: 220, display: 'block' }} />
              </div>
              <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                <a className="btn btn-primary btn-sm" href={active.dataUrl} download={`${tab === 'card' ? 'digital-card' : 'whatsapp'}-qr.png`}>
                  <Icon name="download" size={15} /> Download PNG
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={shareCode}>
                  <Icon name="share" size={15} /> Share
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink}>
                  <Icon name="copy" size={15} /> Copy link
                </button>
              </div>
            </>
          ) : (
            <p className="muted small">QR code unavailable right now.</p>
          )}
        </Card>

        <Card>
          <CardHead title="Where it points" sub="Copy this link anywhere" />
          <div className="stack" style={{ gap: 10 }}>
            <div>
              <span className="tiny muted">Public card</span>
              <p className="small" style={{ margin: '2px 0 0', wordBreak: 'break-all' }}>{codes.card?.cardUrl || '—'}</p>
            </div>
            <div>
              <span className="tiny muted">Card QR target</span>
              <p className="small" style={{ margin: '2px 0 0', wordBreak: 'break-all' }}>{codes.card?.target || '—'}</p>
            </div>
            <div>
              <span className="tiny muted">WhatsApp QR target</span>
              <p className="small" style={{ margin: '2px 0 0', wordBreak: 'break-all' }}>{codes.whatsapp?.target || '—'}</p>
            </div>
          </div>
          <div className="notice" style={{ marginTop: 14 }}>
            <Icon name="sparkle" size={16} />
            <span className="small">
              Tip: download the QR at full size and place it on your shop flyer. Every scan from the card QR is counted separately
              from normal link visits.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
