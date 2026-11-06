import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import captions from './captions.json';
import {chromeText, clamp, FontWarmup, GridTexture, inMarker, layoutAt, life, MARKER_DUR, MARKERS, PlayCircle, ramp, SANS, springAt, useT} from './common';

// Transparent layer over the keyed speaker: captions, glass lists, diagrams, section markers.

const AMBER = '#FFB37A';
const RED = '#FF5A4E';
const NERVE = '#FFD54A';

// ---------- captions (word-by-word, blur-in, like the reference) ----------
type Wd = {t: string; s: number; e: number};
const CHUNKS = (captions as {chunks: {s: number; e: number; words: Wd[]}[]}).chunks;
const BRACKET_FROM = 66.5; // outro lines switch to the bracketed caption style

const Captions: React.FC = () => {
  const t = useT();
  if (inMarker(t)) return null;
  const idx = CHUNKS.findIndex((c, i) => t >= c.s - 0.05 && t < (i + 1 < CHUNKS.length ? Math.min(CHUNKS[i + 1].s - 0.05, c.e + 0.7) : c.e + 0.7));
  if (idx < 0) return null;
  const c = CHUNKS[idx];
  const {dy} = layoutAt(t);
  const bracket = c.s >= BRACKET_FROM;
  const y = 1170 + dy * 0.95;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 16, rowGap: 4}}>
      {bracket && <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 46, color: 'rgba(255,255,255,0.8)'}}>[</span>}
      {c.words.map((w, i) => {
        const pr = ramp(t, w.s - 0.04, w.s + 0.18);
        const active = t >= w.s && t < w.e + 0.15;
        return (
          <span
            key={i}
            style={{
              fontFamily: SANS, fontWeight: bracket ? 400 : 500, fontSize: bracket ? 42 : 52,
              color: active || bracket ? 'white' : 'rgba(255,255,255,0.88)',
              opacity: pr, filter: `blur(${(1 - pr) * 8}px)`, transform: `translateY(${(1 - pr) * 10}px) scale(${active && !bracket ? 1.04 : 1})`,
              textShadow: '0 2px 18px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.4)', display: 'inline-block',
            }}
          >
            {w.t.replace(/'/g, '’')}
          </span>
        );
      })}
      {bracket && <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 46, color: 'rgba(255,255,255,0.8)'}}>]</span>}
    </div>
  );
};

// ---------- top-left typed title (Asror 2 opener) ----------
const typed = (text: string, t: number, t0: number, cps = 26) => text.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

