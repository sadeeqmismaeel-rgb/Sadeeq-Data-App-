import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Card, CardHead, Field, Input, Select, Spinner, useToast, ErrorNote, Toggle } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';

const PRESETS = [
  { key: 'royal-gold', name: 'Premium blue + gold', primary: '#0F3D7E', secondary: '#C9A227', background: 'royal', cardStyle: 'elevated' },
  { key: 'emerald', name: 'Emerald luxury', primary: '#0B6B4F', secondary: '#D4AF37', background: 'gradient', cardStyle: 'elevated' },
  { key: 'midnight', name: 'Midnight blue', primary: '#122A4D', secondary: '#7FB3FF', background: 'dark', cardStyle: 'glass' },
  { key: 'rose', name: 'Rose elegance', primary: '#9B2C4E', secondary: '#E8B4B8', background: 'plain', cardStyle: 'flat' },
  { key: 'sunset', name: 'Sunset amber', primary: '#B45309', secondary: '#F59E0B', background: 'gradient', cardStyle: 'elevated' },
  { key: 'slate', name: 'Modern slate', primary: '#334155', secondary: '#94A3B8', background: 'plain', cardStyle: 'outline' }
];

const DEFAULT_THEME = {
  preset: 'royal-gold',
  primary: '#0F3D7E',
  secondary: '#C9A227',
  background: 'royal',
  buttonStyle: 'rounded',
  cardStyle: 'elevated',
  fontStyle: 'modern'
};

