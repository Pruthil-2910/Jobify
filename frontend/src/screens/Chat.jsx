import React from 'react';
import { AuthAPI, ChatAPI } from '../api.js';

const Chat = ({ setRoute }) => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const scrollerRef = React.useRef(null);

  React.useEffect(() => { if (!AuthAPI.isLoggedIn()) setRoute('login'); }, []);
  React.useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput(''); setBusy(true);
    try {
      const r = await ChatAPI.send(text);
      setMessages(m => [...m, { role: 'bot', text: r.response, intent: r.intent, jobs: r.jobs_referenced || [] }]);
    } catch (e) {
      const detail = e.status === 401 ? 'Set your Gemini API key in Settings first.' : (e.message || 'Chat failed');
      setMessages(m => [...m, { role: 'bot', text: detail, error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 48px 96px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>AGENTIC RAG</div>
      <h1 className="h-display" style={{ fontSize: 48, margin: 0, marginBottom: 24 }}>Career chat</h1>

      <div className="panel" style={{ padding: 0, height: 'calc(100vh - 280px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
        <div ref={scrollerRef} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--star-400)', fontSize: 14, textAlign: 'center', marginTop: 80 }}>
              Ask about jobs, your resume, or career strategy. The agent picks between semantic search, analytics, and general advice.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 16, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '78%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                background: m.role === 'user' ? 'var(--nebula-cyan)' : (m.error ? 'rgba(255,80,80,0.1)' : 'var(--star-900)'),
                color: m.role === 'user' ? '#000' : (m.error ? 'var(--magenta)' : 'var(--star-100)'),
                border: m.role === 'user' ? 'none' : 'var(--border-hair)',
              }}>
                {m.text}
                {m.intent && <div className="mono" style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>intent: {m.intent}</div>}
                {m.jobs && m.jobs.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {m.jobs.slice(0, 3).map(j => (
                      <div key={j.id} style={{ fontSize: 12, marginBottom: 4 }}>• {j.title} — {j.company}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div style={{ color: 'var(--star-400)', fontSize: 13, fontStyle: 'italic' }}>thinking…</div>}
        </div>
        <div style={{ padding: 16, borderTop: 'var(--border-hair)', display: 'flex', gap: 8 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask the agent…" style={{ flex: 1, padding: 12, fontSize: 14 }} disabled={busy} />
          <button className="btn btn-primary" onClick={send} disabled={busy || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
