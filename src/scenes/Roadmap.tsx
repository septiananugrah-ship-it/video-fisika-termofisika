import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, smoothPath, win} from '../anim';
import {DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak (dihitung analitik):
// (1) termometer di atas nyala api: kolom naik-turun mengikuti nyala, butir kalor jingga naik;
// (2) awan molekul gas (toska, memantul di kotak) + kurva Maxwell f(v) ∝ v²·e^(−v²/a²)/a³ yang "bernapas"
//     bersama suhu: T naik → puncak bergeser ke kanan, lebih rendah & lebar (luas tetap);
// (3) termos (dinding ganda vakum, kalor dipantulkan lapisan perak) + kulkas (kalor dibuang dari kumparan belakang);
// dihubungkan oleh lintasan tempat sebutir kalor merambat.
const PARTS = [
  {n: '1', title: 'Konsep', color: C.kin, hue: 'kin' as Hue, items: ['Suhu', 'Kalor', 'Perubahan wujud', 'Perpindahan kalor', 'Hukum termodinamika']},
  {n: '2', title: 'Termofisika di dunia kimia', color: C.cyan, hue: 'cyan' as Hue, items: ['Teori kinetik gas', 'Sebaran kecepatan molekul', 'Faktor Boltzmann', 'Entropi mikroskopis']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['Termos', 'Kulkas', 'Kalorimeter bom']},
];
const KEYS = [
  ['suhu', 'kalor', 'wujud', 'perpindahan', 'hukum'],
  ['kinetik', 'sebaran', 'boltzmann', 'entropi'],
  ['termos', 'kulkas', 'kalorimeter'],
];
const CX = [380, 960, 1540];
const TOP = 196;
const CW = 500;
const CH = 600;
const PY = TOP + CH + 40;
const ICON_Y = TOP + 205;

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 9 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const pl = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const fold = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (m < L ? m : 2 * L - m);
};
const GAS = Array.from({length: 14}, (_, i) => {
  const s = 40 + 70 * Math.sqrt(rand(i * 3.1 + 1));
  const a = rand(i * 7.7 + 2) * TAU;
  return {x0: rand(i * 1.3 + 5), y0: rand(i * 2.9 + 8), vx: s * Math.cos(a), vy: s * Math.sin(a)};
});

