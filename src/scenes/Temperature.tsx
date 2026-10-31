import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand} from '../anim';
import {Formula, Glow, Label, Motes, Note, Ripple, Sqrt, Stage, Stream, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Suhu = ukuran energi kinetik rata-rata gerak acak.
// Molekul memantul di kotak: posisi "dilipat" (fold) secara tertutup, tanpa state.
//  · laju ∝ √T: 200 K vs 800 K → T × 4 ⇒ laju × 2 (gerak lambat untuk layar: 300 K ≙ 150 px/s);
//  · skala K ↔ °C: T(K) = t(°C) + 273,15; laju molekul di lensa mengikuti √T(t) — fase = ∫√(T/300) dt
//    (dijumlah numerik per frame dari waktu tetap → deterministik);
//  · nol mutlak: gerak termal minimum, tetap ada getar sisa kecil (kualitatif);
//  · kesetimbangan termal: dua balok identik 80 °C & 20 °C bersentuhan → T = 50 ± 30·e^(−s/τ), kalor jingga
//    mengalir panas → dingin dengan laju ∝ beda suhu; termometer ikut setimbang (hukum ke-0).
const TAU = Math.PI * 2;
const fold = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (m < L ? m : 2 * L - m);
};
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
const lin = (x: number) => x;
const tcol = (f: number) => interpolateColors(Math.max(0, Math.min(1, f)), [0, 0.5, 1], [C.pot, '#d9cdf2', C.heat]);
const num = (v: number, d = 2) => v.toFixed(d).replace('.', ',').replace('-', '−');
const V300 = 150; // px/s pada 300 K

type Mol = {x0: number; y0: number; ux: number; uy: number; s: number; j: number};
const mkMols = (n: number, seed: number): Mol[] =>
  Array.from({length: n}, (_, i) => {
    const a = rand(i * 7.7 + seed * 3.1) * TAU;
    return {x0: rand(i * 1.3 + seed), y0: rand(i * 2.9 + seed * 1.7), ux: Math.cos(a), uy: Math.sin(a), s: 0.55 + 0.9 * Math.sqrt(rand(i * 3.1 + seed * 0.7)), j: rand(i * 5.5 + seed) * TAU};
  });
const MA = mkMols(22, 1);
const MC = mkMols(18, 2);
const MH = mkMols(18, 3);
const ML = mkMols(14, 4);

/** Molekul gas memantul di kotak; ph = jarak tempuh dasar (px). */
const Gas: React.FC<{mols: Mol[]; x0: number; y0: number; x1: number; y1: number; ph: number; col: string; r?: number; trail?: number; jig?: number; t: number}> = ({
  mols,
  x0,
  y0,
  x1,
  y1,
  ph,
  col,
  r = 9,
  trail = 9,
  jig = 0,
  t,
}) => (
  <g>
    {mols.map((m, i) => {
      const at = (d: number) =>
        [fold(x0 + m.x0 * (x1 - x0) + m.ux * m.s * (ph - d), x0 + r, x1 - r), fold(y0 + m.y0 * (y1 - y0) + m.uy * m.s * (ph - d), y0 + r, y1 - r)] as [number, number];
      const [x, y] = at(0);
      const jx = jig * Math.sin(t * 17 + m.j) + jig * 0.5 * Math.sin(t * 29 + 2 * m.j);
      const jy = jig * Math.cos(t * 19 + m.j * 1.3) + jig * 0.5 * Math.sin(t * 23 + m.j);
      return (
        <g key={i}>
          {[1, 2, 3].map((k) => {
            const [tx, ty] = at(trail * k * m.s);
            return <circle key={k} cx={tx} cy={ty} r={r * (1 - k * 0.22)} fill={col} opacity={(0.2 - k * 0.05) * Math.min(1, trail / 3)} />;
          })}
          <circle cx={x + jx} cy={y + jy} r={r * 2.1} fill={col} opacity={0.18} />
          <circle cx={x + jx} cy={y + jy} r={r} fill={col} />
          <circle cx={x + jx - r * 0.3} cy={y + jy - r * 0.3} r={r * 0.35} fill="#fff" opacity={0.75} />
        </g>
      );
    })}
  </g>
);

