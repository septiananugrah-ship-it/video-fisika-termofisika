import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand} from '../anim';
import {Glow, Label, Motes, Ripple, Spark, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: tiga gelombang, dihitung analitik per frame.
// (A) kolam: kerikil jatuh → riak melingkar r = V(t − t₀) − nλ; daun di jarak tetap hanya naik-turun
//     h = A cos(k r − ωτ) (setelah muka gelombang tiba);
// (B) gitar: senar bergetar y = A(t) sin(πx/L) cos ωt (meredam), muka gelombang bunyi menyebar dan tiba di telinga
//     beberapa saat kemudian (amplitudo muka = amplitudo senar saat dipancarkan);
// (C) Matahari → mata: gelombang cahaya merambat menempuh ≈ 150 juta km ruang hampa (tidak berskala);
// lalu kata "gelombang", rantai titik medium yang hanya naik-turun sementara energi (emas) mengalir,
// dan teaser: elektron sebagai paket gelombang (ungu).
const TAU = Math.PI * 2;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const line = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// ---- kolam ----
const PV = 105; // px/s
const PL = 64; // jarak antar-riak
const PK = TAU / PL;
const PSX = -110; // titik jatuh kerikil
const PCY = 40;
const LEAF_R = 250;
const ringAmp = (r: number, tauE: number) => (tauE < 0 ? 0 : Math.exp(-tauE / 9) * sm(r / 30) * Math.max(0, 1 - r / 330));

const Pond: React.FC<{t: number; drops: number[]; foc: number; naik: number}> = ({t, drops, foc, naik}) => {
  const rings: React.ReactNode[] = [];
  let h = 0;
  drops.forEach((ts, d) => {
    const tau = t - ts;
    if (tau <= 0) return;
    const nMax = Math.floor((PV * tau) / PL);
    for (let n = Math.max(0, nMax - 7); n <= nMax; n++) {
      const r = PV * tau - n * PL;
      if (r <= 2 || r > 330) continue;
      const a = ringAmp(r, tau - r / PV);
      rings.push(<ellipse key={`${d}-${n}`} cx={PSX} cy={PCY} rx={r} ry={r * 0.36} fill="none" stroke="#c8f0ff" strokeWidth={1.5 + 2.5 * a} opacity={Math.min(1, a * 1.6)} />);
    }
    // daun: hanya naik-turun ketika muka gelombang lewat
    const arr = sm((PV * tau - LEAF_R) / 30);
    h += 15 * arr * ringAmp(LEAF_R, tau - LEAF_R / PV) * 2.4 * Math.cos(PK * LEAF_R - PK * PV * tau);
  });
  // kerikil jatuh
  const ts0 = drops[0];
  const fall = (t - (ts0 - 0.7)) / 0.7;
  const fall2 = drops[1] !== undefined ? (t - (drops[1] - 0.7)) / 0.7 : -1;
  const lx = PSX + LEAF_R;
  const ly = PCY - h;
  return (
    <g>
      <defs>
        <clipPath id="hk-pond">
          <ellipse cx={0} cy={PCY} rx={330} ry={128} />
        </clipPath>
        <radialGradient id="hk-water" cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1f5f9a" />
          <stop offset="100%" stopColor="#0b2346" />
        </radialGradient>
      </defs>
      {/* rerumputan tepi & batu */}
      <ellipse cx={0} cy={PCY + 8} rx={350} ry={142} fill="#14223f" />
      {Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * TAU + 0.2;
        const x = 340 * Math.cos(a);
        const y = PCY + 8 + 136 * Math.sin(a);
        return <ellipse key={i} cx={x} cy={y} rx={18 + 10 * rand(i)} ry={9 + 4 * rand(i + 4)} fill="#2a3768" stroke="#56628f" strokeWidth={1.5} />;
      })}
      <ellipse cx={0} cy={PCY} rx={330} ry={128} fill="url(#hk-water)" stroke="#3aa0ff" strokeOpacity={0.4} strokeWidth={2} />
      <g clipPath="url(#hk-pond)">
        {/* kilau permukaan */}
        {Array.from({length: 6}, (_, i) => (
          <path key={i} d={`M${-260 + i * 95 + 12 * Math.sin(t * 0.7 + i)},${PCY - 70 + i * 22} q20,-6 40,0`} fill="none" stroke="#bfe3ff" strokeOpacity={0.18} strokeWidth={2} />
        ))}
        {rings}
        <Ripple x={PSX} y={PCY} p={(t - ts0) / 0.8} r={70} color="white" rings={1} width={2} />
      </g>
      {/* percikan */}
      {Array.from({length: 7}, (_, i) => {
        const tau = t - ts0;
        if (tau <= 0 || tau > 0.9) return null;
        const a = -Math.PI / 2 + (i - 3) * 0.32;
        const sp = 120 + 40 * rand(i);
        return <circle key={i} cx={PSX + Math.cos(a) * sp * tau} cy={PCY - 4 + Math.sin(a) * sp * tau + 300 * tau * tau} r={3} fill="#c8f0ff" opacity={1 - tau / 0.9} />;
      })}
      {[fall, fall2].map((f, i) =>
        f > 0 && f < 1 ? (
          <g key={i}>
            <ellipse cx={PSX} cy={PCY - 300 + 300 * f * f} rx={14} ry={11} fill="#7d89b5" stroke="#c9d3ee" strokeWidth={2} />
            <line x1={PSX} y1={PCY - 330 + 300 * f * f} x2={PSX} y2={PCY - 360 + 300 * f * f} stroke="#c9d3ee" strokeOpacity={0.4} strokeWidth={2} />
          </g>
        ) : null,
      )}
      {/* daun */}
      <g opacity={naik * foc}>
        <line x1={lx} y1={PCY - 50} x2={lx} y2={PCY + 50} stroke={C.gold} strokeOpacity={0.6} strokeWidth={2.5} strokeDasharray="4 6" />
        <path d={`M${lx + 70},${PCY} l0,-36 m-8,10 l8,-12 l8,12 M${lx + 70},${PCY} l0,36 m-8,-10 l8,12 l8,-12`} fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <ellipse cx={lx} cy={PCY + 8} rx={36} ry={8} fill="#000" opacity={0.25} />
      <g transform={`translate(${lx} ${ly}) rotate(${-8 + 4 * Math.sin(t * 0.9)})`}>
        <path d="M-40,0 C-20,-20 20,-20 42,0 C20,18 -20,18 -40,0 Z" fill="#4fbf6a" stroke="#bff5c9" strokeOpacity={0.7} strokeWidth={2} />
        <path d="M-40,0 L40,0 M-12,0 l10,-9 M8,0 l10,-8 M-12,0 l10,9 M8,0 l10,8" fill="none" stroke="#1d5a2c" strokeWidth={2} />
        <path d="M-40,0 q-12,-4 -18,4" fill="none" stroke="#4fbf6a" strokeWidth={3} strokeLinecap="round" />
      </g>
      <Label x={lx} y={PCY + 172} size={28} color={C.gold} weight={600} opacity={naik * foc}>
        daun: hanya naik-turun
      </Label>
    </g>
  );
};

