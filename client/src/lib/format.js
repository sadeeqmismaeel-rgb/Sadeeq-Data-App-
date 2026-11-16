export function formatPrice(price, currency = 'NGN') {
  if (price === null || price === undefined || price === '') return 'Price on request';
  const value = Number(price);
  if (!Number.isFinite(value)) return 'Price on request';
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `₦${value.toLocaleString()}`;
  }
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function waLink(number, message) {
  const digits = digitsOnly(number);
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function parseSqlDate(value) {
  if (!value) return null;
  return new Date(`${String(value).replace(' ', 'T')}Z`);
}

export function timeAgo(value) {
  const date = parseSqlDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function shortDay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function themeStyle(theme = {}) {
  const fonts = {
    modern: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    classic: 'Georgia, "Times New Roman", serif',
    elegant: '"Palatino Linotype", "Book Antiqua", Georgia, serif'
  };
  const backgrounds = {
    royal: 'linear-gradient(180deg, #EEF3FC 0%, #FFFFFF 45%, #F7F9FD 100%)',
    plain: '#FFFFFF',
    gradient: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, #FFFFFF 40%)',
    dark: '#0A1729'
  };
  return {
    '--pc-primary': theme.primary || '#0F3D7E',
    '--pc-secondary': theme.secondary || '#C9A227',
    '--pc-font': fonts[theme.fontStyle] || fonts.modern,
    '--pc-bg': backgrounds[theme.background] || backgrounds.royal,
    '--pc-btn-radius':
      theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'square' ? '6px' : '14px',
    '--pc-card-radius': theme.cardStyle === 'flat' ? '10px' : '20px'
  };
}

export function initial(value) {
  return String(value || '?')
    .trim()
    .charAt(0)
    .toUpperCase();
}
