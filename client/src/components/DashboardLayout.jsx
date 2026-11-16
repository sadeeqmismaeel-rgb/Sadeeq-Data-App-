import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Icon } from '../lib/icons.jsx';
import { initial } from '../lib/format.js';

export const navItems = [
  { to: '/dashboard', label: 'Home', icon: 'home', end: true },
  { to: '/dashboard/business', label: 'Business', icon: 'store' },
  { to: '/dashboard/products', label: 'Products', icon: 'box' },
  { to: '/dashboard/whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { to: '/dashboard/qr', label: 'QR Code', icon: 'qr' },
  { to: '/dashboard/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/dashboard/appearance', label: 'Appearance', icon: 'palette' },
  { to: '/dashboard/social', label: 'Social', icon: 'share' },
  { to: '/dashboard/settings', label: 'Settings', icon: 'settings' }
];

export default function DashboardLayout() {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const cardPath = business ? `/card/${business.slug}` : null;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">DV</div>
          <div>
            <strong>Digital vCard</strong>
            <span>Business Manager</span>
          </div>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`.trim()}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-foot">
          {cardPath ? (
            <a className="nav-item" href={cardPath} target="_blank" rel="noreferrer">
              <Icon name="external" size={18} />
              <span>View public card</span>
            </a>
          ) : null}
          <button type="button" className="nav-item" onClick={handleLogout} style={{ border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <Icon name="logout" size={18} />
            <span>Logout</span>
          </button>
          <div className="sidebar-user">
            <div className="avatar">
              {business?.logo ? <img src={business.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial(user?.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <strong>{user?.name}</strong>
              <small>{business?.name || 'Business owner'}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="avatar" style={{ width: 32, height: 32 }}>
              {business?.logo ? <img src={business.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial(business?.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                {business?.name || 'My business'}
              </h1>
              <p>{business ? `digitalvcard.app/card/${business.slug}` : ''}</p>
            </div>
          </div>
          <div className="topbar-actions">
            {cardPath ? (
              <a className="btn btn-ghost btn-sm" href={cardPath} target="_blank" rel="noreferrer">
                <Icon name="external" size={15} />
                <span className="hide-sm">View card</span>
              </a>
            ) : null}
            <button type="button" className="btn btn-primary btn-sm" onClick={handleLogout}>
              <Icon name="logout" size={15} />
              <span className="hide-sm">Logout</span>
            </button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
