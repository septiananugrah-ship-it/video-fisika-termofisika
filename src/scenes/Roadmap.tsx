import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, smoothPath, win} from '../anim';
import {Arrow, DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak (dihitung analitik):
// (1) tali dengan gelombang berjalan y = A sin(kx − ωt): partikel emas hanya naik-turun, panah v hijau, kurung λ merah muda;
// (2) atom dengan gelombang berdiri melingkar (gelombang materi, ungu) disinari gelombang cahaya;
// (3) senar dengan gelombang berdiri (simpul merah tetap) yang memancarkan muka gelombang bunyi;
// dihubungkan oleh lintasan tempat sebutir cahaya emas merambat.
const PARTS = [
  {n: '1', title: 'Konsep gelombang', color: C.cyan, hue: 'cyan' as Hue, items: ['Jenis gelombang', 'Besaran gelombang', 'Persamaan gelombang', 'Cepat rambat', 'Interferensi', 'Gelombang berdiri', 'Bunyi']},
  {n: '2', title: 'Gelombang di dunia kimia', color: C.spr, hue: 'spr' as Hue, items: ['Cahaya', 'Difraksi sinar-X kristal', 'Gelombang materi', 'Jembatan ke kuantum']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['Alat musik', 'Ultrasonografi (USG)', 'Peredam bising']},
];
const KEYS = [
  ['jenis', 'besaran', 'persamaan', 'cepat', 'interferensi', 'berdiri', 'bunyi'],
  ['cahaya', 'difraksi', 'materi', 'jembatan'],
  ['musik', 'ultrasonografi', 'peredam'],
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
const pl = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // gelombang berjalan pada tali: λ = 180 px, f = 0,7 Hz
    const lam = 180;
    const k = TAU / lam;
    const om = TAU * 0.7;
    const A = 42;
    const x0 = x - 220;
    const x1 = x + 220;
    const pts = Array.from({length: 61}, (_, j) => {
      const X = x0 + ((x1 - x0) * j) / 60;
      return [X, y + 10 - A * Math.sin(k * (X - x0) - om * t)] as [number, number];
    });
    const xm = x - 10;
    const ym = y + 10 - A * Math.sin(k * (xm - x0) - om * t);
    // puncak: k(X − x0) − ωt = π/2 + 2πm
    const base = x0 + (Math.PI / 2 + om * t) / k;
    const cr = Array.from({length: 4}, (_, j) => base + (Math.floor((x0 - base) / lam) + j) * lam);
    return (
      <g>
        <Glow x={x} y={y} r={170} color="cyan" opacity={0.25 + 0.3 * act} />
        <line x1={x0} y1={y + 10} x2={x1} y2={y + 10} stroke={C.faint} strokeWidth={2} strokeDasharray="5 8" />
        <path d={pl(pts)} fill="none" stroke={C.cyan} strokeOpacity={0.22} strokeWidth={12} />
        <path d={pl(pts)} fill="none" stroke={C.cyan} strokeWidth={4.5} strokeLinecap="round" />
        {cr.map((X, j) => {
          const o = Math.max(0, Math.min(1, (X - x0 - 10) / 30, (x1 - lam - X) / 30));
          return o > 0.01 ? (
            <g key={j} opacity={o}>
              <path d={`M${X},${y - A - 4} L${X},${y - A - 18} L${X + lam},${y - A - 18} L${X + lam},${y - A - 4}`} fill="none" stroke={C.press} strokeWidth={3} />
              <text x={X + lam / 2} y={y - A - 34} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={30} fill={C.press}>
                λ
              </text>
            </g>
          ) : null;
        })}
        <line x1={xm} y1={y + 10 - A - 8} x2={xm} y2={y + 10 + A + 8} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="3 5" />
        <circle cx={xm} cy={ym} r={22} fill="url(#soft-gold)" />
        <circle cx={xm} cy={ym} r={9} fill={C.gold} stroke="#fff3c4" strokeWidth={2} />
        <Arrow x1={x + 60} y1={y + 92} x2={x + 200} y2={y + 92} color="work" width={5} />
        <text x={x + 40} y={y + 100} textAnchor="end" fontFamily={FONT.serif} fontStyle="italic" fontSize={30} fill={C.work}>
          v
        </text>
      </g>
    );
  }
  if (i === 1) {
    // atom: gelombang berdiri melingkar (n = 5) + gelombang cahaya datang
    const cx = x + 70;
    const ring = Array.from({length: 97}, (_, j) => {
      const a = (j / 96) * TAU;
      const r = 78 + 12 * Math.sin(5 * a) * Math.cos(TAU * 0.8 * t);
      return [cx + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
    });
    const head = cx - 100;
    const wave = Array.from({length: 48}, (_, k) => {
      const X = x - 230 + ((head - (x - 230)) * k) / 47;
      const env = Math.min(1, (X - (x - 230)) / 40);
      return [X, y + 14 * env * Math.sin((X - x) * 0.09 - t * 6)] as [number, number];
    });
    return (
      <g>
        <Glow x={cx} y={y} r={170} color="spr" opacity={0.25 + 0.3 * act} />
        <path d={pl(wave)} fill="none" stroke="#5ef08a" strokeOpacity={0.25} strokeWidth={10} />
        <path d={pl(wave)} fill="none" stroke="#5ef08a" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={cx} cy={y} r={78} fill="none" stroke={C.spr} strokeOpacity={0.2} strokeWidth={2} strokeDasharray="4 6" />
        <path d={pl(ring)} fill="none" stroke={C.spr} strokeOpacity={0.25} strokeWidth={12} />
        <path d={pl(ring)} fill="none" stroke={C.spr} strokeWidth={4} />
        <circle cx={cx} cy={y} r={34} fill="url(#soft-heat)" opacity={0.7 + 0.2 * Math.sin(t * 3)} />
        <circle cx={cx} cy={y} r={14} fill={C.heat} stroke="#ffd0d6" strokeWidth={2} />
        <text x={cx} y={y + 128} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.spr} opacity={0.9}>
          gelombang materi
        </text>
      </g>
    );
  }
  // senar: gelombang berdiri n = 3 (simpul merah tetap) + muka gelombang bunyi
  const x0 = x - 210;
  const x1 = x + 70;
  const L = x1 - x0;
  const yS = y + 6;
  const amp = 30 * Math.cos(TAU * 1.1 * t);
  const str = Array.from({length: 61}, (_, j) => {
    const X = x0 + (L * j) / 60;
    return [X, yS - amp * Math.sin((3 * Math.PI * (X - x0)) / L)] as [number, number];
  });
  const strB = Array.from({length: 61}, (_, j) => {
    const X = x0 + (L * j) / 60;
    return [X, yS + amp * Math.sin((3 * Math.PI * (X - x0)) / L)] as [number, number];
  });
  return (
    <g>
      <Glow x={x} y={y} r={170} color="work" opacity={0.25 + 0.3 * act} />
      <rect x={x0 - 16} y={yS - 40} width={12} height={80} rx={4} fill="#3b4a7a" />
      <rect x={x1 + 4} y={yS - 40} width={12} height={80} rx={4} fill="#3b4a7a" />
      <path d={pl(strB)} fill="none" stroke={C.cyan} strokeOpacity={0.2} strokeWidth={3} />
      <path d={pl(str)} fill="none" stroke={C.cyan} strokeOpacity={0.22} strokeWidth={10} />
      <path d={pl(str)} fill="none" stroke={C.cyan} strokeWidth={4} />
      {[0, 1, 2, 3].map((n) => (
        <circle key={n} cx={x0 + (L * n) / 3} cy={yS} r={7} fill={C.heat} stroke="#ffd0d6" strokeWidth={1.5} />
      ))}
      {[0, 1, 2, 3].map((n) => {
        const ph = (((t * 0.6 + n / 4) % 1) + 1) % 1;
        const r = 30 + ph * 150;
        return <path key={n} d={`M${x1 + 30 + r * Math.cos(-0.5)},${yS + r * Math.sin(-0.5)} A${r},${r} 0 0 1 ${x1 + 30 + r * Math.cos(0.5)},${yS + r * Math.sin(0.5)}`} fill="none" stroke={C.work} strokeWidth={3} strokeLinecap="round" opacity={Math.min(1, ph * 6) * (1 - ph)} />;
      })}
      <text x={x - 70} y={y + 110} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.heat} opacity={0.85}>
        simpul tetap
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
  const imp = ramp(t, wordOf(0, 'gelombang') - 0.2, wordOf(0, 'gelombang') + 0.6);
  const three = ramp(t, wordOf(0, 'tiga') - 0.2, wordOf(0, 'tiga') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.cyan, opacity: 0.35 + 0.65 * imp}}>gelombang</span> <span style={{color: C.muted, opacity: 0.35 + 0.65 * three}}>dalam tiga bagian</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="gold" opacity={0.4} seed={11} />
        {/* gelombang kosinus samar di latar yang terus merambat */}
        {[250, 520, 790].map((y, k) => (
          <path
            key={k}
            d={Array.from({length: 49}, (_, j) => {
              const X = -20 + j * 41;
              return `${j ? 'L' : 'M'}${X},${(y + 22 * Math.cos(X * 0.008 * (1 + 0.3 * k) - t * (0.9 + 0.25 * k) + k)).toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke={k === 1 ? C.gold : C.cyan}
            strokeOpacity={0.16}
            strokeWidth={2}
            opacity={head}
          />
        ))}
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
        <DrawPath d={PTS_D} p={pathP} stroke="gold" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="gold" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="gold" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
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
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(220,240,255,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: 31, fontWeight: 700, marginTop: 4, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{p.title}</div>
            <div style={{height: 216}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 24 : 28, color: C.muted, lineHeight: i === 0 ? 1.36 : 1.7, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
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
