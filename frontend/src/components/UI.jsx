import React from 'react';

export const Icon = ({ name, size = 18, stroke = 1.75 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'sparkles': return (<svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>);
    case 'arrow-right': return (<svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>);
    case 'arrow-left': return (<svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>);
    case 'check': return (<svg {...props}><path d="M5 13l4 4L19 7"/></svg>);
    case 'mail': return (<svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>);
    case 'lock': return (<svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>);
    case 'user': return (<svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>);
    case 'briefcase': return (<svg {...props}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/></svg>);
    case 'file': return (<svg {...props}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>);
    case 'download': return (<svg {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>);
    case 'edit': return (<svg {...props}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/></svg>);
    case 'plus': return (<svg {...props}><path d="M12 5v14M5 12h14"/></svg>);
    case 'search': return (<svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>);
    case 'map-pin': return (<svg {...props}><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>);
    case 'clock': return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case 'dollar': return (<svg {...props}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>);
    case 'link': return (<svg {...props}><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5"/></svg>);
    case 'sun': return (<svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>);
    case 'moon': return (<svg {...props}><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></svg>);
    case 'logout': return (<svg {...props}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>);
    case 'rocket': return (<svg {...props}><path d="M5 13l-2 2 4 4 2-2M9 11l4 4M15 4c-3 0-6 1-9 4l5 5c3-3 4-6 4-9zM15 4l5 5"/></svg>);
    default: return null;
  }
};

export const MatchRing = ({ pct = 80, size = 56 }) => {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--star-400)';
  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(228, 228, 231, 0.15)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease-orbit)', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="pct">{pct}</div>
    </div>
  );
};

export const Nav = ({ current, setRoute, theme, setTheme, signedIn }) => {
  const links = signedIn
    ? [['jobs', 'Jobs'], ['builder', 'Resume builder'], ['chat', 'Chat'], ['profile', 'Profile']]
    : [['home', 'Home'], ['jobs', 'Jobs'], ['builder', 'Templates']];
  return (
    <nav className="nav">
      <button className="nav-brand" onClick={() => setRoute(signedIn ? 'jobs' : 'home')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <svg className="glyph" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fafafa" />
              <stop offset="100%" stopColor="#a1a1aa" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="11" fill="none" stroke="url(#brand-grad)" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="5" fill="url(#brand-grad)" />
          <circle cx="27" cy="16" r="2" fill="#a1a1aa" />
        </svg>
        <span>Jobify</span>
      </button>
      <div className="nav-links">
        {links.map(([k, label]) => (
          <button key={k} className={`nav-link ${current === k ? 'active' : ''}`} onClick={() => setRoute(k)}>{label}</button>
        ))}
      </div>
      <div className="nav-actions">
        <button className="icon-btn hide-mobile" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        {signedIn ? (
          <>
            <button className="icon-btn" onClick={() => setRoute('settings')} title="Settings"><Icon name="edit" size={16} /></button>
            <button className="icon-btn" onClick={() => setRoute('home')} title="Sign out"><Icon name="logout" size={16} /></button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3f3f46, #18181b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>RP</div>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm hide-mobile" onClick={() => setRoute('login')}>Sign in</button>
            <button className="btn btn-primary btn-sm" onClick={() => setRoute('signup')}>Get started</button>
          </>
        )}
      </div>
    </nav>
  );
};

export const StarField = ({ count = 40 }) => {
  const stars = React.useMemo(() => Array.from({ length: count }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    size: Math.random() * 2 + 1,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map((s, i) => (
        <div key={i} className="star-dot"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
};
