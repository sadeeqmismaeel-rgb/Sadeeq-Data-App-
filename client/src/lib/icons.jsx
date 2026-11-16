const paths = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /></>,
  store: <><path d="M4 9h16l-1 11H5L4 9Z" /><path d="M8 9V7a4 4 0 0 1 8 0v2" /></>,
  box: <><path d="M12 3 21 7.5v9L12 21 3 16.5v-9L12 3Z" /><path d="M3 7.5 12 12l9-4.5" /><path d="M12 12v9" /></>,
  whatsapp: <><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.6 8.4c.3-.5.8-.6 1.1-.5.3.1.6.7.8 1.2.1.4-.4.8-.6 1 .4 1 1.2 1.8 2.2 2.2.3-.2.6-.7 1-.6.5.1 1.1.5 1.2.8.1.3.1.8-.5 1.2-.7.5-1.6.6-2.6.2-1-.4-2.2-1.2-3.2-2.3-1-1.1-1.6-2.2-1.7-2.8-.1-.4 0-.9.3-1.4Z" /></>,
  phone: <><path d="M4.5 3.5h4l2 5-2.5 1.5a11 11 0 0 0 5.5 5.5L15 13l5 2v4a2 2 0 0 1-2.2 2A16 16 0 0 1 2.5 5.7 2 2 0 0 1 4.5 3.5Z" /></>,
  mail: <><path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" /></>,
  mapPin: <><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  truck: <><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7" /><circle cx="6.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3z" /><path d="M21 14v3" /><path d="M14 21h7" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4 1-2 2.5-2H18a3 3 0 0 0 3-3 9 9 0 0 0-9-11Z" /><circle cx="8" cy="10" r="1.2" /><circle cx="12" cy="7.5" r="1.2" /><circle cx="16" cy="10" r="1.2" /></>,
  settings: <><path d="M4 6h10" /><path d="M18 6h2" /><path d="M4 12h4" /><path d="M12 12h8" /><path d="M4 18h10" /><path d="M18 18h2" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="16" cy="18" r="2" /></>,
  share: <><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h9" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="M14 6l4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></>,
  copy: <><rect x="9" y="9" width="11" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  download: <><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 21h16" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" /><path d="M17 11a3.5 3.5 0 1 0 0-7" /><path d="M18 21c0-3-1.5-5-3-6" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" /></>,
  x: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  check: <><path d="M4 12l5 5L20 6" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></>,
  chevronRight: <><path d="M9 6l6 6-6 6" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  sparkle: <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" /></>,
  star: <><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" /></>,
  facebook: <><path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H8v3h2v6h3v-6h3l1-3h-4V10a1 1 0 0 1 1-1Z" /></>,
  tiktok: <><path d="M15 4c.5 2.5 2 4 4.5 4.2V11c-1.7.1-3.3-.5-4.5-1.4V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 1 .1v3a2.5 2.5 0 1 0 1.5 2.4V4h3Z" /></>,
  xSocial: <><path d="M4 4l7.5 9.5L4.5 20h2.2l6-6.6L18 20h2.5l-7.8-9.9L19.5 4h-2.2l-5.4 6L7 4H4Z" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18" /><path d="M12 3c-3 3-3 15 0 18" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 15l-5-5-9 9" /></>,
  alert: <><path d="M12 4l9 16H3l9-16Z" /><path d="M12 10v4" /><path d="M12 17v.5" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><circle cx="8" cy="11" r="2" /><path d="M5.5 16c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2" /><path d="M14 10h5" /><path d="M14 14h5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3 10h18" /></>,
  send: <><path d="M4 12l16-8-6 16-2.5-6L4 12Z" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5l13 13" /></>,
  key: <><circle cx="8" cy="8" r="4" /><path d="M11 11l9 9" /><path d="M17 17l2-2" /></>,
  zap: <><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></>,
  dot: <><circle cx="12" cy="12" r="3" /></>
};

export function Icon({ name, size = 20, className = '', strokeWidth = 1.8, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name] || paths.dot}
    </svg>
  );
}

export const socialIcons = {
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  x: 'xSocial',
  twitter: 'xSocial',
  telegram: 'send',
  linkedin: 'link',
  website: 'globe',
  email: 'mail',
  other: 'link'
};

export default Icon;