const CornerTitle: React.FC<{s: number; e: number; kicker: string; big: string; sub: string}> = ({s, e, kicker, big, sub}) => {
  const t = useT();
  const a = life(t, s, e, 0.25);
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 70, top: 110, opacity: a}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${springAt(t, s)})`, transformOrigin: 'left center'}}>
        <PlayCircle size={70} />
        <span style={{fontFamily: SANS, fontWeight: 400, fontSize: 28, color: 'rgba(255,255,255,0.85)'}}>{kicker}</span>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 400, fontSize: 96, color: 'white', lineHeight: 1.05, marginTop: 14, letterSpacing: -2, textShadow: '0 4px 30px rgba(0,0,0,0.4)', minHeight: 100}}>{typed(big, t, s + 0.15)}</div>
      <div style={{fontFamily: SANS, fontStyle: 'italic', fontWeight: 300, fontSize: 58, color: 'white', marginLeft: 180, marginTop: -6, minHeight: 64}}>{typed(sub, t, s + 0.15 + big.length / 26)}</div>
    </div>
  );
};

// ---------- section markers: "#1 o'rinda" glitch over a pixelated frame ----------
const Markers: React.FC = () => {
  const t = useT();
  const m = MARKERS.find((x) => t >= x.t && t < x.t + MARKER_DUR);
  if (!m) return null;
  const k = Math.floor(t * 30);
  const jitter = (seed: string) => (random(`${seed}${k}`) - 0.5) * 2;
  const p = (t - m.t) / MARKER_DUR;
  const a = interpolate(p, [0, 0.12, 0.85, 1], [0, 1, 1, 0], clamp);
  const glitchOn = p < 0.3 || p > 0.75 || random(`g${k}`) > 0.75;
  const dx = glitchOn ? jitter('x') * 14 : 0;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.6px, transparent 1.8px)', backgroundSize: '9px 9px'}} />
      <div style={{position: 'absolute', left: 110, top: 720}}>
        <div
          style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 250, color: 'white', lineHeight: 1, letterSpacing: -6,
            transform: `translateX(${dx}px) skewX(${glitchOn ? jitter('s') * 6 : 0}deg)`,
            textShadow: glitchOn ? `${6 + dx * 0.3}px 0 rgba(255,40,80,0.85), ${-6 - dx * 0.3}px 0 rgba(40,230,255,0.85)` : '0 6px 40px rgba(0,0,0,0.5)',
            clipPath: glitchOn && random(`c${k}`) > 0.5 ? `inset(${Math.floor(random(`i${k}`) * 40)}% 0 ${Math.floor(random(`j${k}`) * 30)}% 0)` : undefined,
          }}
        >
          {m.n}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 80, color: 'transparent', WebkitTextStroke: '2px white', marginTop: -10, transform: `translateX(${-dx * 0.6}px)`}}>{m.label}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- glass panel in the top region (speaker is shifted down while it shows) ----------
const TopPanel: React.FC<{s: number; e: number; title: string; children: React.ReactNode; height?: number}> = ({s, e, title, children, height = 620}) => {
  const t = useT();
  const a = life(t, s, e, 0.3);
  if (a <= 0) return null;
  const sp = springAt(t, s, 15);
  return (
    <div
      style={{
        position: 'absolute', left: 50, top: 70, width: 980, height, borderRadius: 44, overflow: 'hidden', opacity: a,
        transform: `translateY(${(1 - sp) * -40}px) scale(${0.94 + 0.06 * sp})`,
        background: 'linear-gradient(150deg, rgba(255,255,255,0.17), rgba(255,255,255,0.05))',
        border: '1.5px solid rgba(255,255,255,0.32)', boxShadow: '0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
      }}
    >
      <GridTexture size={26} alpha={0.06} />
      <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 18}}>
        <PlayCircle size={52} />
        <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 38, color: 'white'}}>{title}</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, bottom: 0}}>{children}</div>
    </div>
  );
};

const Pill: React.FC<{x: number; y: number; text: string; show: number; color?: string; align?: 'left' | 'right'}> = ({x, y, text, show, color = 'white', align = 'left'}) => (
  <div
    style={{
      position: 'absolute', top: y, [align]: x, padding: '10px 22px', borderRadius: 30, background: 'rgba(20,22,26,0.55)', border: `1.5px solid ${color}`,
      fontFamily: SANS, fontWeight: 500, fontSize: 30, color: 'white', whiteSpace: 'nowrap', opacity: show, transform: `scale(${0.8 + 0.2 * show})`,
    } as React.CSSProperties}
  >
    {text}
  </div>
);

// disk cross-section: annulus (tough shell) around a jelly nucleus
const DiskAnatomy: React.FC = () => {
  const t = useT();
  const shell = ramp(t, 10.0, 10.6);
  const jelly = ramp(t, 12.7, 13.3);
  const core = ramp(t, 15.62, 16.2);
  return (
    <TopPanel s={8.3} e={17.15} title="Umurtqalararo disk">
      <svg width={980} height={510} viewBox="0 0 980 510">
        <defs>
          <radialGradient id="jel" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#bfe6ff" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#6fb3e6" stopOpacity={0.75} />
          </radialGradient>
        </defs>
        <ellipse cx={490} cy={240} rx={300} ry={190} fill={`rgba(255,179,122,${0.25 + 0.45 * shell})`} stroke="white" strokeOpacity={0.7} strokeWidth={3} />
        {[0.82, 0.68].map((k) => (
          <ellipse key={k} cx={490} cy={240} rx={300 * k} ry={190 * k} fill="none" stroke="white" strokeOpacity={0.35 + 0.3 * shell} strokeWidth={2} />
        ))}
        <ellipse cx={490} cy={240} rx={150 * (0.6 + 0.4 * jelly)} ry={100 * (0.6 + 0.4 * jelly)} fill="url(#jel)" opacity={0.3 + 0.7 * jelly} />
        <circle cx={490} cy={240} r={34} fill="white" opacity={core * 0.9} />
        <line x1={240} y1={140} x2={140} y2={70} stroke="white" strokeWidth={2} opacity={shell} />
        <line x1={600} y1={250} x2={800} y2={360} stroke="white" strokeWidth={2} opacity={jelly} />
        <line x1={490} y1={240} x2={490} y2={440} stroke="white" strokeWidth={2} opacity={core} />
      </svg>
      <Pill x={40} y={20} text="Qattiq qobiq" show={shell} color={AMBER} />
      <Pill x={40} y={330} text="Jeleysimon modda" show={jelly} color="#8fd0ff" align="right" />
      <Pill x={380} y={430} text="Yadro" show={core} />
    </TopPanel>
  );
};

// ---------- glass progress slider (Asror 1) ----------
const Slider: React.FC = () => {
  const t = useT();
  const s = 28.3;
  const e = 30.5;
  const a = life(t, s, e, 0.25);
  if (a <= 0) return null;
  const v = Math.round(interpolate(t, [28.6, 30.2], [100, 35], {...clamp}));
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: 950, opacity: a}}>
      <div style={{fontFamily: SANS, fontWeight: 400, fontSize: 28, color: 'rgba(255,255,255,0.85)', marginBottom: 12, marginLeft: 6}}>Disk mustahkamligi</div>
      <div style={{position: 'relative', height: 74, borderRadius: 40, background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)'}}>
        <div style={{position: 'absolute', left: 14, top: 13, width: 48, height: 48, borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 20, color: 'white'}}>{v}</div>
        <div style={{position: 'absolute', left: 80, right: 30, top: 32, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.18)'}}>
          <div style={{height: 10, borderRadius: 5, width: `${v}%`, background: v > 60 ? 'white' : `linear-gradient(90deg, white, ${RED})`, boxShadow: '0 0 18px rgba(255,255,255,0.6)'}} />
        </div>
      </div>
    </div>
  );
};

// ---------- numbered glass list with chrome header (Asror 2 "20 TA FORMAT") ----------
const GlassList: React.FC<{s: number; e: number; num: string; label: string; kicker?: string; rows: {t: number; text: string}[]}> = ({s, e, num, label, kicker, rows}) => {
  const t = useT();
  const a = life(t, s, e, 0.3);
  if (a <= 0) return null;
  const hs = springAt(t, s, 13);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 60, opacity: a}}>
      {kicker && <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 400, fontSize: 30, color: 'rgba(255,255,255,0.8)'}}>{kicker}</div>}
      <div style={{textAlign: 'center', transform: `scale(${0.7 + 0.3 * hs})`, opacity: hs}}>
        <div style={{...chromeText, fontFamily: SANS, fontWeight: 600, fontSize: 170, lineHeight: 1, letterSpacing: -8}}>{num}</div>
        <div style={{...chromeText, fontFamily: SANS, fontWeight: 700, fontSize: 46, letterSpacing: 2, marginTop: -6}}>{label}</div>
      </div>
      <div style={{marginTop: 26, padding: '0 90px'}}>
        {rows.map((r, i) => {
          const pr = springAt(t, r.t, 15);
          const on = t >= r.t;
          return (
            <div key={r.text} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '12px 0', borderBottom: '1.5px solid rgba(255,255,255,0.28)', opacity: on ? pr : 0, transform: `translateX(${(1 - pr) * -50}px)`, filter: on ? 'drop-shadow(0 0 14px rgba(255,255,255,0.18))' : undefined}}>
              <PlayCircle size={54} />
              <span style={{flex: 1, fontFamily: SANS, fontWeight: 400, fontSize: 36, color: 'white'}}>{r.text}</span>
              <span style={{fontFamily: SANS, fontWeight: 400, fontSize: 36, color: 'white'}}>{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- herniation: shell cracks, jelly leaks, nerve is pinched ----------
const Herniation: React.FC = () => {
  const t = useT();
  const crack = ramp(t, 42.16, 42.7);
  const leak = ramp(t, 44.78, 45.6);
  const nerve = ramp(t, 45.9, 46.3);
  const pinch = ramp(t, 46.26, 46.8);
  const pulse = pinch > 0 ? 0.6 + 0.4 * Math.sin(t * 12) : 0;
  return (
    <TopPanel s={41.5} e={47.45} title="Disk churrasi qanday paydo bo’ladi">
      <svg width={980} height={510} viewBox="0 0 980 510">
        <ellipse cx={430} cy={240} rx={280} ry={180} fill="rgba(255,179,122,0.6)" stroke="white" strokeOpacity={0.7} strokeWidth={3} />
        <ellipse cx={430} cy={240} rx={140} ry={95} fill="#9fd4f5" opacity={0.9} />
        <path d="M640,175 L668,205 L652,232 L690,262 L700,300" fill="none" stroke="#2a1d14" strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack} />
        <path d={`M560,230 C620,${210 - 20 * leak} ${660 + 120 * leak},${200} ${680 + 150 * leak},240 C${660 + 120 * leak},280 620,${270 + 20 * leak} 560,250 Z`} fill="#9fd4f5" opacity={leak} />
        <path d={`M860,20 C${860 - 40 * pinch},180 ${860 - 60 * pinch},300 860,500`} fill="none" stroke={pinch > 0 ? RED : NERVE} strokeWidth={12} strokeLinecap="round" opacity={nerve} style={{filter: pinch > 0 ? `drop-shadow(0 0 ${18 * pulse}px ${RED})` : undefined}} />
      </svg>
      <Pill x={560} y={30} text="Yorilish" show={crack} color={AMBER} />
      <Pill x={420} y={410} text="Jeley chiqadi" show={leak} color="#8fd0ff" />
      <Pill x={40} y={150} text="Nerv qisiladi" show={pinch} color={RED} align="right" />
    </TopPanel>
  );
};

// ---------- pain path: not the back, down the leg ----------
const PainPath: React.FC = () => {
  const t = useT();
  const back = ramp(t, 54.42, 54.9);
  const path = ramp(t, 56.2, 59.5);
  const leg = ramp(t, 59.96, 60.5);
  const PATH = 'M300,120 C300,220 330,280 420,330 C520,385 600,420 680,470';
  return (
    <TopPanel s={53.3} e={61.45} title="Og’riq qayerga ketadi?">
      <svg width={980} height={510} viewBox="0 0 980 510">
        {Array.from({length: 7}).map((_, i) => (
          <rect key={i} x={250} y={20 + i * 44} width={100} height={34} rx={10} fill="rgba(255,255,255,0.75)" />
        ))}
        <rect x={262} y={250} width={76} height={10} rx={5} fill={AMBER} />
        <path d={PATH} fill="none" stroke="rgba(255,213,74,0.45)" strokeWidth={10} strokeLinecap="round" />
        <path d={PATH} fill="none" stroke={RED} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - path} style={{filter: `drop-shadow(0 0 14px ${RED})`}} />
        <circle cx={700} cy={480} r={26 + 8 * Math.sin(t * 10) * leg} fill={RED} opacity={leg} />
      </svg>
      <Pill x={40} y={190} text="Bel — emas" show={back} color="rgba(255,255,255,0.6)" />
      <Pill x={60} y={300} text="Oyoqqa og’riq" show={leg} color={RED} align="right" />
    </TopPanel>
  );
};

// ---------- next-video card with cursor click (Asror 2 profile card) ----------
const NextCard: React.FC = () => {
  const t = useT();
  const s = 66.8;
  const e = 70.2;
  const a = life(t, s, e, 0.25);
  if (a <= 0) return null;
  const sp = springAt(t, s, 14);
  const click = 68.7;
  const cx = interpolate(t, [67.4, click], [900, 640], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const cy = interpolate(t, [67.4, click], [1880, 1660], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const pressed = t >= click;
  const press = t >= click && t < click + 0.15 ? 0.85 : 1;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 1360, height: 360, borderRadius: 40, overflow: 'hidden', background: 'linear-gradient(150deg, rgba(255,255,255,0.22), rgba(255,255,255,0.07))', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: '0 30px 80px rgba(0,0,0,0.4)', transform: `translateY(${(1 - sp) * 80}px)`}}>
        <GridTexture size={24} alpha={0.06} />
        <div style={{position: 'absolute', left: 40, top: 36, display: 'flex', gap: 24, alignItems: 'center'}}>
          <PlayCircle size={96} />
          <div>
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: 'white'}}>Keyingi video</div>
            <div style={{fontFamily: SANS, fontWeight: 400, fontSize: 28, color: 'rgba(255,255,255,0.8)'}}>Disk churrasi: operatsiya kerakmi?</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 192, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)'}}>
          <div style={{width: '18%', height: 8, borderRadius: 4, background: 'white'}} />
        </div>
        <div style={{position: 'absolute', left: 40, right: 40, bottom: 36, display: 'flex', gap: 18}}>
          <div style={{flex: 1, height: 78, borderRadius: 18, background: pressed ? '#2f7bff' : 'rgba(255,255,255,0.9)', color: pressed ? 'white' : '#1d2026', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 32, transform: `scale(${press})`}}>
            {pressed ? 'Kuzatilmoqda ✓' : 'Kuzatib boring'}
          </div>
          <div style={{flex: 1, height: 78, borderRadius: 18, background: 'rgba(255,255,255,0.18)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 32}}>Saqlash</div>
        </div>
      </div>
      <svg width={70} height={84} viewBox="0 0 24 28" style={{position: 'absolute', left: cx, top: cy, transform: `scale(${press})`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'}}>
        <path d="M2,1 L2,22 L7.5,17 L11,26 L14.5,24.5 L11,16 L18,16 Z" fill="white" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

export const Front: React.FC = () => (
  <AbsoluteFill>
    <CornerTitle s={0.15} e={3.95} kicker="Umurtqa salomatligi" big="Disk yorilsa" sub="nima bo’ladi?" />
    <DiskAnatomy />
    <Slider />
    <GlassList
      s={30.9} e={41.45} num="4" label="TA SABAB"
      rows={[
        {t: 30.98, text: 'Og’ir yuk'},
        {t: 32.44, text: 'Ko’p yuklama'},
        {t: 34.26, text: 'Doimiy og’ir mehnat'},
        {t: 36.38, text: 'Birdaniga egilish'},
      ]}
    />
    <Herniation />
    <PainPath />
    <NextCard />
    <GlassList
      s={70.6} e={80.5} num="4" label="TA SAVOL" kicker="Keyingi videoda"
      rows={[
        {t: 70.58, text: 'Qachon operatsiya kerak?'},
        {t: 72.76, text: 'Endoskop bilan qachon?'},
        {t: 74.4, text: 'Ochiq amaliyot qachon?'},
        {t: 76.62, text: 'Operatsiyasiz davolash'},
      ]}
    />
    <CornerTitle s={80.95} e={83.6} kicker="Davomi bor" big="Batafsil —" sub="keyingi videoda." />
    <Captions />
    <Markers />
    <FontWarmup />
  </AbsoluteFill>
);
