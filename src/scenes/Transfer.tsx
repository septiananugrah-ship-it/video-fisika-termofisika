import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Arrow, Formula, Glow, Label, Motes, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Tiga cara perpindahan kalor (gerak lambat, kualitatif):
//  Konduksi: suhu batang T(x, τ) = erfc(x / 2√(Dτ)) (sumber panas tetap di ujung kiri); D logam ≫ D kayu.
//    Atom hanya bergetar di tempat (amplitudo ∝ T), energi diteruskan ke tetangga.
//  Konveksi: dua sel sirkulasi di panci — fluida panas naik di atas nyala api, mendingin di permukaan, turun di sisi.
//  Radiasi: Matahari → Bumi lewat ruang hampa, gelombang EM.
//  P = eσAT⁴ → T × 2 ⇒ P × 2⁴ = 16 (batang 1 : 16).

const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const erfc = (x: number) => {
  const z = Math.max(0, x);
  const k = 1 / (1 + 0.3275911 * z);
  return k * (0.254829592 + k * (-0.284496736 + k * (1.421413741 + k * (-1.453152027 + k * 1.061405429)))) * Math.exp(-z * z);
};

const Flame: React.FC<{x: number; y: number; s?: number; t: number; k?: number; opacity?: number}> = ({x, y, s = 1, t, k = 0, opacity = 1}) => {
  if (s <= 0.01 || opacity <= 0.001) return null;
  const f = 1 + 0.13 * Math.sin(t * 11 + k * 1.7) + 0.07 * Math.sin(t * 17.3 + k);
  const sw = 3 * Math.sin(t * 7 + k * 2.3);
  const d = (w: number, h: number) => `M${-w},0 C${-w * 1.25},${-h * 0.42} ${-w * 0.3 + sw},${-h * 0.66} ${sw},${-h} C${w * 0.3 + sw},${-h * 0.66} ${w * 1.25},${-h * 0.42} ${w},0 Q0,${w * 0.55} ${-w},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <path d={d(15, 50 * f)} fill={C.kin} opacity={0.85} />
      <path d={d(9, 32 * f)} fill={C.gold} />
      <path d={d(4, 15 * f)} fill="#fff6e0" />
    </g>
  );
};

const PANELS = [
  {x0: 100, x1: 660, title: 'Konduksi', hue: C.kin},
  {x0: 680, x1: 1240, title: 'Konveksi', hue: C.water},
  {x0: 1260, x1: 1820, title: 'Radiasi', hue: C.gold},
];
const PY0 = 190;
const PY1 = 790;

/* ---------------- konduksi ---------------- */
const Rod: React.FC<{y: number; t: number; tau: number; D: number; ign: number; metal: boolean; label: number; name: string; verdict: string}> = ({y, t, tau, D, ign, metal, label, name, verdict}) => {
  const n = 11;
  const L = 2 * Math.sqrt(D * Math.max(tau, 0)) + 1e-6;
  const temps = Array.from({length: n}, (_, k) => ign * erfc(k / (n - 1) / L));
  const front = 180 + 410 * Math.min(1, 0.81 * L);
  const tEnd = temps[n - 1];
  return (
    <g>
      <rect x={160} y={y - 20} width={440} height={40} rx={10} fill={metal ? 'url(#tr-metal)' : 'url(#tr-wood)'} stroke={metal ? '#aebbe0' : '#b08a5e'} strokeWidth={2} />
      {metal ? null : Array.from({length: 4}, (_, k) => <path key={k} d={`M170,${y - 12 + k * 8} q110,${4 * Math.sin(k)} 220,0 t210,0`} fill="none" stroke="#5a3d22" strokeWidth={1.5} opacity={0.5} />)}
      {/* pendar panas sepanjang batang */}
      {temps.map((T, k) => (
        <circle key={`g${k}`} cx={180 + k * 41} cy={y} r={26} fill="url(#soft-kin)" opacity={0.9 * T} />
      ))}
      {temps.map((T, k) => {
        const a = 1.5 + 6.5 * T;
        const x = 180 + k * 41 + a * Math.sin(t * 13 + k * 2.1);
        const yy = y + a * Math.cos(t * 11.3 + k * 1.3);
        return (
          <g key={k}>
            <circle cx={x} cy={yy} r={metal ? 11 : 10} fill={interpolateColors(T, [0, 0.5, 1], metal ? ['#7b8fc4', C.kin, '#ffe1a8'] : ['#a07c56', C.kin, '#ffe1a8'])} stroke="#0b1126" strokeWidth={1.5} />
            <circle cx={x - 3} cy={yy - 3} r={3} fill="#fff" opacity={0.5} />
          </g>
        );
      })}
      <Stream
        pts={[
          [182, y],
          [front, y],
        ]}
        color="kin"
        n={metal ? 6 : 2}
        speed={0.6}
        r={4}
        jitter={3}
        opacity={0.85 * ign}
        seed={metal ? 1 : 4}
      />
      {/* termometer di ujung kanan */}
      <rect x={619} y={y - 78} width={12} height={70} rx={6} fill="#141e40" stroke={C.muted} strokeWidth={1.5} />
      <rect x={622} y={y - 10 - 64 * tEnd} width={6} height={64 * tEnd + 4} rx={3} fill={interpolateColors(tEnd, [0, 1], [C.pot, C.heat])} />
      <circle cx={625} cy={y} r={11} fill={interpolateColors(tEnd, [0, 1], [C.pot, C.heat])} stroke={C.muted} strokeWidth={1.5} />
      {[0, 1].map((k) => (
        <Flame key={k} x={186 + k * 22} y={y + 72} s={0.8 * ign} t={t} k={k + (metal ? 0 : 3)} />
      ))}
      <Label x={160} y={y - 46} size={25} color={metal ? '#cfd8f5' : '#d6b48a'} anchor="start" weight={600} opacity={ramp(t, label - 0.3, label + 0.4) * 0.6 + 0.4}>
        {name}
      </Label>
      <Label x={600} y={y - 46} size={22} color={metal ? C.kin : C.muted} anchor="end" opacity={ramp(t, label - 0.3, label + 0.4)}>
        {verdict}
      </Label>
    </g>
  );
};

/* ---------------- konveksi ---------------- */
const Pot: React.FC<{t: number; heat: number; lab: number}> = ({t, heat, lab}) => {
  const loops = [
    {cx: 895, s: 1},
    {cx: 1025, s: -1},
  ];
  const om = 0.9;
  const surf = Array.from({length: 23}, (_, k) => {
    const x = 806 + k * 14;
    return `${k ? 'L' : 'M'}${x},${(472 + 4 * Math.sin(x * 0.05 + t * 3) * heat).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <defs>
        <clipPath id="tr-potclip">
          <path d="M806,470 L806,660 Q806,676 822,676 L1098,676 Q1114,676 1114,660 L1114,470 Z" />
        </clipPath>
      </defs>
      {/* kompor */}
      <rect x={862} y={728} width={196} height={16} rx={6} fill="#2a3560" stroke="#6a78a8" strokeWidth={2} />
      <Glow x={960} y={700} r={140} color="kin" opacity={0.5 * heat} />
      {Array.from({length: 5}, (_, k) => (
        <Flame key={k} x={900 + k * 30} y={728} s={0.85 * heat} t={t} k={k + 5} />
      ))}
      {/* panci */}
      <path d="M800,430 L800,664 Q800,684 822,684 L1098,684 Q1120,684 1120,664 L1120,430" fill="#1a2348" stroke="#9aa8d4" strokeWidth={4} />
      <rect x={780} y={424} width={360} height={10} rx={5} fill="#9aa8d4" />
      <path d="M800,460 q-40,0 -40,24" fill="none" stroke="#9aa8d4" strokeWidth={7} strokeLinecap="round" />
      <path d="M1120,460 q40,0 40,24" fill="none" stroke="#9aa8d4" strokeWidth={7} strokeLinecap="round" />
      <g clipPath="url(#tr-potclip)">
        <rect x={800} y={460} width={320} height={230} fill="url(#water)" opacity={0.75} />
        <rect x={930} y={470} width={60} height={210} fill={C.kin} opacity={0.12 * heat} />
        {loops.map((l, li) => (
          <ellipse key={`e${li}`} cx={l.cx} cy={575} rx={55} ry={78} fill="none" stroke="#dbe8ff" strokeWidth={2} strokeDasharray="8 12" strokeDashoffset={l.s * t * 22} opacity={0.35 * heat} />
        ))}
        {/* gelembung */}
        {Array.from({length: 6}, (_, k) => {
          const ph = (t * (0.35 + 0.1 * rand(k)) + rand(k + 3)) % 1;
          return <circle key={`b${k}`} cx={960 + (rand(k + 7) - 0.5) * 50 + 5 * Math.sin(t * 4 + k)} cy={672 - ph * 200} r={3 + 3 * ph} fill="none" stroke="#e8f4ff" strokeWidth={1.5} opacity={cyc(ph) * heat * 0.8} />;
        })}
        {loops.map((l, li) =>
          Array.from({length: 9}, (_, k) => {
            const th = -om * t + (2 * Math.PI * k) / 9 + li * 0.3;
            const P = (a: number): [number, number] => [l.cx + l.s * 55 * Math.cos(a), 575 + 78 * Math.sin(a)];
            const h = 0.5 + 0.5 * Math.cos(th - Math.PI / 4);
            const col = interpolateColors(h, [0, 0.5, 1], [C.pot, '#c8d8ff', C.kin]);
            const [x, y] = P(th);
            return (
              <g key={`${li}-${k}`} opacity={0.35 + 0.65 * heat}>
                {[1, 2, 3].map((j) => {
                  const [tx, tyy] = P(th + om * 0.09 * j);
                  return <circle key={j} cx={tx} cy={tyy} r={7 - j * 1.5} fill={col} opacity={0.35 * (1 - j / 4)} />;
                })}
                <circle cx={x} cy={y} r={8} fill={col} stroke="#0b1126" strokeWidth={1.2} />
              </g>
            );
          }),
        )}
        <path d={surf} fill="none" stroke="#bfe3ff" strokeWidth={2.5} opacity={0.7} />
      </g>
      {/* uap */}
      {[905, 960, 1015].map((x, k) => {
        const ph = (t * 0.3 + k * 0.33) % 1;
        return (
          <path
            key={k}
            d={`M${x},${440 - ph * 110} q14,-16 0,-32 q-14,-16 0,-32`}
            fill="none"
            stroke="#dfe8ff"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={cyc(ph) * 0.45 * heat}
            transform={`translate(${8 * Math.sin(t * 1.3 + k)} 0)`}
          />
        );
      })}
      <g opacity={lab}>
        <Label x={828} y={768} size={23} color={C.pot} font="sans" weight={600}>
          ↓ dingin
        </Label>
        <Label x={960} y={768} size={23} color={C.kin} font="sans" weight={600}>
          ↑ panas
        </Label>
        <Label x={1092} y={768} size={23} color={C.pot} font="sans" weight={600}>
          ↓ dingin
        </Label>
      </g>
    </g>
  );
};

