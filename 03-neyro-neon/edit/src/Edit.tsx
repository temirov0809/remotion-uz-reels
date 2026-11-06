import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import captions from './captions.json';
import * as F from './fonts';

export const FPS = 30;
export const DURATION = 52.6;

// ---------- fonts: plain CSS @font-face with data URIs (a delayRender-held FontFace promise timed out in long renders) ----------
const SANS = 'MontserratLocal';
const COND = 'OswaldLocal';
const FONTS: [string, string, number][] = [
  [SANS, F.montserrat_500, 500], [SANS, F.montserrat_600, 600], [SANS, F.montserrat_700, 700], [SANS, F.montserrat_800, 800], [COND, F.oswald_700, 700],
];
if (typeof document !== 'undefined' && !document.getElementById('local-fonts')) {
  const el = document.createElement('style');
  el.id = 'local-fonts';
  el.textContent = FONTS.map(([f, uri, w]) => `@font-face{font-family:'${f}';src:url(${uri}) format('woff2');font-weight:${w};font-display:block}`).join('\n');
  document.head.appendChild(el);
}
const FontWarmup: React.FC = () => (
  <div style={{position: 'absolute', opacity: 0}}>
    {FONTS.map(([f, , w]) => (
      <span key={f + w} style={{fontFamily: f, fontWeight: w}}>Aa’1</span>
    ))}
  </div>
);

// ---------- palette & helpers ----------
const BLUE = '#2E8BFF';
const RED = '#FF2E3E';
const GREEN = '#2BE36B';
const neon = (c: string, k = 1) => `0 0 ${6 * k}px ${c}, 0 0 ${18 * k}px ${c}, 0 0 ${42 * k}px ${c}cc, 0 0 ${80 * k}px ${c}88`;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const useT = () => useCurrentFrame() / FPS;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});
const sp = (t: number, t0: number, damping = 13) => spring({frame: Math.round((t - t0) * FPS), fps: FPS, config: {damping, mass: 0.6}});
const life = (t: number, s: number, e: number, out = 0.2) => (t < s || t > e ? 0 : Math.min(ramp(t, s, s + 0.2), interpolate(t, [e - out, e], [1, 0], clamp)));

// Full-screen motion scenes cut into the talking head (the "montage inside the frame" from the references).
const SCENES = [
  {s: 8.4, e: 14.45, id: 'size'},
  {s: 20.4, e: 31.1, id: 'arc'},
  {s: 34.7, e: 41.95, id: 'small'},
] as const;
const sceneAt = (t: number) => SCENES.find((x) => t >= x.s && t < x.e);
const sceneMix = (t: number) => {
  const sc = sceneAt(t);
  if (!sc) return 0;
  return Math.min(ramp(t, sc.s, sc.s + 0.25), interpolate(t, [sc.e - 0.25, sc.e], [1, 0], clamp));
};

// speaker punch-ins (cut rhythm)
const ZOOMS: [number, number][] = [
  [0, 1.0], [1.52, 1.1], [3.98, 1.0], [5.18, 1.12], [7.22, 1.18], [14.45, 1.0], [16.76, 1.1], [18.3, 1.16],
  [31.1, 1.0], [33.12, 1.1], [41.95, 1.0], [44.58, 1.1], [46.42, 1.0], [49.54, 1.08],
];
const zoomAt = (t: number) => {
  let i = 0;
  for (let k = 0; k < ZOOMS.length; k++) if (ZOOMS[k][0] <= t) i = k;
  const t1 = i + 1 < ZOOMS.length ? ZOOMS[i + 1][0] : DURATION;
  return ZOOMS[i][1] * (1 + 0.02 * Math.min(1, (t - ZOOMS[i][0]) / Math.max(1, t1 - ZOOMS[i][0])));
};