// ---- gitar ----
const GX0 = -300;
const GX1 = 110;
const GY = 40;
const HOLE = -175;
const SV = 135;
const SL = 46;
const EAR: [number, number] = [282, 10];
const strAmp = (tau: number) => (tau <= 0 ? 0 : 20 * sm(tau / 0.08) * Math.exp(-tau / 4.5));

const Note8: React.FC<{x: number; y: number; s?: number; op: number}> = ({x, y, s = 1, op}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={10} ry={7.5} transform="rotate(-20)" fill={C.gold} />
    <line x1={9} y1={-2} x2={9} y2={-40} stroke={C.gold} strokeWidth={3.5} />
    <path d="M9,-40 q14,6 12,22" fill="none" stroke={C.gold} strokeWidth={3.5} strokeLinecap="round" />
  </g>
);

const Guitar: React.FC<{t: number; plucks: number[]; foc: number}> = ({t, plucks, foc}) => {
  const amp = (tt: number) => plucks.reduce((s, p) => s + strAmp(tt - p), 0);
  const A = amp(t);
  const om = TAU * 3.2;
  const str = Array.from({length: 41}, (_, i) => {
    const x = GX0 + ((GX1 - GX0) * i) / 40;
    return [x, GY + A * Math.sin((Math.PI * (x - GX0)) / (GX1 - GX0)) * Math.cos(om * t)] as [number, number];
  });
  const rEar = Math.hypot(EAR[0] - HOLE, EAR[1] - GY) - 26;
  const arcs: React.ReactNode[] = [];
  const first = plucks[0];
  const nMax = Math.floor((SV * (t - first)) / SL);
  for (let n = Math.max(0, nMax - 10); n <= nMax; n++) {
    const r = SV * (t - first) - n * SL;
    if (r < 110 || r > rEar) continue;
    const a = Math.min(1, amp(t - r / SV) / 14);
    const op = a * sm((r - 110) / 30) * sm((rEar - r) / 30);
    if (op < 0.02) continue;
    const a0 = -0.42;
    const a1 = 0.32;
    arcs.push(
      <path
        key={n}
        d={`M${HOLE + r * Math.cos(a0)},${GY + r * Math.sin(a0)} A${r},${r} 0 0 1 ${HOLE + r * Math.cos(a1)},${GY + r * Math.sin(a1)}`}
        fill="none"
        stroke={C.cyan}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={op}
      />,
    );
  }
  const heard = sm((t - first - rEar / SV) / 0.4);
  return (
    <g>
      <defs>
        <radialGradient id="hk-wood" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#8a5a2c" />
          <stop offset="100%" stopColor="#3b2412" />
        </radialGradient>
      </defs>
      {/* badan gitar */}
      <circle cx={-250} cy={GY} r={102} fill="url(#hk-wood)" stroke="#d9a066" strokeOpacity={0.6} strokeWidth={3} />
      <circle cx={-120} cy={GY} r={80} fill="url(#hk-wood)" stroke="#d9a066" strokeOpacity={0.6} strokeWidth={3} />
      <rect x={-200} y={GY - 70} width={70} height={140} fill="url(#hk-wood)" />
      <circle cx={HOLE} cy={GY} r={32} fill="#0b0a12" stroke="#d9a066" strokeOpacity={0.5} strokeWidth={4} />
      <rect x={-318} y={GY - 26} width={18} height={52} rx={4} fill="#1d1208" />
      <rect x={-50} y={GY - 22} width={175} height={44} rx={4} fill="#2a1a0c" stroke="#7a5230" strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((k) => (
        <line key={k} x1={-20 + k * 30} y1={GY - 22} x2={-20 + k * 30} y2={GY + 22} stroke="#c9d3ee" strokeOpacity={0.5} strokeWidth={2} />
      ))}
      <rect x={GX1} y={GY - 26} width={44} height={52} rx={8} fill="#2a1a0c" stroke="#7a5230" strokeWidth={2} />
      {[-15, -9, -3, 9, 15].map((d) => (
        <line key={d} x1={GX0} y1={GY + d} x2={GX1} y2={GY + d} stroke="#c9d3ee" strokeOpacity={0.35} strokeWidth={1.5} />
      ))}
      <path d={line(str)} fill="none" stroke={C.cyan} strokeOpacity={0.25} strokeWidth={10} />
      <path d={line(str)} fill="none" stroke="#e8fbff" strokeWidth={2.5} />
      {arcs}
      {/* telinga */}
      <g transform={`translate(${EAR[0]} ${EAR[1]})`}>
        <circle cx={0} cy={0} r={70} fill="url(#soft-gold)" opacity={heard * (0.6 + 0.3 * Math.sin(t * 5))} />
        <path d="M-6,-46 C28,-56 50,-26 40,4 C34,22 18,24 14,40 C10,56 -14,58 -22,44" fill="#2a3768" stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} strokeLinecap="round" />
        <path d="M-2,-28 C18,-34 30,-16 22,0 C16,10 6,8 4,18" fill="none" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {[0, 1, 2].map((k) => {
        const ph = (((t - first - rEar / SV) * 0.45 + k / 3) % 1 + 1) % 1;
        return <Note8 key={k} x={EAR[0] + 30 + 30 * Math.sin(ph * 5 + k)} y={EAR[1] - 50 - ph * 120} s={0.9} op={heard * foc * Math.min(1, ph * 6) * (1 - ph)} />;
      })}
    </g>
  );
};