/** Nyala api (path berkedip). */
const flame = (x: number, y: number, h: number, w: number, t: number, k = 0) => {
  const f1 = Math.sin(t * 9 + k) * 0.08 + Math.sin(t * 13.7 + k * 2) * 0.05;
  const tip = h * (1 + f1);
  const sway = w * 0.25 * Math.sin(t * 5.3 + k);
  return `M${x - w / 2},${y} C${x - w / 2},${y - tip * 0.45} ${x - w * 0.1 + sway},${y - tip * 0.6} ${x + sway},${y - tip} C${x + w * 0.1 + sway},${y - tip * 0.6} ${x + w / 2},${y - tip * 0.45} ${x + w / 2},${y} Z`;
};

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // termometer + nyala api
    const tx = x - 40;
    const y0 = y - 100;
    const y1 = y + 36;
    const lvl = 0.55 + 0.25 * Math.sin(t * 1.1) + 0.05 * Math.sin(t * 3.3);
    const fy = y1 - (y1 - y0) * lvl;
    const fx = x + 110;
    const fyb = y + 95;
    return (
      <g>
        <Glow x={x} y={y} r={170} color="kin" opacity={0.25 + 0.3 * act} />
        {/* termometer */}
        <rect x={tx - 16} y={y0 - 16} width={32} height={y1 - y0 + 16} rx={16} fill="#0c1631" stroke="#cfe0ff" strokeOpacity={0.8} strokeWidth={3} />
        {Array.from({length: 7}, (_, k) => (
          <line key={k} x1={tx + 16} y1={y0 + k * 24} x2={tx + (k % 2 ? 26 : 34)} y2={y0 + k * 24} stroke="#cfe0ff" strokeOpacity={0.55} strokeWidth={2.5} />
        ))}
        <circle cx={tx} cy={y1 + 22} r={56} fill="url(#soft-heat)" />
        <circle cx={tx} cy={y1 + 22} r={28} fill={C.heat} stroke="#cfe0ff" strokeOpacity={0.8} strokeWidth={3} />
        <rect x={tx - 7} y={fy} width={14} height={y1 - fy + 14} rx={7} fill={C.heat} />
        <rect x={tx - 10} y={y0 - 8} width={4} height={(y1 - y0) * 0.9} rx={2} fill="#fff" opacity={0.3} />
        <text x={tx - 34} y={y0 + 6} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
          °C
        </text>
        {/* pembakar + api */}
        <rect x={fx - 46} y={fyb} width={92} height={18} rx={6} fill="#3b4a7a" stroke="#7d8bbd" strokeWidth={2} />
        <circle cx={fx} cy={fyb - 40} r={70} fill="url(#soft-kin)" opacity={0.8 + 0.2 * Math.sin(t * 7)} />
        <path d={flame(fx, fyb, 110, 64, t)} fill={C.heat} opacity={0.85} />
        <path d={flame(fx, fyb, 78, 42, t, 1.3)} fill={C.kin} />
        <path d={flame(fx, fyb, 42, 22, t, 2.1)} fill="#ffe7a8" />
        {/* butir kalor naik */}
        {[0, 1, 2, 3].map((k) => {
          const ph = fr(t * 0.55 + k / 4);
          return <circle key={k} cx={fx + 22 * Math.sin(t * 2 + k * 1.7)} cy={fyb - 110 - ph * 120} r={5} fill={C.kin} opacity={cyc(ph)} />;
        })}
      </g>
    );
  }
  if (i === 1) {
    // awan molekul (kotak) + kurva Maxwell
    const bx0 = x - 220;
    const bx1 = x - 40;
    const by0 = y - 90;
    const by1 = y + 90;
    const temp = 1 + 0.35 * Math.sin(t * 0.9); // T relatif
    const aw = Math.sqrt(temp);
    const gx0 = x - 10;
    const gx1 = x + 220;
    const gy = y + 90;
    const sc = 64;
    const f = (v: number) => (4 / Math.sqrt(Math.PI)) * (v * v) / aw ** 3 * Math.exp(-(v * v) / (aw * aw));
    const curve: [number, number][] = Array.from({length: 61}, (_, k) => {
      const v = (k / 60) * 3.4;
      return [gx0 + (v / 3.4) * (gx1 - gx0), gy - sc * 1.9 * f(v) * 0.9];
    });
    const fill = `${pl(curve)} L${gx1},${gy} L${gx0},${gy} Z`;
    const pkx = gx0 + (aw / 3.4) * (gx1 - gx0);
    return (
      <g>
        <Glow x={x} y={y} r={170} color="cyan" opacity={0.25 + 0.3 * act} />
        <rect x={bx0 - 8} y={by0 - 8} width={bx1 - bx0 + 16} height={by1 - by0 + 16} rx={12} fill="#0c1631" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2.5} />
        {GAS.map((g, k) => {
          const px = fold(bx0 + g.x0 * (bx1 - bx0) + g.vx * aw * t, bx0 + 8, bx1 - 8);
          const py = fold(by0 + g.y0 * (by1 - by0) + g.vy * aw * t, by0 + 8, by1 - 8);
          return (
            <g key={k}>
              <circle cx={px} cy={py} r={14} fill="url(#soft-cyan)" />
              <circle cx={px} cy={py} r={6.5} fill="#bff0ff" />
            </g>
          );
        })}
        <line x1={gx0} y1={gy} x2={gx1 + 10} y2={gy} stroke={C.muted} strokeWidth={2.5} />
        <line x1={gx0} y1={gy} x2={gx0} y2={y - 100} stroke={C.muted} strokeWidth={2.5} />
        <path d={fill} fill={C.cyan} opacity={0.18} />
        <path d={pl(curve)} fill="none" stroke={C.cyan} strokeOpacity={0.25} strokeWidth={10} />
        <path d={pl(curve)} fill="none" stroke={C.cyan} strokeWidth={4} strokeLinejoin="round" />
        <line x1={pkx} y1={gy} x2={pkx} y2={gy - 8} stroke={C.gold} strokeWidth={3} />
        <text x={gx1 + 4} y={gy + 30} textAnchor="end" fontFamily={FONT.serif} fontStyle="italic" fontSize={26} fill={C.muted}>
          v
        </text>
        <text x={x - 130} y={y + 124} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.cyan} opacity={0.9}>
          molekul gas
        </text>
        <text x={x + 105} y={y + 124} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.cyan} opacity={0.9}>
          sebaran laju
        </text>
      </g>
    );
  }
  // termos + kulkas
  const ox = x - 120;
  const kx = x + 100;
  return (
    <g>
      <Glow x={x} y={y} r={170} color="work" opacity={0.25 + 0.3 * act} />
      <g transform={`translate(${x} ${y - 6}) scale(0.8) translate(${-x} ${-y})`}>
      {/* termos */}
      <rect x={ox - 26} y={y - 132} width={52} height={22} rx={6} fill="#5b6aa0" />
      <rect x={ox - 58} y={y - 112} width={116} height={240} rx={22} fill="#24315e" stroke="#9aa6c8" strokeWidth={3} />
      <rect x={ox - 44} y={y - 98} width={88} height={212} rx={14} fill="#0a1128" stroke="#dfe7ff" strokeOpacity={0.9} strokeWidth={3} strokeDasharray="7 6" strokeDashoffset={-t * 8} />
      <rect x={ox - 34} y={y - 70} width={68} height={176} rx={10} fill={C.kin} opacity={0.35 + 0.08 * Math.sin(t * 2)} />
      {[0, 1, 2].map((k) => {
        // butir kalor memantul di antara dinding perak (tertahan di dalam)
        const px = fold(ox - 28 + k * 20 + 60 * t * (k % 2 ? 1 : -0.8), ox - 26, ox + 26);
        const py = fold(y - 60 + k * 50 + 45 * t * (k === 1 ? -1 : 1), y - 62, y + 98);
        return <circle key={k} cx={px} cy={py} r={6} fill="#ffd2a8" />;
      })}
      {[0, 1].map((k) => {
        const ph = fr(t * 0.4 + k / 2);
        return <path key={k} d={`M${ox - 10 + k * 18},${y - 140 - ph * 40} q6,-8 0,-16 q-6,-8 0,-16`} fill="none" stroke="#e8f0ff" strokeWidth={3} opacity={cyc(ph) * 0.35} />;
      })}
      {/* kulkas */}
      <rect x={kx - 62} y={y - 120} width={124} height={248} rx={14} fill="#dfe6f6" stroke="#8a95b5" strokeWidth={3} />
      <line x1={kx - 62} y1={y - 40} x2={kx + 62} y2={y - 40} stroke="#8a95b5" strokeWidth={3} />
      <rect x={kx + 40} y={y - 100} width={8} height={40} rx={4} fill="#8a95b5" />
      <rect x={kx + 40} y={y - 20} width={8} height={60} rx={4} fill="#8a95b5" />
      <circle cx={kx - 10} cy={y + 40} r={44} fill="url(#soft-pot)" />
      <g transform={`translate(${kx - 10} ${y + 40}) rotate(${t * 25})`}>
        {[0, 1, 2].map((k) => (
          <line key={k} x1={-22 * Math.cos((k * Math.PI) / 3)} y1={-22 * Math.sin((k * Math.PI) / 3)} x2={22 * Math.cos((k * Math.PI) / 3)} y2={22 * Math.sin((k * Math.PI) / 3)} stroke={C.pot} strokeWidth={4} strokeLinecap="round" />
        ))}
      </g>
      {/* kalor dibuang ke ruangan dari belakang/atas */}
      <Stream pts={[[kx + 50, y - 120], [kx + 85, y - 150], [kx + 130, y - 165]]} color="kin" n={4} speed={0.6} r={5} jitter={2} />
      </g>
      <text x={x - 96} y={y + 124} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.work}>
        termos
      </text>
      <text x={x + 80} y={y + 124} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.work}>
        kulkas
      </text>
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur, wordOf} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);
  const itemAt = (i: number, k: number) => wordOf(i + 1, KEYS[i][k]) - 0.15;
  const imp = ramp(t, wordOf(0, 'termofisika') - 0.2, wordOf(0, 'termofisika') + 0.6);
  const three = ramp(t, wordOf(0, 'tiga') - 0.2, wordOf(0, 'tiga') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.kin, opacity: 0.35 + 0.65 * imp}}>termofisika</span> <span style={{color: C.muted, opacity: 0.35 + 0.65 * three}}>dalam tiga bagian</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="kin" opacity={0.4} seed={11} />
        {/* butir kalor samar yang melayang naik di latar */}
        {Array.from({length: 18}, (_, k) => {
          const ph = fr(t * (0.05 + rand(k) * 0.05) + rand(k * 3.1));
          const x = 60 + rand(k * 5.3) * 1800 + 18 * Math.sin(t * 0.8 + k);
          return <circle key={k} cx={x} cy={900 - ph * 760} r={2 + 2 * rand(k * 1.9)} fill={k % 3 ? C.kin : C.heat} opacity={0.3 * cyc(ph) * head} />;
        })}
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="kin" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="kin" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="kin" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={20 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={11} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => {
        const q0 = Math.min(1, ps[i]);
        return (
          <div
            key={p.n}
            style={{
              position: 'absolute',
              left: CX[i] - CW / 2,
              top: TOP,
              width: CW,
              height: CH,
              borderRadius: 24,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${p.color}55`,
              borderTop: `8px solid ${p.color}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * q0),
              translate: `0px ${(1 - q0) * 40 - 6 * act[i]}px`,
              scale: String(0.9 + 0.1 * ps[i]),
              fontFamily: FONT.head,
              color: C.ink,
              padding: '22px 34px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(255,230,210,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: i === 1 ? 28 : 31, fontWeight: 700, marginTop: 4, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{p.title}</div>
            <div style={{height: 216}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 26 : 27, color: C.muted, lineHeight: i === 0 ? 1.5 : 1.7, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
                    <span style={{color: p.color, marginRight: 8}}>—</span>
                    {it}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <g transform={`translate(${CX[i]} ${ICON_Y}) scale(0.84) translate(${-CX[i]} ${-ICON_Y})`}>
              <Icon i={i} x={CX[i]} y={ICON_Y} t={t} act={act[i]} />
            </g>
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
