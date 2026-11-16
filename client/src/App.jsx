import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PublicCard from './pages/PublicCard.jsx';
import NotFound from './pages/NotFound.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import Business from './pages/dashboard/Business.jsx';
import Products from './pages/dashboard/Products.jsx';
import WhatsApp from './pages/dashboard/WhatsApp.jsx';
import QRCodePage from './pages/dashboard/QRCodePage.jsx';
import Analytics from './pages/dashboard/Analytics.jsx';
import Appearance from './pages/dashboard/Appearance.jsx';
import Social from './pages/dashboard/Social.jsx';
import Settings from './pages/dashboard/Settings.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <p>Loading your workspace…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/card/:slug" element={<PublicCard />} />
      <Route
        path="/dashboard"
        element={
          <Protected role="owner">
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="business" element={<Business />} />
        <Route path="products" element={<Products />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="qr" element={<QRCodePage />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="appearance" element={<Appearance />} />
        <Route path="social" element={<Social />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminDashboard />
          </Protected>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