// ---- Matahari ----
const SUNX = -250;
const EYEX = 270;
const LV = 320;
const LK = TAU / 58;
const Sun: React.FC<{t: number; tl: number; foc: number; hampa: number; jarak: number}> = ({t, tl, foc, hampa, jarak}) => {
  const front = SUNX + 80 + LV * Math.max(0, t - tl);
  const x1 = Math.min(EYEX - 46, front);
  const pts: [number, number][] =
    x1 > SUNX + 84
      ? Array.from({length: 70}, (_, i) => {
          const x = SUNX + 80 + ((x1 - SUNX - 80) * i) / 69;
          return [x, -20 + 18 * sm((x - SUNX - 80) / 40) * Math.sin(LK * x - LK * LV * t)];
        })
      : [];
  const seen = sm((front - EYEX + 46) / 60);
  return (
    <g>
      <defs>
        <radialGradient id="hk-sun" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="55%" stopColor="#ffd25a" />
          <stop offset="100%" stopColor="#ff9a2e" />
        </radialGradient>
      </defs>
      {/* bintang ruang hampa */}
      {Array.from({length: 26}, (_, i) => (
        <circle key={i} cx={-330 + rand(i * 3.1) * 660} cy={-190 + rand(i * 7.3) * 330} r={1 + rand(i) * 1.6} fill="#fff" opacity={(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * (1 + rand(i + 2)) + i))) * (0.6 + 0.4 * hampa)} />
      ))}
      <circle cx={SUNX} cy={-20} r={150} fill="url(#soft-gold)" />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * TAU + t * 0.25;
        const l = 98 + 10 * Math.sin(t * 3 + i * 1.7);
        return <line key={i} x1={SUNX + 78 * Math.cos(a)} y1={-20 + 78 * Math.sin(a)} x2={SUNX + l * Math.cos(a)} y2={-20 + l * Math.sin(a)} stroke="#ffd25a" strokeWidth={5} strokeLinecap="round" opacity={0.7} />;
      })}
      <circle cx={SUNX} cy={-20} r={70} fill="url(#hk-sun)" />
      {pts.length ? (
        <>
          <path d={line(pts)} fill="none" stroke="#ffe08a" strokeOpacity={0.25} strokeWidth={12} />
          <path d={line(pts)} fill="none" stroke="#ffe9a8" strokeWidth={3.5} strokeLinecap="round" />
        </>
      ) : null}
      {front < EYEX - 40 ? <Spark x={x1} y={-20} r={6} color="gold" /> : null}
      {/* mata */}
      <g transform={`translate(${EYEX} -20)`}>
        <circle cx={0} cy={0} r={70} fill="url(#soft-gold)" opacity={seen * 0.8} />
        <path d="M-46,0 Q0,-36 46,0 Q0,36 -46,0 Z" fill="#e8ecf8" stroke={C.ink} strokeWidth={2.5} />
        <circle cx={-6} cy={0} r={17} fill="#3a7bd5" />
        <circle cx={-6} cy={0} r={8} fill="#0b0f1e" />
        <circle cx={-11} cy={-5} r={3.5} fill="#fff" />
        <path d="M-46,0 Q0,-44 46,0" fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} transform={`translate(0 ${-4 - 2 * Math.sin(t * 0.8)})`} />
      </g>
      {/* jarak */}
      <g opacity={jarak * foc}>
        <path d={`M${SUNX + 80},${110} L${SUNX + 80},${124} L${EYEX - 50},${124} L${EYEX - 50},${110}`} fill="none" stroke={C.gold} strokeWidth={3} />
        <Label x={(SUNX + EYEX) / 2 + 15} y={158} size={28} color={C.gold} weight={600}>
          ≈ 150 juta km
        </Label>
      </g>
      <Label x={(SUNX + EYEX) / 2 + 15} y={-150} size={26} color={C.muted} font="mono" opacity={hampa * foc}>
        ruang hampa · tanpa medium
      </Label>
    </g>
  );
};

