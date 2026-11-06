import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import * as F from './fonts';
import layout from './layout.json';

export const FPS = 30;
export const DURATION = layout.duration;
export const W = 1080;
export const H = 1920;

// Fonts are inlined as data URIs (src/fonts.ts) so loading never depends on the network or the render server.
export const SANS = 'PoppinsLocal';
export const MONO = 'MonoLocal';
const FONTS: [string, string, string, string][] = [
  [SANS, F.poppins_300, '300', 'normal'],
  [SANS, F.poppins_400, '400', 'normal'],
  [SANS, F.poppins_500, '500', 'normal'],
  [SANS, F.poppins_600, '600', 'normal'],
  [SANS, F.poppins_700, '700', 'normal'],
  [SANS, F.poppins_300i, '300', 'italic'],
  [MONO, F.mono_400, '400', 'normal'],
];
// Plain CSS @font-face, no delayRender: a FontFace promise held by delayRender timed out in long multi-tab renders.
if (typeof document !== 'undefined' && !document.getElementById('local-fonts')) {
  const el = document.createElement('style');
  el.id = 'local-fonts';
  el.textContent = FONTS.map(([family, uri, weight, style]) => `@font-face{font-family:'${family}';src:url(${uri}) format('woff2');font-weight:${weight};font-style:${style};font-display:block}`).join('\n');
  document.head.appendChild(el);
}

// Hidden glyphs in every weight so each tab decodes all faces before the first visible use.
export const FontWarmup: React.FC = () => (
  <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}>
    {FONTS.map(([family, , weight, style]) => (
      <span key={family + weight + style} style={{fontFamily: family, fontWeight: Number(weight), fontStyle: style}}>Aa’1</span>
    ))}
  </div>
);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const useT = () => useCurrentFrame() / FPS;
export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});
export const springAt = (t: number, t0: number, damping = 14) => spring({frame: Math.round((t - t0) * FPS), fps: FPS, config: {damping, mass: 0.6}});
// fade in at s, fade out before e
export const life = (t: number, s: number, e: number, out = 0.2) => (t < s || t > e ? 0 : Math.min(ramp(t, s, s + 0.25), interpolate(t, [e - out, e], [1, 0], clamp)));

// The same keyframes drive the person transform in the ffmpeg composite (composite.py).
const KF = layout.keyframes as [number, number, number][];
export const layoutAt = (t: number) => {
  if (t <= KF[0][0]) return {s: KF[0][1], dy: KF[0][2]};
  for (let i = 0; i < KF.length - 1; i++) {
    const [t0, s0, d0] = KF[i];
    const [t1, s1, d1] = KF[i + 1];
    if (t >= t0 && t <= t1) {
      const p = t1 - t0 < 0.01 ? 1 : (t - t0) / (t1 - t0);
      return {s: s0 + (s1 - s0) * p, dy: d0 + (d1 - d0) * p};
    }
  }
  const l = KF[KF.length - 1];
  return {s: l[1], dy: l[2]};
};
export const MARKERS = layout.markers;
export const MARKER_DUR = layout.markerDur;
export const inMarker = (t: number) => MARKERS.some((m) => t >= m.t && t < m.t + MARKER_DUR);

export const glassStyle = (warm = false): React.CSSProperties => ({
  background: warm
    ? 'linear-gradient(140deg, rgba(255,214,170,0.42), rgba(255,190,140,0.16))'
    : 'linear-gradient(140deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06))',
  border: '1.5px solid rgba(255,255,255,0.38)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
  backgroundImage: undefined,
});

export const GridTexture: React.FC<{size?: number; alpha?: number}> = ({size = 22, alpha = 0.12}) => (
  <div
    style={{
      position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
      backgroundImage: `linear-gradient(rgba(255,255,255,${alpha}) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,${alpha}) 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
    }}
  />
);

export const PlayCircle: React.FC<{size: number; dim?: boolean}> = ({size, dim}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: dim ? 'rgba(255,255,255,0.55)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,255,255,0.35)', flexShrink: 0}}>
    <div style={{width: 0, height: 0, borderTop: `${size * 0.17}px solid transparent`, borderBottom: `${size * 0.17}px solid transparent`, borderLeft: `${size * 0.27}px solid #2a2d33`, marginLeft: size * 0.07}} />
  </div>
);

export const chromeText: React.CSSProperties = {
  background: 'linear-gradient(180deg, #ffffff 0%, #f1f1f1 45%, #8d9096 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 6px 24px rgba(255,255,255,0.18))',
};
