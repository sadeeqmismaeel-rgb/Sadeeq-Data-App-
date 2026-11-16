import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

export default function NotFound() {
  return (
    <div className="pc-error">
      <span className="stat-ico gold" style={{ margin: '0 auto' }}>
        <Icon name="search" size={20} />
      </span>
      <h1 style={{ fontSize: '1.4rem' }}>Page not found</h1>
      <p className="muted small">
        The page or business card you are looking for does not exist, or the link has changed.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
