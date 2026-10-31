import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Formula, Glow, Label, Motes, Ripple, Stage, Stream, Sub, TSub, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kulkas (potongan samping, pintu di kiri): cairan pendingin beredar dalam loop tertutup —
// evaporator di dalam (menguap, menyerap kalor laten, biru) → kompresor (usaha listrik W, hijau) → kondensor di belakang
// (melepas kalor, merah–jingga) → katup ekspansi → kembali. Diagram pompa kalor: lebar panah ∝ energi,
// Q_buang = Q_ambil + W (2 + 1 = 3 satuan, COP = 2, dalam rentang 2–4). Meter entropi total terus naik:
// ΔS = Q_buang/T_p − Q_ambil/T_d = 3/298 − 2/277 > 0.

// ---------- loop pendingin ----------
const COND: [number, number][] = [];
for (let j = 0; j <= 12; j++) {
  const y = 740 - j * 40;
  if (j % 2 === 0) COND.push([772, y], [712, y]);
  else COND.push([712, y], [772, y]);
}
const EVAP: [number, number][] = [
  [640, 264],
  [334, 264],
  [334, 294],
  [640, 294],
  [640, 324],
  [334, 324],
  [334, 354],
  [646, 354],
];
const LOOP: [number, number][] = [
  [760, 778],
  [772, 760],
  ...COND,
  [742, 228],
  [700, 228],
  [676, 246],
  ...EVAP,
  [676, 354],
  [676, 826],
  [712, 830],
  [740, 812],
  [760, 778],
];
const segLen = (pts: [number, number][]) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
};
const L_ALL = segLen(LOOP);
const uAt = (k: number) => segLen(LOOP.slice(0, k + 1)) / L_ALL;
const U_CEND = uAt(2 + COND.length - 1);
const U_VALVE = uAt(2 + COND.length + 1);
const U_EVAP0 = uAt(2 + COND.length + 2);
const U_EEND = uAt(2 + COND.length + 2 + EVAP.length - 1);
const U_COMP = uAt(LOOP.length - 3);
const colAt = (u: number) =>
  interpolateColors(u, [0, U_CEND, U_VALVE, U_EVAP0 + 0.01, U_EEND, U_COMP, 1], [C.heat, '#ffd9c2', '#e8eeff', C.pot, C.cyan, C.cyan, C.heat]);
const pathD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

/** Panah tebal (lebar ∝ energi) dengan butir yang mengalir di dalamnya. */
const FatArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; w: number; color: string; t: number; op: number; speed?: number}> = ({x1, y1, x2, y2, w, color, t, op, speed = 0.7}) => {
  if (op <= 0.001) return null;
  const L = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const hl = w * 0.8 + 14;
  const hw = w * 0.95 + 10;
  return (
    <g opacity={op} transform={`translate(${x1},${y1}) rotate(${ang})`}>
      <path d={`M0,${-w / 2} L${L - hl},${-w / 2} L${L - hl},${-hw} L${L},0 L${L - hl},${hw} L${L - hl},${w / 2} L0,${w / 2} Z`} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {Array.from({length: 5}, (_, i) => {
        const ph = (((t * speed + i / 5) % 1) + 1) % 1;
        return <circle key={i} cx={ph * (L - 8)} cy={Math.sin(t * 3 + i * 2) * w * 0.18} r={Math.max(3, w * 0.18)} fill="#fff" opacity={cyc(ph) * 0.85} />;
      })}
    </g>
  );
};

