import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Motes, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (suhu, kalor, hukum termodinamika)',
  'D. Halliday, R. Resnick & J. Walker, Fundamentals of Physics (teori kinetik gas, entropi)',
  'A. G. Sarojo, Seri Fisika Dasar: Termodinamika',
  'P. Atkins & J. de Paula, Physical Chemistry (distribusi Boltzmann, entropi statistik, kalorimetri)',
  'CODATA (tetapan Boltzmann) · NIST Chemistry WebBook (kalor laten air, kalor pembakaran glukosa)',
  'RPS Fisika Umum S1 Kimia UNESA (termofisika)',
];

// butir yang mengorbit logo (warna = kode warna gelombang: y toska, gelombang kedua ungu, λ merah muda, v hijau, f emas, simpul merah)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'cyan', ph: 0},
  {hue: 'spr', ph: 1.05},
  {hue: 'press', ph: 2.09},
  {hue: 'work', ph: 3.14},
  {hue: 'gold', ph: 4.19},
  {hue: 'heat', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

/** Motif kiri: tali dengan gelombang berdiri n = 3 (simpul merah tetap) + gelombang berjalan kecil (v hijau). */
const StandingString: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const a0 = x + 14;
  const a1 = x + 246;
  const sy = y - 130;
  const amp = 34 * Math.cos(2 * Math.PI * 0.7 * t);
  const pts = (A: number) => {
    const out: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const xx = a0 + ((a1 - a0) * i) / 48;
      out.push(`${xx.toFixed(1)},${(sy - A * Math.sin((3 * Math.PI * i) / 48)).toFixed(1)}`);
    }
    return out.join(' ');
  };
  const trav: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const xx = a0 + ((a1 - a0) * i) / 48;
    trav.push(`${xx.toFixed(1)},${(y - 42 - 10 * Math.sin((xx - x) * 0.07 - t * 3.2)).toFixed(1)}`);
  }
  return (
    <g opacity={opacity}>
      <Glow x={x + 130} y={sy} r={150} color="cyan" opacity={0.35} />
      <rect x={a0 - 12} y={sy - 50} width={10} height={100} rx={3} fill="#5b6a9e" />
      <rect x={a1 + 2} y={sy - 50} width={10} height={100} rx={3} fill="#5b6a9e" />
      <polyline points={pts(34)} fill="none" stroke={C.cyan} strokeWidth={1.5} strokeDasharray="4 6" opacity={0.45} />
      <polyline points={pts(-34)} fill="none" stroke={C.cyan} strokeWidth={1.5} strokeDasharray="4 6" opacity={0.45} />
      <polyline points={pts(amp)} fill="none" stroke={C.cyan} strokeOpacity={0.25} strokeWidth={10} />
      <polyline points={pts(amp)} fill="none" stroke={C.cyan} strokeWidth={3.5} />
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={a0 + ((a1 - a0) * k) / 3} cy={sy} r={6} fill={C.heat} />
      ))}
      <polyline points={trav.join(' ')} fill="none" stroke={C.spr} strokeWidth={2.5} opacity={0.8} />
      <line x1={x + 170} y1={y - 12} x2={x + 236} y2={y - 12} stroke={C.work} strokeWidth={3} markerEnd="url(#arrow-work)" />
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Motif kanan: dua sumber riak (toska & ungu) yang muka gelombangnya mengembang & saling bertumpang. */
const Ripples: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const cy = y - 120;
  const src = [
    {sx: x + 85, hue: 'cyan' as Hue, col: C.cyan, off: 0},
    {sx: x + 175, hue: 'spr' as Hue, col: C.spr, off: 0.5},
  ];
  return (
    <g opacity={opacity}>
      <Glow x={x + 130} y={cy} r={160} color="spr" opacity={0.35} />
      <ellipse cx={x + 130} cy={cy} rx={150} ry={110} fill="#0b2f66" opacity={0.25} />
      {src.map((s) =>
        [0, 1, 2, 3].map((k) => {
          const q = (((t * 0.45 + k / 4 + s.off / 4) % 1) + 1) % 1;
          return <circle key={`${s.sx}-${k}`} cx={s.sx} cy={cy} r={8 + q * 120} fill="none" stroke={s.col} strokeWidth={2.2} opacity={cyc(q) * 0.7} />;
        }),
      )}
      {src.map((s) => (
        <Spark key={s.sx} x={s.sx} y={cy + 4 * Math.sin(2 * Math.PI * 0.9 * t + s.off * 6)} r={7} color={s.hue} />
      ))}
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan pil penutup seri (motif gelombang). */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const next = ramp(t, 6, 7);
  const motif = ramp(t, 1.0, 3.0);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  const orbitOn = ramp(t, 0.8, 2.2);
  const pts = ORBIT.map((o) => {
    const a = o.ph + t * OC.sp;
    const trail = [1, 2, 3, 4, 5].map((k) => orbitPt(a - k * 0.07));
    return {o, a, p: orbitPt(a), trail, front: Math.sin(a) > 0};
  });
  const ring = (front: boolean) =>
    pts
      .filter((q) => q.front === front)
      .map((q) => <Spark key={q.o.hue} x={q.p[0]} y={q.p[1]} r={5.25 + 1.25 * Math.sin(q.a)} color={q.o.hue} trail={q.trail} opacity={orbitOn * (0.8 + 0.2 * Math.sin(q.a))} />);
  const ellipseD = (() => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt((i / 48) * Math.PI * 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={240} r={440} color="cyan" opacity={0.35 * logo} />
        <Glow x={960} y={188} r={200} color="spr" opacity={0.3 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="cyan" opacity={0.45 * logo} seed={13} />
        {/* butir yang hanyut pelan di atas jejak sinus (gelombang berjalan) */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const x = -40 + p * 2000;
          const base = 140 + rand(k * 5.3) * 780;
          const amp = 8 + 10 * rand(k * 2.2);
          const yAt = (xx: number) => base + amp * Math.sin(xx * 0.03 + k);
          const tail = [1, 2, 3, 4, 5, 6].map((j) => `${(x - j * 6).toFixed(1)},${yAt(x - j * 6).toFixed(1)}`);
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo}>
              <polyline points={`${x.toFixed(1)},${yAt(x).toFixed(1)} ${tail.join(' ')}`} fill="none" stroke="#cdeeff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
              <circle cx={x} cy={yAt(x)} r={2.4} fill="#fff" />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <StandingString x={110} y={860} t={t} opacity={0.85 * motif} />
        <Ripples x={1560} y={860} t={t} opacity={0.85 * motif} />
        <Twinkles x={960} y={530} rx={360} ry={30} n={4} color="gold" opacity={by * 0.7} seed={17} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{
            width: 230,
            height: 230,
            opacity: logo,
            scale: String((0.85 + 0.15 * logo) * (1 + 0.015 * Math.sin(t * 1.3))),
            rotate: `${(1 - logo) * -20}deg`,
          }}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.cyan}55`}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2, translate: `0px ${(1 - by) * 12}px`}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10, opacity: ramp(t, 3.4, 4.2)}}>RUJUKAN</div>
          {REFS.map((r, i) => {
            const o = ramp(t, 3.7 + i * 0.22, 4.6 + i * 0.22);
            return (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55, opacity: o, translate: `0px ${(1 - o) * 10}px`}}>
                {r}
              </div>
            );
          })}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 19, color: C.muted, opacity: 0.85 * ramp(t, 5.2, 6.0)}}>
            Ilustrasi skematis · c air ≈ 4200 J/(kg·K) · suhu kamar ≈ 300 K · gas dianggap ideal
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            fontFamily: FONT.head,
            fontSize: 30,
            color: C.ink,
            opacity: next,
            padding: '10px 28px',
            borderRadius: 999,
            border: `2px solid ${C.cyan}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.cyan}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.ink}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
