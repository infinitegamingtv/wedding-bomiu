import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const MountainBg = () => (
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, zIndex: -1, pointerEvents: 'none' }}>
    <defs>
      <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ba9263" />
        <stop offset="100%" stopColor="#ba9263" stopOpacity="0" />
      </linearGradient>
    </defs>
    <circle cx="200" cy="180" r="60" fill="url(#sunGrad)">
      <animate attributeName="cy" values="240; 120; 120; 240" dur="20s" repeatCount="indefinite" />
    </circle>
    <path d="M-50 300 L80 130 L220 250 L340 150 L450 300 Z" fill="#79603d" opacity="0.3" />
    <path d="M0 300 L0 220 L150 110 L280 230 L400 140 L400 300 Z" fill="#79603d" opacity="0.5" />
    <path d="M-50 300 L120 180 L230 280 L350 190 L450 300 Z" fill="#79603d" opacity="0.8" />
  </svg>
);

const WaveBg = () => (
  <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, zIndex: -1, pointerEvents: 'none' }}>
    <circle cx="300" cy="100" r="40" fill="#ba9263" opacity="0.4" />
    <g fill="#79603d">
      <path d="M-200 220 Q -150 190, -100 220 T 0 220 T 100 220 T 200 220 T 300 220 T 400 220 T 500 220 T 600 220 L 600 300 L -200 300 Z" opacity="0.3">
        <animateTransform attributeName="transform" type="translate" values="0,0; 200,0" dur="8s" repeatCount="indefinite" />
      </path>
      <path d="M-200 250 Q -150 230, -100 250 T 0 250 T 100 250 T 200 250 T 300 250 T 400 250 T 500 250 T 600 250 L 600 300 L -200 300 Z" opacity="0.5">
        <animateTransform attributeName="transform" type="translate" values="200,0; 0,0" dur="6s" repeatCount="indefinite" />
      </path>
      <path d="M-200 270 Q -150 255, -100 270 T 0 270 T 100 270 T 200 270 T 300 270 T 400 270 T 500 270 T 600 270 L 600 300 L -200 300 Z" opacity="0.8">
        <animateTransform attributeName="transform" type="translate" values="0,0; 200,0" dur="4s" repeatCount="indefinite" />
      </path>
    </g>
  </svg>
);

console.log(renderToStaticMarkup(<div><MountainBg /><WaveBg /></div>));
