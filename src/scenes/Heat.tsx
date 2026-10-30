import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Part, Ripple, Stage, Stream, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kalor = energi yang sedang mengalir karena beda suhu (jingga); yang tersimpan adalah energi dalam U (ungu).
// Q = mcΔT. Air vs besi, masing-masing 1 kg, di atas pembakar identik (daya sama → Q sama tiap saat):
//   c air ≈ 4200, c besi ≈ 450 J/(kg·K) → laju naik suhu besi ≈ 4200/450 ≈ 9,3× air.
//   Pemanasan dihentikan saat air naik 10 K: Q = 1·4200·10 = 42 kJ; Q yang sama menaikkan besi ≈ 93 K
//   (untuk naik 10 K besi hanya perlu 4,5 kJ ≈ 9× lebih sedikit).
// Laut: siang–malam, darat berayun besar, laut nyaris tetap (c air besar). Semua analitik per frame.
const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
const lin = (x: number) => x;
const tcol = (f: number) => interpolateColors(Math.max(0, Math.min(1, f)), [0, 0.5, 1], [C.pot, '#d9cdf2', C.heat]);
const num = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const C_W = 4200;
const C_FE = 450;

/** Termometer (SVG). f = 0..1 tinggi kolom. */
const Thermo: React.FC<{x: number; y0: number; y1: number; f: number; color?: string; w?: number}> = ({x, y0, y1, f, color = C.heat, w = 22}) => {
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

/** Nyala api berkedip. */
const flame = (x: number, y: number, h: number, w: number, t: number, k = 0) => {
  const f1 = Math.sin(t * 9 + k) * 0.1 + Math.sin(t * 13.7 + k * 2) * 0.06;
  const tip = h * (1 + f1);
  const sway = w * 0.22 * Math.sin(t * 5.3 + k);
  return `M${x - w / 2},${y} C${x - w / 2},${y - tip * 0.45} ${x - w * 0.1 + sway},${y - tip * 0.6} ${x + sway},${y - tip} C${x + w * 0.1 + sway},${y - tip * 0.6} ${x + w / 2},${y - tip * 0.45} ${x + w / 2},${y} Z`;
};

const Burner: React.FC<{x: number; t: number; heat: number; pilot: number}> = ({x, t, heat, pilot}) => (
  <g>
    <circle cx={x} cy={735} r={130} fill="url(#soft-kin)" opacity={heat * (0.8 + 0.2 * Math.sin(t * 7 + x))} />
    {[-60, -20, 20, 60].map((dx, k) => (
      <g key={k}>
        <path d={flame(x + dx, 762, 12 + 44 * heat, 26, t, k * 1.7 + x)} fill="#4d8dff" opacity={0.35 * pilot + 0.4 * heat} />
        <path d={flame(x + dx, 762, 6 + 34 * heat, 16, t, k * 2.3 + x)} fill={C.kin} opacity={heat} />
        <path d={flame(x + dx, 762, 18 * heat, 8, t, k * 3.1 + x)} fill="#ffe7a8" opacity={heat} />
      </g>
    ))}
    <rect x={x - 100} y={714} width={200} height={7} rx={3} fill="#56628f" />
    <rect x={x - 90} y={762} width={180} height={40} rx={10} fill="#2c3a66" stroke="#7d8bbd" strokeWidth={2.5} />
    <circle cx={x + 64} cy={782} r={9} fill="#a9b4d6" />
    <line x1={x + 64} y1={782} x2={x + 64 + 8 * Math.cos(-0.5 - heat * 2)} y2={782 + 8 * Math.sin(-0.5 - heat * 2)} stroke="#2c3a66" strokeWidth={3} />
  </g>
);

// grafik T–waktu pemanasan
const PA = {x0: 1250, y0: 790, w: 480, h: 300, tmin: 20, tmax: 130};
const ppy = (T: number) => PA.y0 - ((T - PA.tmin) / (PA.tmax - PA.tmin)) * PA.h;

// pantai
const PER = 3.6;

export const Heat: React.FC = () => {
  const {t, cue, word, wordOf, dur} = useScene();

  // ---------- bagian 0: kalor mengalir, U tersimpan ----------
  const p0 = Math.min(ramp(t, -0.6, 0.6), 1 - ramp(t, cue(1) - 0.7, cue(1), EASE_IN_OUT));
  const dec0 = Math.exp(-Math.max(0, t - 0.8) / 5);
  const Th0 = 50 + 40 * dec0;
  const Tc0 = 50 - 40 * dec0;
  const fh = (Th0 - 10) / 80;
  const fc = (Tc0 - 10) / 80;
  const qGrow = ramp(t, wordOf(0, 'berpindah') - 0.5, wordOf(0, 'berpindah') + 0.6, EASE_IN_OUT);
  const beda = ramp(t, wordOf(0, 'perbedaan') - 0.4, wordOf(0, 'perbedaan') + 0.4);
  const simpan = ramp(t, wordOf(0, 'disimpan') - 0.4, wordOf(0, 'disimpan') + 0.4);
  const alir = ramp(t, wordOf(0, 'mengalir') - 0.4, wordOf(0, 'mengalir') + 0.4);

  // ---------- bagian 1: air vs besi ----------
  const p1 = Math.min(ramp(t, cue(1) - 0.4, cue(1) + 0.5), 1 - ramp(t, cue(5) - 0.7, cue(5), EASE_IN_OUT));
  const h0 = cue(3) + 0.2;
  const h1 = wordOf(4, 'kilojoule') + 0.2;
  const u = ramp(t, h0, h1, lin);
  const heat = Math.min(ramp(t, cue(3) - 0.4, cue(3) + 0.3), 1 - ramp(t, h1 - 0.1, h1 + 0.8, EASE_IN_OUT));
  const pilot = 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.3);
  const dTw = 10 * u;
  const Q = (C_W * dTw) / 1000; // kJ, m = 1 kg
  const dTfe = (Q * 1000) / C_FE;
  const Tw = 25 + dTw;
  const Tfe = 25 + dTfe;
  const qCount = ramp(t, h0 - 0.4, h0 + 0.2);
  const c1 = slot(t, wordOf(1, 'q') - 0.3, cue(2) - 0.1);
  const c2 = slot(t, cue(2) - 0.1, cue(3) - 0.1);
  const c3 = slot(t, cue(3) - 0.1, cue(4) - 0.1);
  const c4 = slot(t, cue(4) - 0.1, cue(5) - 0.6);
  const besi3 = ramp(t, wordOf(3, 'besi') - 0.3, wordOf(3, 'besi') + 0.4);
  const nine = ramp(t, wordOf(4, 'sembilan') - 0.4, wordOf(4, 'sembilan') + 0.5);
  const hl1 = (k: number) => 0.45 + 0.55 * ramp(t, word(1, k) - 0.2, word(1, k) + 0.3);
  const plotIn = ramp(t, cue(3) - 0.3, cue(3) + 0.5);
  const done = ramp(t, h1, h1 + 0.6);

  // ---------- bagian 2: pantai siang–malam ----------
  const p2 = ramp(t, cue(5) - 0.5, cue(5) + 0.4);
  const th = (TAU * (t - (cue(5) - 0.5))) / PER + 0.35;
  const sun = Math.sin(th);
  const TL = 25 + 12 * Math.sin(th - 0.5);
  const TS = 25 + 1.2 * Math.sin(th - 1.0);
  const day = Math.max(0, sun);
  const night = Math.max(0, -sun);
  const sky = interpolateColors(sun, [-1, -0.1, 0.2, 1], ['#070d24', '#2a2150', '#5a4a7a', '#2f6db0']);
  const sx = 960 - 640 * Math.cos(th);
  const sy = 590 - 330 * sun;
  const mx = 960 + 640 * Math.cos(th);
  const my = 590 + 330 * sun;
  const msg = ramp(t, wordOf(5, 'meredam') - 0.4, wordOf(5, 'meredam') + 0.4);

  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <Motes x={960} y={520} rx={880} ry={330} n={30} color="kin" opacity={0.3} seed={9} />

        {/* ===== 0: blok panas → batang → blok dingin ===== */}
        <g opacity={p0}>
          <defs>
            <linearGradient id="he-rod" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={tcol(fh)} />
              <stop offset="100%" stopColor={tcol(fc)} />
            </linearGradient>
          </defs>
          <rect x={490} y={510} width={940} height={44} rx={10} fill="url(#he-rod)" opacity={0.55} />
          <rect x={490} y={510} width={940} height={44} rx={10} fill="none" stroke="#cfe0ff" strokeOpacity={0.4} strokeWidth={2} />
          <Stream pts={[[500, 532], [1420, 532]]} color="kin" n={12} speed={0.3} r={7} jitter={6} opacity={qGrow * (0.3 + 0.7 * dec0)} />
          {[
            {x: 200, f: fh, T: Th0, k: 0},
            {x: 1430, f: fc, T: Tc0, k: 1},
          ].map((b) => {
            const col = tcol(b.f);
            const amp = 1.5 + 7 * b.f;
            const sp = 2 + 6 * b.f;
            const gx = b.k ? 1770 : 130;
            return (
              <g key={b.k}>
                <Glow x={b.x + 145} y={530} r={260} color={b.k ? 'pot' : 'heat'} opacity={0.5 * Math.abs(b.f - 0.5) * 2} />
                <rect x={b.x} y={390} width={290} height={280} rx={18} fill={interpolateColors(Math.max(0, Math.min(1, b.f)), [0, 1], ['#112a58', '#5a1824'])} stroke={col} strokeWidth={4} />
                {Array.from({length: 20}, (_, i) => {
                  const ix = i % 5;
                  const iy = Math.floor(i / 5);
                  const dx = amp * (Math.sin(t * sp * 1.3 + i * 2.1 + b.k * 5) + 0.45 * Math.sin(t * sp * 2.7 + i));
                  const dy = amp * (Math.sin(t * sp * 1.1 + i * 3.7 + b.k) + 0.45 * Math.cos(t * sp * 2.3 + i * 1.3));
                  return <circle key={i} cx={b.x + 45 + ix * 50 + dx} cy={440 + iy * 60 + dy} r={12} fill={col} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.5} />;
                })}
                {/* pengukur energi dalam U (ungu) */}
                <rect x={gx - 16} y={400} width={32} height={260} rx={10} fill="#0c1631" stroke={C.spr} strokeOpacity={0.7} strokeWidth={2.5} />
                <rect x={gx - 10} y={654 - 248 * (0.2 + 0.6 * b.f)} width={20} height={248 * (0.2 + 0.6 * b.f)} rx={6} fill={C.spr} opacity={0.85} />
                <circle cx={gx} cy={654 - 248 * (0.2 + 0.6 * b.f)} r={14} fill="url(#soft-spr)" />
                <text x={gx} y={384} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={34} fill={C.spr}>
                  U
                </text>
                <Label x={b.x + 145} y={350} size={34} color={col} font="mono" weight={600} opacity={beda}>
                  {`${Math.round(b.T)} °C`}
                </Label>
                <Label x={b.x + 145} y={712} size={26} color={C.spr} font="sans" weight={600} opacity={simpan}>
                  energi dalam U · tersimpan
                </Label>
              </g>
            );
          })}
          <Arrow x1={560} y1={455} x2={mix(570, 1360, qGrow)} y2={455} color="kin" width={12} opacity={Math.min(1, qGrow * 4)} />
          <text x={960} y={428} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={52} fill={C.kin} opacity={qGrow}>
            Q
          </text>
          <Label x={960} y={612} size={32} color={C.kin} weight={600} opacity={alir}>
            kalor = energi yang sedang mengalir
          </Label>
          <Twinkles x={960} y={612} rx={300} ry={30} n={5} color="kin" opacity={0.6 * alir} seed={2} />
        </g>

        {/* ===== 1: air vs besi ===== */}
        <g opacity={p1}>
          <Burner x={380} t={t} heat={heat} pilot={pilot} />
          <Burner x={860} t={t} heat={heat} pilot={pilot} />
          {/* kalor naik dari api */}
          {[380, 860].map((x, k) => (
            <g key={k} opacity={heat}>
              <Arrow x1={x - 70} y1={760} x2={x - 70} y2={700} color="kin" width={6} pulse={false} />
              <Arrow x1={x + 70} y1={760} x2={x + 70} y2={700} color="kin" width={6} pulse={false} />
              <Stream pts={[[x - 30, 760], [x - 26, 650]]} color="kin" n={4} speed={0.8} r={5} jitter={3} seed={k} />
              <Stream pts={[[x + 30, 760], [x + 26, 650]]} color="kin" n={4} speed={0.8} r={5} jitter={3} seed={k + 3} />
            </g>
          ))}
          {/* gelas kimia berisi air */}
          {(() => {
            const wy = 592;
            const surf = Array.from({length: 25}, (_, i) => {
              const x = 268 + i * 9.5;
              return `${i ? 'L' : 'M'}${x.toFixed(1)},${(wy + 3 * Math.sin(x * 0.06 + t * 3) + 2 * Math.sin(x * 0.11 - t * 2.2)).toFixed(1)}`;
            }).join(' ');
            return (
              <g>
                <ellipse cx={380} cy={714} rx={130} ry={10} fill="#000" opacity={0.25} />
                <path d={`${surf} L496,706 Q496,712 488,712 L272,712 Q264,712 264,706 Z`} fill="url(#water)" />
                {Array.from({length: 7}, (_, k) => {
                  const ph = fr(t * (0.5 + rand(k) * 0.4) + rand(k * 2.3));
                  return <circle key={k} cx={290 + rand(k * 4.1) * 180 + 5 * Math.sin(t * 4 + k)} cy={704 - ph * 100} r={3 + 3 * rand(k * 1.7)} fill="none" stroke="#dff4ff" strokeWidth={1.5} opacity={cyc(ph) * (0.25 + 0.75 * heat)} />;
                })}
                <path d="M258,540 L258,704 Q258,716 270,716 L490,716 Q502,716 502,704 L502,540" fill="rgba(200,230,255,0.06)" stroke="#dfe9ff" strokeOpacity={0.75} strokeWidth={3.5} />
                <path d="M250,540 L268,540 M492,540 L510,540" stroke="#dfe9ff" strokeOpacity={0.75} strokeWidth={3.5} strokeLinecap="round" />
                <rect x={270} y={556} width={6} height={140} rx={3} fill="#fff" opacity={0.18} />
                <text x={345} y={672} textAnchor="middle" fontFamily={FONT.head} fontSize={34} fontWeight={700} fill="#e6f4ff" opacity={0.85}>
                  H₂O
                </text>
                <Thermo x={455} y0={330} y1={652} f={(Tw - 20) / 110} color={tcol((Tw - 20) / 110 + 0.1)} />
              </g>
            );
          })()}
          {/* balok besi */}
          <g>
            <defs>
              <linearGradient id="he-fe" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8a93b2" />
                <stop offset="100%" stopColor="#3a4160" />
              </linearGradient>
            </defs>
            <ellipse cx={860} cy={714} rx={110} ry={9} fill="#000" opacity={0.25} />
            <rect x={770} y={598} width={180} height={114} rx={8} fill="url(#he-fe)" stroke="#b5bdd8" strokeWidth={2.5} />
            <rect x={770} y={598} width={180} height={114} rx={8} fill={C.heat} opacity={0.4 * Math.max(0, (Tfe - 25) / 93)} />
            <path d="M776,604 L944,604" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
            <text x={835} y={668} textAnchor="middle" fontFamily={FONT.head} fontSize={40} fontWeight={700} fill="#eef2ff" opacity={0.9}>
              Fe
            </text>
            {/* udara panas di atas besi */}
            {[0, 1, 2].map((k) => {
              const ph = fr(t * 0.8 + k / 3);
              return <path key={k} d={`M${800 + k * 40},${580 - ph * 50} q8,-10 0,-20 q-8,-10 0,-20`} fill="none" stroke={C.heat} strokeWidth={2.5} opacity={cyc(ph) * 0.8 * Math.max(0, (Tfe - 40) / 78)} />;
            })}
            <Thermo x={918} y0={330} y1={612} f={(Tfe - 20) / 110} color={tcol((Tfe - 20) / 110 + 0.1)} />
          </g>
          {/* pembacaan & penghitung Q */}
          <Label x={455} y={282} size={34} color={tcol((Tw - 20) / 110 + 0.1)} font="mono" weight={600}>
            {`${num(Tw)} °C`}
          </Label>
          <Label x={918} y={282} size={34} color={tcol((Tfe - 20) / 110 + 0.1)} font="mono" weight={600}>
            {`${num(Tfe)} °C`}
          </Label>
          <Label x={455} y={228} size={28} color={C.kin} font="mono" opacity={qCount}>
            {`Q = ${num(Q)} kJ`}
          </Label>
          <Label x={918} y={228} size={28} color={C.kin} font="mono" opacity={qCount}>
            {`Q = ${num(Q)} kJ`}
          </Label>
          <Label x={380} y={850} size={28} color={C.water} weight={600}>
            air · 1 kg
          </Label>
          <Label x={860} y={850} size={28} color="#b5bdd8" weight={600}>
            besi · 1 kg
          </Label>
          <Label x={618} y={480} size={24} color={C.muted} font="sans" opacity={qCount * (1 - done)}>
            pembakar identik
          </Label>
          <Ripple x={455} y={282} p={ramp(t, h1 - 0.1, h1 + 1.3, lin)} r={120} color="kin" />

          {/* grafik T–waktu */}
          <g opacity={plotIn}>
            <line x1={PA.x0} y1={PA.y0} x2={PA.x0 + PA.w + 20} y2={PA.y0} stroke={C.muted} strokeWidth={2.5} />
            <line x1={PA.x0} y1={PA.y0} x2={PA.x0} y2={PA.y0 - PA.h - 20} stroke={C.muted} strokeWidth={2.5} />
            {[25, 75, 125].map((v) => (
              <g key={v}>
                <line x1={PA.x0 - 8} y1={ppy(v)} x2={PA.x0} y2={ppy(v)} stroke={C.muted} strokeWidth={2} />
                <text x={PA.x0 - 14} y={ppy(v) + 8} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
                  {v}
                </text>
              </g>
            ))}
            <text x={PA.x0 + 10} y={PA.y0 - PA.h - 26} fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
              T (°C)
            </text>
            <text x={PA.x0 + PA.w + 10} y={PA.y0 + 36} textAnchor="end" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
              waktu pemanasan →
            </text>
            <line x1={PA.x0} y1={ppy(25)} x2={PA.x0 + PA.w * u} y2={ppy(Tfe)} stroke="#c5cce6" strokeWidth={4.5} strokeLinecap="round" />
            <line x1={PA.x0} y1={ppy(25)} x2={PA.x0 + PA.w * u} y2={ppy(Tw)} stroke={C.water} strokeWidth={4.5} strokeLinecap="round" />
            <circle cx={PA.x0 + PA.w * u} cy={ppy(Tfe)} r={8} fill="#c5cce6" />
            <circle cx={PA.x0 + PA.w * u} cy={ppy(Tw)} r={8} fill={C.water} />
            <Label x={PA.x0 + PA.w * u + 18} y={ppy(Tfe)} size={24} color="#c5cce6" anchor="start" font="sans" weight={600} opacity={ramp(t, h0 + 1, h0 + 1.6)}>
              besi
            </Label>
            <Label x={PA.x0 + PA.w * u + 18} y={ppy(Tw) - 4} size={24} color={C.water} anchor="start" font="sans" weight={600} opacity={ramp(t, h0 + 1, h0 + 1.6)}>
              air
            </Label>
            <g opacity={nine}>
              <line x1={PA.x0 + PA.w + 50} y1={ppy(Tw)} x2={PA.x0 + PA.w + 50} y2={ppy(Tfe)} stroke={C.gold} strokeWidth={3} strokeDasharray="6 6" />
              <Label x={PA.x0 + PA.w * 0.45} y={ppy(100)} size={30} color={C.gold} weight={700}>
                ΔT besi ≈ 9 × ΔT air
              </Label>
            </g>
            <Twinkles x={PA.x0 + PA.w * 0.45} y={ppy(100)} rx={180} ry={30} n={5} color="gold" opacity={0.7 * nine} seed={5} />
          </g>
        </g>

        {/* ===== 2: pantai siang–malam ===== */}
        <g opacity={p2}>
          <defs>
            <clipPath id="he-coast">
              <rect x={120} y={180} width={1680} height={680} rx={26} />
            </clipPath>
          </defs>
          <g clipPath="url(#he-coast)">
            <rect x={120} y={180} width={1680} height={680} fill={sky} />
            {Array.from({length: 26}, (_, k) => (
              <circle key={k} cx={150 + rand(k * 3.3) * 1620} cy={200 + rand(k * 1.7) * 330} r={1.2 + 1.5 * rand(k)} fill="#fff" opacity={night * (0.4 + 0.5 * Math.sin(t * 2 + k))} />
            ))}
            <circle cx={sx} cy={sy} r={150} fill="url(#soft-gold)" />
            <circle cx={sx} cy={sy} r={46} fill="#ffd66b" stroke="#fff3c4" strokeWidth={3} />
            <circle cx={mx} cy={my} r={34} fill="#e6ecff" opacity={0.9} />
            <circle cx={mx + 12} cy={my - 8} r={30} fill={sky} />
            {/* darat */}
            <path d="M120,600 C300,585 520,590 700,610 C780,618 850,640 910,660 L910,860 L120,860 Z" fill={interpolateColors(Math.max(0, Math.min(1, (TL - 13) / 24)), [0, 0.5, 1], ['#1d3a5c', '#3a4a3a', '#7a3a2a'])} />
            <path d="M120,600 C300,585 520,590 700,610 C780,618 850,640 910,660" fill="none" stroke="#e8c48a" strokeOpacity={0.6} strokeWidth={3} />
            {[260, 520].map((x, k) => (
              <g key={k}>
                <rect x={x - 5} y={520} width={10} height={75} fill="#5a4030" />
                <ellipse cx={x + 3 * Math.sin(t * 1.5 + k)} cy={515} rx={38} ry={22} fill="#2e6b4a" />
              </g>
            ))}
            {/* laut */}
            <path
              d={`M880,648 ${Array.from({length: 24}, (_, i) => {
                const x = 900 + i * 40;
                return `L${x},${(648 + 5 * Math.sin(x * 0.03 - t * 2.4)).toFixed(1)}`;
              }).join(' ')} L1800,860 L880,860 Z`}
              fill="url(#water)"
            />
            {Array.from({length: 5}, (_, k) => (
              <path key={k} d={`M${1000 + k * 160 + 20 * Math.sin(t + k)},${690 + (k % 2) * 40} q20,-8 40,0`} fill="none" stroke="#bfe3ff" strokeOpacity={0.35} strokeWidth={2.5} />
            ))}
            {/* kalor: siang masuk, malam keluar */}
            <Stream pts={[[sx, sy + 40], [mix(sx, 420, 0.5), mix(sy, 600, 0.5)], [420, 610]]} color="kin" n={6} speed={0.6} r={6} jitter={3} opacity={day} seed={1} />
            <Stream pts={[[sx, sy + 40], [mix(sx, 1380, 0.5), mix(sy, 650, 0.5)], [1380, 660]]} color="kin" n={6} speed={0.6} r={6} jitter={3} opacity={day} seed={2} />
            {[300, 560, 760].map((x, k) => (
              <Arrow key={k} x1={x} y1={600} x2={x} y2={500 - 20 * k} color="kin" width={6} opacity={night * 0.9} pulse={false} />
            ))}
            <Arrow x1={1560} y1={640} x2={1560} y2={590} color="kin" width={5} opacity={night * 0.5} pulse={false} />
          </g>
          <rect x={120} y={180} width={1680} height={680} rx={26} fill="none" stroke={C.line} strokeWidth={3} />
          {/* termometer darat & laut */}
          <Thermo x={420} y0={360} y1={590} f={(TL - 5) / 40} color={tcol((TL - 13) / 24)} />
          <Thermo x={1380} y0={360} y1={640} f={(TS - 5) / 40} color={tcol((TS - 13) / 24)} />
          <Label x={540} y={400} size={32} color={tcol((TL - 13) / 24)} font="mono" weight={600} anchor="start">
            {`darat ${Math.round(TL)} °C`}
          </Label>
          <Label x={1260} y={400} size={32} color={tcol((TS - 13) / 24)} font="mono" weight={600} anchor="end">
            {`laut ${Math.round(TS)} °C`}
          </Label>
          {/* jejak suhu */}
          <rect x={160} y={720} width={1600} height={120} rx={14} fill="rgba(7,11,24,0.6)" />
          {[
            {A: 12, lag: 0.5, col: C.heat},
            {A: 1.2, lag: 1.0, col: C.water},
          ].map((s, k) => (
            <path
              key={k}
              d={Array.from({length: 81}, (_, i) => {
                const x = 200 + i * 19.5;
                const tt = th - ((80 - i) / 80) * TAU * 2.2;
                return `${i ? 'L' : 'M'}${x.toFixed(1)},${(780 - 4 * s.A * Math.sin(tt - s.lag)).toFixed(1)}`;
              }).join(' ')}
              fill="none"
              stroke={s.col}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
          <Label x={1740} y={738} size={22} color={C.heat} anchor="end" font="sans" weight={600}>
            darat
          </Label>
          <Label x={1740} y={822} size={22} color={C.water} anchor="end" font="sans" weight={600}>
            laut
          </Label>
        </g>
      </Stage>

      <Formula x={1490} y={300} p={c1} accent={C.kin} size={66} caption="m massa · c kalor jenis · ΔT kenaikan suhu">
        <Part p={hl1(6)} color={C.kin}>
          <V>Q</V>
        </Part>{' '}
        = <Part p={hl1(9)}>
          <V>m</V>
        </Part>{' '}
        <Part p={hl1(10)} color={C.gold}>
          <V>c</V>
        </Part>{' '}
        <Part p={hl1(11)} color={C.heat}>
          Δ<V>T</V>
        </Part>
      </Formula>
      <Formula x={1490} y={300} p={c2} accent={C.gold} size={60} caption="satuan: J/(kg·K)">
        <V color={C.gold}>c</V> ={' '}
        <Frac
          n={
            <V color={C.kin}>Q</V>
          }
          d={
            <>
              <V>m</V> Δ<V>T</V>
            </>
          }
        />
      </Formula>
      <Formula x={1490} y={300} p={c3} accent={C.gold} size={56} caption="kalor jenis, J/(kg·K)">
        <div>
          <V color={C.gold}>c</V>
          <sub style={{fontSize: '0.5em', fontFamily: FONT.sans}}>air</sub> ≈ <span style={{color: C.water}}>4200</span>
        </div>
        <div style={{opacity: besi3}}>
          <V color={C.gold}>c</V>
          <sub style={{fontSize: '0.5em', fontFamily: FONT.sans}}>besi</sub> ≈ <span style={{color: '#c5cce6'}}>450</span>
        </div>
      </Formula>
      <Formula x={1490} y={300} p={c4} accent={C.kin} size={56} caption="air 1 kg, ΔT = 10 K  ·  besi: ≈ 4,5 kJ">
        <V color={C.kin}>Q</V> = 1 · 4200 · 10 ≈ <span style={{color: C.kin}}>42 kJ</span>
      </Formula>
      <Note x={960} y={240} p={msg * p2} color={C.water} size={30}>
        <span style={{color: C.water}}>c</span> air besar → laut menyimpan panas &amp; meredam perubahan suhu
      </Note>
    </AbsoluteFill>
  );
};
