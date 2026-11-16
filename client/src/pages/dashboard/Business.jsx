import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Card, CardHead, Field, ImagePicker, Input, Spinner, Textarea, useToast, ErrorNote } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';

const EMPTY = {
  name: '',
  tagline: '',
  description: '',
  category: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  openingHours: '',
  deliveryInfo: '',
  website: '',
  slug: '',
  logoUrl: '',
  coverUrl: ''
};

export default function Business() {
  const { refresh } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    api('/owner/business')
      .then((data) => {
        if (!alive) return;
        const b = data.business || {};
        setForm({
          name: b.name || '',
          tagline: b.tagline || '',
          description: b.description || '',
          category: b.category || '',
          phone: b.phone || '',
          whatsapp: b.whatsapp || '',
          email: b.email || '',
          address: b.address || '',
          openingHours: b.openingHours || '',
          deliveryInfo: b.deliveryInfo || '',
          website: b.website || '',
          slug: b.slug || '',
          logoUrl: b.logoUrl || '',
          coverUrl: b.coverUrl || ''
        });
      })
      .catch((err) => alive && setNote(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      await api('/owner/business', { method: 'PUT', body: form });
      await refresh();
      success('Business profile updated — your public card is live');
    } catch (err) {
      setNote(err.message);
      error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner text="Loading business profile…" />;

  return (
    <form onSubmit={save} className="stack" style={{ gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Business profile</h2>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Everything here appears on your public digital card immediately after saving.
        </p>
      </div>

      <ErrorNote>{note}</ErrorNote>

      <Card>
        <CardHead title="Identity" sub="Logo, cover image and public link" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <ImagePicker
            label="Business logo"
            hint="Square image works best (PNG/JPG)."
            value={form.logoUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, logoUrl: value }))}
          />
          <ImagePicker
            label="Cover image"
            hint="Wide banner, at least 1200 × 600px."
            variant="cover"
            maxSize={1600}
            value={form.coverUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, coverUrl: value }))}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14 }}>
          <Field label="Business name">
            <Input required value={form.name} onChange={set('name')} maxLength={120} />
          </Field>
          <Field label="Public link" hint={`Your card: /card/${form.slug}`}>
            <Input value={form.slug} onChange={set('slug')} maxLength={60} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={set('tagline')} maxLength={140} placeholder="Premium Jallabiya & Islamic Fashion" />
          </Field>
          <Field label="Business category">
            <Input value={form.category} onChange={set('category')} maxLength={80} placeholder="Fashion / Jallabiya" />
          </Field>
        </div>
        <Field label="Description" hint="Tell customers what you sell and why they should choose you.">
          <Textarea rows={5} value={form.description} onChange={set('description')} maxLength={2000} />
        </Field>
      </Card>

      <Card>
        <CardHead title="Contact & location" sub="Used by the call, WhatsApp and save-contact buttons" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Phone number">
            <Input value={form.phone} onChange={set('phone')} placeholder="+234 814 650 8373" />
          </Field>
          <Field label="WhatsApp number">
            <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+2348146508373" />
          </Field>
          <Field label="Email address">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="orders@business.com" />
          </Field>
          <Field label="Website" hint="Optional, must start with https://">
            <Input value={form.website} onChange={set('website')} placeholder="https://business.com" />
          </Field>
        </div>
        <Field label="Address">
          <Input value={form.address} onChange={set('address')} maxLength={240} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Field label="Opening hours" hint="One line per row, e.g. Mon – Sat: 9:00 AM – 7:00 PM">
            <Textarea rows={3} value={form.openingHours} onChange={set('openingHours')} maxLength={240} />
          </Field>
          <Field label="Delivery information">
            <Textarea rows={3} value={form.deliveryInfo} onChange={set('deliveryInfo')} maxLength={240} placeholder="Nationwide Delivery" />
          </Field>
        </div>
      </Card>

      <div className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
        <a className="btn btn-ghost" href={`/card/${form.slug}`} target="_blank" rel="noreferrer">
          <Icon name="external" size={15} /> Preview card
        </a>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
