import React from 'react';
import { Icon, MatchRing } from '../components/UI.jsx';
import { ScrollSplit, Magnetic, useScrollReveal } from '../components/MoncyFX.jsx';
import { AuthAPI, JobsAPI } from '../api.js';
import { MOCK_JOBS, timeAgo } from '../mock.js';

const Jobs = ({ setRoute, setSelectedJob }) => {
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [jobs, setJobs] = React.useState(MOCK_JOBS);
  const [isLive, setIsLive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  useScrollReveal();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!AuthAPI.isLoggedIn()) return;
      setLoading(true);
      try {
        const data = await JobsAPI.search({ limit: 50 });
        if (!cancelled && data && data.length > 0) {
          const mapped = data.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company || 'Unknown',
            location: j.location || 'Remote',
            salary: j.salary_min && j.salary_max ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k` : 'Competitive',
            match: Math.floor(60 + Math.random() * 35),
            tags: j.description ? j.description.split(/\s+/).slice(0, 3) : [],
            time: timeAgo(j.fetched_at),
            logo: (j.company || 'XX').slice(0, 2).toUpperCase(),
            description: j.description,
            external_id: j.external_id,
          }));
          setJobs(mapped);
          setIsLive(true);
        }
      } catch {} finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = jobs.filter(j => {
    if (filter === 'high' && j.match < 80) return false;
    if (filter === 'remote' && !j.location.toLowerCase().includes('remote')) return false;
    if (query && !j.title.toLowerCase().includes(query.toLowerCase()) && !j.company.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="moncy-mode" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 48px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="section-num">
            <span className="pill">{isLive ? 'LIVE' : 'FEED'}</span> {filtered.length} ROLES IN ORBIT
            {loading && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--star-400)' }}>loading…</span>}
          </div>
          <h1 className="hero-display" style={{ fontSize: 'clamp(48px, 7vw, 88px)', margin: 0 }}>
            <ScrollSplit text="Roles tuned to" />
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}>
              <ScrollSplit text="your trajectory." stagger={0.03} />
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: 12, color: 'var(--star-400)' }}><Icon name="search" size={16} /></div>
            <input className="input" placeholder="Search roles, companies…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 40, width: 260 }} />
          </div>
        </div>
      </div>

      <div className="jobs-banner">
        <div className="jobs-banner-track">
          {Array(2).fill(0).map((_, i) => (
            <React.Fragment key={i}>
              <span>Senior Frontend</span><span className="sep">✦</span>
              <span>Creative Developer</span><span className="sep">✦</span>
              <span>3D / WebGL Engineer</span><span className="sep">✦</span>
              <span>Design Engineer</span><span className="sep">✦</span>
              <span>Motion Designer</span><span className="sep">✦</span>
              <span>Brand Engineer</span><span className="sep">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          ['all', 'All matches', jobs.length],
          ['high', '80%+ match', jobs.filter(j => j.match >= 80).length],
          ['remote', 'Remote', jobs.filter(j => j.location.toLowerCase().includes('remote')).length],
        ].map(([k, label, n]) => (
          <Magnetic key={k} strength={0.18}>
            <button className={`btn btn-sm ${filter === k ? 'btn-primary' : ''}`} onClick={() => setFilter(k)}>
              {label} <span className="mono" style={{ opacity: 0.7, marginLeft: 4 }}>{n}</span>
            </button>
          </Magnetic>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {filtered.map((j, i) => (
          <div key={j.id} className="job-card"
            onClick={() => { setSelectedJob(j); setRoute('jobDetail'); }}
            data-reveal data-reveal-delay={Math.min(i * 0.06, 0.5)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: 'rgba(76, 195, 255, 0.08)',
                  border: '1px solid rgba(201, 196, 240, 0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
                  color: 'var(--star-100)', fontFamily: 'var(--font-ui)',
                }}>{j.logo}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--star-100)', marginBottom: 2 }}>{j.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--star-400)' }}>{j.company}</div>
                </div>
              </div>
              <MatchRing pct={j.match} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {j.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--star-400)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="map-pin" size={12} /> {j.location}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="dollar" size={12} /> {j.salary}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} /> {j.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
