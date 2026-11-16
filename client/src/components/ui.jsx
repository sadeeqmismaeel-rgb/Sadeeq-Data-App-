import { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';
import { Icon } from '../lib/icons.jsx';
import { resizeImage } from '../lib/image.js';

/* ---------------- toasts ---------------- */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = {
    toast: (message) => push(message, 'info'),
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error')
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast ${item.tone}`}>
            <Icon name={item.tone === 'error' ? 'alert' : 'check'} size={16} />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

/* ---------------- primitives ---------------- */
export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {sub ? <p>{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Button({ variant = 'primary', size, icon, children, className = '', ...rest }) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="label">{label}</span> : null}
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="select" {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Badge({ tone = 'blue', children }) {
  const map = { blue: '', gold: 'gold', green: 'green', red: 'red', grey: 'grey' };
  return <span className={`badge ${map[tone] || ''}`.trim()}>{children}</span>;
}

export function StatCard({ label, value, icon, tone = '', hint }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon ? (
          <span className={`stat-ico ${tone}`.trim()}>
            <Icon name={icon} size={17} />
          </span>
        ) : null}
      </div>
      <span className="stat-value">{value}</span>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function Empty({ icon = 'box', title, text, action }) {
  return (
    <div className="empty">
      <span className="stat-ico">
        <Icon name={icon} size={20} />
      </span>
      <strong>{title}</strong>
      {text ? <span className="small">{text}</span> : null}
      {action}
    </div>
  );
}

export function Spinner({ text = 'Loading…' }) {
  return (
    <div className="empty">
      <div className="boot-spinner" />
      <span className="small">{text}</span>
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ImagePicker({ value, onChange, label, hint, variant = 'square', maxSize = 1200 }) {
  const id = useId();
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file, maxSize, 0.82);
      onChange(dataUrl);
    } catch (err) {
      window.alert(err.message || 'Could not read image');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <div className="field">
      {label ? <span className="label">{label}</span> : null}
      <div className="image-picker">
        <div className={`image-thumb ${variant === 'cover' ? 'cover' : ''}`.trim()}>
          {value ? <img src={value} alt="" /> : <Icon name="image" size={20} />}
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="file-input"
            onChange={handleFile}
            disabled={busy}
          />
          <div className="row" style={{ gap: 6 }}>
            {busy ? <span className="hint">Processing…</span> : null}
            {value ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="notice error">
      <Icon name="alert" size={16} />
      <span>{children}</span>
    </div>
  );
}