const BoxFrame: React.FC<{x0: number; y0: number; x1: number; y1: number; col: string}> = ({x0, y0, x1, y1, col}) => (
  <g>
    <rect x={x0 - 8} y={y0 - 8} width={x1 - x0 + 16} height={y1 - y0 + 16} rx={18} fill="#0b1430" stroke={col} strokeOpacity={0.3} strokeWidth={12} />
    <rect x={x0 - 8} y={y0 - 8} width={x1 - x0 + 16} height={y1 - y0 + 16} rx={18} fill="none" stroke={col} strokeWidth={3} />
  </g>
);

/** Termometer (SVG). f = 0..1 tinggi kolom. */
const Thermo: React.FC<{x: number; y0: number; y1: number; f: number; color?: string; w?: number}> = ({x, y0, y1, f, color = C.heat, w = 24}) => {
  const r = w * 0.95;
  const fy = y1 - (y1 - y0 - 6) * Math.max(0, Math.min(1, f));
  return (
    <g>
      <rect x={x - w / 2} y={y0 - w / 2} width={w} height={y1 - y0 + w / 2} rx={w / 2} fill="#0c1631" stroke="#cfe0ff" strokeOpacity={0.8} strokeWidth={2.5} />
      {Array.from({length: 8}, (_, i) => (
        <line key={i} x1={x + w / 2} y1={y0 + ((y1 - y0) * (i + 0.5)) / 8} x2={x + w / 2 + (i % 2 ? 7 : 12)} y2={y0 + ((y1 - y0) * (i + 0.5)) / 8} stroke="#cfe0ff" strokeOpacity={0.5} strokeWidth={2} />
      ))}
      <circle cx={x} cy={y1 + r * 0.7} r={r * 2} fill={color} opacity={0.16} />
      <circle cx={x} cy={y1 + r * 0.7} r={r} fill={color} stroke="#cfe0ff" strokeOpacity={0.8} strokeWidth={2.5} />
      <rect x={x - w * 0.22} y={fy} width={w * 0.44} height={y1 - fy + r * 0.5} rx={w * 0.22} fill={color} />
      <rect x={x - w * 0.32} y={y0 - w * 0.2} width={w * 0.13} height={(y1 - y0) * 0.9} rx={w * 0.07} fill="#fff" opacity={0.25} />
    </g>
  );
};

// skala K ↔ °C
const SX = (T: number) => 270 + 3.6 * T;
const SY = 640;
const TICKS = [0, 100, 200, 273.15, 373.15];
const LENS_Y = 410;
const LENS_R = 100;

// kesetimbangan
const BH0 = 470;
const BH1 = 730;
const AX = {x0: 1130, y0: 730, w: 600, h: 380};
const PLOT_S = 8;

