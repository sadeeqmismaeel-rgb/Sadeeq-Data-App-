import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Card, CardHead, Empty, Field, ImagePicker, Input, Modal, Spinner, Textarea, Toggle, useToast, Badge, ErrorNote } from '../../components/ui.jsx';
import { Icon } from '../../lib/icons.jsx';
import { formatPrice, waLink, digitsOnly } from '../../lib/format.js';

const BLANK = {
  name: '',
  price: '',
  description: '',
  badge: '',
  imageUrl: '',
  orderMessage: '',
  active: true
};

export default function Products() {
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(null);

  function load() {
    return Promise.all([api('/owner/products'), api('/owner/business')])
      .then(([list, biz]) => {
        setProducts(list.products || []);
        setBusiness(biz.business);
      })
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

  function startEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      price: product.price ?? '',
      description: product.description || '',
      badge: product.badge || '',
      imageUrl: product.imageUrl || '',
      orderMessage: product.orderMessage || '',
      active: product.active
    });
    setNote('');
    setOpen(true);
  }

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNote('');
    try {
      const body = { ...form, price: form.price === '' ? null : Number(form.price) };
      if (editing) await api(`/owner/products/${editing.id}`, { method: 'PUT', body });
      else await api('/owner/products', { method: 'POST', body });
      success(editing ? 'Product updated' : 'Product added to your card');
      setOpen(false);
      await load();
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(product) {
    try {
      await api(`/owner/products/${product.id}`, { method: 'DELETE' });
      success('Product deleted');
      setConfirming(null);
      await load();
    } catch (err) {
      error(err.message);
    }
  }

  if (loading) return <Spinner text="Loading products…" />;

  const waNumber = digitsOnly(business?.whatsapp);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Products</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {products.length} product{products.length === 1 ? '' : 's'} on your public card. Each one gets its own WhatsApp order button.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={startAdd}>
          <Icon name="plus" size={16} /> Add product
        </button>
      </div>

      {products.length === 0 ? (
        <Card>
          <Empty
            icon="box"
            title="No products yet"
            text="Add your first product so customers can order directly from your card."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
                <Icon name="plus" size={15} /> Add product
              </button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {products.map((product) => (
            <Card key={product.id} className="stack" style={{ gap: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#eef2f9',
                    flex: '0 0 76px',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#9aa8bd'
                  }}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="image" size={20} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{product.name}</strong>
                    {product.badge ? <Badge tone="gold">{product.badge}</Badge> : null}
                    {product.active ? null : <Badge tone="grey">Hidden</Badge>}
                  </div>
                  <p style={{ margin: '2px 0 0', color: 'var(--blue-800)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {formatPrice(product.price, product.currency)}
                  </p>
                  <p className="tiny muted" style={{ margin: '4px 0 0' }}>
                    {(product.description || 'No description yet').slice(0, 90)}
                    {(product.description || '').length > 90 ? '…' : ''}
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(product)}>
                  <Icon name="edit" size={14} /> Edit
                </button>
                <a
                  className="btn btn-ghost btn-sm"
                  href={waLink(waNumber, product.orderMessage || `Hello, I want to order ${product.name} from ${business?.name}.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="whatsapp" size={14} /> Test order
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(product)}>
                  <Icon name="trash" size={14} /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit product' : 'Add product'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <Icon name="check" size={16} />}
              {saving ? 'Saving…' : editing ? 'Save product' : 'Add product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={save} className="stack" style={{ gap: 12 }}>
          <ErrorNote>{note}</ErrorNote>
          <ImagePicker
            label="Product image"
            variant="cover"
            value={form.imageUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))}
            hint="Square or landscape image, JPG or PNG."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Product name">
              <Input required value={form.name} onChange={set('name')} maxLength={120} placeholder="Jallabiya" />
            </Field>
            <Field label="Price (₦)">
              <Input type="number" min="0" step="500" value={form.price} onChange={set('price')} placeholder="18500" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={4} value={form.description} onChange={set('description')} maxLength={800} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Badge" hint="Optional, e.g. Best seller">
              <Input value={form.badge} onChange={set('badge')} maxLength={40} />
            </Field>
            <Field label="Visibility">
              <Toggle checked={form.active} onChange={(value) => setForm((prev) => ({ ...prev, active: value }))} label={form.active ? 'Visible on card' : 'Hidden from card'} />
            </Field>
          </div>
          <Field
            label="WhatsApp order message"
            hint={`Leave empty to use: “Hello, I want to order ${form.name || 'this product'} from ${business?.name || 'your business'}.”`}
          >
            <Textarea rows={2} value={form.orderMessage} onChange={set('orderMessage')} maxLength={400} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirming)}
        title="Delete product?"
        onClose={() => setConfirming(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(null)}>
              Keep product
            </button>
            <button type="button" className="btn btn-danger" onClick={() => remove(confirming)}>
              <Icon name="trash" size={15} /> Delete
            </button>
          </>
        }
      >
        <p className="small">
          <strong>{confirming?.name}</strong> will be removed from your public card immediately. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
