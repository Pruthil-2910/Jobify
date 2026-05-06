import React from 'react';
import { Icon } from '../components/UI.jsx';
import { SplitText } from '../components/Kinetic.jsx';

const Onboarding = ({ setRoute }) => {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    role: '',
    seniority: 'mid',
    skills: ['React', 'TypeScript'],
    location: 'Remote',
    salary: 120,
  });
  const allSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'Figma', 'GraphQL', 'PostgreSQL', 'Next.js', 'Design systems', 'AWS', 'PyTorch', 'LLMs', 'Tailwind', 'CSS', 'Swift'];

  const steps = [
    {
      title: 'What role are you orbiting?',
      sub: 'Tell us the role title and seniority you\'re aiming for.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label">Target role</label>
            <input className="input" placeholder="e.g. Senior Frontend Engineer" value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} />
          </div>
          <div>
            <label className="label">Seniority</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['junior', 'mid', 'senior', 'staff'].map(s => (
                <button key={s} className={`btn ${data.seniority === s ? 'btn-primary' : ''}`} onClick={() => setData({ ...data, seniority: s })} style={{ textTransform: 'capitalize', justifyContent: 'center' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Which constellations do you know?',
      sub: 'Pick your top skills. We\'ll match you with jobs that need them.',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allSkills.map(s => {
            const on = data.skills.includes(s);
            return (
              <button key={s}
                className={`tag-chip ${on ? 'match-high' : ''}`}
                style={{ cursor: 'pointer', border: on ? undefined : '1px solid rgba(201,196,240,0.22)', background: on ? undefined : 'transparent', color: on ? undefined : 'var(--star-300)' }}
                onClick={() => setData({ ...data, skills: on ? data.skills.filter(x => x !== s) : [...data.skills, s] })}>
                {on && <Icon name="check" size={12} />} {s}
              </button>
            );
          })}
        </div>
      )
    },
    {
      title: 'Where do you want to land?',
      sub: 'Location preferences and target compensation.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label">Location</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['Remote', 'Hybrid', 'On-site'].map(l => (
                <button key={l} className={`btn ${data.location === l ? 'btn-primary' : ''}`} onClick={() => setData({ ...data, location: l })} style={{ justifyContent: 'center' }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Target salary · <span className="mono" style={{ color: 'var(--nebula-cyan)' }}>${data.salary}k+</span></label>
            <input type="range" min="40" max="300" step="10" value={data.salary} onChange={(e) => setData({ ...data, salary: +e.target.value })} style={{ width: '100%', accentColor: 'var(--nebula-cyan)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--star-400)', marginTop: 4 }}>
              <span>$40k</span><span>$300k+</span>
            </div>
          </div>
        </div>
      )
    },
  ];

  const cur = steps[step];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px' }}>
      <div className="stepper" style={{ marginBottom: 48, justifyContent: 'center' }}>
        {steps.map((_, i) => (
          <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>STEP {step + 1} OF {steps.length}</div>
        <h1 className="h-display" style={{ fontSize: 48, margin: '0 0 12px' }}>
          <SplitText key={step} text={cur.title} />
        </h1>
        <p>{cur.sub}</p>
      </div>

      <div className="panel" style={{ padding: 32, marginBottom: 24 }}>
        {cur.content}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button className="btn" onClick={() => step === 0 ? setRoute('home') : setStep(step - 1)}>
          <Icon name="arrow-left" size={14} /> Back
        </button>
        <button className="btn btn-primary" onClick={() => step === steps.length - 1 ? setRoute('settings') : setStep(step + 1)}>
          {step === steps.length - 1 ? 'Finish & set up API key' : 'Continue'} <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