export const Temperature: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---------- bagian A: kotak gas ----------
  const partA = 1 - ramp(t, cue(2) - 0.6, cue(2) + 0.1, EASE_IN_OUT);
  const boxA = ramp(t, -0.6, 0.6);
  const split = ramp(t, cue(1) - 0.4, cue(1) + 0.8, EASE_IN_OUT);
  const kin = wordOf(0, 'kinetik');
  const tB = wordOf(1, 'cepat') - 0.3;
  const card0 = slot(t, kin - 0.4, tB);
  const card1 = slot(t, tB, cue(2) - 0.3);
  const acak = ramp(t, wordOf(0, 'acak') - 0.4, wordOf(0, 'acak') + 0.4) * (1 - split);
  const ratio = ramp(t, wordOf(1, 'berlarian') - 0.4, wordOf(1, 'berlarian') + 0.4);

  // ---------- bagian B: skala ----------
  const partB = Math.min(ramp(t, cue(2) - 0.3, cue(2) + 0.6), 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.1, EASE_IN_OUT));
  const kCel = wordOf(2, 'celsius');
  const kOff = wordOf(2, 'tiga');
  const Tm = (x: number) => {
    let T = 300;
    T = mix(T, 373.15, ramp(x, kCel - 0.2, kCel + 1.2, EASE_IN_OUT));
    T = mix(T, 273.15, ramp(x, kOff - 0.3, kOff + 1.3, EASE_IN_OUT));
    T = mix(T, 0, ramp(x, cue(3) - 0.2, cue(3) + 2.2, EASE_IN_OUT));
    return T;
  };
  const T = Tm(t);
  let lensPh = 0;
  {
    const t0 = cue(2) - 1;
    const dt = 1 / 30;
    for (let x = t0; x < t; x += dt) {
      const h = Math.min(dt, t - x);
      lensPh += Math.sqrt(Tm(x + h / 2) / 300) * h;
    }
    lensPh *= V300 * 0.8;
  }
  const xm = SX(T);
  const card2 = slot(t, cue(2) + 0.2, cue(4) - 0.4);
  const offHi = ramp(t, kOff + 0.6, kOff + 1.4) * (1 - ramp(t, cue(3) - 0.2, cue(3) + 0.4));
  const zeroP = ramp(t, cue(3) + 1.2, cue(3) + 2.4);
  const nolLbl = ramp(t, wordOf(3, 'mutlak') - 0.4, wordOf(3, 'mutlak') + 0.4);
  const resid = ramp(t, wordOf(3, 'batas') - 0.4, wordOf(3, 'batas') + 0.4);
  const tf = T / 400;

  // ---------- bagian C: kesetimbangan ----------
  const partC = ramp(t, cue(4) - 0.4, cue(4) + 0.5);
  const tC = wordOf(4, 'bersentuhan');
  const slide = ramp(t, tC - 0.9, tC + 0.1, EASE_IN_OUT);
  const tauE = Math.max(0.6, (wordOf(4, 'sama') - tC) / 4.2);
  const sE = Math.max(0, t - tC);
  const dec = Math.exp(-sE / tauE);
  const Th = 50 + 30 * dec;
  const Tc = 50 - 30 * dec;
  const hx0 = mix(180, 300, slide);
  const cx0 = mix(720, 600, slide);
  const eq = ramp(t, wordOf(4, 'kesetimbangan') - 0.4, wordOf(4, 'kesetimbangan') + 0.4);
  const termo = ramp(t, wordOf(4, 'termometer') - 0.4, wordOf(4, 'termometer') + 0.5);
  const plotS = Math.min(PLOT_S, sE);
  const curve = (sgn: number) =>
    Array.from({length: 61}, (_, i) => {
      const s = (plotS * i) / 60;
      const v = 50 + sgn * 30 * Math.exp(-s / tauE);
      return `${i ? 'L' : 'M'}${(AX.x0 + (s / PLOT_S) * AX.w).toFixed(1)},${(AX.y0 - (v / 100) * AX.h).toFixed(1)}`;
    }).join(' ');
  const pre = (v: number) => AX.y0 - (v / 100) * AX.h;

  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  // geometri kotak bagian A
  const A = {x0: 220, y0: 270, x1: 900, y1: 730};
  const Cb = {x0: mix(220, 160, split), y0: 290, x1: mix(560, 590, split), y1: 710};
  const Hb = {x0: mix(560, 690, split), y0: 290, x1: mix(900, 1120, split), y1: 710};

  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <Motes x={960} y={520} rx={880} ry={330} n={30} color="cyan" opacity={0.3} seed={5} />

        {/* ===== A: kotak gas ===== */}
        <g opacity={partA}>
          <g opacity={boxA * (1 - split)}>
            <Glow x={560} y={500} r={420} color="cyan" opacity={0.3} />
            <BoxFrame {...A} col={C.cyan} />
            <Gas mols={MA} {...A} ph={V300 * t} col="#9fe8ff" t={t} />
            {/* satu molekul disorot: lintasan acak */}
            {(() => {
              const m = MA[3];
              const at = (d: number) =>
                [fold(A.x0 + m.x0 * (A.x1 - A.x0) + m.ux * m.s * (V300 * t - d), A.x0 + 9, A.x1 - 9), fold(A.y0 + m.y0 * (A.y1 - A.y0) + m.uy * m.s * (V300 * t - d), A.y0 + 9, A.y1 - 9)] as [number, number];
              const pts = Array.from({length: 40}, (_, k) => at(k * 14));
              return (
                <g opacity={acak}>
                  <path d={pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.gold} strokeWidth={3} strokeOpacity={0.7} strokeLinejoin="round" />
                  <circle cx={pts[0][0]} cy={pts[0][1]} r={16} fill="none" stroke={C.gold} strokeWidth={3} />
                </g>
              );
            })()}
            <Label x={560} y={225} size={32} color={C.cyan} weight={600}>
              gas · 300 K
            </Label>
            <Thermo x={990} y0={330} y1={640} f={0.6 + 0.01 * Math.sin(t * 2)} color={tcol(0.6)} />
          </g>
          <g opacity={split}>
            <Glow x={(Cb.x0 + Cb.x1) / 2} y={500} r={300} color="pot" opacity={0.35} />
            <Glow x={(Hb.x0 + Hb.x1) / 2} y={500} r={320} color="heat" opacity={0.35} />
            <BoxFrame {...Cb} col={C.pot} />
            <BoxFrame {...Hb} col={C.heat} />
            <Gas mols={MC} {...Cb} ph={V300 * Math.sqrt(200 / 300) * t} col="#7cc0ff" t={t} />
            <Gas mols={MH} {...Hb} ph={V300 * Math.sqrt(800 / 300) * t} col="#ff7a86" t={t} />
            <Label x={(Cb.x0 + Cb.x1) / 2} y={245} size={32} color={C.pot} weight={600}>
              dingin · 200 K
            </Label>
            <Label x={(Hb.x0 + Hb.x1) / 2} y={245} size={32} color={C.heat} weight={600}>
              panas · 800 K
            </Label>
            <g opacity={ratio}>
              <Label x={(Cb.x0 + Cb.x1) / 2} y={765} size={28} color={C.pot} font="mono">
                laju × 1
              </Label>
              <Label x={(Hb.x0 + Hb.x1) / 2} y={765} size={28} color={C.heat} font="mono">
                laju × 2
              </Label>
            </g>
          </g>
          <Twinkles x={1450} y={330} rx={240} ry={70} n={5} color="cyan" opacity={0.6 * card0} seed={3} />
        </g>

        {/* ===== B: skala kelvin ↔ celsius ===== */}
        <g opacity={partB}>
          <line x1={SX(0) - 30} y1={SY} x2={SX(400) + 20} y2={SY} stroke={C.muted} strokeWidth={3} />
          <rect x={SX(0)} y={SY - 7} width={xm - SX(0)} height={14} rx={7} fill={tcol(tf)} opacity={0.75} />
          {Array.from({length: 41}, (_, k) => (
            <line key={k} x1={SX(k * 10)} y1={SY - (k % 5 ? 7 : 13)} x2={SX(k * 10)} y2={SY + (k % 5 ? 7 : 13)} stroke={C.muted} strokeOpacity={0.6} strokeWidth={1.5} />
          ))}
          <text x={SX(0) - 82} y={SY - 30} textAnchor="end" fontFamily={FONT.head} fontSize={26} fontWeight={700} fill={C.gold}>
            K
          </text>
          <text x={SX(0) - 82} y={SY + 48} textAnchor="end" fontFamily={FONT.head} fontSize={26} fontWeight={700} fill={C.cyan}>
            °C
          </text>
          {TICKS.map((v) => {
            const hi = v === 273.15 ? offHi : 0;
            return (
              <g key={v}>
                <line x1={SX(v)} y1={SY - 20} x2={SX(v)} y2={SY + 20} stroke={C.ink} strokeWidth={2.5} />
                <rect x={SX(v) - 62} y={SY - 70} width={124} height={124} rx={12} fill="none" stroke={C.gold} strokeWidth={3} opacity={hi} />
                <Label x={SX(v)} y={SY - 40} size={26} color={C.gold} font="mono">
                  {num(v, v % 1 ? 2 : 0)}
                </Label>
                <Label x={SX(v)} y={SY + 38} size={26} color={C.cyan} font="mono">
                  {num(v - 273.15, v % 1 ? 0 : 2)}
                </Label>
              </g>
            );
          })}
          <Label x={SX(273.15)} y={SY + 78} size={22} color={C.muted} font="sans">
            es mencair
          </Label>
          <Label x={SX(373.15)} y={SY + 78} size={22} color={C.muted} font="sans">
            air mendidih
          </Label>
          {/* penunjuk + lensa molekul */}
          <line x1={xm} y1={LENS_Y + LENS_R} x2={xm} y2={SY - 8} stroke={tcol(tf)} strokeWidth={3} strokeDasharray="6 6" />
          <circle cx={xm} cy={SY} r={11} fill={tcol(tf)} stroke="#fff" strokeWidth={2.5} />
          <defs>
            <clipPath id="te-lens">
              <circle cx={xm} cy={LENS_Y} r={LENS_R - 4} />
            </clipPath>
          </defs>
          <circle cx={xm} cy={LENS_Y} r={LENS_R * 1.7} fill={tcol(tf)} opacity={0.1} />
          <circle cx={xm} cy={LENS_Y} r={LENS_R} fill="#0b1430" stroke={tcol(tf)} strokeWidth={4} />
          <g clipPath="url(#te-lens)">
            <Gas mols={ML} x0={xm - LENS_R} y0={LENS_Y - LENS_R} x1={xm + LENS_R} y1={LENS_Y + LENS_R} ph={lensPh} col={tcol(tf)} r={8} trail={5 * Math.sqrt(T / 300)} jig={1.6 * zeroP} t={t} />
          </g>
          {/* pembacaan */}
          {(() => {
            const rx = Math.max(330, Math.min(1590, xm));
            return (
              <Label x={rx} y={SY + 128} size={30} color={tcol(tf)} font="mono" weight={600}>
                {`${num(T)} K = ${num(T - 273.15)} °C`}
              </Label>
            );
          })()}
          {/* nol mutlak */}
          <g opacity={nolLbl}>
            <circle cx={xm} cy={LENS_Y} r={LENS_R * 2.2} fill="url(#soft-pot)" opacity={0.8} />
            <Label x={SX(0) + 140} y={LENS_Y - 34} size={44} color={C.pot} weight={700} anchor="start">
              nol mutlak
            </Label>
          </g>
          <Label x={SX(0) + 140} y={LENS_Y + 22} size={26} color={C.muted} anchor="start" font="sans" opacity={resid}>
            gerak termal minimum —
          </Label>
          <Label x={SX(0) + 140} y={LENS_Y + 58} size={26} color={C.muted} anchor="start" font="sans" opacity={resid}>
            masih tersisa getaran kecil
          </Label>
          <Ripple x={SX(0)} y={SY} p={ramp(t, cue(3) + 2.0, cue(3) + 3.4, lin)} r={160} color="pot" />
        </g>

        {/* ===== C: kesetimbangan termal ===== */}
        <g opacity={partC}>
          {[
            {x0: hx0, T: Th, hot: true},
            {x0: cx0, T: Tc, hot: false},
          ].map((b, k) => {
            const f = (b.T - 10) / 80;
            const col = tcol(f);
            const amp = 1.5 + 7 * f;
            const sp = 2 + 6 * f;
            return (
              <g key={k}>
                <Glow x={b.x0 + 150} y={600} r={240} color={b.hot ? 'heat' : 'pot'} opacity={0.4 * Math.abs(f - 0.5) * 2} />
                <rect x={b.x0} y={BH0} width={300} height={BH1 - BH0} rx={k ? 4 : 16} fill={interpolateColors(Math.max(0, Math.min(1, f)), [0, 1], ['#112a58', '#5a1824'])} stroke={col} strokeWidth={4} />
                {Array.from({length: 24}, (_, i) => {
                  const ix = i % 6;
                  const iy = Math.floor(i / 6);
                  const dx = amp * (Math.sin(t * sp * 1.3 + i * 2.1 + k * 5) + 0.45 * Math.sin(t * sp * 2.7 + i));
                  const dy = amp * (Math.sin(t * sp * 1.1 + i * 3.7 + k) + 0.45 * Math.cos(t * sp * 2.3 + i * 1.3));
                  return <circle key={i} cx={b.x0 + 40 + ix * 44 + dx} cy={BH0 + 70 + iy * 50 + dy} r={11} fill={col} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.5} />;
                })}
                <g opacity={1}>
                  <circle cx={b.x0 + 150} cy={BH0 - 120} r={80} fill={`url(#soft-${b.hot ? 'kin' : 'pot'})`} opacity={termo * (0.6 + 0.3 * Math.sin(t * 4))} />
                  <Thermo x={b.x0 + 150} y0={260} y1={BH0 + 20} f={(b.T - 0) / 100} color={col} />
                </g>
                <Label x={b.x0 + 150} y={212} size={36} color={col} font="mono" weight={600}>
                  {`${Math.round(b.T)} °C`}
                </Label>
              </g>
            );
          })}
          {/* kalor melintasi bidang kontak */}
          {[0, 1, 2, 3].map((k) => (
            <Stream key={k} pts={[[hx0 + 230, 520 + k * 58], [cx0 + 70, 520 + k * 58]]} color="kin" n={4} speed={0.8} r={6} jitter={3} seed={k * 1.9} opacity={slide * Math.min(1, dec * 1.4)} />
          ))}
          <Label x={600} y={BH1 + 44} size={30} color={C.kin} weight={600} opacity={slide * Math.min(1, dec * 2)}>
            kalor →
          </Label>
          <Ripple x={600} y={600} p={ramp(t, wordOf(4, 'sama') + 0.3, wordOf(4, 'sama') + 1.9, lin)} r={260} color="gold" />
          <Label x={600} y={BH1 + 92} size={24} color={C.muted} font="mono" opacity={termo}>
            termometer ikut setimbang dengan benda
          </Label>

          {/* grafik T–t */}
          <g>
            <line x1={AX.x0} y1={AX.y0} x2={AX.x0 + AX.w + 20} y2={AX.y0} stroke={C.muted} strokeWidth={2.5} />
            <line x1={AX.x0} y1={AX.y0} x2={AX.x0} y2={AX.y0 - AX.h - 20} stroke={C.muted} strokeWidth={2.5} />
            {[20, 50, 80].map((v) => (
              <g key={v}>
                <line x1={AX.x0 - 8} y1={pre(v)} x2={AX.x0} y2={pre(v)} stroke={C.muted} strokeWidth={2} />
                <text x={AX.x0 - 16} y={pre(v) + 8} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
                  {v}
                </text>
              </g>
            ))}
            <text x={AX.x0 + 10} y={AX.y0 - AX.h - 26} fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
              T (°C)
            </text>
            <text x={AX.x0 + AX.w + 10} y={AX.y0 + 36} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
              waktu →
            </text>
            <line x1={AX.x0} y1={pre(50)} x2={AX.x0 + AX.w} y2={pre(50)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 8" opacity={eq} />
            <path d={curve(1)} fill="none" stroke={C.heat} strokeWidth={4} strokeLinecap="round" opacity={slide} />
            <path d={curve(-1)} fill="none" stroke={C.pot} strokeWidth={4} strokeLinecap="round" opacity={slide} />
            <circle cx={AX.x0 + (plotS / PLOT_S) * AX.w} cy={pre(Th)} r={8} fill={C.heat} opacity={slide} />
            <circle cx={AX.x0 + (plotS / PLOT_S) * AX.w} cy={pre(Tc)} r={8} fill={C.pot} opacity={slide} />
            <Twinkles x={AX.x0 + AX.w * 0.75} y={pre(50)} rx={160} ry={40} n={5} color="gold" opacity={eq * 0.7} seed={8} />
          </g>
        </g>
      </Stage>

      <Formula x={1450} y={330} p={card0} accent={C.cyan} size={64} caption="K̄ = energi kinetik rata-rata gerak acak">
        <V>T</V> ∝ <V color={C.kin}>K̄</V>
      </Formula>
      <Formula x={1450} y={330} p={card1} accent={C.heat} size={64} caption="T × 4  ⇒  laju × 2">
        <V color={C.cyan}>v</V> ∝{' '}
        <Sqrt>
          <V>T</V>
        </Sqrt>
      </Formula>
      <Formula x={1250} y={238} p={card2 * partB} accent={C.gold} size={58}>
        <V>T</V>
        <span style={{fontSize: '0.6em', color: C.gold}}> (K)</span> = <V>t</V>
        <span style={{fontSize: '0.6em', color: C.cyan}}> (°C)</span> + <span style={{color: C.gold}}>273,15</span>
      </Formula>
      <Note x={1430} y={250} p={eq * partC} color={C.gold} size={32}>
        kesetimbangan termal: <span style={{color: C.heat}}>T₁</span> = <span style={{color: C.pot}}>T₂</span>
      </Note>
    </AbsoluteFill>
  );
};
