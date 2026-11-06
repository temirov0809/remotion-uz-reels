import React from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import captions from './captions.json';
import * as F from './fonts';

export const FPS = 30;
export const DURATION = 70.7;

// Fonts are inlined as data URIs (src/fonts.ts) so loading never depends on the network or the render server.
const ANTON = 'AntonLocal';
const SERIF = 'PlayfairLocal';
const SANS = 'ManropeLocal';
const FONTS: [string, string, string, string][] = [
  [ANTON, F.anton, '400', 'normal'],
  [SERIF, F.playfair_500i, '500', 'italic'],
  [SANS, F.manrope_500, '500', 'normal'],
  [SANS, F.manrope_700, '700', 'normal'],
  [SANS, F.manrope_800, '800', 'normal'],
];
const fontHandle = delayRender('fonts');
Promise.all(
  FONTS.map(([family, uri, weight, style]) =>
    new FontFace(family, `url(${uri})`, {weight, style}).load().then((f) => document.fonts.add(f)),
  ),
)
  .catch((err) => console.error('font load failed', err))
  .finally(() => continueRender(fontHandle));

const ORANGE = '#E8663D';
const BLUE = '#2F6BFF';
const GREEN = '#21A65B';
const MAROON = '#1C0306';
const INK = '#16181D';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const useT = () => useCurrentFrame() / FPS;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// 0→1 spring that starts at t0 (seconds)
const useIn = (t0: number, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - t0 * fps, fps, config: {damping, mass: 0.6}});
};

// ---------- timeline data ----------

type Seg = {s: number; e: number; id: 'A' | 'B' | 'C' | 'D'; bottom: string[]};
const SEGMENTS: Seg[] = [
  {s: 5.98, e: 12.4, id: 'A', bottom: ['Chap ⇄ O’ng']},
  {s: 14.74, e: 20.45, id: 'B', bottom: ['Qayerda?']},
  {s: 27.0, e: 35.9, id: 'C', bottom: ['Qarama-qarshi']},
  {s: 44.1, e: 60.6, id: 'D', bottom: ['Katta maydon', 'Kam joy']},
];
const SEG_T = 0.45;

// full-frame punch-ins (cut rhythm): [time, scale]
const ZOOMS: [number, number][] = [
  [0, 1.0], [0.78, 1.12], [1.68, 1.0], [3.34, 1.18], [12.4, 1.0], [13.1, 1.05], [20.5, 1.0], [23.38, 1.12],
  [25.26, 1.22], [35.9, 1.0], [38.94, 1.14], [40.8, 1.24], [41.3, 1.06], [41.92, 1.28], [42.56, 1.1], [43.58, 1.2],
  [60.6, 1.0], [64.36, 1.1],
];
const FLASHES = [0.78, 12.4, 20.5, 35.9, 40.8, 60.6];

type Line = {text: string; serif?: boolean; size?: number};
const TITLES: {s: number; e: number; lines: Line[]}[] = [
  {s: 0.0, e: 1.62, lines: [{text: 'QO’LINGIZNI'}, {text: 'ko’taring!', serif: true}]},
  {s: 3.34, e: 5.92, lines: [{text: 'MIYANING'}, {text: 'qaysi qismi?', serif: true}]},
  {s: 12.62, e: 14.7, lines: [{text: 'birlamchi', serif: true}, {text: 'HARAKAT PO’STLOG’I', size: 112}]},
  {s: 25.26, e: 26.98, lines: [{text: 'QARAMA-'}, {text: 'QARSHI'}]},
  {s: 38.94, e: 40.76, lines: [{text: 'ma’lum bir', serif: true}, {text: 'KETMA-KETLIK'}]},
  {s: 40.8, e: 41.28, lines: [{text: 'BARMOQ'}]},
  {s: 41.3, e: 41.9, lines: [{text: 'QO’L'}]},
  {s: 41.92, e: 42.54, lines: [{text: 'YUZ'}]},
  {s: 42.56, e: 43.56, lines: [{text: 'GAVDA'}]},
  {s: 43.58, e: 44.08, lines: [{text: 'OYOQ'}]},
  {s: 67.04, e: 70.7, lines: [{text: 'ANIQ'}, {text: 'hamda', serif: true}, {text: 'NOZIK'}]},
];

