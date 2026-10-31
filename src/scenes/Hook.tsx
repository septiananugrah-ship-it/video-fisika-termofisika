import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, smoothPath} from '../anim';
import {Arrow, Glow, Label, Motes, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

// Pembuka: tiga peristiwa panas sehari-hari, semuanya dihitung analitik per frame.
// (A) es di telapak tangan: butir kalor (jingga) mengalir tangan → es, es menyusut & sudutnya membulat, genangan melebar;
// (B) kopi: suhu turun eksponensial T = 24 + 56·e^(−τ/2) (hukum pendinginan Newton), uap menipis bersama suhu;
// (C) mesin mobil: bensin masuk, sebagian kecil jadi gerak (hijau), sebagian besar terbuang sebagai panas (merah);
// lalu aturan "panas → dingin" (panah jingga), dan zoom ke molekul yang bergerak acak (posisi dilipat, tanpa state).
const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const fold = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (m < L ? m : 2 * L - m);
};
const lin = (x: number) => x;

/** Termometer kecil (SVG). f = 0..1 tinggi kolom. */
const Thermo: React.FC<{x: number; y0: number; y1: number; f: number; color?: string; w?: number}> = ({x, y0, y1, f, color = C.heat, w = 20}) => {
  const r = w * 0.95;
  const fy = y1 - (y1 - y0 - 6) * Math.max(0, Math.min(1, f));
  return (
    <g>
      <rect x={x - w / 2} y={y0 - w / 2} width={w} height={y1 - y0 + w / 2} rx={w / 2} fill="#0c1631" stroke="#cfe0ff" strokeOpacity={0.75} strokeWidth={2.5} />
      {Array.from({length: 6}, (_, i) => (
        <line key={i} x1={x + w / 2} y1={y0 + ((y1 - y0) * (i + 0.5)) / 6} x2={x + w / 2 + 8} y2={y0 + ((y1 - y0) * (i + 0.5)) / 6} stroke="#cfe0ff" strokeOpacity={0.5} strokeWidth={2} />
      ))}
      <circle cx={x} cy={y1 + r * 0.7} r={r * 1.9} fill={color} opacity={0.18} />
      <circle cx={x} cy={y1 + r * 0.7} r={r} fill={color} stroke="#cfe0ff" strokeOpacity={0.75} strokeWidth={2.5} />
      <rect x={x - w * 0.22} y={fy} width={w * 0.44} height={y1 - fy + r * 0.5} rx={w * 0.22} fill={color} />
      <rect x={x - w * 0.32} y={y0 - w * 0.2} width={w * 0.14} height={(y1 - y0) * 0.9} rx={w * 0.07} fill="#fff" opacity={0.25} />
    </g>
  );
};

/** Bingkai panel. */
const Frame: React.FC<{color: string; op: number}> = ({color, op}) => (
  <rect x={-345} y={-235} width={690} height={470} rx={26} fill="rgba(14,22,50,0.55)" stroke={color} strokeOpacity={0.25 + 0.45 * op} strokeWidth={3} />
);

// ---------- (A) tangan & es ----------
const HAND =
  'M-345,84 C-270,74 -205,64 -150,61 C-100,58 -50,56 0,56 L150,56 C192,56 228,48 252,28 C266,16 284,22 280,40 C274,70 240,98 190,110 C120,128 40,138 -40,140 C-120,142 -210,152 -345,166 Z';
const THUMB = 'M-190,62 C-196,26 -176,-6 -146,-18 C-128,-24 -118,-12 -124,4 C-132,26 -140,44 -132,60 Z';