const Frame: React.FC<{color: string; op: number}> = ({color, op}) => (
  <rect x={-370} y={-225} width={740} height={450} rx={28} fill="rgba(13,20,48,0.5)" stroke={color} strokeOpacity={0.35} strokeWidth={2.5} opacity={op} />
);

const SLOT_Y = 292;
const SLOT_S = 0.5;
const SLOTS = [400, 960, 1520];

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const c = [0, 1, 2, 3, 4, 5].map(cue);

  const drops = [wordOf(0, 'kolam') + 0.35, c[3] + 0.3];
  const plucks = [wordOf(1, 'Petik') + 0.35, c[3] + 0.6];
  const tl = wordOf(2, 'Cahaya') + 0.2;

  const inA = ramp(t, -0.6, 0.6);
  const mvA = ramp(t, c[1] - 0.6, c[1] + 0.5, EASE_IN_OUT);
  const inB = ramp(t, c[1] - 0.2, c[1] + 0.7);
  const mvB = ramp(t, c[2] - 0.6, c[2] + 0.5, EASE_IN_OUT);
  const inC = ramp(t, c[2] - 0.2, c[2] + 0.7);
  const mvC = ramp(t, c[3] - 0.6, c[3] + 0.5, EASE_IN_OUT);
  const outRow = 1 - ramp(t, c[5] - 0.5, c[5] + 0.5, EASE_IN_OUT);

  const pos = (fx: number, fy: number, fs: number, k: number, mv: number) => ({x: mix(fx, SLOTS[k], mv), y: mix(fy, SLOT_Y, mv), s: mix(fs, SLOT_S, mv)});
  const pA = pos(960, 470, 1.5, 0, mvA);
  const pB = pos(960, 625, 1.2, 1, mvB);
  const pC = pos(960, 640, 1.2, 2, mvC);

  const naik = ramp(t, wordOf(0, 'naik') - 0.4, wordOf(0, 'naik') + 0.4);
  const jarak = ramp(t, wordOf(2, 'kilometer') - 0.6, wordOf(2, 'kilometer') + 0.3);
  const hampa = ramp(t, wordOf(2, 'hampa') - 0.5, wordOf(2, 'hampa') + 0.3);
  const tags = ramp(t, c[3] - 0.1, c[3] + 0.7) * outRow;
  const wordT = wordOf(3, 'gelombang');
  const word = ramp(t, wordT - 0.3, wordT + 0.4) * outRow;
  const chain = ramp(t, c[4] - 0.2, c[4] + 0.6) * outRow;
  const energi = ramp(t, wordOf(4, 'energi') - 0.3, wordOf(4, 'energi') + 0.4);
  const materi = ramp(t, wordOf(4, 'materi') - 0.3, wordOf(4, 'materi') + 0.4);

  // ---- rantai titik medium (baris 4) ----
  const CY = 790;
  const cPts: [number, number][] = Array.from({length: 25}, (_, i) => {
    const x = 460 + i * 41.7;
    return [x, CY - 26 * Math.sin(TAU * (x / 330) - TAU * 0.8 * t)];
  });

  // ---- elektron (baris 5) ----
  const e5 = c[5];
  const eIn = ramp(t, e5 - 0.2, e5 + 0.6);
  const pk = ramp(t, wordOf(5, 'gelombang') - 0.6, wordOf(5, 'gelombang') + 0.5);
  const xc = 330 + 150 * (t - e5);
  const ePts: [number, number][] = Array.from({length: 130}, (_, i) => {
    const x = xc - 360 + (720 * i) / 129;
    const env = Math.exp(-(((x - xc) / 150) ** 2));
    return [x, 520 - 70 * pk * env * Math.sin(TAU * (x / 70) - TAU * 1.6 * t)];
  });
  const atom = ramp(t, wordOf(5, 'kuantum') - 0.4, wordOf(5, 'kuantum') + 0.8);
  const ring = Array.from({length: 97}, (_, i) => {
    const a = (i / 96) * TAU;
    const r = 120 + 16 * Math.sin(5 * a) * Math.cos(TAU * 0.9 * t);
    return [1500 + r * Math.cos(a), 520 + r * 0.92 * Math.sin(a)] as [number, number];
  });
  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={34} color="cyan" opacity={0.35} seed={2} />
        {/* panel A: kolam */}
        <g opacity={inA * outRow} transform={`translate(${pA.x} ${pA.y}) scale(${pA.s})`}>
          <Frame color={C.cyan} op={mvA} />
          <Pond t={t} drops={drops} foc={1 - mvA} naik={naik} />
        </g>
        {/* panel B: gitar */}
        <g opacity={inB * outRow} transform={`translate(${pB.x} ${pB.y}) scale(${pB.s})`}>
          <Frame color={C.cyan} op={mvB} />
          <Guitar t={t} plucks={plucks} foc={1} />
        </g>
        {/* panel C: Matahari */}
        <g opacity={inC * outRow} transform={`translate(${pC.x} ${pC.y}) scale(${pC.s})`}>
          <Frame color={C.gold} op={mvC} />
          <Sun t={t} tl={tl} foc={1 - mvC} hampa={hampa} jarak={jarak} />
        </g>
        <Label x={pB.x} y={pB.y + 205 * pB.s} size={28} color={C.cyan} font="mono" opacity={inB * (1 - mvB) * ramp(t, wordOf(1, 'mendengar') - 0.4, wordOf(1, 'mendengar') + 0.3)}>
          bunyi tiba beberapa saat kemudian
        </Label>
        {/* label tiap gelombang */}
        {['riak air', 'bunyi', 'cahaya'].map((s, k) => (
          <Label key={s} x={SLOTS[k]} y={SLOT_Y + 145} size={30} color={k === 2 ? C.gold : C.cyan} weight={600} opacity={tags}>
            {s}
          </Label>
        ))}
        <Ripple x={960} y={SLOT_Y} p={ramp(t, c[3] - 0.1, c[3] + 1.6, (z) => z)} r={760} color="cyan" rings={2} width={2} />

        {/* rantai medium + aliran energi */}
        <g opacity={chain}>
          <path d={line(cPts)} fill="none" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2.5} />
          {cPts.map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={CY - 30} x2={x} y2={CY + 30} stroke={C.faint} strokeWidth={1.5} opacity={0.6} />
              <circle cx={x} cy={y} r={i === 12 ? 9 : 6.5} fill={i === 12 ? C.cyan : '#9fdcff'} stroke={i === 12 ? '#fff' : 'none'} strokeWidth={2} />
            </g>
          ))}
          <Stream pts={cPts.map(([x, y]) => [x, y - 2] as [number, number])} color="gold" n={7} speed={0.22} r={9} jitter={0} opacity={energi} />
          <Label x={440} y={CY + 64} size={24} color={C.cyan} anchor="start" opacity={materi} font="sans">
            materi: tetap di tempat
          </Label>
          <Label x={1480} y={CY + 64} size={24} color={C.gold} anchor="end" opacity={energi} weight={600}>
            energi: berpindah →
          </Label>
        </g>

        {/* elektron sebagai gelombang */}
        <g opacity={eIn}>
          <Glow x={xc} y={520} r={300} color="spr" opacity={0.5} />
          <path d={line(ePts)} fill="none" stroke={C.spr} strokeOpacity={0.25} strokeWidth={14} />
          <path d={line(ePts)} fill="none" stroke={C.spr} strokeWidth={4} strokeLinecap="round" opacity={pk} />
          <Spark x={xc} y={520} r={10} color="spr" opacity={1 - 0.75 * pk} trail={[1, 2, 3, 4].map((k) => [xc - k * 16, 520] as [number, number])} />
          <Label x={xc} y={400} size={34} color={C.spr} weight={600}>
            elektron
          </Label>
          <Label x={xc} y={650} size={22} color={C.muted} font="mono" opacity={pk}>
            berperilaku seperti gelombang
          </Label>
          <g opacity={atom}>
            <circle cx={1500} cy={520} r={200} fill="url(#soft-spr)" />
            <path d={line(ring)} fill="none" stroke={C.spr} strokeOpacity={0.25} strokeWidth={12} />
            <path d={line(ring)} fill="none" stroke={C.spr} strokeWidth={3.5} />
            <circle cx={1500} cy={520} r={14} fill={C.heat} stroke="#ffd0d6" strokeWidth={2} />
          </g>
          <Twinkles x={1500} y={520} rx={180} ry={150} n={5} color="spr" opacity={0.7 * atom} seed={4} />
        </g>
      </Stage>
      {/* kata "gelombang": huruf mengikuti gelombang yang berjalan */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', opacity: word}}>
        {'gelombang'.split('').map((ch, i) => {
          const p = ramp(t, wordT - 0.2 + i * 0.05, wordT + 0.5 + i * 0.05);
          const bob = 14 * Math.sin(TAU * 0.8 * t - i * 0.7);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT.head,
                fontWeight: 700,
                fontSize: 132,
                letterSpacing: 2,
                display: 'inline-block',
                color: C.ink,
                opacity: p,
                translate: `0px ${(1 - p) * 40 + bob}px`,
                textShadow: `0 0 ${36 + 12 * Math.sin(t * 2 + i)}px rgba(79,214,255,0.55)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
