import React from 'react';
import { Icon, MatchRing } from '../components/UI.jsx';
import { TailorAPI } from '../api.js';
import { MOCK_JOBS } from '../mock.js';

const JobDetail = ({ job, setRoute }) => {
  const j = job || MOCK_JOBS[0];
  const [phase, setPhase] = React.useState('idle');
  const [url, setUrl] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');

  const startTailor = async () => {
    if (!url.trim()) {
      setUrl(`https://${j.company.toLowerCase().replace(/\W/g, '')}.com/careers/${j.id}`);
    }
    setPhase('tailoring');
    setProgress(10);
    setError('');
    let tick = setInterval(() => setProgress(p => Math.min(p + Math.random() * 8 + 4, 92)), 350);
    try {
      const jdText = j.description || `${j.title} at ${j.company}. Skills: ${j.tags.join(', ')}.`;
      await TailorAPI.tailor(jdText);
      clearInterval(tick);
      setProgress(100);
      setTimeout(() => setPhase('done'), 400);
    } catch (e) {
      clearInterval(tick);
      setError(e.status === 401 ? 'Set your Gemini API key in Settings first.' : (e.message || 'Tailor failed'));
      setPhase('idle');
    }
  };

  const tailorSteps = [
    { t: 'Reading job description', done: progress > 15 },
    { t: 'Mapping skills to requirements', done: progress > 35 },
    { t: 'Rewriting summary & headline', done: progress > 60 },
    { t: 'Reordering experience bullets', done: progress > 80 },
    { t: 'Polishing tone', done: progress >= 100 },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 48px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setRoute('jobs')}>
          <Icon name="arrow-left" size={14} /> Back to jobs
        </button>
        {j.redirect_url && (
          <a className="btn btn-primary btn-sm"
             href={j.redirect_url} target="_blank" rel="noopener noreferrer"
             style={{ textDecoration: 'none' }}>
            View on Adzuna <Icon name="arrow-right" size={14} />
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }} className="detail-grid">
        <div className="panel" style={{ padding: 40 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: 'rgba(76, 195, 255, 0.08)',
              border: '1px solid rgba(201, 196, 240, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--star-100)',
            }}>{j.logo}</div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{j.company} · {j.time}</div>
              <h1 className="h-display" style={{ fontSize: 36, margin: 0 }}>{j.title}</h1>
            </div>
            <MatchRing pct={j.match} size={72} />
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--star-300)', marginBottom: 32, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} /> {j.location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="dollar" size={14} /> {j.salary}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="briefcase" size={14} /> Full-time</span>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>SKILLS NEEDED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
            {[...j.tags, 'CSS', 'Performance', 'Testing'].map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>ABOUT THE ROLE</div>
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            {j.company} is hiring a {j.title.toLowerCase()} to lead the next generation of {j.tags[0]?.toLowerCase() || 'product'}-driven products.
          </p>
        </div>

        <div style={{ position: 'sticky', top: 96, alignSelf: 'flex-start', height: 'max-content' }}>
          <div className="panel" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(91,59,212,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--nebula-cyan)' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--nebula-cyan)', marginRight: 6, boxShadow: '0 0 8px var(--nebula-cyan)' }} />
                AI TAILORING
              </div>
              <h2 className="h-display" style={{ fontSize: 28, margin: '0 0 8px' }}>
                {phase === 'done' ? <><span style={{ color: 'var(--success)' }}>Tailored.</span> Ready to send.</>
                  : phase === 'tailoring' ? <>Rewriting your <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}>resume…</span></>
                  : <>Tailor your resume to <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}>this role.</span></>}
              </h2>

              {error && <div style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', margin: '12px 0', fontSize: 13, color: '#ff5050' }}>{error}</div>}

              {phase !== 'tailoring' && phase !== 'done' && (
                <>
                  <p style={{ fontSize: 13, marginBottom: 20 }}>Paste the job link or use the one we detected.</p>
                  <label className="label">Job URL</label>
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <div style={{ position: 'absolute', left: 14, top: 14, color: 'var(--star-400)' }}><Icon name="link" size={16} /></div>
                    <input className="input" placeholder={`https://${j.company.toLowerCase().replace(/\W/g, '')}.com/careers/...`} style={{ paddingLeft: 40 }} value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={startTailor} style={{ width: '100%', justifyContent: 'center' }}>
                    <Icon name="sparkles" size={16} /> Tailor my resume
                  </button>
                </>
              )}

              {phase === 'tailoring' && (
                <div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(228, 228, 231, 0.12)', marginBottom: 24, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%',
                      background: 'linear-gradient(90deg, #fafafa, #a1a1aa)',
                      transition: 'width 0.3s var(--ease-orbit)',
                      boxShadow: '0 0 12px rgba(255, 255, 255, 0.2)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tailorSteps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, opacity: s.done ? 1 : 0.5 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: '1px solid ' + (s.done ? 'var(--success)' : 'rgba(228, 228, 231, 0.3)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: s.done ? 'rgba(61,220,151,0.2)' : 'transparent', color: 'var(--success)',
                        }}>{s.done && <Icon name="check" size={12} />}</div>
                        <span style={{ color: s.done ? 'var(--star-100)' : 'var(--star-300)' }}>{s.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'done' && (
                <div>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(61,220,151,0.08)', border: '1px solid rgba(61,220,151,0.3)', marginBottom: 16, fontSize: 13 }}>
                    Your resume has been tailored and saved. View your history under Profile.
                  </div>
                  <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => setRoute('preview')}>
                    <Icon name="file" size={16} /> Review tailored resume
                  </button>
                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setRoute('profile')}>
                    See history <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default JobDetail;