const HandIce: React.FC<{t: number; m: number; flow: number; cold: number}> = ({t, m, flow, cold}) => {
  const s = 150 * (1 - 0.5 * m);
  const rx = 10 + 34 * m;
  const wob = 1.5 * Math.sin(t * 1.1);
  const iceX = -s / 2;
  const iceY = 56 - s;
  return (
    <g>
      <defs>
        <linearGradient id="hk-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3bf9c" />
          <stop offset="100%" stopColor="#b36c4b" />
        </linearGradient>
        <linearGradient id="hk-ice" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2fbff" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#7fc8f0" stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <ellipse cx={-30} cy={196} rx={300} ry={18} fill="#000" opacity={0.25} />
      <path d={HAND} fill="url(#hk-skin)" stroke="#7a4630" strokeWidth={3} />
      {/* garis jari */}
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${150 + k * 30},${60 + k * 2} q8,22 -4,${44 - k * 6}`} fill="none" stroke="#8a5038" strokeOpacity={0.45} strokeWidth={2.5} />
      ))}
      <path d={THUMB} fill="url(#hk-skin)" stroke="#7a4630" strokeWidth={3} />
      {/* telapak mendingin di bawah es */}
      <ellipse cx={0} cy={80} rx={120 + 30 * m} ry={34} fill={C.pot} opacity={0.4 * cold} />
      {/* genangan */}
      <ellipse cx={0} cy={58} rx={40 + 150 * m} ry={7 + 6 * m} fill="#8fd3f5" opacity={0.55 * Math.min(1, m * 3)} />
      {/* es */}
      <g transform={`rotate(${wob} 0 56)`}>
        <rect x={iceX} y={iceY} width={s} height={s} rx={rx} fill="url(#hk-ice)" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={3} />
        <path d={`M${iceX + 18},${iceY + 22} L${iceX + s * 0.55},${iceY + 14}`} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <path d={`M${iceX + 16},${iceY + 36} L${iceX + 20},${iceY + s * 0.6}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
        {/* tetes menuruni sisi es */}
        {[0, 1, 2].map((k) => {
          const ph = fr(t * 0.45 + k / 3);
          const side = k === 1 ? -1 : 1;
          return <ellipse key={k} cx={side * (s / 2 - 2)} cy={iceY + 16 + ph * (s - 18)} rx={5} ry={7} fill="#dff4ff" opacity={cyc(ph) * Math.min(1, m * 4)} />;
        })}
      </g>
      {/* kalor: tangan → es */}
      {[-60, 0, 60].map((x0, k) => (
        <Stream key={k} pts={[[x0 * 1.6, 132], [x0 * 0.9, 70], [x0 * 0.4, 56 - s * 0.45]]} color="kin" n={5} speed={0.5} r={6} seed={k * 2.3} jitter={3} opacity={flow} />
      ))}
      <Label x={190} y={-30} size={30} color={C.kin} weight={600} anchor="start" opacity={flow}>
        kalor
      </Label>
      <Arrow x1={150} y1={-8} x2={96} y2={-8} color="kin" width={4} opacity={flow} pulse={false} />
    </g>
  );
};