// ---------- base speaker ----------
const Speaker: React.FC = () => {
  const t = useT();
  const m = sceneMix(t);
  return (
    <AbsoluteFill style={{filter: m > 0 ? `blur(${m * 14}px) brightness(${1 - m * 0.6})` : undefined}}>
      <Video src={staticFile('base.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoomAt(t) * (1 + m * 0.08)})`, transformOrigin: '50% 30%'}} />
    </AbsoluteFill>
  );
};

// ---------- dusty black stage for the motion scenes ----------
const Stage: React.FC<{seed: string}> = ({seed}) => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(90% 70% at 50% 45%, #1b1c1f 0%, #0b0b0d 55%, #030303 100%)'}}>
      {Array.from({length: 70}).map((_, i) => {
        const x = random(`${seed}x${i}`) * 1080;
        const y0 = random(`${seed}y${i}`) * 1920;
        const v = 8 + random(`${seed}v${i}`) * 26;
        const r = 1 + random(`${seed}r${i}`) * 3;
        const y = (y0 - t * v + 1920) % 1920;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(t + i) * 6, top: y, width: r, height: r, borderRadius: r, background: 'rgba(255,255,255,0.55)', opacity: 0.25 + random(`${seed}o${i}`) * 0.5}} />;
      })}
      {[0, 1, 2].map((i) => {
        const on = random(`${seed}s${i}${Math.floor(t * 8)}`) > 0.82;
        return on ? <div key={i} style={{position: 'absolute', left: random(`${seed}sx${i}${Math.floor(t * 8)}`) * 1080, top: 0, width: 1.5, height: 1920, background: 'rgba(255,255,255,0.08)'}} /> : null;
      })}
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '120px 120px', maskImage: 'radial-gradient(60% 50% at 50% 50%, black, transparent)'}} />
    </AbsoluteFill>
  );
};

const Glass: React.FC<{style?: React.CSSProperties; glow?: string; children: React.ReactNode}> = ({style, glow = BLUE, children}) => (
  <div
    style={{
      position: 'absolute', borderRadius: 40, overflow: 'hidden',
      background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.25))',
      border: '1.5px solid rgba(255,255,255,0.22)',
      boxShadow: `0 40px 90px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 60px ${glow}33`,
      ...style,
    }}
  >
    {children}
  </div>
);

// Scene 1: "size decides the danger" — mm counter + rising chart, then struck out
const SizeScene: React.FC<{s: number; e: number}> = ({s, e}) => {
  const t = useT();
  const a = life(t, s, e, 0.25);
  const card = sp(t, s + 0.1);
  const mm = interpolate(t, [10.32, 12.2], [0, 10], {...clamp});
  const chart = ramp(t, 10.3, 12.3);
  const wrong = sp(t, 13.4, 11);
  const PATH = 'M0,190 C60,180 90,120 150,140 C210,160 240,70 300,90 C360,110 390,30 460,20';
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Stage seed="size" />
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 52, color: 'white', textShadow: neon('#ffffff', 0.25)}}>
        Ko’pchilik fikricha
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 36, color: 'rgba(255,255,255,0.75)'}}>xavf = disk churrasi o’lchami</div>
      </div>
      <Glass glow={GREEN} style={{left: 150, top: 660, width: 780, height: 520, transform: `perspective(1400px) rotateX(${(1 - card) * 30}deg) scale(${0.85 + 0.15 * card})`, opacity: card}}>
        <div style={{position: 'absolute', left: 44, top: 40, width: 64, height: 64, borderRadius: 32, border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: COND, fontSize: 30, color: 'white'}}>⌀</div>
        <div style={{position: 'absolute', right: 50, top: 22, fontFamily: SANS, fontWeight: 800, fontSize: 120, color: 'white', letterSpacing: -4}}>
          {mm.toFixed(0)}
          <span style={{fontSize: 56}}> mm</span>
        </div>
        <svg width={780} height={260} viewBox="-20 -10 500 230" style={{position: 'absolute', left: 0, top: 170}}>
          <path d={PATH} fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - chart} style={{filter: `drop-shadow(0 0 10px ${GREEN})`}} />
        </svg>
        <div style={{position: 'absolute', left: 44, bottom: 40, padding: '14px 30px', borderRadius: 40, border: '1.5px solid rgba(255,255,255,0.3)', fontFamily: SANS, fontWeight: 600, fontSize: 34, color: 'white'}}>xavflilik darajasi</div>
      </Glass>
      <div style={{position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: wrong, transform: `scale(${0.6 + 0.4 * wrong}) rotate(-4deg)`}}>
        <div style={{padding: '18px 54px', borderRadius: 26, background: RED, fontFamily: COND, fontWeight: 700, fontSize: 92, color: 'white', letterSpacing: 2, boxShadow: neon(RED, 1)}}>BU TO’G’RI EMAS</div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: glowing arc with numbered nodes rotating into view (three criteria)
