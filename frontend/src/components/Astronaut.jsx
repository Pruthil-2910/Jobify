import React from 'react';

const Astronaut = ({ size = 280 }) => {
  return (
    <div className="astronaut-stage" style={{ width: size, height: size, position: 'relative' }}>
      <svg className="orbit-ring" width={size} height={size} style={{ position: 'absolute', inset: 0 }} viewBox="0 0 280 280">
        <ellipse cx="140" cy="140" rx="130" ry="48" fill="none" stroke="rgba(76,195,255,0.35)" strokeWidth="1" strokeDasharray="2 5" />
        <circle cx="270" cy="140" r="3" fill="#4cc3ff" />
      </svg>
      <svg className="astronaut" width={size} height={size} viewBox="0 0 280 280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="helmet-glass" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a3e3ff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#4cc3ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5b3bd4" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="suit-grad" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="70%" stopColor="#c9c4f0" />
            <stop offset="100%" stopColor="#8e88b8" />
          </radialGradient>
          <radialGradient id="pack-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6fae" stopOpacity="1" />
            <stop offset="100%" stopColor="#a238c9" stopOpacity="0.3" />
          </radialGradient>
          <filter id="soft-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <rect x="100" y="115" width="80" height="80" rx="14" fill="url(#suit-grad)" stroke="#5b3bd4" strokeWidth="2" />
        <circle cx="140" cy="190" r="8" fill="url(#pack-glow)" filter="url(#soft-glow)" />
        <circle cx="140" cy="190" r="4" fill="#ff6fae" />
        <path d="M 95 130 Q 95 110 115 105 L 165 105 Q 185 110 185 130 L 185 200 Q 185 220 165 222 L 115 222 Q 95 220 95 200 Z" fill="url(#suit-grad)" stroke="#5b3bd4" strokeWidth="2" />
        <rect x="120" y="155" width="40" height="26" rx="4" fill="#0a0818" stroke="#5b3bd4" strokeWidth="1.5" />
        <circle cx="128" cy="164" r="2.5" fill="#3ddc97" />
        <circle cx="138" cy="164" r="2.5" fill="#ffb547" />
        <circle cx="148" cy="164" r="2.5" fill="#ff5577" />
        <rect x="125" y="170" width="30" height="2" fill="#4cc3ff" opacity="0.7" />
        <rect x="125" y="174" width="20" height="2" fill="#4cc3ff" opacity="0.5" />
        <path d="M 95 135 Q 75 145 70 175 Q 68 195 80 200" fill="none" stroke="url(#suit-grad)" strokeWidth="22" strokeLinecap="round" />
        <circle cx="80" cy="200" r="13" fill="url(#suit-grad)" stroke="#5b3bd4" strokeWidth="1.5" />
        <g className="astro-arm" style={{ transformBox: 'fill-box', transformOrigin: '15% 5%' }}>
          <path d="M 185 135 Q 215 130 230 100 Q 238 80 232 60" fill="none" stroke="url(#suit-grad)" strokeWidth="22" strokeLinecap="round" />
          <circle cx="232" cy="60" r="14" fill="url(#suit-grad)" stroke="#5b3bd4" strokeWidth="1.5" />
        </g>
        <circle cx="140" cy="80" r="42" fill="url(#helmet-glass)" stroke="#c9c4f0" strokeWidth="2" opacity="0.95" />
        <ellipse cx="125" cy="65" rx="14" ry="20" fill="white" opacity="0.35" />
        <g className="astro-eye"><circle cx="128" cy="80" r="4" fill="#0a0818" /><circle cx="129" cy="79" r="1.2" fill="white" /></g>
        <g className="astro-eye" style={{ animationDelay: '0.1s' }}><circle cx="152" cy="80" r="4" fill="#0a0818" /><circle cx="153" cy="79" r="1.2" fill="white" /></g>
        <path d="M 132 92 Q 140 99 148 92" fill="none" stroke="#0a0818" strokeWidth="2" strokeLinecap="round" />
        <circle cx="120" cy="90" r="3" fill="#ff6fae" opacity="0.5" />
        <circle cx="160" cy="90" r="3" fill="#ff6fae" opacity="0.5" />
        <circle cx="140" cy="80" r="42" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <line x1="140" y1="38" x2="140" y2="28" stroke="#c9c4f0" strokeWidth="2" />
        <circle cx="140" cy="26" r="3" fill="#ff6fae"><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" /></circle>
        <circle cx="40" cy="60" r="1.5" fill="#4cc3ff"><animate attributeName="cy" values="60;40;60" dur="4s" repeatCount="indefinite" /></circle>
        <circle cx="240" cy="220" r="1" fill="#ff6fae"><animate attributeName="cy" values="220;240;220" dur="5s" repeatCount="indefinite" /></circle>
        <circle cx="60" cy="240" r="1.5" fill="#a238c9"><animate attributeName="cy" values="240;220;240" dur="4.5s" repeatCount="indefinite" /></circle>
      </svg>
    </div>
  );
};

export default Astronaut;
