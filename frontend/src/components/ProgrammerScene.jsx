import React from 'react';

const ProgrammerScene = ({ size = 420 }) => (
  <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      background: 'radial-gradient(circle at 50% 55%, rgba(76,195,255,0.35) 0%, rgba(30,99,255,0.18) 30%, transparent 65%)',
      filter: 'blur(20px)',
    }} />
    <div className="neon-ring" style={{
      position: 'absolute', width: '88%', height: '88%', borderRadius: '50%',
      border: '1.5px solid rgba(76,195,255,0.45)',
      boxShadow: '0 0 40px rgba(76,195,255,0.5), inset 0 0 40px rgba(30,99,255,0.25)',
    }} />
    <div style={{ position: 'absolute', width: '102%', height: '102%', borderRadius: '50%', border: '1px dashed rgba(120,180,255,0.25)' }} />
    <svg viewBox="0 0 400 400" width={size * 0.95} height={size * 0.95} style={{ position: 'relative', zIndex: 2 }}>
      <defs>
        <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f5d4b3" /><stop offset="100%" stopColor="#e0b896" /></linearGradient>
        <linearGradient id="hoodie" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1e2849" /><stop offset="100%" stopColor="#0f1632" /></linearGradient>
        <linearGradient id="hoodieHi" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="rgba(76,195,255,0.5)" /><stop offset="100%" stopColor="rgba(76,195,255,0)" /></linearGradient>
        <linearGradient id="hair" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3a2a1f" /><stop offset="100%" stopColor="#1f140d" /></linearGradient>
        <linearGradient id="laptop" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#dde3ee" /><stop offset="100%" stopColor="#a8b0c0" /></linearGradient>
        <linearGradient id="screen" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0a1530" /><stop offset="100%" stopColor="#1a2548" /></linearGradient>
        <linearGradient id="desk" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3a2818" /><stop offset="100%" stopColor="#1f1408" /></linearGradient>
        <linearGradient id="chair" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1a1830" /><stop offset="100%" stopColor="#0a0820" /></linearGradient>
        <radialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stopColor="rgba(76,195,255,0.6)" /><stop offset="100%" stopColor="rgba(76,195,255,0)" /></radialGradient>
      </defs>
      <ellipse cx="200" cy="340" rx="160" ry="14" fill="rgba(0,0,0,0.45)" />
      <rect x="40" y="280" width="320" height="14" rx="3" fill="url(#desk)" />
      <rect x="40" y="280" width="320" height="3" fill="rgba(255,255,255,0.08)" />
      <path d="M 90 200 Q 90 130 130 130 L 130 280 L 90 280 Z" fill="url(#chair)" />
      <path d="M 90 200 Q 90 130 130 130 L 130 145 Q 100 145 100 200 Z" fill="rgba(76,195,255,0.12)" />
      <path d="M 130 200 Q 130 175 165 170 L 235 170 Q 270 175 270 205 L 270 285 L 130 285 Z" fill="url(#hoodie)" />
      <path d="M 165 170 Q 165 155 200 155 Q 235 155 235 170 L 235 178 Q 200 173 165 178 Z" fill="#0a0e1f" />
      <rect x="130" y="200" width="140" height="2" fill="url(#hoodieHi)" opacity="0.8" />
      <path d="M 132 220 Q 110 250 130 285 L 165 285 Q 160 260 165 235 Z" fill="url(#hoodie)" />
      <rect x="130" y="218" width="3" height="40" fill="url(#hoodieHi)" opacity="0.6" />
      <ellipse cx="148" cy="278" rx="14" ry="9" fill="url(#skin)" />
      <path d="M 268 220 Q 290 248 270 282 L 235 282 Q 240 258 235 232 Z" fill="url(#hoodie)" />
      <rect x="266" y="218" width="3" height="40" fill="url(#hoodieHi)" opacity="0.6" />
      <ellipse cx="252" cy="276" rx="14" ry="9" fill="url(#skin)" />
      <ellipse cx="200" cy="125" rx="38" ry="42" fill="url(#skin)" />
      <ellipse cx="162" cy="128" rx="5" ry="8" fill="url(#skin)" />
      <ellipse cx="238" cy="128" rx="5" ry="8" fill="url(#skin)" />
      <path d="M 165 110 Q 165 78 200 78 Q 235 78 235 110 Q 235 95 218 92 Q 210 85 200 86 Q 190 85 182 92 Q 165 95 165 110 Z" fill="url(#hair)" />
      <path d="M 168 105 Q 175 88 200 87 L 200 100 Q 180 100 168 110 Z" fill="rgba(76,195,255,0.18)" />
      <circle cx="184" cy="128" r="11" fill="none" stroke="#1a1530" strokeWidth="2" />
      <circle cx="216" cy="128" r="11" fill="none" stroke="#1a1530" strokeWidth="2" />
      <line x1="195" y1="128" x2="205" y2="128" stroke="#1a1530" strokeWidth="2" />
      <circle cx="184" cy="128" r="11" fill="rgba(76,195,255,0.25)" />
      <circle cx="216" cy="128" r="11" fill="rgba(76,195,255,0.25)" />
      <ellipse cx="180" cy="124" rx="4" ry="2.5" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="212" cy="124" rx="4" ry="2.5" fill="rgba(255,255,255,0.5)" />
      <path d="M 192 148 Q 200 152 208 148" stroke="#1a1530" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 162 110 Q 200 75 238 110" stroke="#0a0e1f" strokeWidth="5" fill="none" />
      <ellipse cx="162" cy="125" rx="9" ry="14" fill="#0a0e1f" />
      <ellipse cx="238" cy="125" rx="9" ry="14" fill="#0a0e1f" />
      <ellipse cx="162" cy="125" rx="4" ry="6" fill="#4cc3ff" opacity="0.8" />
      <ellipse cx="238" cy="125" rx="4" ry="6" fill="#4cc3ff" opacity="0.8" />
      <ellipse cx="200" cy="240" rx="80" ry="40" fill="url(#screenGlow)" opacity="0.7" />
      <path d="M 145 282 L 255 282 L 268 290 L 132 290 Z" fill="url(#laptop)" />
      <rect x="132" y="288" width="136" height="2" fill="rgba(0,0,0,0.4)" />
      <rect x="148" y="218" width="104" height="66" rx="3" fill="#1a1530" />
      <rect x="151" y="221" width="98" height="60" rx="2" fill="url(#screen)" />
      <rect x="155" y="226" width="22" height="2" rx="1" fill="#4cc3ff" opacity="0.9" />
      <rect x="180" y="226" width="32" height="2" rx="1" fill="#7dd3fc" opacity="0.7" />
      <rect x="160" y="232" width="40" height="2" rx="1" fill="#a78bfa" opacity="0.85" />
      <rect x="155" y="238" width="18" height="2" rx="1" fill="#4cc3ff" opacity="0.9" />
      <rect x="176" y="238" width="50" height="2" rx="1" fill="#86efac" opacity="0.8" />
      <rect x="160" y="244" width="62" height="2" rx="1" fill="#7dd3fc" opacity="0.6" />
      <rect x="155" y="250" width="26" height="2" rx="1" fill="#fda4af" opacity="0.85" />
      <rect x="184" y="250" width="36" height="2" rx="1" fill="#4cc3ff" opacity="0.7" />
      <rect x="160" y="256" width="44" height="2" rx="1" fill="#a78bfa" opacity="0.7" />
      <rect x="155" y="262" width="14" height="2" rx="1" fill="#86efac" opacity="0.9" />
      <rect x="172" y="262" width="38" height="2" rx="1" fill="#7dd3fc" opacity="0.6" />
      <rect x="155" y="268" width="2" height="2" fill="#4cc3ff" />
      <rect x="160" y="268" width="48" height="2" rx="1" fill="#fda4af" opacity="0.7" />
      <circle cx="200" cy="287" r="1.5" fill="#fff" opacity="0.6" />
      <rect x="290" y="262" width="24" height="22" rx="3" fill="#2a3252" />
      <rect x="290" y="262" width="24" height="3" fill="rgba(76,195,255,0.4)" />
      <path d="M 314 268 Q 322 268 322 274 Q 322 280 314 280" fill="none" stroke="#2a3252" strokeWidth="2.5" />
      <path d="M 296 258 Q 298 252 296 248 Q 294 244 296 240" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 304 256 Q 306 250 304 246 Q 302 242 304 238" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="60" y="262" width="22" height="22" rx="2" fill="#3a2818" />
      <path d="M 71 262 Q 60 250 62 240 Q 70 245 71 258 Z" fill="#3dcc91" />
      <path d="M 71 262 Q 82 250 80 238 Q 72 244 71 258 Z" fill="#2eb478" />
      <path d="M 71 262 Q 71 245 71 235" stroke="#2eb478" strokeWidth="2" />
      <g opacity="0.85">
        <rect x="48" y="150" width="20" height="20" rx="4" fill="rgba(10,15,40,0.8)" stroke="#4cc3ff" strokeWidth="1" />
        <text x="58" y="164" fill="#4cc3ff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{'</>'}</text>
      </g>
      <g opacity="0.85">
        <rect x="332" y="120" width="22" height="22" rx="4" fill="rgba(10,15,40,0.8)" stroke="#7dd3fc" strokeWidth="1" />
        <text x="343" y="135" fill="#7dd3fc" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{'{ }'}</text>
      </g>
      <g opacity="0.85">
        <circle cx="346" cy="200" r="11" fill="rgba(10,15,40,0.8)" stroke="#a78bfa" strokeWidth="1" />
        <text x="346" y="204" fill="#a78bfa" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">π</text>
      </g>
      <g opacity="0.85">
        <rect x="50" y="220" width="22" height="22" rx="4" fill="rgba(10,15,40,0.8)" stroke="#86efac" strokeWidth="1" />
        <text x="61" y="235" fill="#86efac" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">JS</text>
      </g>
      <g fill="#ffffff">
        <circle cx="80" cy="80" r="1.5" opacity="0.9" />
        <circle cx="320" cy="60" r="1" opacity="0.7" />
        <circle cx="360" cy="280" r="1.5" opacity="0.8" />
        <circle cx="40" cy="320" r="1" opacity="0.6" />
        <circle cx="380" cy="80" r="2" opacity="0.9" />
      </g>
    </svg>
  </div>
);

export default ProgrammerScene;