export const Fridge: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);

  const tMel = wordOf(0, 'melanggar');
  const c1 = cue(1);
  const tUsaha = wordOf(1, 'usaha');
  const tPompa = wordOf(1, 'memompa');
  const c2 = cue(2);
  const tUap = wordOf(2, 'menguap');
  const tKomp = wordOf(2, 'kompresor');
  const tKisi = wordOf(2, 'kisi');
  const c3 = cue(3);
  const tBuang = wordOf(3, 'dibuang');
  const tEnt = wordOf(3, 'entropi');

  const boxes = ramp(t, cue(0) - 0.2, cue(0) + 0.8);
  const paradox = ramp(t, tMel - 0.3, tMel + 0.5) * (1 - ramp(t, c1 + 0.6, c1 + 1.4, EASE_IN_OUT));
  const pump = ramp(t, tUsaha - 0.4, tUsaha + 0.6);
  const wOn = ramp(t, tUsaha - 0.2, tUsaha + 0.6);
  const qOn = ramp(t, tPompa - 0.3, tPompa + 0.6);
  const evL = ramp(t, tUap - 0.3, tUap + 0.4);
  const kmL = ramp(t, tKomp - 0.3, tKomp + 0.4);
  const kdL = ramp(t, tKisi - 0.3, tKisi + 0.4);
  const valL = ramp(t, tKomp + 0.4, tKomp + 1.0) * (1 - ramp(t, c3 - 0.2, c3 + 0.4, EASE_IN_OUT));
  const loopHi = ramp(t, c2 - 0.3, c2 + 0.6);
  const sizeL = ramp(t, tBuang - 0.3, tBuang + 0.5);
  const formula = ramp(t, c3 + 0.3, c3 + 1.1);
  const meter = ramp(t, c3 + 0.6, c3 + 1.4);
  const entHi = ramp(t, tEnt - 0.3, tEnt + 0.4);
  const cam = 1 + 0.04 * ramp(t, c2 - 0.2, c2 + 1.2, EASE_IN_OUT) * (1 - ramp(t, c3 - 0.2, c3 + 1.0, EASE_IN_OUT));

  // tingkat entropi total: selalu naik (laju tetap), sedikit lebih cepat setelah disorot
  const sLev = 0.22 + 0.016 * Math.max(0, t - c3) + 0.05 * entHi;
  const comp = 1.2 * Math.sin(t * 38) * pump; // getar kompresor

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <defs>
          <linearGradient id="fr-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3c4c84" />
            <stop offset="100%" stopColor="#1c2650" />
          </linearGradient>
          <linearGradient id="fr-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#123462" />
            <stop offset="100%" stopColor="#0b1a3c" />
          </linearGradient>
        </defs>
        <Motes x={560} y={540} rx={420} ry={320} n={24} color="pot" opacity={0.35 * intro} seed={21} />
        <g opacity={intro} transform={`translate(560,560) scale(${cam}) translate(-560,-560)`}>
          <line x1={200} y1={850} x2={980} y2={850} stroke={C.line} strokeWidth={3} />
          <ellipse cx={540} cy={852} rx={300} ry={12} fill="#000" opacity={0.35} />
          {/* udara ruangan yang menghangat di belakang kulkas */}
          {Array.from({length: 6}, (_, i) => {
            const ph = (((t * 0.22 + i / 6) % 1) + 1) % 1;
            const x0 = 800 + i * 22;
            const pts: string[] = [];
            for (let k = 0; k <= 14; k++) {
              const y = 760 - k * 34 - ph * 60;
              pts.push(`${(x0 + 8 * Math.sin(k * 0.9 + t * 2 + i)).toFixed(1)},${y.toFixed(1)}`);
            }
            return <polyline key={i} points={pts.join(' ')} fill="none" stroke={C.heat} strokeWidth={2} opacity={0.18 * cyc(ph) * (0.4 + 0.6 * kdL)} />;
          })}
          {/* kabinet */}
          <rect x={280} y={210} width={410} height={636} rx={20} fill="url(#fr-body)" stroke="#6a7bb8" strokeWidth={2} />
          <rect x={308} y={238} width={354} height={580} rx={8} fill="url(#fr-in)" />
          <Glow x={485} y={520} r={260} color="pot" opacity={0.45} />
          <rect x={308} y={384} width={354} height={12} fill="#3c4c84" />
          {[560, 700].map((y) => (
            <line key={y} x1={312} y1={y} x2={658} y2={y} stroke="#8fb4ff" strokeOpacity={0.45} strokeWidth={4} />
          ))}
          <rect x={266} y={430} width={10} height={110} rx={5} fill="#9fb0e6" />
          {/* makanan */}
          <g>
            <rect x={340} y={480} width={46} height={80} rx={6} fill="#e8eeff" opacity={0.85} />
            <path d="M340,480 L363,462 L386,480 Z" fill="#cdd8f5" />
            <circle cx={440} cy={538} r={21} fill="#d24a5a" />
            <path d="M440,517 q5,-10 12,-12" stroke="#5ec27a" strokeWidth={3} fill="none" />
            <rect x={540} y={604} width={30} height={96} rx={10} fill="#4fb08a" opacity={0.85} />
            <rect x={548} y={590} width={14} height={16} rx={3} fill="#8fd6b8" />
            <rect x={380} y={652} width={110} height={48} rx={8} fill="#c89a5a" opacity={0.8} />
          </g>
          {/* embun beku di freezer */}
          {Array.from({length: 10}, (_, i) => (
            <circle key={i} cx={320 + rand(i * 2.1) * 330} cy={244 + rand(i * 5.3) * 136} r={1.5 + rand(i) * 2} fill="#dff0ff" opacity={0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + i))} />
          ))}

          {/* pipa loop */}
          <path d={pathD(LOOP)} fill="none" stroke="#2a355f" strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathD(COND)} fill="none" stroke={C.heat} strokeOpacity={0.25 + 0.25 * loopHi} strokeWidth={16} strokeLinejoin="round" />
          <path d={pathD(EVAP)} fill="none" stroke={C.pot} strokeOpacity={0.25 + 0.25 * loopHi} strokeWidth={16} strokeLinejoin="round" />
          <path d={pathD(LOOP)} fill="none" stroke="#6c7cb4" strokeWidth={3} strokeLinejoin="round" opacity={0.6} />
          {/* katup ekspansi */}
          <path d="M712,218 L728,238 L712,238 L728,218 Z" fill="#9fb0e6" stroke="#dfe6ff" strokeWidth={1.5} />
          {/* butir cairan pendingin yang beredar */}
          {Array.from({length: 44}, (_, i) => {
            const u = (((t * 0.055 + i / 44) % 1) + 1) % 1;
            const [x, y] = pointAlong(LOOP, u);
            const col = colAt(u);
            const liquid = u > U_CEND - 0.05 && u < U_EVAP0 + 0.02;
            return <circle key={i} cx={x} cy={y} r={liquid ? 4 : 5.5} fill={col} opacity={0.65 + 0.35 * loopHi} />;
          })}
          {/* kompresor */}
          <g transform={`translate(${comp},0)`}>
            <rect x={708} y={812} width={92} height={30} rx={6} fill="#26305a" stroke="#6a7bb8" strokeWidth={2} />
            <ellipse cx={754} cy={808} rx={44} ry={34} fill="#36447a" stroke="#8b9ad0" strokeWidth={2} />
            <ellipse cx={742} cy={796} rx={14} ry={8} fill="#9fb0e6" opacity={0.3} />
          </g>
          <Glow x={754} y={808} r={90} color="work" opacity={0.5 * wOn * (0.7 + 0.3 * Math.sin(t * 6))} still />
          {/* steker & kabel: usaha listrik W */}
          <rect x={890} y={760} width={46} height={66} rx={8} fill="#26305a" stroke="#6a7bb8" strokeWidth={2} />
          <circle cx={905} cy={784} r={4} fill="#0a0f22" />
          <circle cx={921} cy={784} r={4} fill="#0a0f22" />
          <path d="M890,800 C860,800 860,830 800,828" fill="none" stroke="#5a6aa0" strokeWidth={5} />
          <Stream
            pts={[
              [888, 800],
              [862, 812],
              [830, 826],
              [802, 828],
            ]}
            color="work"
            n={5}
            speed={0.9}
            r={5}
            jitter={2}
            opacity={wOn}
          />
          {/* kalor yang diambil dari makanan → evaporator */}
          <Stream
            pts={[
              [440, 520],
              [450, 440],
              [470, 370],
            ]}
            color="kin"
            n={6}
            speed={0.45}
            r={5}
            opacity={qOn}
          />
          <Stream
            pts={[
              [555, 600],
              [560, 470],
              [575, 370],
            ]}
            color="kin"
            n={6}
            speed={0.45}
            r={5}
            opacity={qOn}
            seed={3}
          />
          {/* kalor yang dilepas kondensor ke ruangan (lebih besar) */}
          {[320, 450, 580, 710].map((y, k) => (
            <Stream
              key={y}
              pts={[
                [784, y],
                [850, y - 18],
                [930, y - 40],
              ]}
              color="kin"
              n={5}
              speed={0.5}
              r={5.5}
              opacity={qOn}
              seed={k + 5}
            />
          ))}
          {/* label */}
          <Label x={470} y={186} size={21} color={C.pot} opacity={evL}>
            menguap · menyerap kalor laten
          </Label>
          <Label x={700} y={186} size={21} anchor="start" color={C.muted} opacity={valL}>
            katup ekspansi
          </Label>
          <Label x={808} y={260} size={21} anchor="start" color={C.kin} opacity={kdL}>
            kisi-kisi belakang
          </Label>
          <Label x={808} y={288} size={19} anchor="start" color={C.muted} opacity={kdL}>
            melepas kalor
          </Label>
          <Label x={754} y={872} size={20} color={C.work} opacity={kmL}>
            kompresor
          </Label>
          <Label x={485} y={790} size={22} color={C.pot} opacity={boxes * (1 - evL)}>
            dalam ≈ 4 °C
          </Label>
          <Ripple x={485} y={310} p={(t - tUap) / 1.2} r={200} color="pot" rings={2} width={2} />
          <Ripple x={754} y={808} p={(t - tKomp) / 1.1} r={140} color="work" rings={2} width={2} />
          <Ripple x={742} y={500} p={(t - tKisi) / 1.2} r={220} color="kin" rings={2} width={2} />
        </g>

        {/* --------- diagram pompa kalor --------- */}
        <g transform="translate(1260,474) scale(1.1) translate(-1260,-474)">
        <g opacity={boxes}>
          <rect x={1060} y={214} width={400} height={86} rx={16} fill={C.heat} fillOpacity={0.12} stroke={C.heat} strokeWidth={2.5} />
          <Label x={1260} y={244} size={26} weight={600} color={C.ink}>
            ruangan (panas)
          </Label>
          <Label x={1260} y={278} size={22} font="mono" color={C.heat}>
            T<TSub>p</TSub> ≈ 25 °C
          </Label>
          <rect x={1060} y={646} width={400} height={86} rx={16} fill={C.pot} fillOpacity={0.12} stroke={C.pot} strokeWidth={2.5} />
          <Label x={1260} y={676} size={26} weight={600} color={C.ink}>
            dalam kulkas (dingin)
          </Label>
          <Label x={1260} y={710} size={22} font="mono" color={C.pot}>
            T<TSub>d</TSub> ≈ 4 °C
          </Label>
          {/* kilau udara hangat & kristal dingin di kotak */}
          {Array.from({length: 5}, (_, i) => {
            const ph = (((t * 0.4 + i / 5) % 1) + 1) % 1;
            return <circle key={i} cx={1090 + i * 85} cy={296 - ph * 70} r={3} fill={C.heat} opacity={cyc(ph) * 0.5} />;
          })}
        </g>
        {/* paradoks: kalor dari dingin ke panas begitu saja? */}
        <g opacity={paradox}>
          <line x1={1260} y1={636} x2={1260} y2={318} stroke={C.kin} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={t * 30} markerEnd="url(#arrow-kin)" />
          <circle cx={1260} cy={474} r={44} fill="#0d1534" stroke={C.heat} strokeWidth={3} />
          <text x={1260} y={476} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={48} fontWeight={700} fill={C.heat}>
            ?!
          </text>
          <Label x={1300} y={560} size={22} anchor="start" color={C.kin}>
            dingin → panas?
          </Label>
        </g>
        {/* pompa (kulkas) */}
        <g opacity={pump}>
          <FatArrow x1={1260} y1={642} x2={1260} y2={540} w={24} color={C.kin} t={t} op={qOn} />
          <FatArrow x1={1260} y1={410} x2={1260} y2={302} w={36} color={C.kin} t={t} op={qOn} />
          <FatArrow x1={1520} y1={474} x2={1326} y2={474} w={12} color={C.work} t={t} op={wOn} speed={0.9} />
          <circle cx={1260} cy={474} r={62} fill="#101a3a" stroke={C.ink} strokeOpacity={0.7} strokeWidth={3} />
          <g transform={`rotate(${t * 140 * pump},1260,474)`}>
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d="M1260,474 C1270,450 1290,440 1300,452 C1290,460 1274,468 1260,474 Z" transform={`rotate(${k * 90},1260,474)`} fill="#7c8cc4" opacity={0.9} />
            ))}
          </g>
          <circle cx={1260} cy={474} r={8} fill={C.ink} />
          <Glow x={1260} y={474} r={120} color="work" opacity={0.35 * wOn} />
          {/* steker sumber listrik */}
          <rect x={1534} y={446} width={40} height={56} rx={8} fill="#26305a" stroke={C.work} strokeWidth={2} />
          <path d="M1556,456 L1546,476 L1556,476 L1550,494 L1566,470 L1556,470 L1562,456 Z" fill={C.work} />
          <Label x={1424} y={436} size={32} font="serif" italic color={C.work} opacity={wOn}>
            W
          </Label>
          <Label x={1232} y={592} size={30} font="serif" italic anchor="end" color={C.kin} opacity={qOn}>
            Q<TSub>ambil</TSub>
          </Label>
          <Label x={1216} y={356} size={30} font="serif" italic anchor="end" color={C.kin} opacity={qOn}>
            Q<TSub>buang</TSub>
          </Label>
          {/* ukuran energi: 2 + 1 = 3 */}
          <g opacity={sizeL}>
            <Label x={1300} y={592} size={20} anchor="start" font="mono" color={C.kin}>
              2 satuan
            </Label>
            <Label x={1310} y={356} size={20} anchor="start" font="mono" color={C.kin}>
              3 satuan
            </Label>
            <Label x={1424} y={510} size={20} font="mono" color={C.work}>
              1 satuan
            </Label>
          </g>
        </g>
        <Ripple x={1260} y={356} p={(t - tBuang) / 1.2} r={160} color="kin" rings={2} width={2} />
        </g>

        {/* --------- meter entropi total --------- */}
        <g opacity={meter}>
          <Label x={1690} y={236} size={24} weight={600} color={C.gold}>
            S total
          </Label>
          <rect x={1664} y={262} width={52} height={420} rx={26} fill="#0d1534" stroke={C.gold} strokeOpacity={0.6} strokeWidth={2.5} />
          <rect x={1670} y={262 + 414 * (1 - Math.min(0.95, sLev))} width={40} height={414 * Math.min(0.95, sLev) - 6} rx={20} fill={C.gold} fillOpacity={0.75} />
          {Array.from({length: 4}, (_, i) => {
            const ph = (((t * 0.6 + i / 4) % 1) + 1) % 1;
            const top = 262 + 414 * (1 - Math.min(0.95, sLev));
            return <circle key={i} cx={1682 + (i % 2) * 16} cy={mix(670, top + 12, ph)} r={3} fill="#fff7d6" opacity={cyc(ph) * 0.8} />;
          })}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={1716} y1={262 + 420 * f} x2={1730} y2={262 + 420 * f} stroke={C.muted} strokeWidth={2} />
          ))}
          <path d={`M1748,${520 - 10 * entHi} l14,22 h-28 Z`} fill={C.gold} opacity={0.5 + 0.5 * Math.sin(t * 4) ** 2} />
          <Label x={1690} y={712} size={22} font="mono" color={C.gold}>
            naik terus
          </Label>
          <Twinkles x={1690} y={300} rx={60} ry={60} n={3} color="gold" opacity={entHi} seed={4} />
        </g>
        <Ripple x={1690} y={420} p={(t - tEnt) / 1.2} r={160} color="gold" rings={2} width={2} />
      </Stage>
      <Formula x={1260} y={826} p={formula} accent={C.kin} size={56}>
        <V color={C.kin}>Q</V>
        <Sub>buang</Sub> = <V color={C.kin}>Q</V>
        <Sub>ambil</Sub> + <V color={C.work}>W</V>
      </Formula>
    </AbsoluteFill>
  );
};
