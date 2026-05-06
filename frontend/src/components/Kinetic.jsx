import React from 'react';

export const SplitText = ({ text, delayStart = 0, stagger = 0.04, className = '', el = 'span' }) => {
  const Tag = el;
  return (
    <Tag className={className} aria-label={text} style={{ display: 'inline-block' }}>
      {text.split('').map((c, i) => (
        <span key={i} className="split-char"
          style={{ animationDelay: `${delayStart + i * stagger}s`, whiteSpace: c === ' ' ? 'pre' : 'normal' }}>
          {c}
        </span>
      ))}
    </Tag>
  );
};

export const WordRotator = ({ words, interval = 2200 }) => {
  const [i, setI] = React.useState(0);
  const [phase, setPhase] = React.useState('in');
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), interval - 600);
    const t2 = setTimeout(() => { setI((i + 1) % words.length); setPhase('in'); }, interval);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [i, interval, words.length]);
  return (
    <span className="morph-stage">
      <span key={i + '-' + phase}
        style={{ display: 'inline-block',
          animation: phase === 'in' ? 'morph-in 0.6s var(--ease-orbit) forwards' : 'morph-out 0.6s var(--ease-orbit) forwards' }}>
        {words[i]}
      </span>
    </span>
  );
};

export const Typewriter = ({ phrases, typeSpeed = 60, pauseAtEnd = 1400 }) => {
  const [text, setText] = React.useState('');
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  React.useEffect(() => {
    const phrase = phrases[phraseIdx];
    if (!deleting && text === phrase) { const t = setTimeout(() => setDeleting(true), pauseAtEnd); return () => clearTimeout(t); }
    if (deleting && text === '') { setDeleting(false); setPhraseIdx((phraseIdx + 1) % phrases.length); return; }
    const t = setTimeout(() => {
      if (deleting) setText(phrase.slice(0, text.length - 1));
      else setText(phrase.slice(0, text.length + 1));
    }, deleting ? typeSpeed / 2 : typeSpeed);
    return () => clearTimeout(t);
  }, [text, deleting, phraseIdx, phrases, typeSpeed, pauseAtEnd]);
  return (<span style={{ color: 'var(--nebula-cyan)' }}>{text}<span className="typing-cursor" /></span>);
};
