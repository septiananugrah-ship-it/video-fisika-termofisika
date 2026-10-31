import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors} from 'remotion';
import {EASE_IN_OUT, ramp, rand} from '../anim';
import {Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, TSub, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Perubahan wujud 1 kg H₂O, pemanas berdaya tetap (sumbu datar = kalor Q yang sudah diberikan, kJ):
//  es −20 → 0 °C: Q = 1 · 2100 · 20 = 42 kJ;  melebur: L_f = 334 kJ;  air 0 → 100 °C: 1 · 4186 · 100 ≈ 419 kJ;
//  mendidih: L_v = 2257 kJ ("≈ 2260", terpotong di grafik). Skala 0,55 px/kJ (proporsi asli).
//  334 kJ / 4,186 kJ/(kg·K) = 79,8 K → "hampir 80 °C".
//  Tampilan molekul: kisi es → (meleleh satu per satu dari tepi) cair → (menguap dari permukaan) gas terpisah sepenuhnya.

const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const tri = (u: number) => {
  const v = ((u % 2) + 2) % 2;
  return 1 - Math.abs(v - 1);
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const GX0 = 190;
const GY0 = 790;
const qx = (q: number) => GX0 + 0.55 * q;
const ty = (T: number) => GY0 - (T + 30) * 3.6;
const QA = 42;
const QB = QA + 334;
const QC = QB + 419;
const QE = 1400; // tepi grafik (x = 960)
const Tof = (q: number) => (q < QA ? -20 + (20 * q) / QA : q < QB ? 0 : q < QC ? (100 * (q - QB)) / (QC - QB) : 100);

// panel molekul
const PX0 = 1110;
const PX1 = 1790;
const PY0 = 200;
const PY1 = 560;
const NC = 7;
const NR = 5;
const MOLS = Array.from({length: NC * NR}, (_, i) => {
  const c = i % NC;
  const r = Math.floor(i / NC);
  const lx = 1450 + (c - 3) * 52 + (r % 2 ? 13 : -13);
  const ly = 362 + r * 44;
  const qxx = 1178 + (c + (r % 2 ? 0.5 : 0)) * 80;
  const qyy = 402 + r * 33;
  const d = Math.hypot(c - 3, (r - 2) * 1.15);
  const om = clamp01(1 - d / 3.7 + 0.18 * (rand(i * 3 + 1) - 0.5));
  const og = clamp01((r / 4) * 0.75 + 0.25 * rand(i * 7 + 2));
  return {lx, ly, qx: qxx, qy: qyy, om, og};
});
const LATTICE_BONDS: [number, number][] = [];
for (let i = 0; i < MOLS.length; i++)
  for (let j = i + 1; j < MOLS.length; j++) if (Math.hypot(MOLS[i].lx - MOLS[j].lx, MOLS[i].ly - MOLS[j].ly) < 60) LATTICE_BONDS.push([i, j]);

const gasPos = (i: number, tt: number): [number, number] => [
  PX0 + 30 + tri(rand(i + 1) * 2 + tt * (0.16 + 0.14 * rand(i + 5))) * (PX1 - PX0 - 60),
  PY0 + 30 + tri(rand(i + 9) * 2 + tt * (0.13 + 0.12 * rand(i + 11))) * (PY1 - PY0 - 60),
];

const Flame: React.FC<{x: number; y: number; s?: number; t: number; k?: number; opacity?: number}> = ({x, y, s = 1, t, k = 0, opacity = 1}) => {
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

export const Phase: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();
  const appear = ramp(t, -0.4, 0.7, EASE_IN_OUT);
  const axes = ramp(t, 0, 1.1, EASE_IN_OUT);

  /* ---------- jadwal kalor (pemanas terus menyala) ---------- */
  const t0 = cue(0) + 0.6;
  const tStop = wordOf(0, 'berhenti');
  const keys = [t0, tStop, cueEnd(1), cueEnd(3), cueEnd(4)];
  const vals = [0, QA, QB, QC, QE];
  const Qof = (tt: number) => interpolate(tt, keys, vals, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const Q = Qof(t);
  const T = Tof(Q);
  const fM = clamp01((Q - QA) / (QB - QA));
  const fB = clamp01((Q - QC) / (QE - QC));

  /* ---------- kurva ---------- */
  const pts: [number, number][] = [[qx(0), ty(-20)]];
  if (Q > 0) pts.push([qx(Math.min(Q, QA)), ty(Tof(Math.min(Q, QA)))]);
  if (Q > QA) pts.push([qx(Math.min(Q, QB)), ty(0)]);
  if (Q > QB) pts.push([qx(Math.min(Q, QC)), ty(Tof(Math.min(Q, QC)))]);
  if (Q > QC) pts.push([qx(Q), ty(100)]);
  const curveD = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dotX = qx(Q);
  const dotY = ty(T);
  const trail: [number, number][] = [1, 2, 3, 4, 5].map((k) => {
    const qq = Qof(t - k * 0.14);
    return [qx(qq), ty(Tof(qq))];
  });
  const meltOn = ramp(t, tStop - 0.2, tStop + 0.6);
  const boilOn = ramp(t, cue(4) - 0.3, cue(4) + 0.6);

  /* ---------- kartu & penanda ---------- */
  const n1 = slot(t, wordOf(1, 'memutus') - 0.3, cue(2));
  const f1 = slot(t, wordOf(2, 'laten') - 0.3, cue(3));
  const brk1 = ramp(t, wordOf(2, 'laten') - 0.2, wordOf(2, 'laten') + 0.7) * (1 - 0.5 * ramp(t, cue(4), cue(4) + 0.8, EASE_IN_OUT));
  const b3 = slot(t, cue(3) - 0.1, cue(4));
  const brk3 = ramp(t, wordOf(3, 'cukup') - 0.2, wordOf(3, 'cukup') + 0.7) * (1 - 0.6 * ramp(t, cue(4), cue(4) + 0.8, EASE_IN_OUT));
  const bar1 = ramp(t, cue(3) + 0.2, cue(3) + 1.2, EASE_IN_OUT);
  const bar2 = ramp(t, wordOf(3, 'memanaskan') - 0.2, wordOf(3, 'delapan') + 0.4, EASE_IN_OUT);
  const eighty = ramp(t, wordOf(3, 'delapan') - 0.2, wordOf(3, 'delapan') + 0.5);
  const f4 = ramp(t, wordOf(4, 'dua') - 0.4, wordOf(4, 'dua') + 0.4);
  const cont = ramp(t, wordOf(4, 'mahal') - 0.2, wordOf(4, 'mahal') + 0.6);
  const sep = ramp(t, wordOf(4, 'sepenuhnya') - 0.4, wordOf(4, 'sepenuhnya') + 0.6);
  const heaterHi = Math.max(
    ramp(t, wordOf(0, 'pemanas') - 0.2, wordOf(0, 'pemanas') + 0.4) * (1 - ramp(t, cue(1) - 0.2, cue(1) + 0.6, EASE_IN_OUT)),
    0,
  );
  const zoom = ramp(t, tStop - 0.3, tStop + 1.6, EASE_IN_OUT) * (1 - ramp(t, cue(2) - 0.6, cue(2) + 0.8, EASE_IN_OUT));

  /* ---------- molekul ---------- */
  const amp = 2.2 + 0.11 * (T + 30);
  const pos = MOLS.map((m, i) => {
    const mi = sm((fM - m.om * 0.75) / 0.25);
    const gi = sm((fB - m.og * 0.75) / 0.25);
    const sx = m.lx + amp * Math.sin(t * 9.3 + i * 1.9);
    const sy = m.ly + amp * Math.cos(t * 8.1 + i * 2.7);
    const lqx = m.qx + 16 * Math.sin(t * 0.8 + i * 1.3) + 8 * Math.sin(t * 1.9 + i * 0.7);
    const lqy = m.qy + 9 * Math.sin(t * 1.1 + i * 2.1) + 4 * Math.sin(t * 2.3 + i);
    const [gx, gy] = gasPos(i, t);
    const x1 = sx + (lqx - sx) * mi;
    const y1 = sy + (lqy - sy) * mi;
    return {x: x1 + (gx - x1) * gi, y: y1 + (gy - y1) * gi, mi, gi};
  });
  const bonds: React.ReactNode[] = [];
  LATTICE_BONDS.forEach(([i, j], k) => {
    const op = (1 - pos[i].mi) * (1 - pos[j].mi) * 0.75;
    if (op > 0.02) bonds.push(<line key={`l${k}`} x1={pos[i].x} y1={pos[i].y} x2={pos[j].x} y2={pos[j].y} stroke="#cdeeff" strokeWidth={3} opacity={op} />);
  });
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) {
      const a = pos[i];
      const b = pos[j];
      const liq = Math.min(a.mi, b.mi) * (1 - Math.max(a.gi, b.gi));
      if (liq < 0.02) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const w = clamp01(1 - (d - 52) / 34);
      const op = w * liq * 0.5;
      if (op > 0.03) bonds.push(<line key={`q${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.cyan} strokeWidth={2} strokeDasharray="4 5" opacity={op} />);
    }
  const avgM = pos.reduce((s, p) => s + p.mi, 0) / pos.length;
  const avgG = pos.reduce((s, p) => s + p.gi, 0) / pos.length;
  const wS = 1 - avgM;
  const wL = avgM * (1 - avgG);
  const wG = avgG;
  // label wujud berurutan (tanpa tumpang-tindih teks)
  const lS = sm(1 - 2 * avgM);
  const lL = sm(2 * avgM - 1) * sm(1 - 2 * avgG);
  const lG = sm(2 * avgG - 1);
  const surfY = 384;
  const surfD = Array.from({length: 33}, (_, k) => {
    const x = PX0 + 20 + (k * (PX1 - PX0 - 40)) / 32;
    return `${k ? 'L' : 'M'}${x.toFixed(1)},${(surfY + 5 * Math.sin(x * 0.03 + t * 2.2) + 3 * Math.sin(x * 0.07 - t * 3)).toFixed(1)}`;
  }).join(' ');

  const fmtT = (v: number) => `${Math.round(v) < 0 ? '−' : ''}${Math.abs(Math.round(v))}`;
  const ticks = [-20, 0, 20, 40, 60, 80, 100];

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="ph-curve" gradientUnits="userSpaceOnUse" x1={GX0} y1="0" x2={960} y2="0">
            <stop offset="0%" stopColor={C.pot} />
            <stop offset="25%" stopColor="#cdeeff" />
            <stop offset="55%" stopColor={C.kin} />
            <stop offset="100%" stopColor={C.heat} />
          </linearGradient>
          <radialGradient id="ph-mol" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor={C.cyan} />
            <stop offset="100%" stopColor="#0f5f86" />
          </radialGradient>
          <linearGradient id="ph-bar2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.pot} />
            <stop offset="100%" stopColor={C.kin} />
          </linearGradient>
          <linearGradient id="ph-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb27a" />
            <stop offset="100%" stopColor="#7a2e1a" />
          </linearGradient>
        </defs>

        {/* ================= grafik pemanasan ================= */}
        <g opacity={appear} transform={`translate(240 560) scale(${1 + 0.13 * zoom}) translate(-240 -560)`}>
          <Motes x={560} y={520} rx={420} ry={260} n={20} color="kin" opacity={0.3} seed={4} />
          {/* kisi & sumbu */}
          {ticks.map((T0) => (
            <g key={T0} opacity={axes}>
              <line x1={GX0} y1={ty(T0)} x2={1000} y2={ty(T0)} stroke={C.grid} strokeWidth={T0 === 0 || T0 === 100 ? 2 : 1.2} strokeDasharray={T0 === 0 || T0 === 100 ? '8 8' : undefined} opacity={T0 === 0 || T0 === 100 ? 0.9 : 0.6} />
              <Label x={GX0 - 16} y={ty(T0)} size={22} color={T0 === 0 || T0 === 100 ? C.ink : C.muted} anchor="end" font="mono">
                {fmtT(T0)}
              </Label>
            </g>
          ))}
          <line x1={GX0} y1={GY0} x2={GX0 + 830 * axes} y2={GY0} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <line x1={GX0} y1={GY0} x2={GX0} y2={GY0 - 560 * axes} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <Label x={GX0} y={210} size={24} color={C.muted} opacity={axes}>
            T (°C)
          </Label>
          <Label x={1010} y={828} size={23} color={C.muted} anchor="end" opacity={axes}>
            kalor yang diberikan, Q (1 kg)
          </Label>

          {/* sorotan plateau */}
          <line x1={qx(QA)} y1={ty(0)} x2={qx(Math.min(Math.max(Q, QA), QB))} y2={ty(0)} stroke={C.cyan} strokeWidth={18} strokeLinecap="round" opacity={0.18 * meltOn} />
          <line x1={qx(QC)} y1={ty(100)} x2={qx(Math.min(Math.max(Q, QC), QE))} y2={ty(100)} stroke={C.heat} strokeWidth={18} strokeLinecap="round" opacity={0.2 * boilOn} />
          <path d={curveD} fill="none" stroke="url(#ph-curve)" strokeWidth={16} strokeOpacity={0.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={curveD} fill="none" stroke="url(#ph-curve)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />

          {/* label wujud */}
          <Label x={240} y={752} size={22} color={C.pot} anchor="start" opacity={ramp(t, t0, t0 + 0.8)}>
            es
          </Label>
          <Label x={318} y={714} size={25} color={C.cyan} weight={600} opacity={meltOn}>
            melebur · 0 °C
          </Label>
          <Label x={545} y={562} size={23} color={C.kin} anchor="start" opacity={ramp(t, cueEnd(1), cueEnd(1) + 0.8)}>
            air memanas
          </Label>
          <Label x={800} y={290} size={25} color={C.heat} weight={600} opacity={boilOn}>
            mendidih · 100 °C
          </Label>
          {/* potongan sumbu: plateau didih jauh lebih panjang */}
          <g opacity={ramp(t, cueEnd(4) - 1.2, cueEnd(4) - 0.4)}>
            <line x1={963} y1={ty(100) + 14} x2={971} y2={ty(100) - 14} stroke={C.ink} strokeWidth={3} />
            <line x1={973} y1={ty(100) + 14} x2={981} y2={ty(100) - 14} stroke={C.ink} strokeWidth={3} />
            <line x1={984} y1={ty(100)} x2={1010} y2={ty(100)} stroke={C.heat} strokeWidth={5} strokeDasharray="3 7" strokeDashoffset={-t * 20} />
          </g>
          <Label x={960} y={356} size={22} color={C.heat} anchor="end" font="sans" opacity={cont}>
            berlanjut s.d. ≈ 2260 kJ →
          </Label>

          {/* kurung L_f = 334 kJ di atas plateau lebur */}
          <g opacity={brk1}>
            <path d={`M${qx(QA)},${ty(0) - 22} L${qx(QA)},${ty(0) - 34} L${qx(QB)},${ty(0) - 34} L${qx(QB)},${ty(0) - 22}`} fill="none" stroke={C.gold} strokeWidth={3} />
            <Label x={(qx(QA) + qx(QB)) / 2} y={ty(0) - 60} size={25} color={C.gold} weight={600}>
              L<TSub>f</TSub> = 334 kJ
            </Label>
          </g>
          {/* 334 kJ yang sama → air naik ≈ 80 °C */}
          <g opacity={brk3}>
            <path d={`M${qx(QB)},${GY0 - 8} L${qx(QB)},${GY0 - 20} L${qx(QB + 334)},${GY0 - 20} L${qx(QB + 334)},${GY0 - 8}`} fill="none" stroke={C.gold} strokeWidth={3} />
            <Label x={(qx(QB) + qx(QB + 334)) / 2} y={GY0 - 42} size={23} color={C.gold} weight={600}>
              334 kJ
            </Label>
            <line x1={qx(QB + 334)} y1={GY0 - 20} x2={qx(QB + 334)} y2={ty(79.8)} stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 7" />
            <line x1={GX0} y1={ty(79.8)} x2={qx(QB + 334)} y2={ty(79.8)} stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 7" opacity={eighty} />
            <Label x={300} y={ty(79.8) - 22} size={25} color={C.gold} weight={600} opacity={eighty}>
              ≈ 80 °C
            </Label>
            <circle cx={qx(QB + 334)} cy={ty(79.8)} r={7} fill={C.gold} opacity={eighty} />
          </g>
          <Twinkles x={300} y={ty(79.8) - 22} rx={80} ry={24} n={4} opacity={eighty * (1 - ramp(t, cue(4), cue(4) + 0.6))} seed={3} />

          {/* titik keadaan */}
          <Ripple x={qx(QA)} y={ty(0)} p={(t - tStop) / 1.4} r={90} color="cyan" rings={2} />
          <Ripple x={qx(QC)} y={ty(100)} p={(t - cueEnd(3)) / 1.4} r={90} color="heat" rings={2} />
          <Spark x={dotX} y={dotY} r={9} color="kin" opacity={ramp(t, t0 - 0.4, t0)} trail={trail} />

          {/* pembacaan */}
          <g opacity={ramp(t, t0 - 0.3, t0 + 0.4)}>
            <Label x={262} y={252} size={27} color={interpolateColors(T, [-20, 0, 50, 100], [C.pot, '#cdeeff', C.kin, C.heat])} anchor="start" font="mono" weight={600}>
              T = {fmtT(T)} °C
            </Label>
            <Label x={262} y={290} size={23} color={C.kin} anchor="start" font="mono">
              Q = {Math.round(Q)} kJ
            </Label>
          </g>
        </g>

        {/* ================= tampilan molekul ================= */}
        <g opacity={appear}>
          <Glow x={1450} y={400} r={330} color="cyan" opacity={0.25 * (1 - wG)} still />
          <Glow x={1450} y={400} r={330} color="kin" opacity={0.25 * wG} still />
          <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} rx={22} fill="#0a1230" stroke={C.line} strokeWidth={2} />
          <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} rx={22} fill="#9fd8ff" opacity={0.07 * wS} />
          <rect x={PX0} y={surfY} width={PX1 - PX0} height={PY1 - surfY} rx={18} fill={C.water} opacity={0.12 * wL} />
          <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} rx={22} fill={C.kin} opacity={0.05 * wG} />
          <path d={surfD} fill="none" stroke={C.water} strokeWidth={2.5} opacity={0.6 * wL} />
          {bonds}
          {pos.map((p, i) => {
            const g0 = gasPos(i, t);
            const tr: [number, number][] = p.gi > 0.05 ? [1, 2, 3].map((k) => gasPos(i, t - k * 0.05)).map(([gx, gy]) => [p.x + (gx - g0[0]) * p.gi, p.y + (gy - g0[1]) * p.gi]) : [];
            return (
              <g key={i}>
                {tr.map(([x, y], k) => (
                  <circle key={k} cx={x} cy={y} r={8 - k * 2} fill={C.cyan} opacity={0.3 * p.gi * (1 - k / 3)} />
                ))}
                <circle cx={p.x} cy={p.y} r={30} fill="url(#soft-cyan)" opacity={0.6 * p.gi} />
                <circle cx={p.x} cy={p.y} r={12} fill="url(#ph-mol)" />
              </g>
            );
          })}
          <Ripple x={1450} y={300} p={(t - wordOf(4, 'sepenuhnya') + 0.2) / 1.6} r={260} color="cyan" rings={2} />
          {/* label wujud (silang-pudar) */}
          <Label x={PX0 + 26} y={PY0 + 30} size={25} color="#cdeeff" anchor="start" weight={600} opacity={lS}>
            padat (es): kisi teratur
          </Label>
          <Label x={PX0 + 26} y={PY0 + 30} size={25} color={C.water} anchor="start" weight={600} opacity={lL}>
            cair: ikatan putus-sambung
          </Label>
          <Label x={PX0 + 26} y={PY0 + 30} size={25} color={C.kin} anchor="start" weight={600} opacity={lG * (1 - sep)}>
            gas: molekul lepas
          </Label>
          <Label x={PX0 + 26} y={PY0 + 30} size={25} color={C.kin} anchor="start" weight={600} opacity={lG * sep}>
            gas: terpisah sepenuhnya
          </Label>
          <Label x={PX1 - 24} y={PY0 + 30} size={20} color={C.muted} anchor="end" font="mono">
            H₂O · gerak lambat
          </Label>

          {/* pemanas di bawah panel */}
          <Glow x={1450} y={590} r={220} color="kin" opacity={0.35 + 0.4 * heaterHi} />
          <rect x={PX0 + 20} y={570} width={PX1 - PX0 - 40} height={14} rx={6} fill="url(#ph-plate)" />
          <rect x={PX0 + 20} y={570} width={PX1 - PX0 - 40} height={4} rx={2} fill="#ffe2c4" opacity={0.5 + 0.2 * Math.sin(t * 3)} />
          {Array.from({length: 7}, (_, k) => (
            <Flame key={k} x={PX0 + 70 + k * 90} y={630} s={0.95 + 0.25 * heaterHi} t={t} k={k} />
          ))}
          {[1230, 1450, 1670].map((x, k) => (
            <Stream
              key={k}
              pts={[
                [x, 566],
                [x + 14, 500],
                [x - 8, 430],
              ]}
              color="kin"
              n={4}
              speed={0.55}
              r={4}
              opacity={0.75}
              seed={k + 2}
            />
          ))}
          <Label x={PX1 - 24} y={658} size={22} color={C.kin} anchor="end" weight={600} opacity={heaterHi}>
            pemanas tetap menyala
          </Label>
        </g>

        {/* ================= batang pembanding (baris 3) ================= */}
        {b3 > 0.001 ? (
          <g opacity={b3}>
            <rect x={1130} y={662} width={640} height={190} rx={16} fill="#0f1a3a" stroke={C.gold} strokeOpacity={0.4} strokeWidth={1.5} />
            <rect x={1130} y={662} width={7} height={190} rx={3} fill={C.gold} />
            <Label x={1450} y={690} size={22} color={C.gold} weight={600}>
              sama-sama 334 kJ
            </Label>
            <Label x={1158} y={742} size={22} color="#cdeeff" anchor="start">
              1 kg es → cair (0 °C)
            </Label>
            <rect x={1420} y={727} width={320} height={30} rx={8} fill="#1a2650" />
            <rect x={1420} y={727} width={320 * bar1} height={30} rx={8} fill={C.cyan} opacity={0.85} />
            <text x={1580} y={749} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fontWeight={600} fill="#06122a" opacity={bar1}>
              334 kJ
            </text>
            <Label x={1158} y={808} size={22} color={C.kin} anchor="start">
              1 kg air: 0 → 80 °C
            </Label>
            <rect x={1420} y={793} width={320} height={30} rx={8} fill="#1a2650" />
            <rect x={1420} y={793} width={320 * bar2} height={30} rx={8} fill="url(#ph-bar2)" />
            {[0, 0.25, 0.5, 0.75, 1].map((k) => (
              <line key={k} x1={1420 + 320 * k} y1={826} x2={1420 + 320 * k} y2={834} stroke={C.muted} strokeWidth={2} />
            ))}
            <text x={1580} y={815} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fontWeight={600} fill="#06122a" opacity={eighty}>
              ≈ 80 °C
            </text>
            <circle cx={1420 + 320 * bar2} cy={808} r={6} fill="#fff" opacity={0.9 * Math.sin(Math.PI * bar2)} />
          </g>
        ) : null}
        <Glow x={1450} y={760} r={260} color="gold" opacity={0.35 * f1} />
        <Glow x={1450} y={760} r={260} color="heat" opacity={0.3 * f4} />
        <Twinkles x={1450} y={760} rx={250} ry={70} n={5} color="heat" opacity={f4 * 0.8} seed={7} />
      </Stage>

      <Note x={1450} y={760} p={n1} color={C.cyan} size={29}>
        kalor → memutus ikatan, <span style={{color: C.cyan}}>suhu tetap</span>
      </Note>
      <Formula x={1450} y={760} p={f1} accent={C.gold} size={60} caption="kalor lebur es">
        <span style={{fontStyle: 'italic'}}>L</span>
        <Sub>f</Sub> = 334 kJ/kg
      </Formula>
      <Formula
        x={1450}
        y={760}
        p={f4}
        accent={C.heat}
        size={60}
        caption={
          <>
            kalor uap air · ≈ 6,8 × L<Sub>f</Sub> · molekul dipisahkan
          </>
        }
      >
        <span style={{fontStyle: 'italic'}}>L</span>
        <Sub>v</Sub> ≈ 2260 kJ/kg
      </Formula>
    </AbsoluteFill>
  );
};
