import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {clamp, FontWarmup, GridTexture, life, SANS, springAt, useT} from './common';

// Opaque layer under the keyed speaker: the replacement backdrop and the glass cards that sit behind his head.

const Backdrop: React.FC = () => {
  const t = useT();
  const drift = Math.sin(t * 0.15) * 20;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 28%, #3b3833 0%, #24221f 45%, #0f1011 100%)'}}>
      {[
        {x: 140, y: 420, r: 260, c: 'rgba(255,170,90,0.20)'},
        {x: 930, y: 300, r: 320, c: 'rgba(90,150,170,0.18)'},
        {x: 860, y: 980, r: 220, c: 'rgba(255,200,140,0.12)'},
        {x: 220, y: 1180, r: 300, c: 'rgba(80,120,150,0.14)'},
      ].map((b, i) => (
        <div key={i} style={{position: 'absolute', left: b.x - b.r + drift * (i % 2 ? 1 : -1), top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`, filter: 'blur(30px)'}} />
      ))}
      {/* soft shelf silhouettes, heavily defocused like the reference office */}
      {[80, 300, 780, 960].map((x, i) => (
        <div key={x} style={{position: 'absolute', left: x - 60, top: 120 + (i % 2) * 90, width: 120, height: 760, borderRadius: 18, background: 'rgba(255,235,210,0.035)', filter: 'blur(18px)'}} />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

const CARDS: {s: number; e: number; big: string; small: string; tag: string}[] = [
  {s: 4.95, e: 8.1, big: '23 ta', small: 'disk', tag: 'Umurtqalar orasida'},
  {s: 22.14, e: 27.3, big: 'Amortizator', small: 'harakatni yumshatadi', tag: 'Disk vazifasi'},
  {s: 47.8, e: 51.95, big: 'Disk churrasi', small: 'diskovaya grija', tag: 'Tashxis'},
  {s: 62.9, e: 66.5, big: 'Operatsiya', small: 'har doim ham shart emas', tag: 'Muhim'},
];

const HeadCard: React.FC<(typeof CARDS)[number]> = ({s, e, big, small, tag}) => {
  const t = useT();
  const a = life(t, s, e, 0.25);
  if (a <= 0) return null;
  const sp = springAt(t, s, 13);
  const float = Math.sin((t - s) * 1.4) * 6;
  const fontSize = big.length > 8 ? 104 : 150;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', perspective: 1400}}>
      <div
        style={{
          position: 'relative', width: 760, height: 430, borderRadius: 40, overflow: 'hidden', opacity: a,
          transform: `translateY(${float + (1 - sp) * 60}px) rotateX(${10 + (1 - sp) * 25}deg) rotateY(${-12 + (1 - sp) * -30}deg) scale(${0.85 + 0.15 * sp})`,
          background: 'linear-gradient(140deg, rgba(255,214,170,0.55), rgba(255,180,120,0.22))',
          border: '2px solid rgba(255,255,255,0.45)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.6)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <GridTexture size={20} alpha={0.22} />
        <div style={{position: 'absolute', left: 48, top: 40, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: 'rgba(255,255,255,0.85)', letterSpacing: 1}}>{tag}</div>
        <div style={{position: 'absolute', left: 44, right: 44, top: 100, fontFamily: SANS, fontWeight: 600, fontSize, lineHeight: 1, color: 'white', letterSpacing: -3, textShadow: '0 4px 30px rgba(0,0,0,0.25)'}}>{big}</div>
        <div style={{position: 'absolute', left: 48, top: fontSize > 120 ? 262 : 222, fontFamily: SANS, fontWeight: 400, fontSize: 36, color: 'rgba(255,255,255,0.92)'}}>{small}</div>
        <div style={{position: 'absolute', left: -200, top: 0, width: 160, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)', transform: `translateX(${interpolate(t, [s + 0.2, s + 1.2], [0, 1300], clamp)}px) skewX(-18deg)`}} />
      </div>
    </div>
  );
};

export const Behind: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {CARDS.map((c) => (
      <HeadCard key={c.s} {...c} />
    ))}
    <FontWarmup />
  </AbsoluteFill>
);
