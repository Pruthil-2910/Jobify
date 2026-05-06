import React from 'react';
import { Icon, MatchRing } from '../components/UI.jsx';
import { UsersAPI, TailorAPI } from '../api.js';
import { MOCK_JOBS, timeAgo } from '../mock.js';

const Profile = ({ setRoute }) => {
  const [user, setUser] = React.useState(null);
  const [history, setHistory] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [me, hist] = await Promise.allSettled([UsersAPI.getMe(), TailorAPI.history()]);
      if (cancelled) return;
      if (me.status === 'fulfilled') setUser(me.value);
      if (hist.status === 'fulfilled') setHistory(hist.value || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const displayName = user ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Riya Patel';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const displayJobs = history.length > 0
    ? history.slice(0, 4).map((h, i) => ({
        id: h.id || i,
        title: (h.resume_json && h.resume_json.title) || 'Tailored resume',
        company: h.jd_text ? h.jd_text.slice(0, 40) + '…' : 'Job description',
        match: 85 + Math.floor(Math.random() * 10),
        time: timeAgo(h.created_at),
        logo: 'TR',
      }))
    : MOCK_JOBS.slice(0, 4);

  const stats = [
    ['Resumes tailored', history.length > 0 ? `${history.length}` : '—', history.length > 0 ? 'from API' : 'no history yet', 'success'],
    ['Avg. match score', '87%', '↑ 12 pts', 'cyan'],
    ['Applications sent', '24', 'across 18 cos.', 'star'],
    ['Callback rate', '34%', '3.4× avg.', 'magenta'],
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 48px 96px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR DASHBOARD</div>
        <h1 className="h-display" style={{ fontSize: 56, margin: 0 }}>
          Welcome back, <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}>{displayName.split(' ')[0]}.</span>
        </h1>
        <p style={{ marginTop: 8 }}>Here's your trajectory this week.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="stat-grid">
        {stats.map(([k, v, sub, c], i) => (
          <div key={k} className="panel" style={{ padding: 24, animation: `word-rise 0.6s var(--ease-orbit) ${i * 0.08}s backwards` }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{k}</div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 600, color: 'var(--star-100)', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 12, color: c === 'success' ? 'var(--success)' : 'var(--star-400)', marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }} className="profile-grid">
        <div className="panel" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400 }}>Recent tailorings</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => setRoute('jobs')}>See all <Icon name="arrow-right" size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayJobs.map((j, i) => (
              <div key={j.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                borderBottom: i < 3 ? 'var(--border-hair)' : 'none', cursor: 'pointer',
              }} onClick={() => setRoute('preview')}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(76, 195, 255, 0.08)',
                  border: '1px solid rgba(201, 196, 240, 0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, color: 'var(--star-100)',
                }}>{j.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--star-100)', fontWeight: 500 }}>{j.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--star-400)' }}>{j.company} · {j.time}</div>
                </div>
                <span className={`tag-chip ${j.match >= 80 ? 'match-high' : 'match-mid'}`}>{j.match}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e63ff, #4cc3ff)',
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600, color: 'white',
              boxShadow: '0 0 32px rgba(91,59,212,0.5)',
            }}>{initials}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--star-100)' }}>{displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--star-400)', marginBottom: 16 }}>
              {user ? user.email : 'Senior Frontend Engineer · SF'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-sm" onClick={() => setRoute('builder')}><Icon name="edit" size={12} /> Edit</button>
              <button className="btn btn-sm btn-primary" onClick={() => setRoute('settings')}><Icon name="lock" size={12} /> Settings</button>
            </div>
          </div>

          <div className="panel" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>PROFILE STRENGTH</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <MatchRing pct={user?.has_resume ? 84 : 42} size={72} />
              <div>
                <div style={{ fontSize: 14, color: 'var(--star-100)', fontWeight: 500 }}>
                  {user?.has_resume ? 'Almost stellar.' : 'Getting started.'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--star-400)' }}>
                  {user?.has_api_key ? 'API key configured.' : 'Add your Gemini key in Settings.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
