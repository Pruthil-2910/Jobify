import React from 'react';
import { Nav } from './components/UI.jsx';
import { CustomCursor } from './components/MoncyFX.jsx';
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from './components/TweaksPanel.jsx';

import Landing from './screens/Landing.jsx';
import { SignUp, Login } from './screens/Auth.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Jobs from './screens/Jobs.jsx';
import JobDetail from './screens/JobDetail.jsx';
import { Builder, Preview } from './screens/Builder.jsx';
import Profile from './screens/Profile.jsx';
import Chat from './screens/Chat.jsx';
import Settings from './screens/Settings.jsx';

import { AuthAPI, UsersAPI, HealthAPI } from './api.js';
import { MOCK_JOBS } from './mock.js';

const ROUTE_TO_HASH = {
  home: '/', login: '/login', signup: '/signup', onboarding: '/onboarding',
  jobs: '/jobs', jobDetail: '/job', builder: '/builder', preview: '/preview',
  profile: '/profile', chat: '/chat', settings: '/settings',
};
const HASH_TO_ROUTE = Object.fromEntries(Object.entries(ROUTE_TO_HASH).map(([k, v]) => [v, k]));

function useHashRouter() {
  const hashToRoute = () => {
    const hash = (window.location.hash || '#/').slice(1);
    return HASH_TO_ROUTE[hash] || 'home';
  };
  const [route, setRouteState] = React.useState(hashToRoute());
  React.useEffect(() => {
    const handler = () => setRouteState(hashToRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = React.useCallback((routeKey) => {
    const hash = ROUTE_TO_HASH[routeKey] || '/';
    window.location.hash = '#' + hash;
  }, []);
  return [route, navigate];
}

const TWEAK_DEFAULTS = { theme: 'dark', heroAnim: 'rotate', template: 'modern' };

export default function App() {
  const [route, navigate] = useHashRouter();
  const [signedIn, setSignedIn] = React.useState(AuthAPI.isLoggedIn());
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [backendOnline, setBackendOnline] = React.useState(null);

  React.useEffect(() => { HealthAPI.check().then(setBackendOnline); }, []);

  React.useEffect(() => {
    if (AuthAPI.isLoggedIn()) {
      UsersAPI.getMe().then(() => setSignedIn(true)).catch(() => {
        AuthAPI.logout();
        setSignedIn(false);
      });
    }
  }, []);

  React.useEffect(() => {
    document.body.classList.toggle('theme-light', tweaks.theme === 'light');
  }, [tweaks.theme]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);

  const setRoute = React.useCallback((r) => {
    if (r === 'home') {
      AuthAPI.logout();
      setSignedIn(false);
    }
    navigate(r);
  }, [navigate]);

  const screen = (() => {
    switch (route) {
      case 'home':       return <Landing setRoute={setRoute} heroAnim={tweaks.heroAnim} />;
      case 'login':      return <Login setRoute={setRoute} setSignedIn={setSignedIn} />;
      case 'signup':     return <SignUp setRoute={setRoute} setSignedIn={setSignedIn} />;
      case 'onboarding': return <Onboarding setRoute={setRoute} />;
      case 'jobs':       return <Jobs setRoute={setRoute} setSelectedJob={setSelectedJob} />;
      case 'jobDetail':  return <JobDetail job={selectedJob} setRoute={setRoute} />;
      case 'builder':    return <Builder template={tweaks.template} setTemplate={(t) => setTweak('template', t)} setRoute={setRoute} />;
      case 'preview':    return <Preview template={tweaks.template} setRoute={setRoute} />;
      case 'profile':    return <Profile setRoute={setRoute} />;
      case 'chat':       return <Chat setRoute={setRoute} />;
      case 'settings':   return <Settings setRoute={setRoute} />;
      default:           return <Landing setRoute={setRoute} heroAnim={tweaks.heroAnim} />;
    }
  })();

  return (
    <div className="app-shell">
      <CustomCursor />
      <div className="bg-stars" />

      {backendOnline !== null && (
        <div style={{
          position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
          padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          background: backendOnline ? 'rgba(76,195,127,0.15)' : 'rgba(255,80,80,0.15)',
          color: backendOnline ? '#4cc37f' : '#ff5050',
          border: `1px solid ${backendOnline ? 'rgba(76,195,127,0.3)' : 'rgba(255,80,80,0.3)'}`,
          fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? '#4cc37f' : '#ff5050' }} />
          API {backendOnline ? 'connected' : 'offline'}
        </div>
      )}

      <Nav
        current={route} setRoute={setRoute}
        theme={tweaks.theme} setTheme={(t) => setTweak('theme', t)}
        signedIn={signedIn}
      />
      {screen}

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio value={tweaks.theme} onChange={(v) => setTweak('theme', v)}
            options={[['dark', 'Dark'], ['light', 'Light']]} />
        </TweakSection>
        <TweakSection title="Hero animation">
          <TweakRadio value={tweaks.heroAnim} onChange={(v) => setTweak('heroAnim', v)}
            options={[['rotate', 'Word morph'], ['type', 'Typewriter'], ['shine', 'Shine sweep']]} />
        </TweakSection>
        <TweakSection title="Resume template">
          <TweakRadio value={tweaks.template} onChange={(v) => setTweak('template', v)}
            options={[['classic', 'Classic'], ['modern', 'Modern'], ['creative', 'Creative']]} />
        </TweakSection>
        <TweakSection title="Quick jump">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['home','Home'],['signup','Sign up'],['jobs','Jobs'],['jobDetail','Tailor'],['builder','Builder'],['preview','Resume'],['profile','Profile'],['chat','Chat'],['settings','Settings']].map(([r, l]) => (
              <button key={r} className="btn btn-sm" onClick={() => {
                if (r === 'jobDetail') setSelectedJob(MOCK_JOBS[0]);
                setRoute(r);
              }}>{l}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
