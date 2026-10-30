import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, smoothPath} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sup, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Entropi mikroskopis (AUDIT): S = k ln W (makam Boltzmann, Wina: "S = k. log W").
// 4 molekul di kotak dua sisi: W(4|0) = 1, W(3|1) = 4, W(2|2) = 6, W(1|3) = 4, W(0|4) = 1 (total 2⁴ = 16).
// Peluang N molekul semua di kiri = (½)^N: N = 4 → 1/16; N = 10 → 1/1024 ≈ 10⁻³; N = 100 → 7,9×10⁻³¹ ≈ 10⁻³⁰.
// ΔG = ΔH − TΔS. Contoh kualitatif: NH₄NO₃ larut dalam air → ΔH > 0 (menyerap kalor, terasa dingin), ΔS > 0, ΔG < 0 (spontan).

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const foldD = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return m < L ? {p: lo + m, d: 1} : {p: lo + 2 * L - m, d: -1};
};

// ---------- 4 molekul ----------
const QX0 = 140;
const QX1 = 820;
const QY0 = 300;
const QY1 = 740;
const QMID = (QX0 + QX1) / 2;
const Q_COL = [C.cyan, C.pot, C.buoy, '#f2f5ff'];
const Q_MOL = [0, 1, 2, 3].map((i) => {
  const a = rand(i * 5.3 + 1) * Math.PI * 2;
  const s = 120 + 70 * rand(i * 2.7 + 3);
  return {x0: QX0 + 40 + rand(i * 1.9) * (QX1 - QX0 - 80), y0: QY0 + 40 + rand(i * 3.1) * (QY1 - QY0 - 80), vx: s * Math.cos(a), vy: s * Math.sin(a)};
});
// semua himpunan bagian {0,1,2,3} dikelompokkan menurut jumlah di kiri (4,3,2,1,0)
const SUBSETS: number[][][] = [4, 3, 2, 1, 0].map((n) => {
  const out: number[][] = [];
  for (let m = 0; m < 16; m++) {
    const left = [0, 1, 2, 3].filter((b) => (m >> b) & 1);
    if (left.length === n) out.push(left);
  }
  return out;
});
const HX = (c: number) => 1080 + c * 150;
const HBASE = 800;
const HROW = 52;

// ---------- kotak besar: gas | hampa ----------
const BX0 = 130;
const BX1 = 930;
const BY0 = 260;
const BY1 = 760;
const MID = (BX0 + BX1) / 2;
const MR = 10;
const LO_X = BX0 + 6 + MR;
const HI_X = BX1 - 6 - MR;
const MID_X = MID - 6 - MR;
const LO_Y = BY0 + 6 + MR;
const HI_Y = BY1 - 6 - MR;
const NG = 70;
const GAS = Array.from({length: NG}, (_, i) => {
  const a = rand(i * 7.1 + 4) * Math.PI * 2;
  const s = 90 + 130 * Math.sqrt(rand(i * 3.3 + 9));
  return {x0: LO_X + rand(i * 1.7 + 2) * (MID_X - LO_X), y0: LO_Y + rand(i * 2.3 + 6) * (HI_Y - LO_Y), vx: s * Math.cos(a), vy: s * Math.sin(a)};
});
const gasX = (g: (typeof GAS)[number], t: number, to: number) => {
  if (t < to) return foldD(g.x0 + g.vx * t, LO_X, MID_X).p;
  const b = foldD(g.x0 + g.vx * to, LO_X, MID_X);
  return foldD(b.p + b.d * g.vx * (t - to), LO_X, HI_X).p;
};

