// Small reusable controls for the resume Builder:
//   <AIRewriteButton value=... kind=... onResult=... />
//   <InsertLinkButton onInsert=... />
//   <ImportGitHubButton onImported=... />

import React from 'react';
import { Icon } from './UI.jsx';
import { AIAPI } from '../api.js';

export const AIRewriteButton = ({ value, kind = 'generic', context, onResult, label = 'Rewrite with AI', size = 'sm' }) => {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const click = async () => {
    if (!value || !value.trim()) return;
    setBusy(true); setErr('');
    try {
      const r = await AIAPI.rewrite(value, kind, context);
      if (r?.rewritten) onResult(r.rewritten);
    } catch (e) {
      setErr(e?.status === 401 ? 'Set Gemini API key first' : (e?.message || 'Failed'));
    } finally { setBusy(false); }
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button type="button" className={`btn btn-${size}`} onClick={click} disabled={busy || !value?.trim?.()} title="Rewrite with Gemini">
        <Icon name="sparkles" size={12} /> {busy ? 'Rewriting…' : label}
      </button>
      {err && <span style={{ fontSize: 11, color: 'var(--magenta)' }}>{err}</span>}
    </span>
  );
};

export const InsertLinkButton = ({ onInsert }) => {
  const click = () => {
    const label = window.prompt('Link text');
    if (!label) return;
    const url = window.prompt('URL (https://...)');
    if (!url) return;
    onInsert(`[${label}](${url})`);
  };
  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={click} title="Insert markdown link">
      <Icon name="link" size={12} /> Link
    </button>
  );
};

export const ImportGitHubButton = ({ onImported, size = 'sm' }) => {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const click = async () => {
    const url = window.prompt('GitHub repo URL (e.g. https://github.com/user/repo)');
    if (!url) return;
    setBusy(true); setErr('');
    try {
      const parsed = await AIAPI.extractGithub(url.trim());
      onImported(parsed);
    } catch (e) {
      setErr(e?.status === 401 ? 'Set Gemini API key first' : (e?.message || 'Failed'));
    } finally { setBusy(false); }
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button type="button" className={`btn btn-${size}`} onClick={click} disabled={busy} title="Pull README + extract via Gemini">
        <Icon name="download" size={12} /> {busy ? 'Importing…' : 'Import from GitHub'}
      </button>
      {err && <span style={{ fontSize: 11, color: 'var(--magenta)' }}>{err}</span>}
    </span>
  );
};

/** Render a chip cloud of strings (light italic) — used for project technologies. */
export const TechChips = ({ items = [] }) => {
  if (!items?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {items.map((t, i) => (
        <span key={i} style={{
          fontSize: 11, fontStyle: 'italic', color: 'var(--star-300)',
          padding: '2px 8px', borderRadius: 999,
          border: '1px solid rgba(201,196,240,0.18)',
          background: 'rgba(76,195,255,0.06)',
        }}>{t}</span>
      ))}
    </div>
  );
};
