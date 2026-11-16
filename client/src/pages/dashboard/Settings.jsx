import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Card, CardHead, Field, Input, Spinner, useToast, ErrorNote } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function Settings() {
  const { user, business, logout, refresh } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', currentPassword: '', newPassword: '' });
      setLoading(false);
    }
  }, [user]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      await api('/owner/account', { method: 'PUT', body: form });
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      await refresh();
      success('Account updated');
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/card/${business?.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      success('Public card link copied');
    } catch {
      error('Could not copy the link.');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (loading) return <Spinner text="Loading settings…" />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
        <p className="muted small" style={{ margin: '4px 0 0' }}>
          Your login details and public card address.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card>
          <CardHead title="Account" sub="Owner login details" />
          <form onSubmit={save} className="stack" style={{ gap: 12 }}>
            <ErrorNote>{note}</ErrorNote>
            <Field label="Full name">
              <Input required value={form.name} onChange={set('name')} maxLength={80} />
            </Field>
            <Field label="Email address">
              <Input required type="email" value={form.email} onChange={set('email')} maxLength={160} />
            </Field>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span className="label" style={{ marginBottom: 8, display: 'block' }}>
                Change password
              </span>
              <div className="stack" style={{ gap: 10 }}>
                <Field label="Current password">
                  <Input type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
                </Field>
                <Field label="New password" hint="At least 8 characters. Leave both blank to keep your password.">
                  <Input type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
                </Field>
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
                {saving ? 'Saving…' : 'Save account'}
              </button>
            </div>
          </form>
        </Card>

        <div className="stack" style={{ gap: 16 }}>
          <Card>
            <CardHead title="Public card" sub="Share this address anywhere" />
            <div className="stack" style={{ gap: 10 }}>
              <div>
                <span className="tiny muted">Business</span>
                <strong className="small" style={{ display: 'block' }}>{business?.name}</strong>
              </div>
              <div>
                <span className="tiny muted">Public link</span>
                <p className="small" style={{ margin: '2px 0 0', wordBreak: 'break-all' }}>
                  /card/{business?.slug}
                </p>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <a className="btn btn-primary btn-sm" href={`/card/${business?.slug}`} target="_blank" rel="noreferrer">
                  <Icon name="external" size={15} /> Open card
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink}>
                  <Icon name="copy" size={15} /> Copy link
                </button>
                <a className="btn btn-ghost btn-sm" href={`/api/public/card/${business?.slug}/vcard`}>
                  <Icon name="download" size={15} /> vCard file
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Session" sub="Sign out of this device" />
            <div className="row-between" style={{ gap: 10 }}>
              <div>
                <strong className="small" style={{ display: 'block' }}>{user?.email}</strong>
                <span className="tiny muted">Role: {user?.role}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                <Icon name="logout" size={15} /> Logout
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
