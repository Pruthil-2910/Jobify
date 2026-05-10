import React from 'react';
import { Icon } from '../components/UI.jsx';
import { AIRewriteButton, InsertLinkButton, ImportGitHubButton, TechChips } from '../components/BuilderTools.jsx';
import { DEFAULT_RESUME } from '../mock.js';
import { UsersAPI } from '../api.js';

const Section = ({ title, children, classic }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: classic ? '#1a1530' : '#5b3bd4',
      marginBottom: 6,
      borderBottom: classic ? '1px solid #ddd' : 'none',
      paddingBottom: classic ? 3 : 0,
    }}>{title}</div>
    <div style={{ fontSize: 11, color: '#333' }}>{children}</div>
  </div>
);

export const ResumePreview = ({ resume, template = 'classic', compact = false }) => {
  const r = resume || DEFAULT_RESUME;
  const baseStyle = {
    background: '#fdfcf7', color: '#1a1530',
    padding: compact ? '32px 36px' : '56px 64px',
    borderRadius: 8, fontFamily: 'var(--font-ui)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
    aspectRatio: '8.5 / 11',
    fontSize: compact ? 11 : 13,
    lineHeight: 1.5,
    overflow: 'hidden',
  };

  if (template === 'classic') {
    return (
      <div style={baseStyle}>
        <div style={{ borderBottom: '2px solid #1a1530', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 24 : 32, fontWeight: 400, color: '#1a1530', letterSpacing: '-0.02em' }}>{r.name}</div>
          <div style={{ fontSize: compact ? 12 : 14, color: '#5b3bd4', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{r.title}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#555', marginTop: 8, flexWrap: 'wrap' }}>
            <span>{r.email}</span><span>·</span><span>{r.phone}</span><span>·</span><span>{r.location}</span><span>·</span><span>{r.website}</span>
          </div>
        </div>
        <Section title="Summary" classic>{r.summary}</Section>
        <Section title="Experience" classic>
          {r.experience.map(e => (
            <div key={e.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{e.role} · {e.company}</strong>
                <span style={{ color: '#777', fontSize: 10 }}>{e.period}</span>
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: '#333' }}>{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          ))}
        </Section>
        {(r.projects && r.projects.length > 0) && (
          <Section title="Projects" classic>
            {r.projects.map(p => (
              <div key={p.id || p.name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{p.name}{p.url ? ' · ' : ''}<span style={{ fontWeight: 400, fontSize: 10, color: '#5b3bd4' }}>{p.url ? new URL(p.url).hostname.replace(/^www\./, '') : ''}</span></strong>
                  <span style={{ color: '#777', fontSize: 10 }}>{p.period || [p.start_date, p.end_date].filter(Boolean).join(' — ')}</span>
                </div>
                {p.description && <div style={{ marginTop: 2, color: '#333' }}>{p.description}</div>}
                {(p.technologies || []).length > 0 && (
                  <div style={{ marginTop: 2, fontSize: 10, fontStyle: 'italic', color: '#555' }}>
                    {(p.technologies || []).slice(0, 6).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}
        <Section title="Skills" classic>{r.skills.join(' · ')}</Section>
        <Section title="Education" classic>
          {r.education.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>{e.school}</strong> — {e.degree}</span>
              <span style={{ color: '#777' }}>{e.period}</span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (template === 'modern') {
    return (
      <div style={{ ...baseStyle, padding: 0, display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
        <div style={{ background: 'linear-gradient(180deg, #1a1530, #2a2050)', color: '#fff', padding: compact ? 24 : 36 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 22 : 28, lineHeight: 1.1, marginBottom: 4 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#a3e3ff', marginBottom: 24 }}>{r.title}</div>
          <div style={{ fontSize: 9, lineHeight: 1.7, color: '#c9c4f0', marginBottom: 24 }}>
            <div>{r.email}</div><div>{r.phone}</div><div>{r.location}</div><div>{r.website}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', marginBottom: 8, textTransform: 'uppercase', color: '#a3e3ff' }}>Skills</div>
          {r.skills.map(s => <div key={s} style={{ fontSize: 10, padding: '3px 0', color: '#fff' }}>{s}</div>)}
        </div>
        <div style={{ padding: compact ? 24 : 36 }}>
          <Section title="Summary">{r.summary}</Section>
          <Section title="Experience">
            {r.experience.map(e => (
              <div key={e.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{e.role}</span>
                  <span style={{ fontSize: 10, color: '#777' }}>{e.period}</span>
                </div>
                <div style={{ fontSize: 10, color: '#5b3bd4', marginBottom: 4 }}>{e.company}</div>
                <ul style={{ margin: 0, paddingLeft: 14, color: '#333', fontSize: 10 }}>{(e.bullets || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            ))}
          </Section>
          {(r.projects && r.projects.length > 0) && (
            <Section title="Projects">
              {r.projects.map(p => (
                <div key={p.id || p.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: '#777' }}>{p.period || [p.start_date, p.end_date].filter(Boolean).join(' — ')}</span>
                  </div>
                  {p.description && <div style={{ fontSize: 10, color: '#333', margin: '2px 0' }}>{p.description}</div>}
                  {(p.technologies || []).length > 0 && (
                    <div style={{ fontSize: 9, fontStyle: 'italic', color: '#5b3bd4' }}>
                      {(p.technologies || []).slice(0, 6).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, padding: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, #ff6fae, #5b3bd4)', opacity: 0.7 }} />
      <div style={{ position: 'relative', padding: compact ? 28 : 44 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: compact ? 32 : 44, color: '#1a1530', lineHeight: 1, letterSpacing: '-0.03em' }}>{r.name}</div>
        <div style={{ fontSize: compact ? 13 : 16, color: '#a238c9', marginTop: 4, fontStyle: 'italic' }}>— {r.title}</div>
        <div style={{ fontSize: compact ? 11 : 13, fontStyle: 'italic', color: '#333', margin: '20px 0', lineHeight: 1.6, paddingLeft: 12, borderLeft: '2px solid #a238c9' }}>"{r.summary}"</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 16 : 20, color: '#5b3bd4', marginBottom: 8 }}>Experience</div>
        {r.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>{e.role}</span>
              <span style={{ fontSize: 10, color: '#a238c9', fontStyle: 'italic' }}>{e.period}</span>
            </div>
            <div style={{ fontSize: 10, color: '#5b3bd4', fontStyle: 'italic', marginBottom: 4 }}>{e.company}</div>
            <ul style={{ margin: 0, paddingLeft: 14, color: '#333', fontSize: 10 }}>{(e.bullets || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>
        ))}
        {(r.projects && r.projects.length > 0) && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: compact ? 16 : 20, color: '#5b3bd4', margin: '12px 0 8px' }}>Projects</div>
            {r.projects.map(p => (
              <div key={p.id || p.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: '#a238c9', fontStyle: 'italic' }}>{p.period || [p.start_date, p.end_date].filter(Boolean).join(' — ')}</span>
                </div>
                {p.description && <div style={{ fontSize: 10, color: '#333' }}>{p.description}</div>}
                {(p.technologies || []).length > 0 && (
                  <div style={{ fontSize: 9, fontStyle: 'italic', color: '#5b3bd4', marginTop: 2 }}>
                    {(p.technologies || []).slice(0, 6).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export const Builder = ({ template, setTemplate, setRoute }) => {
  const [resume, setResume] = React.useState(DEFAULT_RESUME);
  const [section, setSection] = React.useState('header');
  const [savedAt, setSavedAt] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  // Load saved resume on mount.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await UsersAPI.getResume();
        if (cancelled) return;
        if (r && typeof r === 'object') {
          setResume({ ...DEFAULT_RESUME, ...r });
        }
      } catch (e) {
        // Silently use defaults — endpoint returns null for new users.
        if (e?.status && e.status !== 404) setLoadError(e.message || 'Could not load resume');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (k, v) => setResume({ ...resume, [k]: v });

  const updateExp = (id, k, v) => setResume({ ...resume, experience: resume.experience.map(e => e.id === id ? { ...e, [k]: v } : e) });
  const addExp = () => setResume({ ...resume, experience: [...resume.experience, { id: Date.now(), role: '', company: '', period: '', bullets: [''] }] });
  const removeExp = (id) => setResume({ ...resume, experience: resume.experience.filter(e => e.id !== id) });

  const projects = resume.projects || [];
  const updateProj = (id, k, v) => setResume({ ...resume, projects: projects.map(p => p.id === id ? { ...p, [k]: v } : p) });
  const addProj = () => setResume({ ...resume, projects: [...projects, { id: Date.now(), name: '', description: '', url: '', period: '', technologies: [], highlights: [] }] });
  const removeProj = (id) => setResume({ ...resume, projects: projects.filter(p => p.id !== id) });

  const education = resume.education || [];
  const updateEdu = (id, k, v) => setResume({ ...resume, education: education.map(e => e.id === id ? { ...e, [k]: v } : e) });
  const addEdu = () => setResume({ ...resume, education: [...education, { id: Date.now(), school: '', degree: '', period: '' }] });
  const removeEdu = (id) => setResume({ ...resume, education: education.filter(e => e.id !== id) });

  const save = async () => {
    setSaving(true);
    try {
      await UsersAPI.saveResume(resume);
      setSavedAt(new Date());
    } catch (e) {
      setLoadError(e?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const sections = [
    ['header', 'Header', 'user'],
    ['summary', 'Summary', 'edit'],
    ['experience', 'Experience', 'briefcase'],
    ['projects', 'Projects', 'file'],
    ['skills', 'Skills', 'sparkles'],
    ['education', 'Education', 'file'],
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>RESUME BUILDER</div>
          <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>Compose your <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}>signal.</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={save} disabled={saving}>
            <Icon name="download" size={14} /> {saving ? 'Saving…' : 'Save to API'}
          </button>
          <button className="btn btn-primary" onClick={() => setRoute('preview')}><Icon name="file" size={14} /> Preview</button>
        </div>
      </div>

      <div className="panel" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="eyebrow" style={{ marginRight: 8 }}>TEMPLATE</div>
        {[['classic', 'Classic'], ['modern', 'Modern'], ['creative', 'Creative']].map(([k, label]) => (
          <button key={k} className={`btn btn-sm ${template === k ? 'btn-primary' : ''}`} onClick={() => setTemplate(k)}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: loadError ? 'var(--magenta)' : 'var(--star-400)' }}>
          {loadError ? `✗ ${loadError}` : (savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : 'Unsaved')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1.1fr', gap: 24 }} className="builder-grid">
        <div className="panel" style={{ padding: 12, height: 'max-content', position: 'sticky', top: 96 }}>
          {sections.map(([k, label, icon]) => (
            <button key={k} className={`nav-link ${section === k ? 'active' : ''}`}
              onClick={() => setSection(k)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8,
                background: section === k ? 'rgba(91,59,212,0.18)' : 'transparent', marginBottom: 4, justifyContent: 'flex-start' }}>
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="panel" style={{ padding: 28 }}>
          {section === 'header' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="eyebrow">HEADER</div>
              <div><label className="label">Full name</label><input className="input" value={resume.name} onChange={(e) => update('name', e.target.value)} /></div>
              <div><label className="label">Title</label><input className="input" value={resume.title} onChange={(e) => update('title', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="label">Email</label><input className="input" value={resume.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div><label className="label">Phone</label><input className="input" value={resume.phone} onChange={(e) => update('phone', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="label">Location</label><input className="input" value={resume.location} onChange={(e) => update('location', e.target.value)} /></div>
                <div><label className="label">Website</label><input className="input" value={resume.website} onChange={(e) => update('website', e.target.value)} /></div>
              </div>
            </div>
          )}
          {section === 'summary' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="eyebrow">SUMMARY</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <InsertLinkButton onInsert={(md) => update('summary', (resume.summary || '') + ' ' + md)} />
                  <AIRewriteButton value={resume.summary} kind="summary" onResult={(t) => update('summary', t)} />
                </div>
              </div>
              <textarea className="input textarea" rows="6" value={resume.summary || ''} onChange={(e) => update('summary', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          )}
          {section === 'experience' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="eyebrow">EXPERIENCE</div>
                <button className="btn btn-sm" onClick={addExp}><Icon name="plus" size={12} /> Add role</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {resume.experience.map((e, idx) => (
                  <div key={e.id} style={{ padding: 16, borderRadius: 12, border: 'var(--border-hair)', background: 'rgba(5,4,13,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--star-400)' }}>ROLE {idx + 1}</span>
                      {resume.experience.length > 1 && <button className="btn btn-sm btn-ghost" onClick={() => removeExp(e.id)}>Remove</button>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input className="input" placeholder="Role" value={e.role || ''} onChange={(ev) => updateExp(e.id, 'role', ev.target.value)} />
                      <input className="input" placeholder="Company" value={e.company || ''} onChange={(ev) => updateExp(e.id, 'company', ev.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input className="input" placeholder="Start (e.g. May 2024)" value={(e.period || '').split(/\s*[-–—]\s*/)[0] || ''}
                        onChange={(ev) => {
                          const end = (e.period || '').split(/\s*[-–—]\s*/)[1] || '';
                          updateExp(e.id, 'period', `${ev.target.value}${end ? ' — ' + end : ''}`);
                        }} />
                      <input className="input" placeholder="End (e.g. Present)" value={(e.period || '').split(/\s*[-–—]\s*/)[1] || ''}
                        onChange={(ev) => {
                          const start = (e.period || '').split(/\s*[-–—]\s*/)[0] || '';
                          updateExp(e.id, 'period', `${start}${ev.target.value ? ' — ' + ev.target.value : ''}`);
                        }} />
                    </div>
                    <textarea className="input textarea" rows="3" placeholder="One bullet per line" value={(e.bullets || []).join('\n')} onChange={(ev) => updateExp(e.id, 'bullets', ev.target.value.split('\n'))} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {(e.bullets || []).filter(Boolean).map((b, bi) => (
                        <AIRewriteButton key={bi} value={b} kind="bullet" label={`Rewrite bullet ${bi + 1}`}
                          context={`${e.role || ''} at ${e.company || ''}`}
                          onResult={(t) => {
                            const next = [...(e.bullets || [])]; next[bi] = t;
                            updateExp(e.id, 'bullets', next);
                          }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="eyebrow">PROJECTS</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ImportGitHubButton onImported={(p) => setResume({
                    ...resume,
                    projects: [...(resume.projects || []), {
                      id: Date.now(),
                      name: p.name || '',
                      description: p.description || '',
                      url: p.url || '',
                      period: [p.start_date, p.end_date].filter(Boolean).join(' — ') || '',
                      start_date: p.start_date || '',
                      end_date: p.end_date || '',
                      technologies: p.technologies || [],
                      highlights: p.highlights || [],
                    }],
                  })} />
                  <button className="btn btn-sm" onClick={addProj}><Icon name="plus" size={12} /> Add project</button>
                </div>
              </div>
              {projects.length === 0 && (
                <div style={{ padding: 14, fontSize: 13, color: 'var(--star-400)', border: 'var(--border-hair)', borderRadius: 8 }}>
                  No projects yet — click <strong>Import from GitHub</strong> to pull a repo's README and have Gemini extract the description, dates, and top tech, or add one manually.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projects.map((p, idx) => (
                  <div key={p.id} style={{ padding: 16, borderRadius: 12, border: 'var(--border-hair)', background: 'rgba(5,4,13,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--star-400)' }}>PROJECT {idx + 1}</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => removeProj(p.id)}>Remove</button>
                    </div>
                    <input className="input" placeholder="Project name" value={p.name || ''} onChange={(ev) => updateProj(p.id, 'name', ev.target.value)} style={{ marginBottom: 8 }} />
                    <input className="input" placeholder="https://github.com/... or live URL" value={p.url || ''} onChange={(ev) => updateProj(p.id, 'url', ev.target.value)} style={{ marginBottom: 8 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input className="input" placeholder="Start (e.g. May 2024)"
                        value={(p.period || '').split(/\s*[-–—]\s*/)[0] || ''}
                        onChange={(ev) => {
                          const end = (p.period || '').split(/\s*[-–—]\s*/)[1] || '';
                          updateProj(p.id, 'period', `${ev.target.value}${end ? ' — ' + end : ''}`);
                        }} />
                      <input className="input" placeholder="End (e.g. Jun 2024)"
                        value={(p.period || '').split(/\s*[-–—]\s*/)[1] || ''}
                        onChange={(ev) => {
                          const start = (p.period || '').split(/\s*[-–—]\s*/)[0] || '';
                          updateProj(p.id, 'period', `${start}${ev.target.value ? ' — ' + ev.target.value : ''}`);
                        }} />
                    </div>
                    <textarea className="input textarea" rows="3" placeholder="What did you build? Lead with impact."
                      value={p.description || ''} onChange={(ev) => updateProj(p.id, 'description', ev.target.value)} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <InsertLinkButton onInsert={(md) => updateProj(p.id, 'description', (p.description || '') + ' ' + md)} />
                      <AIRewriteButton value={p.description} kind="project_description"
                        context={`Project: ${p.name || ''}`} onResult={(t) => updateProj(p.id, 'description', t)} />
                    </div>
                    <input className="input" placeholder="Technologies (comma-separated, e.g. React, FastAPI, Postgres)"
                      value={(p.technologies || []).join(', ')}
                      onChange={(ev) => updateProj(p.id, 'technologies', ev.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      style={{ marginTop: 10 }} />
                    <TechChips items={p.technologies} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'skills' && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>SKILLS</div>
              <textarea className="input textarea" rows="3" value={resume.skills.join(', ')} onChange={(e) => update('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {resume.skills.map(s => <span key={s} className="tag-chip">{s}</span>)}
              </div>
            </div>
          )}
          {section === 'education' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="eyebrow">EDUCATION</div>
                <button className="btn btn-sm" onClick={addEdu}><Icon name="plus" size={12} /> Add degree</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {education.map((ed, idx) => (
                  <div key={ed.id} style={{ padding: 16, borderRadius: 12, border: 'var(--border-hair)', background: 'rgba(5,4,13,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--star-400)' }}>DEGREE {idx + 1}</span>
                      {education.length > 1 && <button className="btn btn-sm btn-ghost" onClick={() => removeEdu(ed.id)}>Remove</button>}
                    </div>
                    <input className="input" placeholder="School / institution (e.g. IIT Bombay)" value={ed.school || ''} onChange={(e) => updateEdu(ed.id, 'school', e.target.value)} style={{ marginBottom: 8 }} />
                    <input className="input" placeholder="Degree (e.g. M.S. Computer Science / B.Tech ECE)" value={ed.degree || ''} onChange={(e) => updateEdu(ed.id, 'degree', e.target.value)} style={{ marginBottom: 8 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input className="input" placeholder="Start (e.g. 2022)"
                        value={(ed.period || '').split(/\s*[-–—]\s*/)[0] || ''}
                        onChange={(e) => {
                          const end = (ed.period || '').split(/\s*[-–—]\s*/)[1] || '';
                          updateEdu(ed.id, 'period', `${e.target.value}${end ? ' — ' + end : ''}`);
                        }} />
                      <input className="input" placeholder="End (e.g. 2024)"
                        value={(ed.period || '').split(/\s*[-–—]\s*/)[1] || ''}
                        onChange={(e) => {
                          const start = (ed.period || '').split(/\s*[-–—]\s*/)[0] || '';
                          updateEdu(ed.id, 'period', `${start}${e.target.value ? ' — ' + e.target.value : ''}`);
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>LIVE PREVIEW · {template.toUpperCase()}</div>
          <ResumePreview resume={resume} template={template} compact />
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .builder-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export const Preview = ({ template, setRoute }) => {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setRoute('builder')}><Icon name="arrow-left" size={14} /> Back to builder</button>
        <button className="btn"><Icon name="download" size={14} /> Download PDF</button>
      </div>
      <ResumePreview resume={DEFAULT_RESUME} template={template} />
    </div>
  );
};
