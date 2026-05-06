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
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ mx: 0.5, my: 0.5, sy: 0, t: 0 });
  React.useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * dpr; cvs.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const N = 380;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pts.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) });
    }
    const onMove = (e) => {
      const r = cvs.getBoundingClientRect();
      stateRef.current.mx = (e.clientX - r.left) / r.width;
      stateRef.current.my = (e.clientY - r.top) / r.height;
    };
    const onScroll = () => { stateRef.current.sy = window.scrollY; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    const tick = () => {
      const s = stateRef.current;
      s.t += 0.005;
      const r = cvs.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const radius = Math.min(r.width, r.height) * 0.36;
      const targetRy = (s.mx - 0.5) * 1.6;
      const targetRx = (s.my - 0.5) * 1.2 + s.sy * 0.0008;
      s._rx = (s._rx ?? 0) + (targetRx - (s._rx ?? 0)) * 0.06;
      s._ry = (s._ry ?? 0) + (targetRy - (s._ry ?? 0)) * 0.06;
      const rx = s._rx, ry = s._ry + s.t * 0.25;
      ctx.clearRect(0, 0, r.width, r.height);
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.6);
      halo.addColorStop(0, 'rgba(76,195,255,0.18)');
      halo.addColorStop(0.5, 'rgba(91,59,212,0.10)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, r.width, r.height);
      const core = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 4, cx, cy, radius * 0.95);
      core.addColorStop(0, 'rgba(255,255,255,0.16)');
      core.addColorStop(0.55, 'rgba(91,59,212,0.10)');
      core.addColorStop(1, 'rgba(10,8,24,0.6)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(201,196,240,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2); ctx.stroke();
      const cosx = Math.cos(rx), sinx = Math.sin(rx);
      const cosy = Math.cos(ry), siny = Math.sin(ry);
      for (const p of pts) {
        let x = p.x * cosy + p.z * siny;
        let z = -p.x * siny + p.z * cosy;
        let y = p.y * cosx - z * sinx;
        z = p.y * sinx + z * cosx;
        const persp = 1.5 / (1.5 - z);
        const px = cx + x * radius * persp;
        const py = cy + y * radius * persp;
        const depth = (z + 1) / 2;
        const sz = 0.6 + depth * 2.4;
        const alpha = 0.25 + depth * 0.75;
        const r2 = Math.round(76 + (255 - 76) * depth);
        const g2 = Math.round(195 + (255 - 195) * depth);
        const b2 = Math.round(255);
        ctx.fillStyle = `rgba(${r2},${g2},${b2},${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(76,195,255,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.18, radius * 0.32, ry * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,99,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.32, radius * 0.18, ry * 0.6 + 0.6, 0, Math.PI * 2);
      ctx.stroke();
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return (
    <div className="hero3d-stage">
      <canvas ref={canvasRef} className="hero3d-canvas" />
      <div className="hero3d-tag hero3d-tag-tl">[ R3F · CANVAS · LIVE ]</div>
      <div className="hero3d-tag hero3d-tag-br">CURSOR + SCROLL REACTIVE</div>
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