/* ---------------- radiasi ---------------- */
const Space: React.FC<{t: number; on: number; lab: number}> = ({t, on, lab}) => {
  const sx = 1335;
  const sy = 480;
  const ex = 1748;
  const waves = [
    {dy0: -54, dy1: -16, col: C.gold, lam: 40},
    {dy0: 0, dy1: 0, col: C.kin, lam: 52},
    {dy0: 54, dy1: 16, col: C.heat, lam: 66},
  ];
  return (
    <g>
      <rect x={1276} y={250} width={528} height={526} rx={16} fill="#03050e" opacity={0.9} />
      {Array.from({length: 26}, (_, k) => (
        <circle key={k} cx={1290 + rand(k) * 500} cy={262 + rand(k + 40) * 500} r={0.8 + rand(k + 9) * 1.6} fill="#fff" opacity={0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * (1 + rand(k + 3) * 2) + k))} />
      ))}
      {/* Matahari */}
      <Glow x={sx} y={sy} r={230} color="gold" opacity={0.9} />
      <g transform={`rotate(${t * 8} ${sx} ${sy})`}>
        {Array.from({length: 12}, (_, k) => {
          const a = (k / 12) * Math.PI * 2;
          const L = 92 + 10 * Math.sin(t * 3 + k * 1.7);
          return <line key={k} x1={sx + 70 * Math.cos(a)} y1={sy + 70 * Math.sin(a)} x2={sx + L * Math.cos(a)} y2={sy + L * Math.sin(a)} stroke={C.gold} strokeWidth={5} strokeLinecap="round" opacity={0.55} />;
        })}
      </g>
      <circle cx={sx} cy={sy} r={64} fill="url(#tr-sun)" />
      {/* gelombang EM */}
      {waves.map((w, k) => {
        const x0 = 1412;
        const x1 = 1700;
        const n = 64;
        const d = Array.from({length: n + 1}, (_, i) => {
          const s = i / n;
          const x = x0 + (x1 - x0) * s;
          const yb = sy + w.dy0 + (w.dy1 - w.dy0) * s;
          const env = Math.sqrt(Math.sin(Math.PI * s));
          const y = yb + 12 * env * Math.sin((2 * Math.PI * (x - x0)) / w.lam - t * 5.5);
          return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        return (
          <g key={k} opacity={on}>
            <path d={d} fill="none" stroke={w.col} strokeWidth={9} strokeOpacity={0.2} strokeLinecap="round" />
            <path d={d} fill="none" stroke={w.col} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      })}
      <Stream
        pts={[
          [1410, sy],
          [1702, sy],
        ]}
        color="gold"
        n={5}
        speed={0.45}
        r={4}
        jitter={0}
        opacity={on}
      />
      {/* Bumi */}
      <Glow x={ex} y={sy} r={90} color="kin" opacity={0.35 * on} />
      <circle cx={ex} cy={sy} r={40} fill="#1e5fbf" />
      <g opacity={0.9}>
        <path d={`M${ex - 26},${sy - 18} q10,-10 22,-4 q6,10 -4,16 q-12,4 -18,-12 Z`} fill="#3fae6a" />
        <path d={`M${ex + 4},${sy + 6} q14,-6 22,4 q-2,16 -16,16 q-10,-6 -6,-20 Z`} fill="#3fae6a" />
      </g>
      <path d={`M${ex},${sy - 40} A40,40 0 0,1 ${ex},${sy + 40} A22,40 0 0,0 ${ex},${sy - 40} Z`} fill="#000" opacity={0.45} />
      <path d={`M${ex - 2},${sy - 40} A40,40 0 0,0 ${ex - 2},${sy + 40}`} fill="none" stroke="#ffd9a0" strokeWidth={3} opacity={0.6 * on} />
      <g opacity={lab}>
        <Label x={1540} y={300} size={25} color={C.ink} weight={600}>
          ruang hampa
        </Label>
        <Label x={1540} y={334} size={21} color={C.muted}>
          tanpa medium
        </Label>
        <Label x={1556} y={640} size={22} color={C.gold}>
          gelombang elektromagnetik
        </Label>
      </g>
      <Label x={sx} y={588} size={22} color={C.gold} opacity={0.9}>
        Matahari
      </Label>
      <Label x={ex} y={548} size={22} color="#9cc8ff" opacity={0.9}>
        Bumi
      </Label>
    </g>
  );
};

export const Transfer: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.4, 0.7, EASE_IN_OUT);
  const tTiga = wordOf(0, 'tiga');
  const pIn = [0, 1, 2].map((k) => ramp(t, tTiga - 0.5 + k * 0.35, tTiga + 0.2 + k * 0.35));
  const pre = 1 - ramp(t, cue(1) - 0.4, cue(1) + 0.3, EASE_IN_OUT);
  const foc = [slot(t, cue(1) - 0.3, cue(2) + 0.1), slot(t, cue(2) - 0.3, cue(3) + 0.1), ramp(t, cue(3) - 0.3, cue(3) + 0.3)];
  const dem = ramp(t, cue(4) - 0.2, cue(4) + 0.7, EASE_IN_OUT);
  const panelOp = [0, 1, 2].map((k) => pIn[k] * (0.35 + 0.65 * Math.max(pre, foc[k])) * (k < 2 ? 1 - 0.94 * dem : 1));

  // konduksi
  const ign = ramp(t, cue(1) - 0.6, cue(1) + 0.4);
  const tau = t - cue(1);
  // konveksi & radiasi
  const heat = 0.35 + 0.65 * ramp(t, cue(2) - 0.6, cue(2) + 0.6);
  const rad = 0.45 + 0.55 * ramp(t, cue(3) - 0.5, cue(3) + 0.5);

  // T⁴
  const fP = ramp(t, wordOf(4, 'sebanding') - 0.4, wordOf(4, 'sebanding') + 0.4);
  const b1 = ramp(t, cue(4) + 0.3, cue(4) + 1.0);
  const ball2 = ramp(t, wordOf(4, 'dua') - 0.4, wordOf(4, 'dua') + 0.4);
  const g16 = ramp(t, wordOf(4, 'enam') - 0.3, wordOf(4, 'enam') + 1.2, EASE_IN_OUT);
  const h2 = 26 + 390 * g16;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="tr-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa6cc" />
            <stop offset="50%" stopColor="#4c5884" />
            <stop offset="100%" stopColor="#2a3358" />
          </linearGradient>
          <linearGradient id="tr-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a7350" />
            <stop offset="100%" stopColor="#5c3f25" />
          </linearGradient>
          <radialGradient id="tr-sun" cx="40%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#fffbe6" />
            <stop offset="45%" stopColor="#ffd24a" />
            <stop offset="100%" stopColor="#ff8a3d" />
          </radialGradient>
          <radialGradient id="tr-b1" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff9a6a" />
            <stop offset="100%" stopColor="#6e1a10" />
          </radialGradient>
          <radialGradient id="tr-b2" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ffe08a" />
            <stop offset="100%" stopColor="#ff8a3d" />
          </radialGradient>
          <linearGradient id="tr-bar2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={C.kin} />
            <stop offset="100%" stopColor="#fff2c0" />
          </linearGradient>
        </defs>
        <g opacity={appear}>
          {PANELS.map((p, k) => (
            <g key={k} opacity={panelOp[k]}>
              <rect x={p.x0} y={PY0} width={p.x1 - p.x0} height={PY1 - PY0} rx={20} fill="#0b1330" opacity={0.7} stroke={p.hue} strokeOpacity={0.25 + 0.5 * (k < 2 ? foc[k] : foc[2])} strokeWidth={2} />
              <circle cx={p.x0 + 36} cy={226} r={17} fill="none" stroke={p.hue} strokeWidth={2.5} />
              <Label x={p.x0 + 36} y={227} size={20} color={p.hue} weight={700} font="mono">
                {k + 1}
              </Label>
              <Label x={p.x0 + 66} y={226} size={30} color={C.ink} anchor="start" weight={600}>
                {p.title}
              </Label>
            </g>
          ))}

          {/* 1 · konduksi */}
          <g opacity={panelOp[0]}>
            <Rod y={380} t={t} tau={tau} D={0.14} ign={ign} metal label={wordOf(1, 'Logam')} name="logam" verdict="penghantar baik" />
            <Rod y={600} t={t} tau={tau} D={0.006} ign={ign} metal={false} label={wordOf(1, 'kayu')} name="kayu" verdict="penghantar buruk" />
            <Label x={380} y={752} size={21} color={C.muted} opacity={ramp(t, wordOf(1, 'tanpa') - 0.3, wordOf(1, 'tanpa') + 0.4)}>
              atom bergetar di tempat, energi diteruskan
            </Label>
          </g>

          {/* 2 · konveksi */}
          <g opacity={panelOp[1]}>
            <Pot t={t} heat={heat} lab={ramp(t, wordOf(2, 'naik') - 0.4, wordOf(2, 'naik') + 0.4)} />
          </g>

          {/* 3 · radiasi */}
          <g opacity={panelOp[2]}>
            <Space t={t} on={rad} lab={ramp(t, wordOf(3, 'medium') - 0.4, wordOf(3, 'medium') + 0.4)} />
          </g>

          {/* ===== P ∝ T⁴ ===== */}
          {dem > 0.001 ? (
            <g opacity={dem}>
              <Motes x={620} y={560} rx={460} ry={240} n={18} color="gold" opacity={0.35} seed={5} />
              {/* bola T */}
              {Array.from({length: 6}, (_, k) => {
                const ph = (t * 0.6 + k / 6) % 1;
                const a = (k / 6) * Math.PI * 2 + 0.4;
                const r = 70 + ph * 90;
                return <circle key={`r1${k}`} cx={300 + r * Math.cos(a)} cy={580 + r * Math.sin(a)} r={4} fill={C.heat} opacity={cyc(ph) * 0.7} />;
              })}
              <Glow x={300} y={580} r={130} color="heat" opacity={0.45} />
              <circle cx={300} cy={580} r={56} fill="url(#tr-b1)" />
              <Label x={300} y={680} size={40} color={C.heat} font="serif" italic weight={600}>
                T
              </Label>
              {/* bola 2T */}
              <g opacity={ball2}>
                {Array.from({length: 26}, (_, k) => {
                  const ph = (t * 0.75 + rand(k) ) % 1;
                  const a = (k / 26) * Math.PI * 2;
                  const r = 70 + ph * 120;
                  return <circle key={`r2${k}`} cx={580 + r * Math.cos(a)} cy={580 + r * Math.sin(a)} r={4.5} fill={C.gold} opacity={cyc(ph) * 0.85} />;
                })}
                <Glow x={580} y={580} r={220} color="gold" opacity={0.95} />
                <circle cx={580} cy={580} r={56} fill="url(#tr-b2)" />
                <Label x={580} y={680} size={40} color={C.gold} font="serif" italic weight={600}>
                  2T
                </Label>
                <Arrow x1={372} y1={680} x2={530} y2={680} color="gold" width={4} pulse={false} />
                <Label x={451} y={652} size={22} color={C.gold} font="mono">
                  × 2
                </Label>
              </g>
              <Ripple x={580} y={580} p={(t - wordOf(4, 'dua')) / 1.4} r={170} color="gold" />
              {/* batang daya */}
              <line x1={730} y1={800} x2={1110} y2={800} stroke={C.muted} strokeWidth={2.5} />
              <rect x={770} y={800 - 26 * b1} width={110} height={26 * b1} rx={6} fill={C.heat} opacity={0.85} />
              <Label x={825} y={800 - 26 * b1 - 26} size={26} color={C.heat} weight={600} opacity={b1}>
                1×
              </Label>
              <g opacity={ball2}>
                <rect x={960} y={800 - h2} width={110} height={h2} rx={6} fill="url(#tr-bar2)" />
                <rect x={960} y={800 - h2} width={110} height={8} rx={4} fill="#fff" opacity={0.4 + 0.3 * Math.sin(t * 4)} />
                <Label x={1015} y={800 - h2 - 30} size={34} color={C.gold} weight={700} opacity={g16}>
                  16×
                </Label>
                <Label x={1015} y={800 - h2 - 80} size={22} color={C.muted} font="mono" opacity={g16}>
                  2⁴ = 16
                </Label>
              </g>
              <Twinkles x={1015} y={800 - h2 - 40} rx={80} ry={40} n={5} opacity={g16} />
              <Label x={825} y={830} size={24} color={C.muted} font="serif" italic>
                T
              </Label>
              <Label x={1015} y={830} size={24} color={C.muted} font="serif" italic opacity={ball2}>
                2T
              </Label>
              <Label x={920} y={862} size={21} color={C.muted}>
                daya pancar P
              </Label>
            </g>
          ) : null}
        </g>
        <Glow x={420} y={300} r={220} color="gold" opacity={0.3 * fP} />
      </Stage>
      <Formula x={420} y={300} p={fP * dem} accent={C.gold} size={64} caption="P = eσAT⁴">
        <span style={{fontStyle: 'italic'}}>P</span> ∝ <span style={{fontStyle: 'italic'}}>T</span>
        <sup style={{fontSize: '0.62em', verticalAlign: '0.55em', lineHeight: 0}}>4</sup>
      </Formula>
    </AbsoluteFill>
  );
};