// ---------- (B) kopi ----------
const Coffee: React.FC<{t: number; T: number; tag: number}> = ({t, T, tag}) => {
  const hot = Math.max(0, Math.min(1, (T - 24) / 56));
  return (
    <g>
      <defs>
        <linearGradient id="hk-cup" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9d2e6" />
          <stop offset="45%" stopColor="#f4f7ff" />
          <stop offset="100%" stopColor="#9aa6c4" />
        </linearGradient>
      </defs>
      <Glow x={-40} y={-20} r={260} color="kin" opacity={0.55 * hot} still />
      <rect x={-330} y={150} width={660} height={16} rx={6} fill="#5b3e2a" />
      <rect x={-330} y={150} width={660} height={4} fill="#8a6446" />
      <ellipse cx={-40} cy={150} rx={150} ry={18} fill="#dfe5f3" stroke="#8a95b5" strokeWidth={2} />
      <path d="M48,4 C112,0 118,92 40,96" fill="none" stroke="url(#hk-cup)" strokeWidth={16} strokeLinecap="round" />
      <path d="M-132,-26 L52,-26 L28,138 Q-40,150 -108,138 Z" fill="url(#hk-cup)" stroke="#8a95b5" strokeWidth={2.5} />
      <ellipse cx={-40} cy={-24} rx={92} ry={15} fill="#5a3418" stroke="#c9d2e6" strokeWidth={3} />
      <ellipse cx={-52} cy={-27} rx={48} ry={6} fill="#a8703f" opacity={0.6 + 0.15 * Math.sin(t * 1.4)} />
      {/* uap: puff bergulir ke atas, menipis bersama suhu */}
      {[0, 1, 2].map((k) => {
        const pts: [number, number][] = Array.from({length: 14}, (_, j) => {
          const y = -40 - j * 14;
          return [-80 + k * 40 + (10 + j * 1.6) * Math.sin(y * 0.045 + t * 1.8 + k * 2), y];
        });
        return (
          <path
            key={k}
            d={smoothPath(pts)}
            fill="none"
            stroke="#e8f0ff"
            strokeWidth={9 - k}
            strokeLinecap="round"
            strokeDasharray="38 46"
            strokeDashoffset={t * 55 + k * 30}
            opacity={(0.15 + 0.55 * hot) * (0.75 + 0.25 * Math.sin(t * 2 + k))}
          />
        );
      })}
      {/* kalor: kopi → udara */}
      <Stream pts={[[-130, 40], [-210, 10], [-290, -40]]} color="kin" n={5} speed={0.45} r={5.5} opacity={0.2 + 0.8 * hot} seed={1} />
      <Stream pts={[[50, 60], [120, 40], [150, -10]]} color="kin" n={4} speed={0.45} r={5.5} opacity={0.2 + 0.8 * hot} seed={3} />
      <Thermo x={230} y0={-160} y1={100} f={(T - 10) / 80} color={interpolateColors(hot, [0, 1], [C.pot, C.heat])} />
      <Label x={230} y={-205} size={34} color={C.ink} weight={600} font="mono" opacity={tag}>
        {`${Math.round(T)} °C`}
      </Label>
    </g>
  );
};

