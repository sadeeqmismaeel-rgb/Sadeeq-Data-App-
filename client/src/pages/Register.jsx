import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../lib/icons.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    category: '',
    whatsapp: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card wide">
        <Link to="/" className="row" style={{ gap: 10, marginBottom: 18 }}>
          <div className="brand-mark">DV</div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>Digital vCard</strong>
            <span className="tiny muted">Business Manager</span>
          </div>
        </Link>
        <h1>Create your business card</h1>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Your public card link is generated from your business name. You can edit everything later.
        </p>

        <form onSubmit={submit}>
          {error ? <div className="alert error">{error}</div> : null}
          <div className="grid two">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" required value={form.name} onChange={set('name')} placeholder="Full name" />
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@business.com"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="businessName">Business name</label>
              <input
                id="businessName"
                required
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Amina Fabrics"
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                value={form.category}
                onChange={set('category')}
                placeholder="Fashion / Tailoring"
              />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp number</label>
              <input
                id="whatsapp"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="+234 800 000 0000"
              />
            </div>
            <div className="field">
              <label htmlFor="address">Address</label>
              <input id="address" value={form.address} onChange={set('address')} placeholder="Shop address" />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="sparkle" size={16} />}
            {busy ? 'Creating…' : 'Create my card'}
          </button>
        </form>

        <p className="small muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