/** Kotak mini dengan 4 molekul (himpunan `left` di kiri). */
const MiniBox: React.FC<{cx: number; cy: number; left: number[]; op: number; glow: number}> = ({cx, cy, left, op, glow}) => {
  if (op <= 0.001) return null;
  const w = 124;
  const h = 44;
  const slots = (side: number, k: number) => [cx + (side === 0 ? -w / 4 : w / 4) + (k % 2 === 0 ? -14 : 14), cy + (k < 2 ? -9 : 9)];
  let li = 0;
  let ri = 0;
  return (
    <g opacity={op}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={8} fill="#0f1838" stroke={C.line} strokeWidth={2} />
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={8} fill="none" stroke={C.gold} strokeWidth={2.5} opacity={glow} />
      <line x1={cx} x2={cx} y1={cy - h / 2 + 4} y2={cy + h / 2 - 4} stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 4" />
      {[0, 1, 2, 3].map((m) => {
        const isL = left.includes(m);
        const [x, y] = isL ? slots(0, li++) : slots(1, ri++);
        return <circle key={m} cx={x} cy={y} r={6.5} fill={Q_COL[m]} />;
      })}
    </g>
  );
};

export const Microstates: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---------- fase ----------
  const stoneIn = ramp(t, -0.5, 0.9);
  const stoneOut = 1 - ramp(t, cue(1) - 0.3, cue(1) + 0.5, EASE_IN_OUT);
  const engrave = ramp(t, wordOf(0, 'sama') - 0.6, wordOf(0, 'log') + 0.9);
  const swIn = Math.min(ramp(t, wordOf(0, 'boltzmann'), wordOf(0, 'boltzmann') + 0.8), 1 - ramp(t, cue(1) - 0.3, cue(1) + 0.4, EASE_IN_OUT));

  const qIn = Math.min(ramp(t, cue(1) - 0.1, cue(1) + 0.7), 1 - ramp(t, cue(2) - 0.3, cue(2) + 0.4, EASE_IN_OUT));
  const tCara = wordOf(1, 'cara');
  const histP = (c: number, r: number) => ramp(t, tCara - 0.6 + (c * 3 + r) * 0.11, tCara - 0.3 + (c * 3 + r) * 0.11);
  const wLbl = ramp(t, wordOf(1, 'sama') - 0.3, wordOf(1, 'sama') + 0.4);

  const bigIn = Math.min(ramp(t, cue(2) - 0.1, cue(2) + 0.7), 1 - ramp(t, cue(4) - 0.4, cue(4) + 0.4, EASE_IN_OUT));
  const tOpen = wordOf(2, 'buka') + 0.4;
  const gate = ramp(t, tOpen - 0.1, tOpen + 0.7, EASE_IN_OUT);
  const traceIn = Math.min(ramp(t, cue(2) + 0.6, cue(2) + 1.3), 1 - ramp(t, cue(3) - 0.2, cue(3) + 0.4, EASE_IN_OUT));

  const rowsIn = Math.min(ramp(t, cue(3) + 0.2, cue(3) + 0.9), 1 - ramp(t, cue(4) - 0.4, cue(4) + 0.4, EASE_IN_OUT));
  const rowP = (k: number) => ramp(t, cue(3) + 0.4 + k * 0.7, cue(3) + 1.0 + k * 0.7);
  const tArrow = wordOf(3, 'arah');
  const arrowP = ramp(t, tArrow - 0.5, tArrow + 0.6, EASE_IN_OUT);

  const gIn = ramp(t, cue(4) + 0.1, cue(4) + 0.9);
  const tH = wordOf(4, 'entalpi');
  const tS = wordOf(4, 'entropi');
  const pH = ramp(t, tH - 0.3, tH + 0.6, EASE_IN_OUT);
  const pS = ramp(t, tS - 0.2, tS + 0.7, EASE_IN_OUT);
  const tGibbs = wordOf(4, 'gibbs');
  const pG = ramp(t, tGibbs - 0.6, tGibbs + 0.4, EASE_IN_OUT);
  const dissolve = ramp(t, cue(4) + 0.8, dur, (q) => q);

  // ---------- molekul ----------
  const qMol = Q_MOL.map((m, i) => ({x: foldD(m.x0 + m.vx * t, QX0 + 22, QX1 - 22).p, y: foldD(m.y0 + m.vy * t, QY0 + 22, QY1 - 22).p, i}));
  const gas = GAS.map((g, i) => ({x: gasX(g, t, tOpen), y: foldD(g.y0 + g.vy * t, LO_Y, HI_Y).p, i}));

  // jejak fraksi molekul di kiri
  const TR0 = tOpen - 1.5;
  const TRW = 11;
  const TX0 = 1110;
  const TXW = 660;
  const TY = (f: number) => 780 - f * 300;
  const trPts: [number, number][] = [];
  const tEnd = Math.min(t, TR0 + TRW);
  for (let k = 0; k <= 110; k++) {
    const tt = TR0 + (k * TRW) / 110;
    if (tt > tEnd) break;
    let nl = 0;
    for (const g of GAS) if (gasX(g, tt, tOpen) < MID) nl++;
    trPts.push([TX0 + ((tt - TR0) / TRW) * TXW, TY(nl / NG)]);
  }
  const nLeftNow = gas.filter((g) => g.x < MID).length;

  // kurva S = k ln W (baris 0)
  const SX0 = 1080;
  const SY0 = 800;
  const sLog = smoothPath(Array.from({length: 61}, (_, i) => {
    const w = 1 + (i / 60) * 99;
    return [SX0 + (w / 100) * 620, SY0 - (Math.log(w) / Math.log(100)) * 260] as [number, number];
  }));

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="ms-big">
            <rect x={BX0 + 5} y={BY0 + 5} width={BX1 - BX0 - 10} height={BY1 - BY0 - 10} rx={18} />
          </clipPath>
          <linearGradient id="ms-stone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a5378" />
            <stop offset="100%" stopColor="#1e2442" />
          </linearGradient>
        </defs>

        {/* ===================== makam (gaya bebas) ===================== */}
        <g opacity={stoneIn * stoneOut}>
          <Glow x={520} y={500} r={360} color="gold" opacity={0.3} />
          <ellipse cx={520} cy={836} rx={300} ry={22} fill="#000" opacity={0.4} />
          <rect x={290} y={770} width={460} height={60} rx={8} fill="#2a3152" stroke="#59628c" strokeWidth={2} />
          <path d="M340,770 L340,330 Q340,210 520,200 Q700,210 700,330 L700,770 Z" fill="url(#ms-stone)" stroke="#6b75a3" strokeWidth={3} />
          <path d="M372,740 L372,345 Q372,245 520,236 Q668,245 668,345 L668,740 Z" fill="none" stroke="#7d87b8" strokeWidth={2} opacity={0.5} />
          {/* medali generik: atom bergaris */}
          <circle cx={520} cy={330} r={58} fill="#262d4f" stroke={C.gold} strokeWidth={2.5} opacity={0.9} />
          {[0, 60, 120].map((a) => (
            <ellipse key={a} cx={520} cy={330} rx={44} ry={15} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.7} transform={`rotate(${a + t * 8} 520 330)`} />
          ))}
          <circle cx={520} cy={330} r={7} fill={C.gold} />
          <Label x={520} y={440} size={26} font="sans" weight={600} color="#b9c2e6" spacing={4}>
            L. BOLTZMANN
          </Label>
          <Label x={520} y={476} size={22} font="mono" color={C.muted}>
            1844 – 1906 · Wina
          </Label>
          {/* ukiran rumus */}
          <rect x={385} y={540} width={270} height={110} rx={10} fill="#141a35" stroke={C.gold} strokeWidth={2} opacity={0.85} />
          <text
            x={520}
            y={597}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT.serif}
            fontStyle="italic"
            fontSize={50}
            fontWeight={600}
            fill={C.gold}
            opacity={engrave}
          >
            S = k · log W
          </text>
          {/* daun rambat bergoyang */}
          {Array.from({length: 7}, (_, k) => {
            const x = 345 + k * 6 + 6 * Math.sin(t * 1.1 + k);
            const y = 760 - k * 52;
            return <ellipse key={k} cx={x} cy={y} rx={13} ry={7} fill={C.work} opacity={0.5} transform={`rotate(${-30 + 12 * Math.sin(t * 1.3 + k)} ${x} ${y})`} />;
          })}
          <Motes x={520} y={520} rx={260} ry={300} n={20} color="gold" opacity={0.45} seed={2} />
          <Ripple x={520} y={595} p={ramp(t, wordOf(0, 'log') + 0.3, wordOf(0, 'log') + 1.8)} r={200} color="gold" />
        </g>

        {/* kurva S vs W (baris 0) */}
        <g opacity={swIn}>
          <line x1={SX0} y1={SY0} x2={SX0 + 650} y2={SY0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={SX0} y1={SY0 + 8} x2={SX0} y2={SY0 - 310} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <path d={sLog} fill="none" stroke={C.gold} strokeWidth={5} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - swIn)} />
          <Label x={SX0 + 640} y={SY0 + 32} size={28} font="serif" italic color={C.ink} anchor="end">
            W
          </Label>
          <Label x={SX0 + 22} y={SY0 - 316} size={28} font="serif" italic color={C.gold} anchor="start">
            S
          </Label>
          <Label x={SX0 + 330} y={SY0 - 120} size={24} color={C.muted} anchor="start">
            W makin banyak → S makin besar
          </Label>
          {(() => {
            const ph = (t * 0.25) % 1;
            const w = 1 + ph * 99;
            return <circle cx={SX0 + (w / 100) * 620} cy={SY0 - (Math.log(w) / Math.log(100)) * 260} r={10} fill={C.gold} opacity={cyc(ph)} />;
          })()}
        </g>

        {/* ===================== 4 molekul & histogram W ===================== */}
        <g opacity={qIn}>
          <rect x={QX0} y={QY0} width={QX1 - QX0} height={QY1 - QY0} rx={22} fill="#0c1634" fillOpacity={0.9} stroke="#c9d4f5" strokeWidth={6} />
          <line x1={QMID} x2={QMID} y1={QY0 + 10} y2={QY1 - 10} stroke={C.muted} strokeWidth={3} strokeDasharray="12 10" />
          <Label x={(QX0 + QMID) / 2} y={QY0 - 30} size={28} color={C.muted}>
            kiri
          </Label>
          <Label x={(QMID + QX1) / 2} y={QY0 - 30} size={28} color={C.muted}>
            kanan
          </Label>
          {qMol.map((m) => (
            <g key={m.i}>
              <circle cx={m.x} cy={m.y} r={40} fill={`url(#soft-cyan)`} opacity={0.6} />
              <circle cx={m.x} cy={m.y} r={18} fill={Q_COL[m.i]} />
              <Label x={m.x} y={m.y} size={20} weight={700} color="#0b1430">
                {m.i + 1}
              </Label>
            </g>
          ))}
          <Label x={(QX0 + QX1) / 2} y={QY1 + 40} size={26} color={C.muted}>
            4 molekul yang bisa dibedakan
          </Label>
          {/* histogram dari susunan */}
          <line x1={1000} x2={1780} y1={HBASE} y2={HBASE} stroke={C.muted} strokeWidth={3} />
          {SUBSETS.map((col, c) => (
            <g key={c}>
              {col.map((left, r) => (
                <MiniBox key={r} cx={HX(c)} cy={HBASE - (r + 0.5) * HROW} left={left} op={histP(c, r)} glow={c === 2 ? wLbl : 0} />
              ))}
              <Label x={HX(c)} y={HBASE + 28} size={26} font="mono" color={C.ink}>
                {`${4 - c}|${c}`}
              </Label>
              <Label x={HX(c)} y={HBASE - col.length * HROW - 26} size={30} font="mono" weight={600} color={C.gold} opacity={histP(c, col.length - 1)}>
                {`W = ${col.length}`}
              </Label>
            </g>
          ))}
          <Glow x={HX(2)} y={HBASE - 3 * HROW} r={200} color="gold" opacity={wLbl * 0.5} />
          <Twinkles x={HX(2)} y={HBASE - 6 * HROW - 30} rx={70} ry={30} n={4} opacity={wLbl} />
        </g>

        {/* ===================== kotak besar: gas → hampa ===================== */}
        <g opacity={bigIn}>
          <ellipse cx={(BX0 + BX1) / 2} cy={BY1 + 24} rx={420} ry={14} fill="#000" opacity={0.35} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={22} fill="#0c1634" fillOpacity={0.9} />
          <rect x={MID} y={BY0 + 6} width={(BX1 - MID - 6) * (1 - gate)} height={BY1 - BY0 - 12} fill="#060914" opacity={0.5} />
          <g clipPath="url(#ms-big)">
            {gas.map((g) => (
              <g key={g.i}>
                <circle cx={g.x} cy={g.y} r={22} fill="url(#soft-cyan)" opacity={0.6} />
                <circle cx={g.x} cy={g.y} r={MR} fill={C.cyan} />
                <circle cx={g.x - 3} cy={g.y - 3.5} r={3.5} fill="#fff" opacity={0.55} />
              </g>
            ))}
            {/* sekat terangkat */}
            <rect x={MID - 6} y={BY0 - gate * (BY1 - BY0 + 20)} width={12} height={BY1 - BY0} fill="#c9d4f5" />
          </g>
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={22} fill="none" stroke="#c9d4f5" strokeWidth={6} />
          <Label x={(BX0 + MID) / 2} y={BY0 - 30} size={30} weight={600} color={C.cyan}>
            gas
          </Label>
          <Label x={(MID + BX1) / 2} y={BY0 - 30} size={30} weight={600} color={C.muted} opacity={1 - gate * 0.6}>
            ruang hampa
          </Label>
          <Ripple x={MID} y={(BY0 + BY1) / 2} p={ramp(t, tOpen, tOpen + 1.4)} r={220} color="cyan" />
          {/* panah waktu */}
          <g opacity={arrowP}>
            <Arrow x1={BX0 + 40} y1={836} x2={BX1 - 40} y2={836} color="gold" width={7} />
            <Label x={(BX0 + BX1) / 2} y={800} size={32} weight={600} color={C.gold}>
              arah waktu → S naik
            </Label>
            <Twinkles x={BX1 - 60} y={836} rx={50} ry={30} n={4} />
          </g>
        </g>

        {/* jejak fraksi di kiri */}
        <g opacity={traceIn}>
          <line x1={TX0} y1={TY(0)} x2={TX0 + TXW + 20} y2={TY(0)} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={TX0} y1={TY(0) + 8} x2={TX0} y2={TY(1) - 30} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={TX0} x2={TX0 + TXW} y1={TY(0.5)} y2={TY(0.5)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 8" opacity={0.7} />
          <Label x={TX0 - 14} y={TY(1)} size={22} font="mono" color={C.muted} anchor="end">
            100%
          </Label>
          <Label x={TX0 - 14} y={TY(0.5)} size={22} font="mono" color={C.gold} anchor="end">
            50%
          </Label>
          <Label x={TX0 + 20} y={TY(1) - 44} size={26} color={C.cyan} anchor="start">
            molekul di sisi kiri
          </Label>
          <Label x={TX0 + TXW} y={TY(0) + 30} size={24} color={C.muted} anchor="end">
            waktu →
          </Label>
          {trPts.length > 1 ? <path d={trPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.cyan} strokeWidth={4} strokeLinejoin="round" /> : null}
          {trPts.length > 0 ? <circle cx={trPts[trPts.length - 1][0]} cy={trPts[trPts.length - 1][1]} r={9} fill={C.cyan} /> : null}
          <Label x={TX0 + TXW} y={TY(1) - 44} size={26} font="mono" color={C.cyan} anchor="end">
            {`${nLeftNow}/${NG}`}
          </Label>
        </g>

        {/* peluang kembali berkumpul */}
        <g opacity={rowsIn}>
          {[
            {n: 4, p: '1/16'},
            {n: 10, p: '≈ 1/1000'},
            {n: 100, p: '≈ 10⁻³⁰'},
          ].map((r, k) => {
            const y = 470 + k * 120;
            const op = rowP(k);
            return (
              <g key={k} opacity={op}>
                <rect x={1080} y={y - 34} width={136} height={68} rx={10} fill="#0f1838" stroke={C.line} strokeWidth={2} />
                <line x1={1148} x2={1148} y1={y - 28} y2={y + 28} stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 4" />
                {Array.from({length: Math.min(r.n, 24)}, (_, j) => (
                  <circle key={j} cx={1094 + (j % 6) * 9.5 + 1.5 * Math.sin(t * 4 + j)} cy={y - 22 + Math.floor(j / 6) * 14 + 1.5 * Math.cos(t * 3.4 + j)} r={4} fill={C.cyan} />
                ))}
                <Label x={1250} y={y} size={32} font="mono" color={C.ink} anchor="start">
                  {`N = ${r.n}`}
                </Label>
                <Label x={1780} y={y} size={34} font="mono" weight={600} color={k === 2 ? C.gold : C.ink} anchor="end">
                  {r.p}
                </Label>
              </g>
            );
          })}
          <Label x={1080} y={826} size={26} color={C.muted} anchor="start" opacity={rowP(3)}>
            satu mol: N ≈ 6 × 10²³ → praktis mustahil
          </Label>
        </g>

        {/* ===================== ΔG = ΔH − TΔS ===================== */}
        <g opacity={gIn}>
          <line x1={240} x2={1000} y1={620} y2={620} stroke={C.muted} strokeWidth={3} />
          <Label x={228} y={620} size={24} font="mono" color={C.muted} anchor="end">
            0
          </Label>
          {/* ΔH > 0 */}
          {(() => {
            const h = 130 * pH;
            return (
              <g opacity={Math.min(1, pH * 3)}>
                <rect x={320} y={620 - h} width={130} height={h} rx={8} fill={C.kin} opacity={0.85} />
                <Label x={385} y={620 - 130 - 34} size={34} font="serif" italic weight={600} color={C.kin}>
                  ΔH &gt; 0
                </Label>
                <Label x={385} y={660} size={24} color={C.muted}>
                  menyerap kalor
                </Label>
              </g>
            );
          })()}
          {/* −TΔS < 0 */}
          {(() => {
            const h = 175 * pS;
            return (
              <g opacity={Math.min(1, pS * 3)}>
                <line x1={450} x2={540} y1={490} y2={490} stroke={C.muted} strokeWidth={2} strokeDasharray="5 5" />
                <rect x={540} y={490} width={130} height={h} rx={8} fill={C.gold} opacity={0.85} />
                <Label x={605} y={455} size={34} font="serif" italic weight={600} color={C.gold}>
                  −TΔS
                </Label>
                <Label x={605} y={490 + 175 + 30} size={24} color={C.muted}>
                  entropi naik
                </Label>
              </g>
            );
          })()}
          {/* ΔG < 0 */}
          {(() => {
            const h = 45 * pG;
            return (
              <g opacity={Math.min(1, pG * 3)}>
                <line x1={670} x2={760} y1={665} y2={665} stroke={C.muted} strokeWidth={2} strokeDasharray="5 5" />
                <rect x={760} y={620} width={130} height={h} rx={6} fill={C.work} opacity={0.9} />
                <Label x={825} y={584} size={34} font="serif" italic weight={600} color={C.work}>
                  ΔG &lt; 0
                </Label>
                <Label x={825} y={700} size={26} weight={600} color={C.work}>
                  berlangsung!
                </Label>
                <Twinkles x={825} y={640} rx={80} ry={40} n={5} color="work" />
                <Ripple x={825} y={640} p={ramp(t, tGibbs, tGibbs + 1.4)} r={140} color="work" />
              </g>
            );
          })()}

          {/* gelas: garam amonium nitrat larut (dingin tetapi spontan) */}
          <g>
            <path d="M1300,460 L1310,800 Q1312,820 1332,820 L1568,820 Q1588,820 1590,800 L1600,460" fill="none" stroke="#dfe7ff" strokeWidth={5} strokeLinejoin="round" />
            <path d={`M1306,${540 + 3 * Math.sin(t * 2)} Q1450,${532 - 3 * Math.sin(t * 2)} 1594,${540 + 3 * Math.sin(t * 2)} L1588,800 Q1586,814 1570,814 L1330,814 Q1314,814 1312,800 Z`} fill="url(#water)" opacity={0.55} />
            {/* kristal larut */}
            {Array.from({length: 7}, (_, k) => {
              const s = 26 * (1 - 0.85 * dissolve) * (0.7 + 0.3 * rand(k));
              return <rect key={k} x={1360 + k * 30 - s / 2} y={800 - s - (k % 2) * 12} width={s} height={s} rx={3} fill="#f2f5ff" opacity={0.85} transform={`rotate(${k * 17} ${1360 + k * 30} ${800 - s / 2})`} />;
            })}
            {/* ion menyebar */}
            {Array.from({length: 26}, (_, k) => {
              const sx = 1360 + (k % 7) * 30;
              const sy = 790;
              const tx = 1330 + rand(k * 3.1) * 240 + 12 * Math.sin(t * 1.3 + k);
              const ty = 570 + rand(k * 5.7) * 220 + 10 * Math.cos(t * 1.1 + k * 2);
              const sp = ramp(dissolve, (k % 9) * 0.04, (k % 9) * 0.04 + 0.5);
              return <circle key={k} cx={mix(sx, tx, sp)} cy={mix(sy, ty, sp)} r={6} fill={k % 2 ? C.pot : C.press} opacity={sp} />;
            })}
            {/* termometer turun */}
            <rect x={1650} y={500} width={26} height={260} rx={13} fill="#141d40" stroke="#c9d4f5" strokeWidth={2.5} />
            <circle cx={1663} cy={782} r={22} fill={C.pot} />
            <rect x={1655} y={760 - 200 * mix(0.75, 0.45, dissolve)} width={16} height={200 * mix(0.75, 0.45, dissolve) + 10} rx={8} fill={C.pot} />
            <Glow x={1450} y={680} r={240} color="pot" opacity={0.35 * dissolve + 0.1} />
            <Label x={1450} y={420} size={28} weight={600} color={C.ink}>
              NH<TSub>4</TSub>NO<TSub>3</TSub> larut dalam air
            </Label>
            <Label x={1450} y={858} size={24} color={C.pot}>
              terasa dingin, tetapi tetap spontan
            </Label>
          </g>
        </g>

        <Motes x={960} y={520} rx={820} ry={320} n={14} color="cyan" opacity={0.25} seed={9} />
      </Stage>

      {/* ===================== kartu rumus ===================== */}
      <Formula x={1400} y={300} p={slot(t, wordOf(0, 'boltzmann') - 0.2, cue(2) + 0.1)} accent={C.gold} size={68} caption="W = banyaknya susunan mikroskopis">
        <Tint c="gold">
          <V>S</V>
        </Tint>{' '}
        = <V color="gold">k</V> ln <V>W</V>
      </Formula>
      <Note x={1440} y={300} p={slot(t, wordOf(2, 'jauh') - 0.3, cue(3) + 0.1)} color={C.gold} size={34}>
        <span style={{fontFamily: FONT.serif, fontStyle: 'italic'}}>W</span>(menyebar) ≫ <span style={{fontFamily: FONT.serif, fontStyle: 'italic'}}>W</span>(berkumpul)
      </Note>
      <Formula x={1430} y={300} p={slot(t, cue(3) + 0.1, cue(4) + 0.1)} accent={C.gold} size={58} caption="peluang 100 molekul semua kembali di kiri">
        <span style={{position: 'relative'}}>
          (<Frac n="1" d="2" size={0.7} />)
        </span>
        <Sup>100</Sup> ≈ <Tint c="gold">7,9 × 10</Tint>
        <Sup color={C.gold}>−31</Sup>
      </Formula>
      <Formula x={960} y={300} p={slot(t, cue(4) + 0.1, dur + 2)} accent={C.work} size={66} caption="energi bebas Gibbs: ΔG < 0 → reaksi dapat berlangsung">
        Δ<V color="work">G</V> = Δ<V color="kin">H</V> − <V color="heat">T</V>
        <Tint c="gold">
          Δ<V>S</V>
        </Tint>
      </Formula>
    </AbsoluteFill>
  );
};