// ---------- (C) mesin ----------
const HEAT_PATHS: [number, number][][] = [-110, -40, 30].map((x0, k) =>
  Array.from({length: 12}, (_, j) => [x0 + 12 * Math.sin(j * 0.9 + k), -84 - j * 12] as [number, number]),
);
const Engine: React.FC<{t: number; fuel: number; waste: number; bar: number}> = ({t, fuel, waste, bar}) => {
  const wheelA = t * 260;
  return (
    <g>
      <Glow x={-40} y={-60} r={280} color="heat" opacity={0.25 + 0.45 * waste} />
      {/* bensin */}
      <rect x={-320} y={10} width={86} height={110} rx={12} fill="#7a2a2a" stroke="#e46a5a" strokeWidth={3} />
      <rect x={-300} y={-6} width={30} height={20} rx={4} fill="#e46a5a" />
      <text x={-277} y={78} textAnchor="middle" fontFamily={FONT.head} fontSize={24} fontWeight={700} fill="#ffd8cf">
        BBM
      </text>
      <path d="M-234,60 L-176,60" stroke="#566190" strokeWidth={10} strokeLinecap="round" />
      <Stream pts={[[-236, 60], [-172, 60]]} color="gold" n={4} speed={0.9} r={5} jitter={1} opacity={fuel} />
      {/* blok mesin */}
      <rect x={-176} y={-70} width={270} height={180} rx={18} fill="#2c3a66" stroke="#7d8bbd" strokeWidth={3} />
      {[0, 1, 2].map((k) => {
        const cx = -126 + k * 82;
        const py = -46 + 26 * (0.5 + 0.5 * Math.sin(t * 9 + (k * TAU) / 3));
        const fire = Math.max(0, Math.sin(t * 9 + (k * TAU) / 3 + Math.PI / 2));
        return (
          <g key={k}>
            <rect x={cx - 26} y={-62} width={52} height={110} rx={6} fill="#141d3c" />
            <circle cx={cx} cy={-50} r={22} fill={C.kin} opacity={0.6 * fire ** 4 * fuel} />
            <rect x={cx - 24} y={py} width={48} height={26} rx={5} fill="#a9b4d6" />
            <line x1={cx} y1={py + 26} x2={cx + 10 * Math.cos(t * 9 + (k * TAU) / 3)} y2={88} stroke="#a9b4d6" strokeWidth={6} />
          </g>
        );
      })}
      <rect x={-176} y={80} width={270} height={30} rx={8} fill="#1d2850" />
      {/* poros → roda */}
      <line x1={94} y1={86} x2={196} y2={86} stroke="#a9b4d6" strokeWidth={10} />
      <g transform={`translate(240 86) rotate(${wheelA})`}>
        <circle r={62} fill="#1a1f30" stroke="#5a6488" strokeWidth={10} />
        <circle r={26} fill="#9aa6c8" />
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={0} y1={0} x2={50 * Math.cos((k * TAU) / 5)} y2={50 * Math.sin((k * TAU) / 5)} stroke="#9aa6c8" strokeWidth={5} />
        ))}
      </g>
      <Arrow x1={110} y1={30} x2={200} y2={30} color="work" width={5} opacity={fuel} pulse={false} />
      <Label x={155} y={-2} size={24} color={C.work} weight={600} opacity={fuel}>
        gerak
      </Label>
      {/* panas terbuang */}
      {HEAT_PATHS.map((pts, k) => (
        <g key={k} opacity={0.3 + 0.7 * waste}>
          <path d={smoothPath(pts)} fill="none" stroke={C.heat} strokeOpacity={0.25} strokeWidth={22} strokeLinecap="round" />
          <path d={smoothPath(pts)} fill="none" stroke={C.heat} strokeWidth={8} strokeLinecap="round" markerEnd="url(#arrow-heat)" />
          <Stream pts={pts} color="kin" n={4} speed={0.7} r={5} jitter={2} seed={k * 1.7} />
        </g>
      ))}
      <Label x={-40} y={-222} size={28} color={C.heat} weight={600} opacity={waste}>
        panas terbuang
      </Label>
      {/* pembagian energi */}
      <g opacity={bar}>
        <rect x={-300} y={168} width={600 * bar} height={26} rx={8} fill={C.heat} opacity={0.85} />
        <rect x={-300 + 600 * 0.7 * bar} y={168} width={600 * 0.3 * bar} height={26} rx={0} fill={C.work} />
        <text x={-290} y={188} fontFamily={FONT.mono} fontSize={19} fill="#1a0b10" fontWeight={600}>
          panas
        </text>
        <text x={290} y={188} textAnchor="end" fontFamily={FONT.mono} fontSize={19} fill="#0b1a12" fontWeight={600} opacity={bar}>
          gerak
        </text>
      </g>
    </g>
  );
};

// ---------- aturan + kisi ----------
const Block: React.FC<{x: number; y: number; t: number; hot: boolean}> = ({x, y, t, hot}) => {
  const col = hot ? C.heat : C.pot;
  const amp = hot ? 7 : 1.6;
  const sp = hot ? 6 : 2;
  return (
    <g>
      <Glow x={x} y={y} r={190} color={hot ? 'heat' : 'pot'} opacity={0.6} />
      <rect x={x - 110} y={y - 75} width={220} height={150} rx={18} fill={hot ? '#5a1824' : '#132d5c'} stroke={col} strokeWidth={4} />
      {Array.from({length: 15}, (_, i) => {
        const cx = x - 80 + (i % 5) * 40;
        const cy = y - 40 + Math.floor(i / 5) * 40;
        const dx = amp * (Math.sin(t * sp * 1.3 + i * 2.1) + 0.5 * Math.sin(t * sp * 2.7 + i));
        const dy = amp * (Math.sin(t * sp * 1.1 + i * 3.7) + 0.5 * Math.cos(t * sp * 2.3 + i * 1.3));
        return <circle key={i} cx={cx + dx} cy={cy + dy} r={10} fill={hot ? '#ff8a8f' : '#8cc6ff'} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />;
      })}
    </g>
  );
};

