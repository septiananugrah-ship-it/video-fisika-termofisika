import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, ramp, rand} from '../anim';
import {Arrow, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Sup, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Proses gas ideal pada diagram p–V (satuan relatif; suhu T ∝ pV):
//  C(3,1) → D(1,1) isobarik (p tetap, didinginkan) → A(1,3) isokhorik (V tetap, dipanaskan, W = 0)
//  → C(3,1) isotermal pV = 3 (ΔU = 0 → Q = W) → F(1, 3^1,4 = 4,66) adiabatik pV^1,4 tetap (Q = 0, ditekan cepat: T naik 1,55×).
//  Adiabatik lewat C lebih curam daripada isotermal lewat C. Usaha = luas di bawah kurva (diarsir di isotermal).
//  Silinder mini mengikuti titik keadaan: tinggi gas ∝ V, panah tekanan ∝ p, laju molekul ∝ √T (fase = ∫√T dt).

const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const tri = (u: number) => {
  const v = ((u % 2) + 2) % 2;
  return 1 - Math.abs(v - 1);
};
const G = 1.4;
const PX = (V: number) => 220 + V * 190;
const PY = (p: number) => 800 - p * 110;
const pAd = (V: number) => Math.pow(3 / V, G);
const pathOfFn = (f: (u: number) => [number, number], u1: number, n = 48) =>
  Array.from({length: n + 1}, (_, i) => {
    const [V, p] = f((u1 * i) / n);
    return `${i ? 'L' : 'M'}${PX(V).toFixed(1)},${PY(p).toFixed(1)}`;
  }).join(' ');

const segIb = (u: number): [number, number] => [3 - 2 * u, 1];
const segIc = (u: number): [number, number] => [1, 1 + 2 * u];
const segIt = (u: number): [number, number] => [1 + 2 * u, 3 / (1 + 2 * u)];
const segAd = (u: number): [number, number] => [3 - 2 * u, pAd(3 - 2 * u)];

// silinder mini
const KX0 = 1190;
const KX1 = 1410;
const KB = 620;
const yPiston = (V: number) => KB - V * 70;

const Flame: React.FC<{x: number; y: number; s?: number; t: number; k?: number}> = ({x, y, s = 1, t, k = 0}) => {
  if (s <= 0.01) return null;
  const f = 1 + 0.13 * Math.sin(t * 11 + k * 1.7) + 0.07 * Math.sin(t * 17.3 + k);
  const sw = 3 * Math.sin(t * 7 + k * 2.3);
  const d = (w: number, h: number) => `M${-w},0 C${-w * 1.25},${-h * 0.42} ${-w * 0.3 + sw},${-h * 0.66} ${sw},${-h} C${w * 0.3 + sw},${-h * 0.66} ${w * 1.25},${-h * 0.42} ${w},0 Q0,${w * 0.55} ${-w},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d(13, 42 * f)} fill={C.kin} opacity={0.85} />
      <path d={d(8, 27 * f)} fill={C.gold} />
      <path d={d(3.5, 12 * f)} fill="#fff6e0" />
    </g>
  );
};

export const Processes: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();
  const appear = ramp(t, -0.4, 0.7, EASE_IN_OUT);
  const axes = ramp(t, cue(0) - 0.6, cue(0) + 1.0, EASE_IN_OUT);

  /* ---------- jadwal proses ---------- */
  const tIb0 = wordOf(1, 'isobarik') - 0.1;
  const tIc0 = wordOf(1, 'isokhorik') - 0.1;
  const tIb1 = tIc0 - 0.4;
  const tIc1 = cueEnd(1) - 0.2;
  const tIt0 = wordOf(2, 'isotermal') - 0.1;
  const tIt1 = cueEnd(2) + 0.2;
  const tAd0 = wordOf(3, 'ditekan') - 0.3;
  const tAd1 = tAd0 + 2.0;
  const U = (tt: number, a: number, b: number) => ramp(tt, a, b, EASE_IN_OUT);
  const state = (tt: number): [number, number] => {
    if (tt < tIb1) return segIb(U(tt, tIb0, tIb1));
    if (tt < tIc1) return segIc(U(tt, tIc0, tIc1));
    if (tt < tAd0 - 0.01 || tt < tIt1) return segIt(U(tt, tIt0, tIt1));
    return segAd(U(tt, tAd0, tAd1));
  };
  const [V, p] = state(t);
  const T = p * V;
  const uIb = U(t, tIb0, tIb1);
  const uIc = U(t, tIc0, tIc1);
  const uIt = U(t, tIt0, tIt1);
  const uAd = U(t, tAd0, tAd1);
  const trail: [number, number][] = [1, 2, 3, 4, 5].map((k) => {
    const [v, q] = state(t - k * 0.07);
    return [PX(v), PY(q)];
  });

  // jendela tiap proses (untuk perlengkapan silinder)
  const wIb = ramp(t, cue(1) - 0.2, tIb0 + 0.2) * (1 - ramp(t, tIc0 - 0.4, tIc0 + 0.2, EASE_IN_OUT));
  const wIc = ramp(t, tIc0 - 0.3, tIc0 + 0.3) * (1 - ramp(t, cue(2) - 0.4, cue(2) + 0.2, EASE_IN_OUT));
  const wIt = ramp(t, cue(2) - 0.2, tIt0 + 0.3) * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.2, EASE_IN_OUT));
  const wAd = ramp(t, cue(3) - 0.2, cue(3) + 0.5) * (1 - ramp(t, cue(4) + 0.4, cue(4) + 1.2, EASE_IN_OUT));
  const pump = ramp(t, wordOf(3, 'pompa') - 0.6, wordOf(3, 'pompa') + 0.2) * (1 - ramp(t, cue(4) + 0.4, cue(4) + 1.2, EASE_IN_OUT));
  const tPump = wordOf(3, 'pompa') - 0.6;
  const pumpWarm = ramp(t, tPump, tPump + 4.5, (x) => x);

  // kartu
  const k1 = slot(t, tIb0 - 0.2, tIc0 - 0.1);
  const k2 = slot(t, tIc0 - 0.1, cue(2));
  const k3 = slot(t, cue(2) - 0.1, cue(3));
  const k4 = slot(t, cue(3) - 0.1, cue(4));
  const k5 = ramp(t, cue(4) - 0.1, cue(4) + 0.5);
  const shade = ramp(t, wordOf(4, 'Luas') - 0.3, wordOf(4, 'kurva') + 0.6, EASE_IN_OUT);
  const shadeLab = ramp(t, wordOf(4, 'usaha') - 0.4, wordOf(4, 'usaha') + 0.4);
  const isoRef = ramp(t, tIt0, tIt0 + 1) * 0.6;

  /* ---------- molekul ---------- */
  let phi = 0;
  const dt = 0.1;
  for (let tt = -1; tt < t; tt += dt) {
    const [v, q] = state(tt);
    phi += Math.sqrt(v * q) * Math.min(dt, t - tt);
  }
  const yp = yPiston(V);
  const mols = Array.from({length: 16}, (_, i) => {
    const vx = 0.12 + 0.1 * rand(i + 3);
    const vy = 0.1 + 0.1 * rand(i + 13);
    const P = (ph: number): [number, number] => [KX0 + 12 + tri(rand(i) * 2 + vx * ph) * (KX1 - KX0 - 24), yp + 12 + tri(rand(i + 7) * 2 + vy * ph) * (KB - yp - 24)];
    return {p: P(phi), tr: [1, 2].map((k) => P(phi - k * 0.08 * Math.sqrt(T)))};
  });
  const Tcol = interpolateColors(T, [1, 3, 4.66], [C.pot, C.kin, C.heat]);
  const hotGlow = Math.max(0, (T - 1) / 3.66);

  const shown = (u: number, a: number) => (u > 0.001 ? a : 0);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="pr-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4c5884" />
            <stop offset="50%" stopColor="#a9b5dc" />
            <stop offset="100%" stopColor="#3a446e" />
          </linearGradient>
          <linearGradient id="pr-piston" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c3cdee" />
            <stop offset="100%" stopColor="#5a6694" />
          </linearGradient>
          <clipPath id="pr-shade">
            <rect x={PX(1)} y={200} width={(PX(3) - PX(1)) * shade} height={620} />
          </clipPath>
          <pattern id="pr-insul" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="#5a4a2a" />
            <line x1="0" y1="0" x2="0" y2="14" stroke={C.gold} strokeWidth="5" opacity="0.6" />
          </pattern>
        </defs>

        {/* ================= diagram p–V ================= */}
        <g opacity={appear}>
          <Motes x={600} y={520} rx={400} ry={260} n={18} color="press" opacity={0.3} seed={6} />
          {[1, 2, 3, 4].map((k) => (
            <g key={k} opacity={axes * 0.5}>
              <line x1={PX(k)} y1={800} x2={PX(k)} y2={250} stroke={C.grid} strokeWidth={1.2} />
              <line x1={220} y1={PY(k)} x2={990} y2={PY(k)} stroke={C.grid} strokeWidth={1.2} />
            </g>
          ))}
          <line x1={220} y1={800} x2={220 + 790 * axes} y2={800} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <line x1={220} y1={800} x2={220} y2={800 - 570 * axes} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <Label x={220} y={208} size={30} color={C.press} font="serif" italic weight={600} opacity={axes}>
            p
          </Label>
          <Label x={1022} y={800} size={30} color={C.muted} font="serif" italic anchor="start" opacity={axes}>
            V
          </Label>
          <Label x={990} y={836} size={21} color={C.muted} anchor="end" opacity={axes}>
            tekanan p terhadap volume V
          </Label>

          {/* luas = usaha (di bawah isotermal) */}
          <g clipPath="url(#pr-shade)">
            <path d={`${pathOfFn(segIt, 1)} L${PX(3)},800 L${PX(1)},800 Z`} fill={C.work} opacity={0.32} />
            {Array.from({length: 14}, (_, k) => {
              const kk = k + ((t * 0.35) % 1);
              const x = PX(1) + (kk * (PX(3) - PX(1))) / 14;
              return <line key={k} x1={x} y1={800} x2={x} y2={PY(3 / ((x - 220) / 190)) + 4} stroke={C.work} strokeWidth={2} opacity={0.35 * Math.sin((Math.PI * kk) / 14)} />;
            })}
          </g>
          <Label x={PX(2)} y={748} size={32} color={C.work} weight={700} opacity={shadeLab}>
            W = luas
          </Label>
          <Twinkles x={PX(2)} y={748} rx={110} ry={30} n={4} color="work" opacity={shadeLab} />

          {/* kurva isotermal acuan (putus-putus) */}
          <path d={Array.from({length: 49}, (_, i) => {
            const v = 0.66 + (i * (4 - 0.66)) / 48;
            return `${i ? 'L' : 'M'}${PX(v).toFixed(1)},${PY(3 / v).toFixed(1)}`;
          }).join(' ')} fill="none" stroke={C.kin} strokeWidth={2} strokeDasharray="5 9" opacity={isoRef} />

          {/* kurva proses (tergambar mengikuti titik) */}
          {[
            {f: segIb, u: uIb, col: C.press, act: wIb},
            {f: segIc, u: uIc, col: C.cyan, act: wIc},
            {f: segIt, u: uIt, col: C.kin, act: Math.max(wIt, shade)},
            {f: segAd, u: uAd, col: C.heat, act: wAd},
          ].map((s, k) =>
            s.u > 0.001 ? (
              <g key={k} opacity={0.55 + 0.45 * s.act}>
                <path d={pathOfFn(s.f, s.u)} fill="none" stroke={s.col} strokeWidth={16} strokeOpacity={0.18} strokeLinecap="round" />
                <path d={pathOfFn(s.f, s.u)} fill="none" stroke={s.col} strokeWidth={6} strokeLinecap="round" />
              </g>
            ) : null,
          )}
          {/* nama proses */}
          <Label x={560} y={668} size={23} color={C.press} weight={600} opacity={shown(uIb, ramp(t, tIb0, tIb0 + 0.6))}>
            isobarik
          </Label>
          <Label x={392} y={580} size={23} color={C.cyan} weight={600} anchor="end" opacity={shown(uIc, ramp(t, tIc0, tIc0 + 0.6))}>
            isokhorik
          </Label>
          <Label x={440} y={600} size={26} color={C.cyan} weight={700} anchor="start" opacity={wIc * ramp(t, wordOf(1, 'usaha') - 0.4, wordOf(1, 'usaha') + 0.3)}>
            W = 0 (tanpa luas)
          </Label>
          <Label x={705} y={624} size={23} color={C.kin} weight={600} anchor="start" opacity={shown(uIt, ramp(t, tIt0, tIt0 + 0.6))}>
            isotermal
          </Label>
          <Label x={448} y={330} size={23} color={C.heat} weight={600} anchor="start" opacity={shown(uAd, ramp(t, tAd0 + 0.6, tAd0 + 1.2))}>
            adiabatik · lebih curam
          </Label>
          <Ripple x={PX(1)} y={PY(pAd(1))} p={(t - tAd1) / 1.4} r={110} color="heat" rings={2} />
          <Ripple x={PX(3)} y={PY(1)} p={(t - tIt1) / 1.4} r={90} color="kin" rings={2} />
          <Label x={PX(3) + 24} y={PY(1) - 34} size={23} color={C.press} anchor="start" opacity={ramp(t, cue(0) + 0.6, cue(0) + 1.3) * (1 - ramp(t, tIb0 - 0.3, tIb0 + 0.3, EASE_IN_OUT))}>
            keadaan gas (p, V)
          </Label>
          <Spark x={PX(V)} y={PY(p)} r={10} color="press" trail={trail} opacity={ramp(t, cue(0) + 0.3, cue(0) + 1)} />
        </g>

        {/* ================= silinder mini ================= */}
        <g opacity={appear * ramp(t, cue(0) + 0.3, cue(0) + 1.2)}>
          <Glow x={1300} y={(yp + KB) / 2} r={200} color="heat" opacity={0.7 * hotGlow * hotGlow} />
          {/* rendaman isotermal */}
          <g opacity={wIt}>
            <rect x={1150} y={440} width={300} height={208} rx={12} fill={C.water} opacity={0.22} />
            <path d={Array.from({length: 21}, (_, k) => `${k ? 'L' : 'M'}${1150 + k * 15},${(440 + 4 * Math.sin(k * 0.8 + t * 3)).toFixed(1)}`).join(' ')} fill="none" stroke={C.water} strokeWidth={2.5} />
            <Label x={1300} y={670} size={20} color={C.water} weight={600}>
              rendaman · T tetap
            </Label>
            {[1170, 1430].map((x, k) => (
              <Stream
                key={k}
                pts={[
                  [x, 600],
                  [x + (k ? -40 : 40), 560],
                  [1300 + (k ? 40 : -40), 540],
                ]}
                color="kin"
                n={3}
                speed={0.55}
                r={4}
                seed={k}
              />
            ))}
          </g>
          {/* gas & molekul */}
          <rect x={KX0} y={yp} width={KX1 - KX0} height={KB - yp} fill={Tcol} opacity={0.12} />
          {mols.map((m, i) => (
            <g key={i}>
              {m.tr.map(([x, y], k) => (
                <circle key={k} cx={x} cy={y} r={6 - k * 1.8} fill={C.cyan} opacity={0.3 * (1 - k / 2)} />
              ))}
              <circle cx={m.p[0]} cy={m.p[1]} r={7.5} fill={C.cyan} />
              <circle cx={m.p[0] - 2} cy={m.p[1] - 2} r={2.5} fill="#fff" opacity={0.8} />
            </g>
          ))}
          {/* panah tekanan ∝ p */}
          {[1240, 1300, 1360].map((x, k) => (
            <Arrow key={k} x1={x} y1={yp + 14 + 12 * p} x2={x} y2={yp + 10} color="press" width={4} pulse={false} opacity={0.85} />
          ))}
          {/* dinding (isolasi saat adiabatik) */}
          <rect x={KX0 - 14} y={260} width={14} height={KB - 260 + 14} fill="url(#pr-wall)" />
          <rect x={KX1} y={260} width={14} height={KB - 260 + 14} fill="url(#pr-wall)" />
          <rect x={KX0 - 14} y={KB} width={KX1 - KX0 + 28} height={14} fill="#4c5884" />
          <g opacity={wAd}>
            <rect x={KX0 - 34} y={260} width={20} height={KB - 260 + 34} fill="url(#pr-insul)" />
            <rect x={KX1 + 14} y={260} width={20} height={KB - 260 + 34} fill="url(#pr-insul)" />
            <rect x={KX0 - 34} y={KB + 14} width={KX1 - KX0 + 68} height={20} fill="url(#pr-insul)" />
            <Label x={1300} y={KB + 58} size={21} color={C.gold} weight={600}>
              terisolasi: Q = 0
            </Label>
          </g>
          {/* piston */}
          <rect x={KX0 + 2} y={yp - 30} width={KX1 - KX0 - 4} height={30} rx={5} fill="url(#pr-piston)" stroke="#e1e7fb" strokeWidth={1.5} />
          <rect x={1294} y={yp - 30 - 60} width={12} height={60} fill="#8e9ac4" />
          <rect x={1254} y={yp - 98} width={92} height={10} rx={5} fill="#c3cdee" />
          {/* beban (isobarik) */}
          <g opacity={wIb}>
            <rect x={1230} y={yp - 98 - 56} width={140} height={56} rx={7} fill="url(#crate)" stroke={C.force} strokeWidth={2.5} />
            <Label x={1300} y={yp - 126} size={20} color={C.force} weight={600}>
              beban tetap
            </Label>
          </g>
          {/* pasak (isokhorik) */}
          <g opacity={wIc}>
            {[KX0 - 40, KX1 - 6].map((x, k) => (
              <rect key={k} x={x} y={yp - 46} width={46} height={12} rx={4} fill="#d5dcf2" stroke={C.cyan} strokeWidth={2} />
            ))}
            <Label x={1300} y={yp - 120} size={20} color={C.cyan} weight={600}>
              piston dikunci
            </Label>
          </g>
          {/* tangan menekan (adiabatik) */}
          <g opacity={wAd * (1 - ramp(t, tAd1, tAd1 + 0.8, EASE_IN_OUT))}>
            <Arrow x1={1300} y1={yp - 190} x2={1300} y2={yp - 108} color="force" width={7} />
            <Label x={1330} y={yp - 170} size={21} color={C.force} anchor="start" weight={600}>
              ditekan cepat
            </Label>
          </g>
          {/* pendingin (isobarik: kalor keluar) */}
          <g opacity={wIb}>
            <rect x={1170} y={KB + 22} width={260} height={14} rx={6} fill={C.pot} opacity={0.8} />
            <Glow x={1300} y={KB + 30} r={120} color="pot" opacity={0.5} />
            <Stream
              pts={[
                [1300, KB - 40],
                [1300, KB + 50],
              ]}
              color="kin"
              n={3}
              speed={0.6}
              r={4}
              jitter={20}
            />
          </g>
          {/* api (isokhorik: kalor masuk) */}
          <g opacity={wIc}>
            <Glow x={1300} y={KB + 40} r={120} color="kin" opacity={0.5} />
            {Array.from({length: 5}, (_, k) => (
              <Flame key={k} x={1240 + k * 30} y={KB + 66} s={0.85} t={t} k={k} />
            ))}
          </g>
          {/* termometer */}
          <rect x={1466} y={330} width={18} height={270} rx={9} fill="#141e40" stroke={C.muted} strokeWidth={1.5} />
          <rect x={1470} y={596 - 250 * (T / 5)} width={10} height={250 * (T / 5) + 6} rx={5} fill={Tcol} />
          <circle cx={1475} cy={610} r={17} fill={Tcol} stroke={C.muted} strokeWidth={1.5} />
          <Label x={1475} y={304} size={26} color={Tcol} font="serif" italic weight={600}>
            T
          </Label>
        </g>

        {/* ================= pompa sepeda ================= */}
        {pump > 0.001 ? (
          <g opacity={pump}>
            {(() => {
              const hy = 330 + 48 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 1.1 * (t - tPump)));
              const bc = interpolateColors(pumpWarm, [0, 1], ['#56628f', '#e0503c']);
              return (
                <g>
                  <Glow x={1670} y={580} r={130} color="heat" opacity={0.8 * pumpWarm} />
                  <rect x={1600} y={640} width={140} height={12} rx={5} fill="#3a446e" />
                  <rect x={1646} y={380} width={48} height={262} rx={8} fill="#2a3358" stroke="#9aa8d4" strokeWidth={2} />
                  <rect x={1648} y={520} width={44} height={120} rx={6} fill={bc} opacity={0.9} />
                  <rect x={1652} y={384} width={8} height={254} rx={4} fill="#fff" opacity={0.1} />
                  <rect x={1666} y={hy} width={8} height={392 - hy} fill="#c3cdee" />
                  <rect x={1620} y={hy - 10} width={100} height={14} rx={7} fill="#c3cdee" />
                  <path d="M1694,620 q50,10 40,-80" fill="none" stroke="#333c66" strokeWidth={6} strokeLinecap="round" />
                  {[0, 1, 2].map((k) => {
                    const ph = (t * 0.6 + k / 3) % 1;
                    return <path key={k} d={`M${1658 + k * 12},${520 - ph * 70} q6,-10 0,-20 q-6,-10 0,-20`} fill="none" stroke={C.heat} strokeWidth={2.5} opacity={Math.min(1, ph * 6) * (1 - ph) * pumpWarm} />;
                  })}
                  <Label x={1670} y={290} size={21} color={C.heat} weight={600}>
                    pompa sepeda
                  </Label>
                  <Label x={1745} y={560} size={20} color={C.heat} anchor="start" opacity={pumpWarm}>
                    hangat
                  </Label>
                </g>
              );
            })()}
          </g>
        ) : null}
        <Glow x={1480} y={775} r={260} color="work" opacity={0.3 * k5} />
      </Stage>

      <Formula x={1480} y={775} p={k1} accent={C.press} size={58} caption="isobarik · tekanan tetap">
        <span style={{fontStyle: 'italic', color: C.work}}>W</span> = <span style={{fontStyle: 'italic', color: C.press}}>p</span> Δ<span style={{fontStyle: 'italic'}}>V</span>
      </Formula>
      <Formula x={1480} y={775} p={k2} accent={C.cyan} size={58} caption="isokhorik · volume tetap">
        Δ<span style={{fontStyle: 'italic'}}>V</span> = 0 → <span style={{fontStyle: 'italic', color: C.work}}>W</span> = 0
      </Formula>
      <Formula
        x={1480}
        y={775}
        p={k3}
        accent={C.kin}
        size={58}
        caption={
          <>
            isotermal · <i>T</i> tetap, <i>p</i> ∝ 1/<i>V</i>
          </>
        }
      >
        Δ<span style={{fontStyle: 'italic', color: C.spr}}>U</span> = 0 → <span style={{fontStyle: 'italic', color: C.kin}}>Q</span> ={' '}
        <span style={{fontStyle: 'italic', color: C.work}}>W</span>
      </Formula>
      <Formula x={1480} y={775} p={k4} accent={C.heat} size={58} caption="adiabatik · Q = 0, lebih curam">
        <span style={{fontStyle: 'italic'}}>pV</span>
        <Sup>1,4</Sup> = tetap
      </Formula>
      <Formula x={1480} y={775} p={k5} accent={C.work} size={58} caption="= luas di bawah kurva p–V">
        <span style={{fontStyle: 'italic', color: C.work}}>W</span> = ∫ <span style={{fontStyle: 'italic'}}>p</span> d<span style={{fontStyle: 'italic'}}>V</span>
      </Formula>
    </AbsoluteFill>
  );
};