const CHIPS: {s: number; e: number; text: string; y: number}[] = [
  {s: 1.68, e: 3.3, text: 'ODDIY HARAKAT', y: 220},
  {s: 13.1, e: 14.7, text: 'MOTOR KORTEKS', y: 60},
  {s: 20.86, e: 25.2, text: 'IXTIYORIY HARAKATLAR', y: 220},
  {s: 35.9, e: 38.9, text: 'TANA XARITASI', y: 220},
  {s: 61.26, e: 66.95, text: 'XULOSA', y: 220},
];

const SFX: {t: number; src: string; v: number}[] = [
  {t: 0.0, src: 'thud.wav', v: 0.35},
  ...SEGMENTS.flatMap((g) => [
    {t: g.s - 0.12, src: 'whoosh.wav', v: 0.2},
    {t: g.e - SEG_T - 0.1, src: 'whoosh.wav', v: 0.16},
  ]),
  ...TITLES.map((x) => ({t: x.s, src: 'pop.wav', v: 0.22})),
  ...CHIPS.map((x) => ({t: x.s, src: 'tick.wav', v: 0.25})),
  {t: 13.1, src: 'ding.wav', v: 0.12},
  {t: 67.04, src: 'ding.wav', v: 0.14},
  ...[46.68, 48.22, 49.06, 49.8, 56.8, 57.52].map((t) => ({t, src: 'tick.wav', v: 0.28})),
  {t: 31.16, src: 'whoosh.wav', v: 0.14},
];

// ---------- helpers ----------

const segProgress = (t: number) => {
  for (const g of SEGMENTS) {
    if (t >= g.s && t <= g.e) {
      const a = interpolate(t, [g.s, g.s + SEG_T], [0, 1], {...clamp, easing: ease});
      const b = interpolate(t, [g.e - SEG_T, g.e], [1, 0], {...clamp, easing: ease});
      return {p: Math.min(a, b), seg: g};
    }
  }
  return {p: 0, seg: null as Seg | null};
};

const zoomAt = (t: number) => {
  let i = 0;
  for (let k = 0; k < ZOOMS.length; k++) if (ZOOMS[k][0] <= t) i = k;
  const [t0, z] = ZOOMS[i];
  const t1 = i + 1 < ZOOMS.length ? ZOOMS[i + 1][0] : DURATION;
  // slow push within each shot keeps the frame alive between cuts
  return z * (1 + 0.025 * Math.min(1, (t - t0) / Math.max(1, t1 - t0)));
};

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- layers ----------

