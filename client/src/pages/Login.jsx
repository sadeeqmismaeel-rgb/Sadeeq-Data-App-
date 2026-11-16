import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../lib/icons.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      const next = location.state?.from;
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate(next || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  function useDemo(kind) {
    if (kind === 'owner') {
      setEmail('owner@ssaminanjuna.com');
      setPassword('Aminan2024!');
    } else {
      setEmail('admin@digitalvcard.app');
      setPassword('Admin2024!');
    }
    setError('');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="row" style={{ gap: 10, marginBottom: 18 }}>
          <div className="brand-mark">DV</div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>Digital vCard</strong>
            <span className="tiny muted">Business Manager</span>
          </div>
        </Link>
        <h1>Welcome back</h1>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Sign in to manage your business card, products and analytics.
        </p>

        <form onSubmit={submit}>
          {error ? <div className="alert error">{error}</div> : null}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="lock" size={16} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-box">
          <strong className="small">Demo accounts</strong>
          <div className="row-between" style={{ marginTop: 8, gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => useDemo('owner')}>
              Use owner login
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => useDemo('admin')}>
              Use admin login
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 8 }}>
            Owner: owner@ssaminanjuna.com · Admin: admin@digitalvcard.app
          </p>
        </div>

        <p className="small muted" style={{ marginTop: 18, textAlign: 'center' }}>
          New here? <Link to="/register" className="link">Create your business card</Link>
        </p>
      </div>
    </div>
  );
}
