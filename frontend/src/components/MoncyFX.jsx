import React from 'react';

export const useMagnetic = (strength = 0.35) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [strength]);
  return ref;
};

export const Magnetic = ({ children, strength = 0.35, className = '', ...rest }) => {
  const ref = useMagnetic(strength);
  return (
    <span ref={ref} className={`magnetic-wrap ${className}`}
      style={{ display: 'inline-block', transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)' }} {...rest}>
      {children}
    </span>
  );
};

export const ScrollSplit = ({ text, className = '', stagger = 0.025, el = 'span' }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        node.querySelectorAll('.scroll-char').forEach((c, i) => {
          c.style.transitionDelay = `${i * stagger}s`;
          c.classList.add('in');
        });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(node);
    return () => io.disconnect();
  }, [stagger]);
  const Tag = el;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split('').map((c, i) => (
        <span key={i} className="scroll-char" style={{ whiteSpace: c === ' ' ? 'pre' : 'normal' }}>{c}</span>
      ))}
    </Tag>
  );
};

export const useScrollReveal = () => {
  React.useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.revealDelay || 0);
          e.target.style.transitionDelay = `${delay}s`;
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
};

export const Hero3D = () => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const sy = window.scrollY;
      const rotX = Math.max(0, 20 - sy * 0.05);
      const rotY = Math.max(0, -15 + sy * 0.03);
      const scale = Math.min(1.05, 0.9 + sy * 0.0005);
      const translateZ = sy * 0.15;
      const opacity = Math.max(0.2, 1 - sy * 0.002);
      el.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale}) translateZ(${translateZ}px)`;
      if (el.querySelector('.mockup-glow')) {
        el.querySelector('.mockup-glow').style.opacity = opacity;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hero3d-stage" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mockup-glow" style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '20%', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1), transparent 70%)', filter: 'blur(60px)', zIndex: 0, transition: 'opacity 0.2s' }} />
      <div ref={ref} className="product-mockup" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '460px',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Mockup Header */}
        <div style={{ height: '40px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ marginLeft: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>jobify-os / resume-builder</div>
        </div>
        {/* Mockup Body */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px' }}>
          {/* Sidebar */}
          <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', width: '100%', marginBottom: '12px' }} />
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '80%' }} />
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '90%' }} />
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '70%' }} />
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', width: '85%', border: '1px solid rgba(255,255,255,0.2)' }} />
          </div>
          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div style={{ height: '40px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', width: '60%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px', width: '40%' }} />
             </div>
             <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', padding: '16px', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '50%' }} />
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '100%' }} />
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '90%' }} />
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '95%' }} />
                  <div style={{ height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', width: '100%', marginTop: 'auto' }} />
                </div>
                <div style={{ width: '100px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#ffffff', transform: 'rotate(45deg)' }} />
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>98% MATCH</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomCursor = () => {
  const dotRef = React.useRef(null);
  const trailRef = React.useRef(null);
  const labelRef = React.useRef(null);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      if (dotRef.current) { dotRef.current.style.left = x + 'px'; dotRef.current.style.top = y + 'px'; }
      if (labelRef.current) { labelRef.current.style.left = x + 'px'; labelRef.current.style.top = y + 'px'; }
    };
    const tick = () => {
      tx += (x - tx) * 0.18; ty += (y - ty) * 0.18;
      if (trailRef.current) { trailRef.current.style.left = tx + 'px'; trailRef.current.style.top = ty + 'px'; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('mousemove', move);
    const onOver = (e) => {
      const t = e.target.closest('a, button, [role="button"], .p-tag, .tag-chip, .job-card, .nav-link, .nav-brand, .icon-btn, [data-cursor]');
      if (!t || !dotRef.current) return;
      dotRef.current.classList.add('cursor-hover');
      const label = t.dataset.cursor;
      if (label && labelRef.current) {
        labelRef.current.textContent = label;
        labelRef.current.classList.add('show');
      }
      if (t.classList.contains('text-magnetic')) t.classList.add('text-magnetic-on');
    };
    const onOut = (e) => {
      const t = e.target.closest('a, button, [role="button"], .p-tag, .tag-chip, .job-card, .nav-link, .nav-brand, .icon-btn, [data-cursor]');
      if (!t || !dotRef.current) return;
      dotRef.current.classList.remove('cursor-hover');
      if (labelRef.current) labelRef.current.classList.remove('show');
      if (t.classList.contains('text-magnetic')) t.classList.remove('text-magnetic-on');
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.body.classList.add('moncy-cursor-on');
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.body.classList.remove('moncy-cursor-on');
    };
  }, []);
  return (
    <>
      <div ref={trailRef} className="moncy-cursor-trail" />
      <div ref={dotRef} className="moncy-cursor-dot" />
      <div ref={labelRef} className="moncy-cursor-label" />
    </>
  );
};

export const TextMagnetic = ({ children, as: Tag = 'span', className = '', ...rest }) => {
  const text = typeof children === 'string' ? children : '';
  if (!text) return <Tag className={`text-magnetic ${className}`} {...rest}>{children}</Tag>;
  return (
    <Tag className={`text-magnetic ${className}`} {...rest}>
      {text.split('').map((c, i) => (
        <span key={i} className="tm-char" style={{ whiteSpace: c === ' ' ? 'pre' : 'normal' }}>{c}</span>
      ))}
    </Tag>
  );
};