const SpeakerVideo: React.FC = () => {
  const t = useT();
  const {p} = segProgress(t);
  const card = {x: 56, y: 800, w: 360, h: 640, r: 34};
  const x = lerp(0, card.x, p);
  const y = lerp(0, card.y, p);
  const w = lerp(1080, card.w, p);
  const h = lerp(1920, card.h, p);
  const scale = lerp(zoomAt(t), 1.0, p);
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden',
        borderRadius: lerp(0, card.r, p), boxShadow: p > 0 ? `0 30px 80px rgba(0,0,0,${0.55 * p})` : undefined,
      }}
    >
      <Video
        src={staticFile('base.mp4')}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`, transformOrigin: '50% 30%'}}
      />
    </div>
  );
};

const GridBackground: React.FC = () => {
  const {p} = segProgress(useT());
  if (p <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: p,
        backgroundColor: MAROON,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.055) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.055) 2px, transparent 2px)',
        backgroundSize: '108px 108px',
        backgroundPosition: '-2px -2px',
      }}
    />
  );
};

const Flash: React.FC = () => {
  const t = useT();
  const o = Math.max(0, ...FLASHES.map((f) => interpolate(t, [f, f + 0.14], [0.55, 0], clamp) * (t >= f ? 1 : 0)));
  return o > 0 ? <AbsoluteFill style={{backgroundColor: 'white', opacity: o}} /> : null;
};

const TitleBlock: React.FC<{s: number; e: number; lines: Line[]}> = ({s, e, lines}) => {
  const t = useT();
  const frame = useCurrentFrame();
  const out = interpolate(t, [e - 0.12, e], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 150, opacity: out}}>
      {lines.map((l, i) => {
        const pr = spring({frame: frame - (s + i * 0.1) * FPS, fps: FPS, config: {damping: 13, mass: 0.5}});
        return (
          <div
            key={i}
            style={{
              fontFamily: l.serif ? SERIF : ANTON,
              fontStyle: l.serif ? 'italic' : 'normal',
              fontWeight: l.serif ? 500 : 400,
              fontSize: l.serif ? 84 : l.size ?? 168,
              lineHeight: l.serif ? 1.05 : 0.95,
              letterSpacing: l.serif ? 0 : -1,
              color: 'white',
              textShadow: '0 6px 30px rgba(0,0,0,0.45)',
              opacity: pr,
              transform: `translateY(${(1 - pr) * 40}px) scale(${0.92 + 0.08 * pr})`,
              marginTop: l.serif ? -6 : 0,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Chip: React.FC<{s: number; e: number; text: string; y: number}> = ({s, e, text, y}) => {
  const t = useT();
  const pr = useIn(s, 15);
  const out = interpolate(t, [e - 0.15, e], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', top: y}}>
      <div
        style={{
          background: ORANGE, color: 'white', fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 1,
          padding: '12px 28px', borderRadius: 14, opacity: pr * out, transform: `scale(${0.7 + 0.3 * pr})`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const KEYWORDS = /^(miya|miyani|miyada|chap|o'ng|po'stlog'i|po'stlog'ida|nozik|katta|kam|barmoqlarimiz|tilimiz|yuzimiz|qarama-qarshi|ixtiyoriy)$/i;

type W = {t: string; s: number; e: number};
const Captions: React.FC = () => {
  const t = useT();
  const {p} = segProgress(t);
  const chunks = (captions as {chunks: {s: number; e: number; words: W[]}[]}).chunks;
  const idx = chunks.findIndex((c, i) => t >= c.s - 0.05 && t < (i + 1 < chunks.length ? Math.min(chunks[i + 1].s - 0.05, c.e + 0.8) : c.e + 0.8));
  if (idx < 0) return null;
  const c = chunks[idx];
  const y = lerp(1330, 1590, p);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 18}}>
      {c.words.map((w, i) => {
        const pr = interpolate(t, [w.s - 0.04, w.s + 0.14], [0, 1], {...clamp, easing: ease});
        const clean = w.t.replace(/[.,?!]+$/, '').replace(/’/g, "'");
        const key = KEYWORDS.test(clean);
        const shown = w.t.replace(/'/g, '’');
        return (
          <span
            key={i}
            style={{
              fontFamily: key ? ANTON : SERIF,
              fontStyle: key ? 'normal' : 'italic',
              fontWeight: key ? 400 : 500,
              fontSize: key ? 84 : 70,
              textTransform: key ? 'uppercase' : 'none',
              color: key && t >= w.s && t < w.e + 0.25 ? '#FFD9C7' : 'white',
              textShadow: '0 3px 18px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.6)',
              opacity: pr,
              transform: `translateY(${(1 - pr) * 22}px)`,
              display: 'inline-block',
            }}
          >
            {shown}
          </span>
        );
      })}
    </div>
  );
};

// ---------- motion-design segment pieces ----------

const BrainIcon: React.FC<{size: number; color?: string}> = ({size, color = 'white'}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M48,18 C38,8 18,14 18,30 C8,34 8,52 16,58 C12,72 26,84 38,80 C42,88 48,88 48,82 Z" />
    <path d="M52,18 C62,8 82,14 82,30 C92,34 92,52 84,58 C88,72 74,84 62,80 C58,88 52,88 52,82 Z" />
    <path d="M30,40 C36,42 38,48 34,54 M70,40 C64,42 62,48 66,54" />
  </svg>
);

const SegmentChrome: React.FC<{seg: Seg; p: number}> = ({seg, p}) => {
  const t = useT();
  const badge = useIn(seg.s + 0.2);
  const bottomIdx = seg.id === 'D' && t >= 54.58 ? 1 : 0;
  const bt = useIn(seg.id === 'D' && bottomIdx === 1 ? 54.58 : seg.s + 0.35);
  return (
    <AbsoluteFill style={{opacity: p}}>
      <div style={{position: 'absolute', left: 140, top: 440, width: 160, height: 160, borderRadius: 36, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${badge})`, boxShadow: '0 16px 40px rgba(232,102,61,0.35)'}}>
        <BrainIcon size={112} />
      </div>
      <div style={{position: 'absolute', left: 60, width: 320, top: 625, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: 'white', opacity: badge, letterSpacing: -1}}>
        Miya 101
      </div>
      <div style={{position: 'absolute', left: 444, top: 1268, fontFamily: SANS, fontWeight: 800, fontSize: 78, color: 'white', letterSpacing: -2, opacity: bt, transform: `translateY(${(1 - bt) * 30}px)`, whiteSpace: 'nowrap'}}>
        {seg.bottom[bottomIdx]}
      </div>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{seg: Seg; p: number; title: string; sub: string; children: React.ReactNode}> = ({seg, p, title, sub, children}) => {
  const pr = useIn(seg.s + 0.12, 16);
  return (
    <div
      style={{
        position: 'absolute', left: 444, top: 292, width: 560, height: 956, borderRadius: 44, overflow: 'hidden',
        background: '#F1F3F7', opacity: p * pr, transform: `scale(${0.9 + 0.1 * pr})`, transformOrigin: '50% 50%',
        backgroundImage: 'linear-gradient(rgba(20,30,60,0.045) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(20,30,60,0.045) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px', boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{textAlign: 'center', marginTop: 70, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: INK, letterSpacing: -0.5}}>{title}</div>
      <div style={{textAlign: 'center', marginTop: 8, fontFamily: SANS, fontWeight: 500, fontSize: 24, color: '#7A808C'}}>{sub}</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 170, bottom: 0}}>{children}</div>
    </div>
  );
};

