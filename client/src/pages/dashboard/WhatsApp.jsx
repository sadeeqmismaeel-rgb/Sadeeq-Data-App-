import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Card, CardHead, Field, Input, Spinner, Textarea, useToast, ErrorNote } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';
import { digitsOnly, waLink } from '../../lib/format.js';

const SAMPLE = 'Assalamu Alaikum, na ga bayanan shagonku a Digital vCard. Ina son karin bayani.';

export default function WhatsApp() {
  const { success, error } = useToast();
  const [business, setBusiness] = useState(null);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    api('/owner/business')
      .then((data) => {
        if (!alive) return;
        setBusiness(data.business);
        setNumber(data.business?.whatsapp || '');
        setMessage(data.whatsappMessage || '');
      })
      .catch((err) => alive && setNote(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      await api('/owner/whatsapp', { method: 'PUT', body: { whatsapp: number, message } });
      success('WhatsApp settings saved');
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner text="Loading WhatsApp settings…" />;

  const digits = digitsOnly(number);
  const previewMessage = message || `Hello ${business?.name || 'my business'}, I saw your digital vCard.`;
  const link = waLink(digits, previewMessage);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>WhatsApp</h2>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Customers reach you on WhatsApp with one tap. Set the number and the greeting they start with.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card>
          <CardHead title="Connection" sub="Used by every WhatsApp button on your card" />
          <form onSubmit={save} className="stack" style={{ gap: 12 }}>
            <ErrorNote>{note}</ErrorNote>
            <Field label="WhatsApp number" hint="Include country code, e.g. +234 814 650 8373">
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+2348146508373" required />
            </Field>
            <Field label="Default message" hint="Sent automatically when a customer taps your WhatsApp button.">
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} placeholder={SAMPLE} />
            </Field>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMessage(SAMPLE)}>
                <Icon name="sparkle" size={14} /> Use Hausa sample
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMessage('')}>
                Clear message
              </button>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <a className="btn btn-ghost" href={link} target="_blank" rel="noreferrer">
                <Icon name="external" size={15} /> Test link
              </a>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
                {saving ? 'Saving…' : 'Save WhatsApp settings'}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHead title="Message preview" sub="Exactly what the customer will send" />
          <div
            style={{
              background: '#e6ddd4',
              borderRadius: 16,
              padding: 14,
              minHeight: 190,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            <div
              style={{
                background: '#dcf8c6',
                borderRadius: '12px 12px 12px 3px',
                padding: '10px 12px',
                fontSize: '0.84rem',
                color: '#1c2b1c',
                lineHeight: 1.5,
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                maxWidth: '92%',
                whiteSpace: 'pre-wrap'
              }}
            >
              {previewMessage}
              <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#5f7a5f', marginTop: 4 }}>
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
          </div>
          <div className="stack" style={{ gap: 6, marginTop: 12 }}>
            <span className="tiny muted">Destination</span>
            <strong className="small">wa.me/{digits || '—'}</strong>
            <span className="tiny muted" style={{ wordBreak: 'break-all' }}>
              {link}
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Where WhatsApp is used" sub="All buttons open wa.me directly" />
        <div className="stack" style={{ gap: 10 }}>
          {[
            'Main "Order on WhatsApp" button on your public card',
            'Every product "Order on WhatsApp" button with its own order message',
            'The separate WhatsApp QR code you can print or share',
            'The WhatsApp link shown inside your saved contact file'
          ].map((item) => (
            <div key={item} className="row" style={{ gap: 8 }}>
              <span className="stat-ico green" style={{ width: 28, height: 28 }}>
                <Icon name="check" size={13} />
              </span>
              <span className="small">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