const ArcScene: React.FC<{s: number; e: number}> = ({s, e}) => {
  const t = useT();
  const a = life(t, s, e, 0.25);
  const items = [
    {t: 20.48, text: ['NERV ILDIZINI', 'QANCHALIK QISYAPTI']},
    {t: 24.98, text: ['QAYSI QISMDAN', 'CHIQYAPTI']},
    {t: 29.04, text: ['BEMOR', 'SHIKOYATI']},
  ];
  let active = 0;
  items.forEach((it, i) => (t >= it.t ? (active = i) : null));
  // the arc rotates so the active node sits at the bottom-centre of the circle
  const rot = items.reduce((acc, it, i) => acc + (i === 0 ? 0 : -40 * sp(t, it.t - 0.1, 16)), 0);
  const R = 1100;
  const cx = 540;
  const cy = 860 - R;
  const draw = ramp(t, s, s + 0.8);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Stage seed="arc" />
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 40, color: 'rgba(255,255,255,0.8)'}}>Neyroxirurgiyada 3 ta muhim kriteriy</div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="white" strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          {items.map((it, i) => {
            const ang = ((90 + i * 40) * Math.PI) / 180;
            const x = cx + R * Math.cos(ang);
            const y = cy + R * Math.sin(ang);
            const on = i === active;
            return (
              <g key={i} transform={`rotate(${-rot} ${x} ${y})`} opacity={t >= it.t - 0.4 ? 1 : 0.35}>
                <circle cx={x} cy={y} r={44} fill="#0b0b0d" stroke="white" strokeWidth={5} style={{filter: on ? 'drop-shadow(0 0 16px white)' : undefined}} />
                <text x={x} y={y + 16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="white">{i + 1}</text>
              </g>
            );
          })}
        </g>
      </svg>
      {items.map((it, i) => {
        if (i !== active) return null;
        const pr = sp(t, it.t, 12);
        const flick = t - it.t < 0.35 && random(`f${Math.floor(t * 30)}`) > 0.5 ? 0.4 : 1;
        return (
          <div key={i} style={{position: 'absolute', top: 990, left: 0, right: 0, textAlign: 'center', opacity: pr * flick, transform: `translateY(${(1 - pr) * 40}px) skewX(-8deg)`}}>
            {it.text.map((line) => (
              <div key={line} style={{fontFamily: COND, fontWeight: 700, fontSize: 104, lineHeight: 1.02, color: '#BFE0FF', textShadow: neon(BLUE, 1)}}>{line}</div>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: chrome diamond badge, then "small hernia → big problem"
const SmallScene: React.FC<{s: number; e: number}> = ({s, e}) => {
  const t = useT();
  const a = life(t, s, e, 0.25);
  const d = sp(t, s + 0.05, 12);
  const label = sp(t, 36.94, 14);
  const big = sp(t, 40.22, 10);
  const pulse = big > 0.5 ? 1 + 0.04 * Math.sin(t * 9) : 1;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Stage seed="small" />
      <div style={{position: 'absolute', left: 540 - 150, top: 520, width: 300, height: 300, transform: `rotate(45deg) scale(${0.6 + 0.4 * d}) rotateY(${(1 - d) * 90}deg)`, borderRadius: 50, background: 'linear-gradient(135deg, #8d9299 0%, #3a3d42 45%, #1a1b1e 60%, #6b7077 100%)', boxShadow: '0 30px 80px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.5)', opacity: d}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)', fontFamily: SANS, fontWeight: 800, fontSize: 150, background: 'linear-gradient(180deg,#fff,#9aa0a8)', WebkitBackgroundClip: 'text', color: 'transparent'}}>!</div>
      </div>
      <div style={{position: 'absolute', top: 930, left: 0, right: 0, textAlign: 'center', opacity: label, transform: `translateY(${(1 - label) * 30}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: 'rgba(255,255,255,0.8)'}}>judayam kichik</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 76, color: 'white'}}>disk churrasi ham</div>
      </div>
      <div style={{position: 'absolute', top: 1170, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: big, transform: `scale(${(0.5 + 0.5 * big) * pulse})`}}>
        <div style={{padding: '20px 56px', borderRadius: 34, background: 'linear-gradient(180deg,#ff5a66,#e0101f)', fontFamily: SANS, fontWeight: 800, fontSize: 84, color: 'white', boxShadow: neon(RED, 1.1)}}>KATTA MUAMMO</div>
      </div>
    </AbsoluteFill>
  );
};

const Scenes: React.FC = () => {
  const t = useT();
  const sc = sceneAt(t);
  if (!sc) return null;
  if (sc.id === 'size') return <SizeScene s={sc.s} e={sc.e} />;
  if (sc.id === 'arc') return <ArcScene s={sc.s} e={sc.e} />;
  return <SmallScene s={sc.s} e={sc.e} />;
};

// ---------- overlays on the speaker ----------
// big glowing number over the chest (IMG_5510 "3")
const NeonNumber: React.FC<{s: number; e: number; num: string; unit: string; color?: string}> = ({s, e, num, unit, color = BLUE}) => {
  const t = useT();
  const a = life(t, s, e, 0.2);
  if (a <= 0) return null;
  const p = sp(t, s, 11);
  const flick = t - s < 0.3 && random(`n${Math.floor(t * 30)}`) > 0.5 ? 0.5 : 1;
  return (
    <div style={{position: 'absolute', top: 1000, left: 0, right: 0, textAlign: 'center', opacity: a * flick, transform: `scale(${0.6 + 0.4 * p})`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 300, lineHeight: 1, color: '#d9ecff', textShadow: neon(color, 1.3)}}>{num}</div>
      <div style={{fontFamily: COND, fontWeight: 700, fontSize: 70, marginTop: -10, color: 'white', letterSpacing: 3, textShadow: neon(color, 0.6)}}>{unit}</div>
    </div>
  );
};

// status pill that flips colour (IMG_5510 price pill red → green)
const StatusPill: React.FC = () => {
  const t = useT();
  const s = 4.86;
  const e = 8.35;
  const a = life(t, s, e, 0.2);
  if (a <= 0) return null;
  const p = sp(t, s, 12);
  const calm = t >= 7.78;
  const flip = sp(t, 7.78, 10);
  const c = calm ? GREEN : RED;
  return (
    <div style={{position: 'absolute', top: 1330, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: a, transform: `scale(${(0.6 + 0.4 * p) * (calm ? 0.9 + 0.1 * flip : 1)})`}}>
      <div style={{padding: '18px 48px', borderRadius: 32, background: calm ? 'linear-gradient(180deg,#5ef08f,#16b84c)' : 'linear-gradient(180deg,#ff5a66,#e0101f)', fontFamily: SANS, fontWeight: 800, fontSize: 64, color: 'white', boxShadow: neon(c, 1)}}>
        {calm ? 'SHOSHILMANG' : 'DARHOL OPERATSIYA?'}
      </div>
    </div>
  );
};

// two small cards at chest level (IMG_5510 "без ремонта / с ремонтом")
const CompareCards: React.FC = () => {
  const t = useT();
  const a = life(t, 31.4, 34.65, 0.2);
  if (a <= 0) return null;
  const c1 = sp(t, 31.6);
  const c2 = sp(t, 33.12);
  const card = (p: number, x: number, top: string, bottom: string, color: string, rot: number) => (
    <div style={{position: 'absolute', left: x, top: 1330, width: 330, height: 300, borderRadius: 34, opacity: p, transform: `translateY(${(1 - p) * 60}px) rotate(${rot}deg) scale(${0.8 + 0.2 * p})`, background: 'linear-gradient(160deg, rgba(40,42,48,0.92), rgba(12,12,14,0.92))', border: `2px solid ${color}`, boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${color}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 92, color: 'white', textShadow: neon(color, 0.5)}}>{top}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,0.85)', marginTop: 4}}>{bottom}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: a}}>
      {card(c1, 150, '10 mm', 'disk churrasi', BLUE, -4)}
      {card(c2, 600, '✓', 'konservativ davo', GREEN, 4)}
    </AbsoluteFill>
  );
};

// CTA: Instagram / Telegram pills + an MRT document card with an upload bar
const CTA: React.FC = () => {
  const t = useT();
  const a = life(t, 46.3, 52.6, 0.3);
  if (a <= 0) return null;
  const ig = sp(t, 46.42);
  const tg = sp(t, 48.08);
  const doc = sp(t, 49.54);
  const up = ramp(t, 50.0, 52.0);
  const pill = (p: number, x: number, label: string, color: string, glyph: string) => (
    <div style={{position: 'absolute', left: x, top: 1330, width: 380, height: 110, borderRadius: 56, opacity: p, transform: `scale(${0.7 + 0.3 * p})`, background: 'rgba(14,14,16,0.85)', border: `2px solid ${color}`, boxShadow: `0 0 36px ${color}66`, display: 'flex', alignItems: 'center', gap: 22, paddingLeft: 22}}>
      <div style={{width: 70, height: 70, borderRadius: 20, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 36, color: 'white'}}>{glyph}</div>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: 'white'}}>{label}</span>
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: a}}>
      {pill(ig, 120, 'Instagram', '#E1306C', '◎')}
      {pill(tg, 580, 'Telegram', '#2AABEE', '➤')}
      <Glass style={{left: 120, top: 1480, width: 840, height: 200, opacity: doc, transform: `translateY(${(1 - doc) * 50}px)`}}>
        <div style={{position: 'absolute', left: 36, top: 36, width: 90, height: 120, borderRadius: 16, background: `linear-gradient(180deg, ${BLUE}, #1450b8)`, boxShadow: neon(BLUE, 0.6), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: 'white'}}>MRT</div>
        <div style={{position: 'absolute', left: 160, top: 40, fontFamily: SANS, fontWeight: 700, fontSize: 38, color: 'white'}}>MRT tasvirlari + shikoyat</div>
        <div style={{position: 'absolute', left: 160, right: 40, top: 118, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.15)'}}>
          <div style={{width: `${up * 100}%`, height: 12, borderRadius: 6, background: BLUE, boxShadow: neon(BLUE, 0.4)}} />
        </div>
        <div style={{position: 'absolute', right: 40, top: 142, fontFamily: SANS, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,0.8)'}}>{up >= 1 ? 'Yuborildi ✓' : `Yuborilmoqda ${Math.round(up * 100)}%`}</div>
      </Glass>
    </AbsoluteFill>
  );
};

// ---------- captions: white Montserrat line, keywords as skewed neon Oswald ----------
type Wd = {t: string; s: number; e: number};
const CHUNKS = (captions as {chunks: {s: number; e: number; words: Wd[]}[]}).chunks;
const BLUE_WORDS = /^(mrt|5|mm-li|operatsiya|shoshilmang|o'lchami|neyroxirurgiyada|uchta|muhim|kriteriy|10|konservativ|instagram|telegram|birinchisi|ikkinchisi|uchinchisi)$/i;
const RED_WORDS = /^(darhol|xavflilik|emas|katta|muammolarga|kichik)$/i;

const NUMBER_WINDOWS: [number, number][] = [[1.52, 3.95], [18.68, 20.38]];

const Captions: React.FC = () => {
  const t = useT();
  const idx = CHUNKS.findIndex((c, i) => t >= c.s - 0.05 && t < (i + 1 < CHUNKS.length ? Math.min(CHUNKS[i + 1].s - 0.05, c.e + 0.6) : c.e + 0.6));
  if (idx < 0) return null;
  const c = CHUNKS[idx];
  const inScene = sceneMix(t) > 0.5;
  // while a neon number sits on the chest, captions drop below it
  const underNumber = NUMBER_WINDOWS.some(([s, e]) => t >= s && t < e);
  const top = inScene ? 1560 : underNumber ? 1470 : 1150;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 16}}>
      {c.words.map((w, i) => {
        const pr = ramp(t, w.s - 0.04, w.s + 0.14);
        const clean = w.t.replace(/[.,?!]+$/, '');
        const blue = BLUE_WORDS.test(clean);
        const red = RED_WORDS.test(clean);
        const key = blue || red;
        const col = red ? RED : BLUE;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', opacity: pr, transform: `translateY(${(1 - pr) * 14}px) ${key ? 'skewX(-8deg)' : ''} scale(${0.9 + 0.1 * pr})`,
              fontFamily: key ? COND : SANS, fontWeight: key ? 700 : 600, fontSize: key ? 92 : 52,
              textTransform: key ? 'uppercase' : 'none', color: key ? (red ? '#FFD2D6' : '#D4E8FF') : 'white',
              textShadow: key ? neon(col, 0.9) : '0 2px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.6)',
              lineHeight: key ? 1.05 : 1.2,
            }}
          >
            {w.t.replace(/'/g, '’')}
          </span>
        );
      })}
    </div>
  );
};

const Flash: React.FC = () => {
  const t = useT();
  const edges = SCENES.flatMap((x) => [x.s, x.e - 0.1]);
  const o = Math.max(0, ...edges.map((f) => (t >= f ? interpolate(t, [f, f + 0.12], [0.35, 0], clamp) : 0)));
  return o > 0 ? <AbsoluteFill style={{background: 'white', opacity: o}} /> : null;
};

const EndFade: React.FC = () => {
  const o = interpolate(useT(), [DURATION - 0.45, DURATION], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{background: 'black', opacity: o}} /> : null;
};

export const Edit: React.FC = () => {
  const t = useT();
  const showSpeakerFx = sceneMix(t) < 0.5;
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <Speaker />
      {showSpeakerFx && (
        <>
          <NeonNumber s={1.52} e={3.95} num="5" unit="MM" />
          <StatusPill />
          <NeonNumber s={18.68} e={20.38} num="3" unit="MUHIM KRITERIY" />
          <CompareCards />
          <CTA />
        </>
      )}
      <Scenes />
      <Captions />
      <Flash />
      <EndFade />
      <FontWarmup />
    </AbsoluteFill>
  );
};