const drawn = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});

const SegA: React.FC<{seg: Seg; p: number}> = ({seg, p}) => {
  const t = useT();
  const leftOn = drawn(t, 6.7, 7.4) * (t < 9.0 ? 1 : interpolate(t, [9.0, 9.3], [1, 0.25], clamp));
  const rightOn = drawn(t, 9.5, 10.2);
  const a1 = drawn(t, 6.3, 7.3);
  const a2 = drawn(t, 9.1, 10.1);
  const hemi = (d: string, on: number, color: string) => (
    <>
      <path d={d} fill="#E3E7EE" stroke="#BCC3D0" strokeWidth={3} />
      <path d={d} fill={color} opacity={on * 0.9} />
    </>
  );
  const L = 'M196,40 C120,30 40,80 36,180 C32,280 100,350 190,345 C194,250 194,130 196,40 Z';
  const R = 'M204,40 C280,30 360,80 364,180 C368,280 300,350 210,345 C206,250 206,130 204,40 Z';
  return (
    <Panel seg={seg} p={p} title="Qarama-qarshi boshqaruv" sub="Miya yarim sharlari · yuqoridan">
      <svg width={560} height={760} viewBox="-40 0 480 650">
        {hemi(L, leftOn, BLUE)}
        {hemi(R, rightOn, GREEN)}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? 'translate(400,0) scale(-1,1)' : undefined} fill="none" stroke="rgba(60,70,90,0.22)" strokeWidth={3} strokeLinecap="round">
            <path d="M80,120 C110,110 120,140 150,130" />
            <path d="M60,190 C100,180 110,215 160,200" />
            <path d="M70,260 C110,250 120,285 165,270" />
          </g>
        ))}
        <text x={115} y={195} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={leftOn > 0.5 ? 'white' : '#5A6170'}>CHAP</text>
        <text x={285} y={195} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={rightOn > 0.5 ? 'white' : '#5A6170'}>O’NG</text>
        <path d="M310,500 C300,380 120,400 115,250" fill="none" stroke={BLUE} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - a1} />
        <path d="M90,500 C100,380 280,400 285,250" fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - a2} />
        {[
          {x: 90, label: 'Chap qo’l', on: a2, c: GREEN},
          {x: 310, label: 'O’ng qo’l', on: a1, c: BLUE},
        ].map((h) => (
          <g key={h.x}>
            <rect x={h.x - 95} y={505} width={190} height={70} rx={35} fill={h.on > 0.05 ? h.c : 'white'} stroke="#D3D8E2" strokeWidth={2} />
            <text x={h.x} y={550} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill={h.on > 0.05 ? 'white' : INK}>{h.label}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
};

const SegB: React.FC<{seg: Seg; p: number}> = ({seg, p}) => {
  const t = useT();
  const front = drawn(t, 15.16, 15.7);
  const strip = drawn(t, 16.08, 16.6);
  const sulcus = drawn(t, 17.4, 18.3);
  const OUTLINE = 'M60,190 C50,110 120,40 220,38 C320,36 400,90 404,170 C407,225 380,250 345,262 C330,290 290,300 255,288 C230,300 190,300 165,290 C120,300 70,270 60,190 Z';
  const rows = [
    {t: 15.16, c: '#F7B79F', label: 'Peshona bo’lagi'},
    {t: 16.08, c: ORANGE, label: 'Markaz oldi pushtasi'},
    {t: 17.4, c: INK, label: 'Markaziy egat', dashed: true},
  ];
  return (
    <Panel seg={seg} p={p} title="Birlamchi harakat po’stlog’i" sub="Motor korteks · yon tomondan">
      <svg width={560} height={440} viewBox="20 10 420 380">
        <defs>
          <clipPath id="brainclip"><path d={OUTLINE} /></clipPath>
        </defs>
        <path d="M255,288 C258,320 262,345 270,370 L292,370 C285,340 282,312 285,292 Z" fill="#D7DCE5" />
        <path d="M290,262 C330,258 368,272 360,302 C350,330 300,330 278,300 Z" fill="#D7DCE5" stroke="#BCC3D0" strokeWidth={3} />
        <path d={OUTLINE} fill="#E3E7EE" stroke="#BCC3D0" strokeWidth={3} />
        <g clipPath="url(#brainclip)">
          <path d="M40,190 C40,100 120,20 220,20 L238,40 C228,100 236,150 214,200 C206,225 204,245 200,262 L200,320 L40,320 Z" fill="#F7B79F" opacity={front * 0.8} />
          <path d="M208,30 C198,100 206,150 184,200 C176,225 174,245 170,270 L200,268 C204,245 206,225 214,200 C236,150 228,100 238,30 Z" fill={ORANGE} opacity={strip} />
          <g fill="none" stroke="rgba(60,70,90,0.2)" strokeWidth={3} strokeLinecap="round">
            <path d="M110,120 C140,110 150,140 180,125" />
            <path d="M270,90 C300,85 310,115 345,110" />
            <path d="M280,170 C310,160 330,190 370,180" />
            <path d="M100,220 C130,210 140,240 170,230" />
          </g>
        </g>
        <path d="M238,40 C228,100 236,150 214,200 C206,225 204,245 200,262" fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 10" opacity={sulcus} />
      </svg>
      <div style={{padding: '0 46px', marginTop: 20}}>
        {rows.map((r) => {
          const pr = spring({frame: (t - r.t) * FPS, fps: FPS, config: {damping: 14}});
          return (
            <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 18, background: 'white', borderRadius: 22, padding: '20px 24px', marginBottom: 16, opacity: pr, transform: `translateX(${(1 - pr) * 60}px)`, boxShadow: '0 6px 18px rgba(20,30,60,0.08)'}}>
              <div style={{width: 30, height: r.dashed ? 0 : 30, borderRadius: 10, background: r.dashed ? 'transparent' : r.c, borderTop: r.dashed ? `5px dashed ${INK}` : undefined}} />
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 32, color: INK}}>{r.label}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const SignalCard: React.FC<{color: string; rank: string; letter: string; name: string; target: string; t0: number; t1: number}> = ({color, rank, letter, name, target, t0, t1}) => {
  const t = useT();
  const fill = drawn(t, t0, t0 + 0.35);
  const content = drawn(t, t0 + 0.3, t0 + 0.7);
  const chars = Math.round(interpolate(t, [t0 + 0.8, t0 + 1.6], [0, target.length], clamp));
  const bar = drawn(t, t0 + 0.8, t1 - 0.3);
  const done = t > t1 - 0.6;
  return (
    <div style={{position: 'absolute', left: 36, right: 36, top: 60, height: 520, borderRadius: 36, background: color, opacity: fill, transform: `scale(${0.94 + 0.06 * fill})`, boxShadow: `0 24px 50px ${color}66`, padding: 30, color: 'white', fontFamily: SANS}}>
      <div style={{opacity: content}}>
        <div style={{display: 'inline-block', background: 'rgba(255,255,255,0.22)', borderRadius: 12, padding: '6px 14px', fontWeight: 700, fontSize: 22}}>{rank}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 22}}>
          <div style={{width: 66, height: 66, borderRadius: 33, border: '3px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30}}>{letter}</div>
          <div>
            <div style={{fontWeight: 800, fontSize: 40, lineHeight: 1}}>{name}</div>
            <div style={{fontWeight: 500, fontSize: 20, opacity: 0.8, marginTop: 4}}>harakat po’stlog’i · signal</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 24}}>
          {[['TUR', 'Ixtiyoriy'], ['YO’NALISH', 'Kesishgan']].map(([k, v]) => (
            <div key={k} style={{flex: 1, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 16, padding: '10px 14px'}}>
              <div style={{fontSize: 16, fontWeight: 700, opacity: 0.85}}>{k}</div>
              <div style={{fontSize: 28, fontWeight: 800}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize: 18, fontWeight: 700, opacity: 0.85, marginTop: 18}}>BOSHQARADI</div>
        <div style={{fontFamily: ANTON, fontSize: 92, lineHeight: 1.05, height: 98}}>{target.slice(0, chars)}</div>
        <div style={{height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)', marginTop: 8}}>
          <div style={{height: 8, borderRadius: 4, background: 'white', width: `${bar * 100}%`}} />
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', color, borderRadius: 30, padding: '8px 10px 8px 22px', marginTop: 18, fontWeight: 800, fontSize: 24}}>
          {done ? 'Harakat ✓' : 'Signal yuborilmoqda'}
          <div style={{width: 36, height: 36, borderRadius: 18, background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22}}>→</div>
        </div>
      </div>
    </div>
  );
};

const SegC: React.FC<{seg: Seg; p: number}> = ({seg, p}) => {
  const t = useT();
  const swap = 31.0;
  const out1 = interpolate(t, [swap, swap + 0.3], [0, -620], {...clamp, easing: ease});
  const in2 = interpolate(t, [swap, swap + 0.35], [620, 0], {...clamp, easing: ease});
  const page = t < swap ? 0 : 1;
  return (
    <Panel seg={seg} p={p} title="Harakat boshqaruvi" sub="Signal tananing qarama-qarshi tomoniga">
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${out1}px)`}}>
        <SignalCard color={BLUE} rank="#1 · chap yarim shar" letter="C" name="Chap po’stloq" target="O’NG TANA" t0={27.3} t1={swap} />
      </div>
      {t >= swap && (
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${in2}px)`}}>
          <SignalCard color={GREEN} rank="#2 · o’ng yarim shar" letter="O" name="O’ng po’stloq" target="CHAP TANA" t0={swap + 0.1} t1={35.6} />
        </div>
      )}
      <div style={{position: 'absolute', top: 610, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: i === page ? 34 : 12, height: 12, borderRadius: 6, background: i === page ? BLUE : '#C9CED8'}} />
        ))}
      </div>
    </Panel>
  );
};