export default function Appearance() {
  const { business, refresh } = useAuth();
  const { success } = useToast();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    let alive = true;
    api('/owner/business')
      .then((data) => {
        if (!alive) return;
        setTheme({ ...DEFAULT_THEME, ...(data.business?.theme || {}) });
        setBgImage(data.business?.coverUrl || '');
      })
      .catch((err) => alive && setNote(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function applyPreset(preset) {
    setTheme((prev) => ({
      ...prev,
      preset: preset.key,
      primary: preset.primary,
      secondary: preset.secondary,
      background: preset.background,
      cardStyle: preset.cardStyle
    }));
  }

  const set = (key) => (event) => setTheme((prev) => ({ ...prev, [key]: event.target.value }));

  async function save() {
    setSaving(true);
    setNote('');
    try {
      await api('/owner/appearance', { method: 'PUT', body: theme });
      await refresh();
      success('Appearance saved — your public card is updated');
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner text="Loading appearance…" />;

  const previewBg =
    theme.background === 'dark'
      ? `linear-gradient(160deg, #0a1120, ${theme.primary})`
      : theme.background === 'gradient'
        ? `linear-gradient(160deg, ${theme.primary}, #081a33)`
        : theme.background === 'plain'
          ? '#eef2f9'
          : `radial-gradient(circle at 15% 0%, ${theme.primary}, #071a34)`;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Appearance</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Colours, fonts and card style for your public vCard.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href={`/card/${business?.slug}`} target="_blank" rel="noreferrer">
            <Icon name="external" size={15} /> Preview
          </a>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : <Icon name="check" size={15} />}
            {saving ? 'Saving…' : 'Save appearance'}
          </button>
        </div>
      </div>

      <ErrorNote>{note}</ErrorNote>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="stack" style={{ gap: 16 }}>
          <Card>
            <CardHead title="Preset themes" sub="Start from a professional look" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    textAlign: 'left',
                    border: theme.preset === preset.key ? '2px solid var(--blue-700)' : '1px solid var(--line)',
                    background: '#fff',
                    borderRadius: 14,
                    padding: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: preset.primary }} />
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: preset.secondary }} />
                  </div>
                  <strong style={{ fontSize: '0.78rem', display: 'block', lineHeight: 1.3 }}>{preset.name}</strong>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Customise" sub="Fine-tune your brand" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <Field label="Primary colour">
                <input className="input" type="color" value={theme.primary} onChange={set('primary')} style={{ height: 42, padding: 4 }} />
              </Field>
              <Field label="Secondary colour">
                <input className="input" type="color" value={theme.secondary} onChange={set('secondary')} style={{ height: 42, padding: 4 }} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <Field label="Background">
                <Select value={theme.background} onChange={set('background')}>
                  <option value="royal">Royal blue</option>
                  <option value="gradient">Gradient</option>
                  <option value="dark">Dark</option>
                  <option value="plain">Light</option>
                </Select>
              </Field>
              <Field label="Button style">
                <Select value={theme.buttonStyle} onChange={set('buttonStyle')}>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </Select>
              </Field>
              <Field label="Card style">
                <Select value={theme.cardStyle} onChange={set('cardStyle')}>
                  <option value="elevated">Elevated</option>
                  <option value="flat">Flat</option>
                  <option value="outline">Outline</option>
                  <option value="glass">Glass</option>
                </Select>
              </Field>
              <Field label="Font style">
                <Select value={theme.fontStyle} onChange={set('fontStyle')}>
                  <option value="modern">Modern sans</option>
                  <option value="classic">Classic serif</option>
                  <option value="elegant">Elegant serif</option>
                </Select>
              </Field>
            </div>
            <Field label="Cover image" hint="Upload a new cover from the Business profile page. It is used as your card banner.">
              <Input value={bgImage ? 'Cover image set' : 'No cover image'} readOnly />
            </Field>
          </Card>
        </div>

        <Card>
          <CardHead title="Live preview" sub="Approximate mobile view" />
          <div
            style={{
              borderRadius: 26,
              overflow: 'hidden',
              background: previewBg,
              padding: '0 0 18px',
              boxShadow: '0 18px 40px rgba(8,24,48,0.18)',
              maxWidth: 320,
              margin: '0 auto'
            }}
          >
            <div style={{ height: 92, background: `linear-gradient(120deg, ${theme.primary}, #07182f)`, position: 'relative' }}>
              <span style={{ position: 'absolute', right: 12, top: 12, color: theme.secondary, fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                PREVIEW
              </span>
            </div>
            <div style={{ padding: '0 14px' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: '#fff',
                  border: `3px solid ${theme.secondary}`,
                  marginTop: -30,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  color: theme.primary
                }}
              >
                {business?.name?.charAt(0) || 'S'}
              </div>
              <strong style={{ display: 'block', color: '#fff', marginTop: 10, fontSize: '0.92rem', lineHeight: 1.3 }}>
                {business?.name || 'Your business'}
              </strong>
              <span style={{ color: theme.secondary, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {business?.category || 'Business category'}
              </span>
              <div
                style={{
                  marginTop: 12,
                  borderRadius: theme.buttonStyle === 'pill' ? 999 : theme.buttonStyle === 'square' ? 6 : 14,
                  background: '#1f9d55',
                  color: '#fff',
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                Order on WhatsApp
              </div>
              <div
                style={{
                  marginTop: 8,
                  background: theme.cardStyle === 'glass' ? 'rgba(255,255,255,0.75)' : '#fff',
                  border: theme.cardStyle === 'outline' ? `1px solid ${theme.primary}` : 'none',
                  borderRadius: theme.cardStyle === 'flat' ? 10 : 18,
                  padding: 10,
                  boxShadow: theme.cardStyle === 'elevated' ? '0 10px 22px rgba(8,24,48,0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2f9' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 7, width: '70%', background: '#dbe3ef', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ height: 7, width: '40%', background: theme.primary, borderRadius: 4, opacity: 0.7 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 12 }}>
            Saved themes apply instantly to your public card.
          </p>
        </Card>
      </div>

      <Card>
        <CardHead title="Visibility" sub="Control how your card is presented" />
        <div className="stack" style={{ gap: 10 }}>
          <Toggle checked readOnly onChange={() => {}} label="Premium blue + gold is the platform default" />
          <p className="tiny muted" style={{ margin: 0 }}>
            Tip: keep the gold accent on a deep blue background for the most premium, flyer-matching look.
          </p>
        </div>
      </Card>
    </div>
  );
}
