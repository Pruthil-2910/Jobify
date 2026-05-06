import React from 'react';
import { AuthAPI, ProjectsAPI, TokenStore } from '../api.js';

const Settings = ({ setRoute }) => {
  const [keyInput, setKeyInput]   = React.useState(TokenStore.geminiKey() || '');
  const [keyMsg, setKeyMsg]       = React.useState('');
  const [keyBusy, setKeyBusy]     = React.useState(false);

  const [urlsInput, setUrlsInput] = React.useState('');
  const [ingestMsg, setIngestMsg] = React.useState('');
  const [ingestBusy, setIngestBusy] = React.useState(false);
  const [projects, setProjects]   = React.useState([]);

  React.useEffect(() => {
    if (!AuthAPI.isLoggedIn()) { setRoute('login'); return; }
    ProjectsAPI.list().then(setProjects).catch(() => {});
  }, []);

  const saveKey = async () => {
    setKeyBusy(true); setKeyMsg('');
    try {
      const v = await AuthAPI.validateKey(keyInput);
      if (!v?.valid) { setKeyMsg('✗ Gemini rejected this key'); return; }
      await AuthAPI.setApiKey(keyInput);
      setKeyMsg('✓ Saved & verified');
    } catch (e) {
      setKeyMsg(`✗ ${e.message || 'Failed to save'}`);
    } finally { setKeyBusy(false); }
  };

  const ingestUrls = async () => {
    const urls = urlsInput.split('\n').map(s => s.trim()).filter(Boolean);
    if (!urls.length) return;
    setIngestBusy(true); setIngestMsg('');
    try {
      const r = await ProjectsAPI.ingest(urls);
      setIngestMsg(`✓ Ingested ${r.ingested}, failed ${r.failed?.length || 0}`);
      setUrlsInput('');
      ProjectsAPI.list().then(setProjects).catch(() => {});
    } catch (e) {
      setIngestMsg(`✗ ${e.message || 'Ingest failed'}`);
    } finally { setIngestBusy(false); }
  };

  const removeProject = async (id) => {
    try { await ProjectsAPI.remove(id); setProjects(p => p.filter(x => x.id !== id)); } catch {}
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 48px 96px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>SETTINGS</div>
      <h1 className="h-display" style={{ fontSize: 48, margin: 0, marginBottom: 24 }}>Configuration</h1>

      <div className="panel" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>Gemini API key</h3>
        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--star-400)' }}>
          Required for chat, JD matching, and project ingest. Get one at <span className="mono">aistudio.google.com/apikey</span>. Stored encrypted on the server.
        </p>
        <input type="password" placeholder="AIza..." value={keyInput}
          onChange={e => setKeyInput(e.target.value)} className="input"
          style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={saveKey} disabled={keyBusy || !keyInput}>
            {keyBusy ? 'Verifying…' : 'Save & verify'}
          </button>
          <span style={{ fontSize: 12, color: keyMsg.startsWith('✓') ? 'var(--success)' : 'var(--magenta)' }}>{keyMsg}</span>
        </div>
      </div>

      <div className="panel" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>Ingest projects</h3>
        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--star-400)' }}>
          One URL per line — GitHub repos or LinkedIn profile URLs. Used as evidence for JD matching.
        </p>
        <textarea rows={4} value={urlsInput} className="input textarea"
          placeholder="https://github.com/user/repo&#10;https://linkedin.com/in/user"
          onChange={e => setUrlsInput(e.target.value)}
          style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={ingestUrls} disabled={ingestBusy || !urlsInput.trim()}>
            {ingestBusy ? 'Ingesting…' : 'Ingest'}
          </button>
          <span style={{ fontSize: 12, color: ingestMsg.startsWith('✓') ? 'var(--success)' : 'var(--magenta)' }}>{ingestMsg}</span>
        </div>

        {projects.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>YOUR PROJECTS ({projects.length})</div>
            {projects.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: 'var(--border-hair)' }}>
                <span className="mono" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.source_url}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => removeProject(p.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
