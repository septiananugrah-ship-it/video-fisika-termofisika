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

// butir yang mengorbit logo (warna = kode warna termofisika: panas merah, kalor jingga, entropi emas, usaha hijau, energi dalam ungu, dingin biru)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'heat', ph: 0},
  {hue: 'kin', ph: 1.05},
  {hue: 'gold', ph: 2.09},
  {hue: 'work', ph: 3.14},
  {hue: 'spr', ph: 4.19},
  {hue: 'pot', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

const tri = (u: number) => 1 - Math.abs(2 * (((u % 1) + 1) % 1) - 1); // pantulan dinding, kontinu

/** Motif kiri: balok panas & balok dingin dihubungkan batang; butir kalor jingga mengalir panas → dingin. */
const HotCold: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const by = y - 120;
  return (
    <g opacity={opacity}>
      <Glow x={x + 40} y={by} r={120} color="heat" opacity={0.45} />
      <Glow x={x + 210} y={by} r={110} color="pot" opacity={0.4} />
      {/* udara panas bergetar di atas balok panas */}
      {[0, 1, 2].map((k) => {
        const p = (((t * 0.4 + k / 3) % 1) + 1) % 1;
        const pts: string[] = [];
        for (let i = 0; i <= 10; i++) {
          const yy = by - 60 - i * 7 - p * 30;
          pts.push(`${(x + 22 + k * 18 + 4 * Math.sin(i * 0.9 + t * 3 + k)).toFixed(1)},${yy.toFixed(1)}`);
        }
        return <polyline key={k} points={pts.join(' ')} fill="none" stroke={C.heat} strokeWidth={2} opacity={cyc(p) * 0.6} />;
      })}
      <rect x={x} y={by - 52} width={80} height={104} rx={12} fill={C.heat} fillOpacity={0.3} stroke={C.heat} strokeWidth={2.5} />
      <rect x={x + 170} y={by - 52} width={80} height={104} rx={12} fill={C.pot} fillOpacity={0.3} stroke={C.pot} strokeWidth={2.5} />
      {Array.from({length: 5}, (_, i) => (
        <circle key={i} cx={x + 184 + (i % 3) * 24} cy={by - 36 + Math.floor(i / 3) * 70} r={2} fill="#e6f4ff" opacity={0.5 + 0.4 * Math.sin(t * 2 + i)} />
      ))}
      <rect x={x + 80} y={by - 9} width={90} height={18} rx={4} fill="#3c4c84" stroke="#6a7bb8" strokeWidth={1.5} />
      {Array.from({length: 4}, (_, i) => {
        const p = (((t * 0.55 + i / 4) % 1) + 1) % 1;
        return (
          <g key={i} opacity={cyc(p)}>
            <circle cx={x + 84 + p * 82} cy={by} r={12} fill="url(#soft-kin)" />
            <circle cx={x + 84 + p * 82} cy={by} r={4.5} fill={C.kin} />
          </g>
        );
      })}
      <text x={x + 40} y={by + 82} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.heat}>
        panas
      </text>
      <text x={x + 210} y={by + 82} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.pot}>
        dingin
      </text>
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Motif kanan: kotak gas berpiston, molekul toska memantul acak (dinding = pantulan segitiga, kontinu). */
const GasBox: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const pis = y - 214 + 10 * Math.sin(t * 1.1);
  const bot = y - 26;
  return (
    <g opacity={opacity}>
      <Glow x={x + 125} y={y - 110} r={160} color="cyan" opacity={0.3} />
      <Glow x={x + 125} y={bot} r={90} color="kin" opacity={0.45} />
      <path d={`M${x + 20},${y - 236} L${x + 20},${bot} L${x + 230},${bot} L${x + 230},${y - 236}`} fill="none" stroke="#8b9ad0" strokeWidth={3} />
      <rect x={x + 24} y={pis + 12} width={202} height={bot - pis - 14} fill={C.cyan} opacity={0.06} />
      <rect x={x + 22} y={pis} width={206} height={12} rx={3} fill="#9fb0e6" />
      <line x1={x + 125} y1={pis} x2={x + 125} y2={pis - 30} stroke="#9fb0e6" strokeWidth={6} />
      {Array.from({length: 14}, (_, i) => {
        const xx = x + 32 + 186 * tri(t * (0.35 + 0.3 * rand(i)) + rand(i * 3.7));
        const yy = pis + 22 + (bot - pis - 34) * tri(t * (0.3 + 0.3 * rand(i * 5.3)) + rand(i * 7.1));
        return (
          <g key={i}>
            <circle cx={xx} cy={yy} r={10} fill="url(#soft-cyan)" />
            <circle cx={xx} cy={yy} r={5} fill={C.cyan} />
          </g>
        );
      })}
      {[0, 1, 2].map((k) => {
        const h = (16 + 5 * Math.sin(t * 11 + k * 2)) * (k === 1 ? 1.3 : 1);
        const cx = x + 95 + k * 30;
        return <path key={k} d={`M${cx - 8},${y - 8} C${cx - 8},${y - 8 - h * 0.6} ${cx},${y - 8 - h * 0.7} ${cx},${y - 8 - h} C${cx},${y - 8 - h * 0.7} ${cx + 8},${y - 8 - h * 0.6} ${cx + 8},${y - 8} Z`} fill={k === 1 ? C.kin : C.heat} opacity={0.85} />;
      })}
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan pil penutup seri (motif panas). */
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
        <Glow x={960} y={240} r={440} color="kin" opacity={0.3 * logo} />
        <Glow x={960} y={188} r={200} color="heat" opacity={0.25 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="kin" opacity={0.45 * logo} seed={13} />
        {/* butir hangat yang naik pelan sambil bergoyang (udara panas) */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const x0 = 60 + rand(k * 5.3) * 1800;
          const xAt = (yy: number) => x0 + (8 + 10 * rand(k * 2.2)) * Math.sin(yy * 0.03 + k);
          const y = 1000 - p * 900;
          const tail = [1, 2, 3, 4, 5, 6].map((j) => `${xAt(y + j * 6).toFixed(1)},${(y + j * 6).toFixed(1)}`);
          const warm = k % 3 !== 0;
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo}>
              <polyline points={`${xAt(y).toFixed(1)},${y.toFixed(1)} ${tail.join(' ')}`} fill="none" stroke={warm ? '#ffd2b0' : '#cdeeff'} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
              <circle cx={xAt(y)} cy={y} r={2.4} fill="#fff" />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.kin} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <HotCold x={110} y={860} t={t} opacity={0.85 * motif} />
        <GasBox x={1560} y={860} t={t} opacity={0.85 * motif} />
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
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.kin}55`}}>{BRAND.channel}</div>
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
            border: `2px solid ${C.kin}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.kin}66`,
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
