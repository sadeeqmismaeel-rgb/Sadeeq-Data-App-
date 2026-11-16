import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { socialIcons } from '../../lib/icons.jsx';
import { Card, CardHead, Empty, Field, Input, Modal, Select, Spinner, useToast, ErrorNote, Badge } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'whatsapp', label: 'WhatsApp channel' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' }
];

const BLANK = { platform: 'instagram', url: '', label: '' };

export default function Social() {
  const { success, error } = useToast();
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  function load() {
    return api('/owner/socials')
      .then((data) => setSocials(data.socials || []))
      .catch((err) => error(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setEditing(null);
    setForm(BLANK);
    setNote('');
    setOpen(true);
  }

  function startEdit(social) {
    setEditing(social);
    setForm({ platform: social.platform, url: social.url, label: social.label || '' });
    setNote('');
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      if (editing) await api(`/owner/socials/${editing.id}`, { method: 'PUT', body: form });
      else await api('/owner/socials', { method: 'POST', body: form });
      success(editing ? 'Social link updated' : 'Social link added');
      setOpen(false);
      await load();
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(social) {
    try {
      await api(`/owner/socials/${social.id}`, { method: 'DELETE' });
      success('Social link removed');
      await load();
    } catch (err) {
      error(err.message);
    }
  }

  if (loading) return <Spinner text="Loading social links…" />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Social media</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            These buttons appear under the contact section of your public card.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={startAdd}>
          <Icon name="plus" size={16} /> Add social link
        </button>
      </div>

      {socials.length === 0 ? (
        <Card>
          <Empty
            icon="link"
            title="No social links yet"
            text="Add Instagram, Facebook, TikTok or your website so customers can follow you."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
                <Icon name="plus" size={15} /> Add social link
              </button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {socials.map((social) => (
            <Card key={social.id}>
              <div className="row" style={{ gap: 10 }}>
                <span className="stat-ico gold">
                  <Icon name={socialIcons[social.platform] || 'link'} size={16} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>{social.label || social.platform}</strong>
                  <span className="tiny muted" style={{ wordBreak: 'break-all' }}>{social.url}</span>
                </div>
                <Badge tone="grey">{social.platform}</Badge>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(social)}>
                  <Icon name="edit" size={14} /> Edit
                </button>
                <a className="btn btn-ghost btn-sm" href={social.url} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} /> Open
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(social)}>
                  <Icon name="trash" size={14} /> Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit social link' : 'Add social link'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="social-form" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
              {saving ? 'Saving…' : 'Save link'}
            </button>
          </>
        }
      >
        <form id="social-form" onSubmit={save} className="stack" style={{ gap: 12 }}>
          <ErrorNote>{note}</ErrorNote>
          <Field label="Platform">
            <Select value={form.platform} onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}>
              {PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link" hint="Must start with https://">
            <Input
              required
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://instagram.com/yourbusiness"
            />
          </Field>
          <Field label="Button label" hint="Optional, e.g. @ssaminanjuna">
            <Input value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} maxLength={60} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
