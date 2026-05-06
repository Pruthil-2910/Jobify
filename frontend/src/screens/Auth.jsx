import React from 'react';
import { Icon, StarField } from '../components/UI.jsx';
import { SplitText } from '../components/Kinetic.jsx';
import ProgrammerScene from '../components/ProgrammerScene.jsx';
import { AuthAPI } from '../api.js';

const AuthShell = ({ children, side }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 72px)' }} className="auth-grid">
    <div style={{ padding: '64px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560 }} className="auth-form">
      {children}
    </div>
    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="auth-side hide-mobile">
      <StarField count={40} />
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,59,212,0.5) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      {side}
    </div>
    <style>{`
      @media (max-width: 900px) {
        .auth-grid { grid-template-columns: 1fr !important; }
        .auth-form { padding: 32px 24px !important; }
      }
    `}</style>
  </div>
);

export const SignUp = ({ setRoute, setSignedIn }) => {
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async () => {
    if (!form.email || !form.password) { setError('Email and password required.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await AuthAPI.register(form.email, form.password);
      setSignedIn(true);
      setRoute('onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell side={<ProgrammerScene size={420} />}>
      <button className="btn btn-ghost btn-sm" onClick={() => setRoute('home')} style={{ alignSelf: 'flex-start', marginBottom: 32, padding: '6px 10px' }}>
        <Icon name="arrow-left" size={14} /> Back
      </button>
      <div className="eyebrow" style={{ marginBottom: 12 }}>JOIN JOBIFY</div>
      <h1 className="h-display" style={{ fontSize: 48, margin: '0 0 12px' }}>
        <SplitText text="Begin your" /> <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}><SplitText text="orbit." delayStart={0.4} /></span>
      </h1>
      <p style={{ marginBottom: 32 }}>Create an account in 30 seconds. We'll guide you in.</p>

      {error && <div style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff5050' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Riya Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" placeholder="you@orbit.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading} style={{ marginTop: 12, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Creating…' : 'Create account'} <Icon name="arrow-right" size={16} />
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--star-400)', marginTop: 16 }}>
          Already have an account? <a onClick={() => setRoute('login')} style={{ cursor: 'pointer' }}>Sign in</a>
        </div>
      </div>
    </AuthShell>
  );
};

export const Login = ({ setRoute, setSignedIn }) => {
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async () => {
    if (!form.email || !form.password) { setError('Email and password required.'); return; }
    setError(''); setLoading(true);
    try {
      await AuthAPI.login(form.email, form.password);
      setSignedIn(true);
      setRoute('jobs');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell side={<ProgrammerScene size={420} />}>
      <button className="btn btn-ghost btn-sm" onClick={() => setRoute('home')} style={{ alignSelf: 'flex-start', marginBottom: 32, padding: '6px 10px' }}>
        <Icon name="arrow-left" size={14} /> Back
      </button>
      <div className="eyebrow" style={{ marginBottom: 12 }}>WELCOME BACK</div>
      <h1 className="h-display" style={{ fontSize: 48, margin: '0 0 12px' }}>
        <SplitText text="Realign your" /> <span style={{ fontStyle: 'italic', color: 'var(--nebula-cyan)' }}><SplitText text="orbit." delayStart={0.4} /></span>
      </h1>
      <p style={{ marginBottom: 32 }}>Pick up where you left off.</p>

      {error && <div style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff5050' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Email</label>
          <input className="input" placeholder="you@orbit.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading} style={{ marginTop: 12, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Signing in…' : 'Sign in'} <Icon name="arrow-right" size={16} />
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--star-400)', marginTop: 16 }}>
          New here? <a onClick={() => setRoute('signup')} style={{ cursor: 'pointer' }}>Create an account</a>
        </div>
      </div>
    </AuthShell>
  );
};
