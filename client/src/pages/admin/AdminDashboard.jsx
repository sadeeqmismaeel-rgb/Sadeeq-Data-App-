import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  Badge,
  Card,
  CardHead,
  Empty,
  ErrorNote,
  Field,
  Input,
  Modal,
  Spinner,
  StatCard,
  Textarea,
  useToast
} from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';
import { timeAgo } from '../../lib/format.js';

const BLANK = {
  name: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  slug: '',
  category: '',
  tagline: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  openingHours: '',
  deliveryInfo: '',
  website: ''
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(null);

  function load(search = '') {
    setLoading(true);
    return api(`/admin/overview${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      .then((payload) => setData(payload))
      .catch((err) => error(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(query.trim()), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const totals = data?.totals || {};
  const businesses = data?.businesses || [];
  const users = data?.users || [];

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function startCreate() {
    setEditing(null);
    setForm(BLANK);
    setNote('');
    setOpen(true);
  }

  function startEdit(business) {
    setEditing(business);
    setForm({
      name: business.name || '',
      ownerName: business.ownerName || '',
      ownerEmail: business.ownerEmail || '',
      ownerPassword: '',
      slug: business.slug || '',
      category: business.category || '',
      tagline: business.tagline || '',
      phone: business.phone || '',
      whatsapp: business.whatsapp || '',
      email: business.email || '',
      address: business.address || '',
      openingHours: business.openingHours || '',
      deliveryInfo: business.deliveryInfo || '',
      website: business.website || ''
    });
    setNote('');
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      if (editing) {
        const body = { ...form };
        delete body.ownerName;
        delete body.ownerEmail;
        delete body.ownerPassword;
        await api(`/admin/businesses/${editing.id}`, { method: 'PUT', body });
        success('Business updated');
      } else {
        await api('/admin/businesses', { method: 'POST', body: form });
        success('Business and owner account created');
      }
      setOpen(false);
      await load(query.trim());
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(business) {
    try {
      const next = business.status === 'active' ? 'suspended' : 'active';
      await api(`/admin/businesses/${business.id}/status`, { method: 'POST', body: { status: next } });
      success(next === 'active' ? 'Business reactivated' : 'Business suspended');
      await load(query.trim());
    } catch (err) {
      error(err.message);
    }
  }

  async function remove(business) {
    try {
      await api(`/admin/businesses/${business.id}`, { method: 'DELETE' });
      success('Business deleted');
      setConfirming(null);
      await load(query.trim());
    } catch (err) {
      error(err.message);
    }
  }

  const cards = useMemo(
    () => [
      { label: 'Total businesses', value: totals.businesses || 0, icon: 'store', hint: `${totals.activeBusinesses || 0} active` },
      { label: 'Total users', value: totals.users || 0, icon: 'users', hint: `${totals.admins || 0} admins` },
      { label: 'Total products', value: totals.products || 0, icon: 'box' },
      { label: 'Total card views', value: Number(totals.views || 0).toLocaleString(), icon: 'eye', tone: 'gold' },
      { label: 'WhatsApp clicks', value: Number(totals.whatsapp || 0).toLocaleString(), icon: 'whatsapp', tone: 'green' },
      { label: 'QR scans', value: Number(totals.qrScans || 0).toLocaleString(), icon: 'qr' }
    ],
    [totals]
  );

  return (
    <div className="stack" style={{ gap: 18, paddingBottom: 30 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <span className="badge gold">
            <Icon name="shield" size={12} /> Platform admin
          </span>
          <h1 style={{ margin: '8px 0 0', fontSize: '1.35rem' }}>Digital vCard Business Manager</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Signed in as {user?.email} · {Number(totals.events || 0).toLocaleString()} tracked events platform-wide
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => load(query.trim())}>
            <Icon name="zap" size={15} /> Refresh
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
            <Icon name="plus" size={15} /> Create business
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            <Icon name="logout" size={15} /> Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} hint={card.hint} />
        ))}
      </div>

      <Card>
        <CardHead
          title="All businesses"
          sub={`${businesses.length} result${businesses.length === 1 ? '' : 's'}`}
          right={
            <div style={{ position: 'relative', minWidth: 210 }}>
              <span style={{ position: 'absolute', left: 10, top: 11, color: '#8a97ab' }}>
                <Icon name="search" size={15} />
              </span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, slug or owner email"
                style={{ paddingLeft: 32 }}
              />
            </div>
          }
        />

        {loading && !data ? (
          <Spinner text="Loading platform data…" />
        ) : businesses.length === 0 ? (
          <Empty
            icon="store"
            title="No businesses found"
            text={query ? 'Try a different search term.' : 'Create the first business to get started.'}
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
                <Icon name="plus" size={15} /> Create business
              </button>
            }
          />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {businesses.map((business) => (
              <div
                key={business.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: 12,
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', gap: 10, minWidth: 220, flex: 1 }}>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#eef2f9',
                      flex: '0 0 44px',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--blue-800)',
                      fontWeight: 800
                    }}
                  >
                    {business.logoUrl ? (
                      <img src={business.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (business.name || '?').charAt(0)
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.92rem' }}>{business.name}</strong>
                      {business.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}
                    </div>
                    <span className="tiny muted" style={{ display: 'block' }}>
                      /card/{business.slug} · {business.category || 'No category'}
                    </span>
                    <span className="tiny muted" style={{ display: 'block' }}>
                      {business.ownerName} · {business.ownerEmail}
                    </span>
                  </div>
                </div>

                <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <strong className="small" style={{ display: 'block' }}>{business.productCount}</strong>
                    <span className="tiny muted">Products</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong className="small" style={{ display: 'block' }}>{business.viewCount}</strong>
                    <span className="tiny muted">Views</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong className="small" style={{ display: 'block' }}>{business.eventCount}</strong>
                    <span className="tiny muted">Events</span>
                  </div>
                </div>

                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <a className="btn btn-ghost btn-sm" href={`/card/${business.slug}`} target="_blank" rel="noreferrer">
                    <Icon name="external" size={14} /> View
                  </a>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(business)}>
                    <Icon name="edit" size={14} /> Edit
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleStatus(business)}>
                    <Icon name={business.status === 'active' ? 'ban' : 'check'} size={14} />
                    {business.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(business)}>
                    <Icon name="trash" size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHead title="Users" sub={`${users.length} account${users.length === 1 ? '' : 's'}`} />
        <div className="stack" style={{ gap: 8 }}>
          {users.map((item) => (
            <div key={item.id} className="row-between" style={{ gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <div>
                <strong className="small" style={{ display: 'block' }}>{item.name}</strong>
                <span className="tiny muted">{item.email}</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Badge tone={item.role === 'admin' ? 'gold' : 'grey'}>{item.role}</Badge>
                <span className="tiny muted">{item.businesses} card{item.businesses === 1 ? '' : 's'}</span>
                <span className="tiny muted">{timeAgo(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={open}
        title={editing ? 'Edit business' : 'Create business'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="admin-business-form" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
              {saving ? 'Saving…' : editing ? 'Save business' : 'Create business'}
            </button>
          </>
        }
      >
        <form id="admin-business-form" onSubmit={save} className="stack" style={{ gap: 12 }}>
          <ErrorNote>{note}</ErrorNote>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Business name">
              <Input required value={form.name} onChange={set('name')} maxLength={120} />
            </Field>
            <Field label="Public slug" hint="Used for /card/slug">
              <Input value={form.slug} onChange={set('slug')} maxLength={60} placeholder="auto-generated" />
            </Field>
          </div>
          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <Field label="Owner name">
                <Input required value={form.ownerName} onChange={set('ownerName')} maxLength={80} />
              </Field>
              <Field label="Owner email">
                <Input required type="email" value={form.ownerEmail} onChange={set('ownerEmail')} maxLength={160} />
              </Field>
              <Field label="Owner password" hint="At least 8 characters">
                <Input required type="password" value={form.ownerPassword} onChange={set('ownerPassword')} autoComplete="new-password" />
              </Field>
            </div>
          ) : (
            <p className="tiny muted" style={{ margin: 0 }}>
              Owner: {editing.ownerName} · {editing.ownerEmail}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Category">
              <Input value={form.category} onChange={set('category')} maxLength={80} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set('phone')} maxLength={40} />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={set('whatsapp')} maxLength={40} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={set('address')} maxLength={240} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Tagline">
              <Input value={form.tagline} onChange={set('tagline')} maxLength={140} />
            </Field>
            <Field label="Delivery info">
              <Input value={form.deliveryInfo} onChange={set('deliveryInfo')} maxLength={240} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirming)}
        title="Delete business?"
        onClose={() => setConfirming(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={() => remove(confirming)}>
              <Icon name="trash" size={15} /> Delete permanently
            </button>
          </>
        }
      >
        <p className="small">
          <strong>{confirming?.name}</strong> and its products, social links, analytics and owner account (if it owns no other
          business) will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}
