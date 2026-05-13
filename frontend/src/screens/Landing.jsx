import React from 'react';
import { Icon, StarField } from '../components/UI.jsx';
import { SplitText, WordRotator, Typewriter } from '../components/Kinetic.jsx';
import { Magnetic, ScrollSplit, Hero3D, useScrollReveal } from '../components/MoncyFX.jsx';

const Landing = ({ setRoute, heroAnim }) => {
  const phrases = ['recruiters love.', 'matches the role.', 'gets interviews.', 'feels like you.'];
  useScrollReveal();

  const [time, setTime] = React.useState('');
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="moncy-mode" style={{ position: 'relative', overflow: 'hidden' }}>
      <StarField count={60} />

      <section style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64,
        alignItems: 'center', maxWidth: 1280, margin: '0 auto',
        padding: '64px 48px 100px',
      }} className="hero-grid">
        <div>
          <div className="moncy-eyebrow" style={{ marginBottom: 28 }}>
            <span className="dot" />
            AVAILABLE NOW · {time} IST · AI RESUME OS
          </div>
          <h1 className="hero-display" style={{ fontSize: 'clamp(56px, 9vw, 132px)', margin: 0, marginBottom: 28, color: 'var(--star-100)' }} data-cursor="explore">
            <SplitText text="LAND THE" delayStart={0.1} stagger={0.04} />
            <br />
            <span className="ital"><SplitText text="job" delayStart={0.5} stagger={0.04} /></span>
            <span style={{ display: 'inline-block', width: '0.4em' }} />
            <span className="spaced"><SplitText text="THAT" delayStart={0.7} stagger={0.04} /></span>
            <br />
            <SplitText text="MATTERS." delayStart={0.9} stagger={0.05} />
            <br />
            <div style={{ fontSize: '0.5em', marginTop: 10 }}>
              {heroAnim === 'rotate' ? (<WordRotator words={phrases} />)
                : heroAnim === 'shine' ? (<span className="shine-text" style={{ fontStyle: 'italic' }}>recruiters love.</span>)
                : (<span style={{ fontStyle: 'italic' }}><Typewriter phrases={phrases} /></span>)}
            </div>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--star-300)', maxWidth: 520, marginBottom: 36, lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--star-100)', fontWeight: 500 }}>The AI-powered Resume OS.</strong> Jobify analyzes job descriptions and reconstructs your resume in seconds. Precise keywords, semantic matching, and a design that stands out.
          </p>
          <div className="cta-row" style={{ marginBottom: 44 }}>
            <Magnetic strength={0.25}>
              <button className="btn btn-primary btn-lg" onClick={() => setRoute('signup')}>
                <Icon name="sparkles" size={18} /> Tailor my resume
              </button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <button className="btn btn-lg" onClick={() => setRoute('jobs')}>
                Browse jobs <Icon name="arrow-right" size={16} />
              </button>
            </Magnetic>
          </div>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            {[['3.4×', 'callback rate'], ['89%', 'match accuracy'], ['< 30s', 'tailoring time']].map(([n, l]) => (
              <div key={l}>
                <div className="mono" style={{ fontSize: 30, color: 'var(--star-100)', fontWeight: 600, letterSpacing: '-0.02em' }}>{n}</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <Hero3D />
      </section>

      <div className="award-marquee">
        {[0, 1].map(i => (
          <div className="award-marquee-track" key={i}>
            {['3.4x higher callback rate', 'Awwwards Honoree 2026', 'Best AI UI/UX Design', 'FWA of the Month', 'Built for Senior Engineers', 'Trusted by devs at FAANG'].map(t => (
              <div className="award-item" key={t}>{t} <span className="star">✦</span></div>
            ))}
          </div>
        ))}
      </div>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 48px' }}>
        <div className="section-num"><span className="pill">02</span> HOW IT WORKS</div>
        <h2 className="hero-display" style={{ fontSize: 'clamp(40px, 5vw, 72px)', marginBottom: 64, maxWidth: 900 }}>
          <ScrollSplit text="From profile to perfect-fit." />
          <br />
          <span className="ital"><ScrollSplit text="In three." stagger={0.04} /></span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="how-grid">
          {[
            { n: '01', t: 'Build your story', d: 'Drop your details into our header-wise editor. Pick from classic, modern, or creative templates.', icon: 'user' },
            { n: '02', t: 'Match with jobs', d: 'We rank live openings by your skills and surface the ones that actually fit — with a transparent match score.', icon: 'briefcase' },
            { n: '03', t: 'Tailor in seconds', d: 'Paste any job URL. Jobify rewrites the relevant sections so your resume reads like it was written for that role.', icon: 'sparkles' },
          ].map((s, i) => (
            <div key={s.n} className="panel" data-reveal data-reveal-delay={i * 0.12} style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div className="mono" style={{ fontSize: 14, color: 'var(--star-400)' }}>{s.n}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--star-100)' }}>
                  <Icon name={s.icon} size={20} />
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '0 0 12px', color: 'var(--star-100)', fontWeight: 400 }}>{s.t}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 96px' }} data-reveal>
        <div className="panel" style={{ padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05), transparent 60%)' }} />
          <div style={{ position: 'relative' }}>
            <div className="section-num" style={{ justifyContent: 'center', marginBottom: 16 }}><span className="pill">03</span> READY?</div>
            <h2 className="hero-display" style={{ fontSize: 'clamp(40px, 6vw, 84px)', margin: '0 0 20px' }}>
              Your next role is<br/><span className="shine-text" style={{ fontStyle: 'italic' }}>already out there.</span>
            </h2>
            <p style={{ marginBottom: 32, fontSize: 16, maxWidth: 520, marginInline: 'auto' }}>Start free. No credit card. We won't pretend an AI knows you better than you do — we just help it sound like it does.</p>
            <Magnetic strength={0.25}>
              <button className="btn btn-primary btn-lg" onClick={() => setRoute('signup')}>
                Start building <Icon name="rocket" size={16} />
              </button>
            </Magnetic>
          </div>
        </div>
      </section>

      <footer style={{ padding: '32px 48px', borderTop: 'var(--border-hair)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, color: 'var(--star-400)', fontSize: 13 }}>
        <div>© 2026 Jobify · The AI Resume Engine</div>
        <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>Privacy</span><span>Terms</span><span>Contact</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