// molekul air di lensa
const LX = 960;
const LY = 500;
const LR = 290;
const WATERS = Array.from({length: 18}, (_, i) => {
  const s = 120 + 150 * Math.sqrt(rand(i * 3.3 + 1));
  const a = rand(i * 5.1 + 2) * TAU;
  return {x0: LX - LR + rand(i * 1.7) * 2 * LR, y0: LY - LR + rand(i * 2.9 + 4) * 2 * LR, vx: s * Math.cos(a), vy: s * Math.sin(a), r0: rand(i) * TAU, w: (rand(i * 7.1) - 0.5) * 6};
});

const SLOTS = [360, 960, 1560];
const SLOT_Y = 320;
const SLOT_S = 0.5;
const HOTX = 560;
const COLDX = 1360;
const RY = 735;

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const c = [0, 1, 2, 3, 4, 5].map(cue);

  const pos = (appear: number, move: number, ax: number, ay: number, as: number, k: number) => {
    const m = ramp(t, move, move + 1.0, EASE_IN_OUT);
    return {x: mix(ax, SLOTS[k], m), y: mix(ay, SLOT_Y, m), s: mix(as, SLOT_S, m), op: ramp(t, appear - 0.4, appear + 0.5), m};
  };
  const pA = pos(c[0] - 0.9, c[1] - 0.6, 960, 520, 1.05, 0);
  const pB = pos(c[1] - 0.3, c[2] - 0.6, 960, 665, 0.84, 1);
  const pC = pos(c[2] - 0.3, c[3] - 0.4, 960, 665, 0.84, 2);

  // es
  const melt = 0.6 * ramp(t, c[0] + 0.4, c[0] + 5.4, lin) + 0.25 * ramp(t, c[0] + 5.4, c[4], lin);
  const flowA = ramp(t, c[0] + 0.5, c[0] + 1.4);
  const cold = ramp(t, wordOf(0, 'dingin') - 0.4, wordOf(0, 'dingin') + 0.6);
  // kopi
  const b0 = c[1] + 0.3;
  const T = 24 + 56 * Math.exp(-Math.max(0, t - b0) / 2.0);
  // mesin
  const fuel = ramp(t, wordOf(2, 'bensin') - 0.5, wordOf(2, 'bensin') + 0.3);
  const waste = ramp(t, wordOf(2, 'terbuang') - 0.4, wordOf(2, 'terbuang') + 0.6);
  const bar = ramp(t, wordOf(2, 'panas') - 0.3, wordOf(2, 'panas') + 1.0);

  // aturan
  const tags = ramp(t, c[3] - 0.1, c[3] + 0.7);
  const conv = ramp(t, wordOf(3, 'satu') - 0.3, wordOf(3, 'aturan') + 0.6, EASE_IN_OUT);
  const rule = ramp(t, c[4] - 0.6, c[4] + 0.3);
  const grow = ramp(t, wordOf(4, 'dari') - 0.3, wordOf(4, 'dingin') + 0.2, EASE_IN_OUT);
  const hiHot = ramp(t, wordOf(4, 'panas', 1) - 0.3, wordOf(4, 'panas', 1) + 0.3);
  const hiCold = ramp(t, wordOf(4, 'dingin') - 0.3, wordOf(4, 'dingin') + 0.3);
  // zoom
  const zp = ramp(t, c[5] - 0.3, c[5] + 1.3, EASE_IN_OUT);
  const zs = 1 + 5 * zp;
  const zx = mix(HOTX, LX, zp);
  const zy = mix(RY, LY, zp);
  const world = 1 - ramp(t, c[5] + 0.3, c[5] + 1.2, EASE_IN_OUT);
  const lens = ramp(t, c[5] + 0.5, c[5] + 1.4);
  const acak = ramp(t, wordOf(5, 'acak') - 0.4, wordOf(5, 'acak') + 0.4);
  const tf = ramp(t, wordOf(5, 'termofisika') - 0.4, wordOf(5, 'termofisika') + 0.4);
  const km = ramp(t, wordOf(5, 'kimia') - 0.4, wordOf(5, 'kimia') + 0.4);
  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  const ms = t - c[5];
  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={34} color="kin" opacity={0.3} seed={2} />
        <g transform={`translate(${zx} ${zy}) scale(${zs}) translate(${-HOTX} ${-RY})`} opacity={world}>
          {/* panel A */}
          <g opacity={pA.op} transform={`translate(${pA.x} ${pA.y}) scale(${pA.s})`}>
            <Frame color={C.pot} op={pA.m} />
            <HandIce t={t} m={melt} flow={flowA} cold={cold} />
          </g>
          {/* panel B */}
          <g opacity={pB.op} transform={`translate(${pB.x} ${pB.y}) scale(${pB.s})`}>
            <Frame color={C.kin} op={pB.m} />
            <Coffee t={t} T={T} tag={ramp(t, c[1] - 0.1, c[1] + 0.5)} />
          </g>
          {/* panel C */}
          <g opacity={pC.op} transform={`translate(${pC.x} ${pC.y}) scale(${pC.s})`}>
            <Frame color={C.heat} op={pC.m} />
            <Engine t={t} fuel={fuel} waste={waste} bar={bar} />
          </g>
          {['es mencair', 'kopi mendingin', 'mesin membuang panas'].map((s, k) => (
            <Label key={s} x={SLOTS[k]} y={SLOT_Y + 150} size={30} color={[C.pot, C.kin, C.heat][k]} weight={600} opacity={tags}>
              {s}
            </Label>
          ))}
          {/* tiga peristiwa → satu aturan */}
          {SLOTS.map((x, k) => (
            <path key={k} d={`M${x},${SLOT_Y + 178} C${x},${SLOT_Y + 240} 960,${SLOT_Y + 200} 960,${SLOT_Y + 262}`} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - conv)} pathLength={1000} opacity={0.75 * (1 - rule)} />
          ))}
          <circle cx={960} cy={SLOT_Y + 262} r={9 + 2 * Math.sin(t * 4)} fill={C.gold} opacity={conv * (1 - rule)} />
          <Ripple x={960} y={SLOT_Y + 262} p={ramp(t, wordOf(3, 'aturan') - 0.1, wordOf(3, 'aturan') + 1.4, lin)} r={140} color="gold" />

          <g opacity={rule}>
            <Block x={HOTX} y={RY} t={t} hot />
            <Block x={COLDX} y={RY} t={t} hot={false} />
            {[0, 1, 2].map((k) => {
              const ph = fr(t * 0.8 + k / 3);
              return <path key={k} d={`M${HOTX + (k - 1) * 145},${RY - 70 - ph * 50} q10,-12 0,-24 q-10,-12 0,-24`} fill="none" stroke={C.heat} strokeWidth={3} opacity={cyc(ph) * 0.7} />;
            })}
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M${COLDX - 90 + k * 60},${RY - 75} l6,10 l6,-10`} fill="none" stroke="#dff1ff" strokeWidth={2.5} opacity={0.5 + 0.3 * Math.sin(t * 2 + k)} />
            ))}
            <Label x={HOTX} y={RY - 140} size={44} color={C.heat} weight={700} opacity={0.45 + 0.55 * hiHot}>
              panas
            </Label>
            <Label x={COLDX} y={RY - 140} size={44} color={C.pot} weight={700} opacity={0.45 + 0.55 * hiCold}>
              dingin
            </Label>
            <Arrow x1={HOTX + 130} y1={RY} x2={mix(HOTX + 140, COLDX - 140, grow)} y2={RY} color="kin" width={14} opacity={Math.min(1, grow * 5)} pulse={false} />
            <Stream pts={[[HOTX + 120, RY], [mix(HOTX + 130, COLDX - 150, grow), RY]]} color="kin" n={7} speed={0.7} r={8} jitter={4} opacity={grow} />
            <Label x={960} y={RY - 52} size={32} color={C.kin} weight={600} opacity={grow}>
              kalor
            </Label>
            <Ripple x={COLDX} y={RY} p={ramp(t, wordOf(4, 'dingin') + 0.1, wordOf(4, 'dingin') + 1.6, lin)} r={200} color="kin" />
          </g>
        </g>

        {/* lensa molekul */}
        <g opacity={lens}>
          <defs>
            <clipPath id="hk-lens">
              <circle cx={LX} cy={LY} r={LR} />
            </clipPath>
          </defs>
          <Glow x={LX} y={LY} r={460} color="kin" opacity={0.45} />
          <circle cx={LX} cy={LY} r={LR} fill="#0b1430" />
          <g clipPath="url(#hk-lens)">
            {WATERS.map((w, i) => {
              const x = fold(w.x0 + w.vx * ms, LX - LR - 20, LX + LR + 20);
              const y = fold(w.y0 + w.vy * ms, LY - LR - 20, LY + LR + 20);
              const a = w.r0 + w.w * ms;
              const hx = (b: number) => x + 26 * Math.cos(a + b);
              const hy = (b: number) => y + 26 * Math.sin(a + b);
              const tr = [1, 2, 3].map((k) => [x - w.vx * 0.03 * k, y - w.vy * 0.03 * k] as [number, number]);
              return (
                <g key={i}>
                  {tr.map(([px, py], k) => (
                    <circle key={k} cx={px} cy={py} r={14 - 3 * k} fill={C.kin} opacity={0.18 - 0.05 * k} />
                  ))}
                  <circle cx={hx(0.91)} cy={hy(0.91)} r={10} fill={ATOM.H.fill} />
                  <circle cx={hx(-0.91)} cy={hy(-0.91)} r={10} fill={ATOM.H.fill} />
                  <circle cx={x} cy={y} r={17} fill={ATOM.O.fill} stroke="#ffd0d6" strokeWidth={1.5} />
                </g>
              );
            })}
          </g>
          <circle cx={LX} cy={LY} r={LR} fill="none" stroke={C.kin} strokeOpacity={0.3} strokeWidth={14} />
          <circle cx={LX} cy={LY} r={LR} fill="none" stroke="#ffd9b8" strokeWidth={3} />
          <Label x={LX} y={LY + LR + 52} size={28} color={C.muted} font="mono" opacity={acak}>
            triliunan molekul · bergerak acak
          </Label>
          <Glow x={360} y={LY} r={190} color="kin" opacity={0.5 * tf} />
          <Label x={360} y={LY} size={50} color={C.kin} weight={700} opacity={tf}>
            termofisika
          </Label>
          <Glow x={1560} y={LY} r={170} color="cyan" opacity={0.5 * km} />
          <Label x={1560} y={LY} size={50} color={C.cyan} weight={700} opacity={km}>
            kimia
          </Label>
          <Stream pts={[[480, LY], [LX - LR - 10, LY]]} color="kin" n={4} speed={0.5} r={5} jitter={2} opacity={tf} />
          <Stream pts={[[LX + LR + 10, LY], [1460, LY]]} color="cyan" n={4} speed={0.5} r={5} jitter={2} opacity={km} />
          <Twinkles x={LX} y={LY} rx={LR} ry={LR} n={6} color="kin" opacity={0.6 * km} seed={3} />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};