const SegD: React.FC<{seg: Seg; p: number}> = ({seg, p}) => {
  const t = useT();
  const rows = [
    {t: 46.68, name: 'Barmoqlar', w: 0.95, big: true},
    {t: 48.22, name: 'Til', w: 0.82, big: true},
    {t: 49.06, name: 'Yuz', w: 0.76, big: true},
    {t: 49.8, name: 'Mimika mushaklari', w: 0.7, big: true},
    {t: 56.8, name: 'Gavda', w: 0.16, big: false},
    {t: 57.52, name: 'Oyoq', w: 0.12, big: false},
  ];
  const divider = spring({frame: (t - 54.58) * FPS, fps: FPS, config: {damping: 14}});
  return (
    <Panel seg={seg} p={p} title="Miyadagi maydon" sub="Harakat po’stlog’i xaritasi">
      <div style={{padding: '10px 34px'}}>
        {rows.map((r, i) => {
          const pr = spring({frame: (t - r.t) * FPS, fps: FPS, config: {damping: 15}});
          const bw = interpolate(t, [r.t + 0.1, r.t + 0.9], [0, r.w], {...clamp, easing: ease});
          const color = r.big ? ORANGE : '#8C96A8';
          return (
            <React.Fragment key={r.name}>
              {i === 4 && (
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#7A808C', letterSpacing: 2, margin: '18px 6px 10px', opacity: divider}}>KAM JOY EGALLAYDI</div>
              )}
              {i === 0 && (
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: ORANGE, letterSpacing: 2, margin: '0 6px 10px', opacity: drawn(t, 44.3, 44.8)}}>KATTA MAYDON</div>
              )}
              <div style={{background: 'white', borderRadius: 22, padding: '16px 20px', marginBottom: 12, opacity: pr, transform: `translateY(${(1 - pr) * 30}px)`, boxShadow: '0 6px 18px rgba(20,30,60,0.08)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK}}>
                  <span>{r.name}</span>
                  <span style={{color, fontSize: 20, alignSelf: 'center'}}>{r.big ? 'KATTA' : 'KICHIK'}</span>
                </div>
                <div style={{height: 14, borderRadius: 7, background: '#E8EBF1', marginTop: 10}}>
                  <div style={{height: 14, borderRadius: 7, background: color, width: `${bw * 100}%`}} />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Panel>
  );
};

const MotionSegment: React.FC = () => {
  const t = useT();
  const {p, seg} = segProgress(t);
  if (!seg || p <= 0) return null;
  const Body = {A: SegA, B: SegB, C: SegC, D: SegD}[seg.id];
  return (
    <AbsoluteFill>
      <SegmentChrome seg={seg} p={p} />
      <Body seg={seg} p={p} />
    </AbsoluteFill>
  );
};

const EndFade: React.FC = () => {
  const o = interpolate(useT(), [DURATION - 0.45, DURATION], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{backgroundColor: 'black', opacity: o}} /> : null;
};

export const Edit: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: 'black'}}>
    <GridBackground />
    <SpeakerVideo />
    <MotionSegment />
    {TITLES.map((x) => (
      <Sequence key={`t${x.s}`} from={Math.round(x.s * FPS)} durationInFrames={Math.round((x.e - x.s) * FPS)}>
        <AbsoluteFill>
          <TitleBlockAbs {...x} />
        </AbsoluteFill>
      </Sequence>
    ))}
    {CHIPS.map((x) => (
      <Sequence key={`c${x.s}`} from={Math.round(x.s * FPS)} durationInFrames={Math.round((x.e - x.s) * FPS)}>
        <ChipAbs {...x} />
      </Sequence>
    ))}
    <Captions />
    <Flash />
    <EndFade />
    {SFX.map((x, i) => (
      <Sequence key={`s${i}`} from={Math.max(0, Math.round(x.t * FPS))} durationInFrames={30}>
        <Audio src={staticFile(x.src)} volume={x.v} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// Sequences reset the frame counter; these wrappers shift it back to absolute time.
const TitleBlockAbs: React.FC<{s: number; e: number; lines: Line[]}> = (x) => (
  <Sequence from={-Math.round(x.s * FPS)} layout="none">
    <TitleBlock {...x} />
  </Sequence>
);
const ChipAbs: React.FC<{s: number; e: number; text: string; y: number}> = (x) => (
  <Sequence from={-Math.round(x.s * FPS)} layout="none">
    <Chip {...x} />
  </Sequence>
);
