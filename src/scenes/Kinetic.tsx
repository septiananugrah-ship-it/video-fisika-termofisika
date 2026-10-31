import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sqrt, Stream, Sub, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Teori kinetik (AUDIT): pV = NkT; ⟨K⟩ = (3/2)kT; N₂ (m = 4,65×10⁻²⁶ kg) di 300 K: v_rms = √(3kT/m) = 517 m/s;
// pesawat jet jelajah ≈ 250 m/s. 1 L udara (100 kPa, 300 K): N = pV/kT = 10⁵·10⁻³/(1,381×10⁻²³·300) = 2,4×10²² molekul.
// Molekul memantul tertutup (posisi "dilipat" per frame). Laju ∝ √T: waktu molekul τ(t) = ∫ √(T/300) dt (sepotong linear, tanpa loncatan).

const BX0 = 120;
const BX1 = 780;
const BY0 = 220;
const BY1 = 700;
const MR = 16;
const LO_X = BX0 + 8 + MR;
const HI_X = BX1 - 8 - MR;
const LO_Y = BY0 + 8 + MR;
const HI_Y = BY1 - 8 - MR;
const NMOL = 40;

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const fold = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (m < L ? m : 2 * L - m);
};

/** ∫ s(u) du dengan s sepotong linear lewat titik kn (s konstan di luar). */
const warp = (t: number, kn: [number, number][]) => {
  let tau = kn[0][1] * Math.min(t, kn[0][0]);
  for (let i = 0; i < kn.length - 1; i++) {
    const [ta, sa] = kn[i];
    const [tb, sb] = kn[i + 1];
    if (t <= ta) break;
    const te = Math.min(t, tb);
    const se = sa + ((sb - sa) * (te - ta)) / (tb - ta);
    tau += ((sa + se) / 2) * (te - ta);
  }
  const last = kn[kn.length - 1];
  if (t > last[0]) tau += last[1] * (t - last[0]);
  return tau;
};
const sAt = (t: number, kn: [number, number][]) => {
  if (t <= kn[0][0]) return kn[0][1];
  for (let i = 0; i < kn.length - 1; i++) {
    const [ta, sa] = kn[i];
    const [tb, sb] = kn[i + 1];
    if (t <= tb) return sa + ((sb - sa) * (t - ta)) / (tb - ta);
  }
  return kn[kn.length - 1][1];
};

// laju 3D bersebaran Maxwell (χ₃), arah acak di bidang layar
const gauss = (k: number) => Math.sqrt(-2 * Math.log(Math.max(1e-6, rand(k)))) * Math.cos(2 * Math.PI * rand(k + 0.5));
const MOLS = Array.from({length: NMOL}, (_, i) => {
  const sp = 62 * Math.sqrt(gauss(i * 3.1 + 1) ** 2 + gauss(i * 5.7 + 2) ** 2 + gauss(i * 8.3 + 3) ** 2);
  const a = rand(i * 7.7 + 2) * Math.PI * 2;
  return {
    x0: LO_X + rand(i * 1.3 + 5) * (HI_X - LO_X),
    y0: LO_Y + rand(i * 2.9 + 8) * (HI_Y - LO_Y),
    vx: sp * Math.cos(a),
    vy: sp * Math.sin(a),
    rot0: rand(i * 5.3) * 360,
    w: (rand(i * 9.1) - 0.5) * 260,
  };
});

/** Molekul diatomik (N₂) toska. */
const Diatom: React.FC<{x: number; y: number; rot: number; s?: number; op?: number}> = ({x, y, rot, s = 1, op = 1}) => {
  const a = (rot * Math.PI) / 180;
  const dx = Math.cos(a) * 7 * s;
  const dy = Math.sin(a) * 7 * s;
  const r = 8.5 * s;
  return (
    <g opacity={op}>
      <circle cx={x - dx} cy={y - dy} r={r} fill={C.cyan} stroke="#bff1ff" strokeWidth={1.2} />
      <circle cx={x + dx} cy={y + dy} r={r} fill={C.cyan} stroke="#bff1ff" strokeWidth={1.2} />
      <circle cx={x - dx - r * 0.3} cy={y - dy - r * 0.35} r={r * 0.33} fill="#fff" opacity={0.6} />
      <circle cx={x + dx - r * 0.3} cy={y + dy - r * 0.35} r={r * 0.33} fill="#fff" opacity={0.6} />
    </g>
  );
};

/** Pesawat jet sederhana (menghadap kanan). */
const Jet: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g transform={`translate(${x} ${y + 2 * Math.sin(t * 2.1)})`}>
    {[0, 1, 2].map((i) => {
      const ph = (t * 1.6 + i / 3) % 1;
      return <line key={i} x1={-70 - ph * 60} x2={-40 - ph * 60} y1={-10 + i * 10} y2={-10 + i * 10} stroke="#dfe7ff" strokeWidth={2.5} strokeLinecap="round" opacity={cyc(ph) * 0.6} />;
    })}
    <path d="M-46,-6 L30,-8 Q52,-6 58,0 Q52,6 30,8 L-46,6 Z" fill="#dfe7ff" />
    <path d="M-6,-6 L-24,-34 L-12,-34 L18,-6 Z" fill="#aeb9dc" />
    <path d="M-6,6 L-24,34 L-12,34 L18,6 Z" fill="#aeb9dc" />
    <path d="M-46,-5 L-56,-22 L-46,-22 L-34,-5 Z" fill="#aeb9dc" />
    <circle cx={40} cy={-2} r={3.2} fill={C.pot} />
  </g>
);

export const Kinetic: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---------- suhu: 300 K → 600 K ("suhu menentukan…") → 300 K ("bergantung pada suhu") ----------
  const a1 = wordOf(1, 'suhu') - 0.2;
  const b1 = wordOf(3, 'bergantung') - 0.1;
  const KN: [number, number][] = [
    [a1, 1],
    [a1 + 1.8, Math.SQRT2],
    [b1, Math.SQRT2],
    [b1 + 2.0, 1],
  ];
  const tau = warp(t, KN);
  const sp = sAt(t, KN);
  const T = 300 * sp * sp;
  const hotness = (T - 300) / 300;

  // ---------- fase ----------
  const boxIn = ramp(t, -0.5, 0.6);
  const noteN = slot(t, wordOf(0, 'triliunan') - 0.4, cue(1) + 0.4);
  const knobIn = ramp(t, cue(1) - 0.3, cue(1) + 0.5);
  const tWall = wordOf(1, 'dinding');
  const wallHi = ramp(t, wordOf(1, 'tumbukan') - 0.3, wordOf(1, 'tumbukan') + 0.4);
  const graphIn = ramp(t, wordOf(1, 'tekanan') - 0.2, wordOf(1, 'tekanan') + 0.6);
  const graphOut = 1 - ramp(t, cue(4) - 0.2, cue(4) + 0.5, EASE_IN_OUT);
  const kBarIn = ramp(t, cue(3) - 0.2, cue(3) + 0.6);
  const raceIn = ramp(t, cue(4) + 0.2, cue(4) + 0.9);
  const tRace = wordOf(4, 'lima');
  const race = ramp(t, tRace - 0.4, tRace + 2.6, (x) => x);
  const jetLbl = ramp(t, wordOf(4, 'pesawat') - 0.3, wordOf(4, 'pesawat') + 0.4);
  const twoX = ramp(t, wordOf(4, 'pesawat') + 0.1, wordOf(4, 'pesawat') + 0.8);

  // ---------- molekul ----------
  const mols = MOLS.map((m, i) => {
    const x = fold(m.x0 + m.vx * tau, LO_X, HI_X);
    const y = fold(m.y0 + m.vy * tau, LO_Y, HI_Y);
    const dx = Math.min(x - LO_X, HI_X - x);
    const dy = Math.min(y - LO_Y, HI_Y - y);
    const hit = Math.max(0, 1 - Math.min(dx, dy) / 18);
    return {x, y, rot: m.rot0 + m.w * tau, hit, dx, dy, i};
  });
  const tr = MOLS[0];
  const trail = Array.from({length: 6}, (_, k) => {
    const tt = warp(t - (k + 1) * 0.05, KN);
    return [fold(tr.x0 + tr.vx * tt, LO_X, HI_X), fold(tr.y0 + tr.vy * tt, LO_Y, HI_Y)] as [number, number];
  });

  // ---------- pengukur tekanan ----------
  const gx = 890;
  const gy = 300;
  const needle = ((-105 + 80 * (T / 300 - 1) * 1.1 + 40 + 3 * Math.sin(t * 9.1) + 1.5 * Math.sin(t * 5.3)) * Math.PI) / 180;

  // ---------- grafik gaya pada dinding ----------
  const GX0 = 1040;
  const GX1 = 1790;
  const GY = 770;
  const H0 = 70;
  const NS = 90;
  const scroll = Math.floor(t * 24);
  let spikes = '';
  for (let i = 0; i < NS; i++) {
    const j = i + scroll;
    if (rand(j * 1.37 + 3) > 0.26 * sp) continue;
    const h = 105 * sp * (0.5 + rand(j * 7.71 + 9));
    const x = GX1 - (i / (NS - 1)) * (GX1 - GX0) - (t * 24 - scroll) * ((GX1 - GX0) / (NS - 1));
    if (x < GX0) continue;
    spikes += `M${x.toFixed(1)},${GY} V${(GY - h).toFixed(1)} `;
  }
  const avgY = GY - H0 * sp * sp;

  // ---------- balapan ----------
  const RX0 = 1060;
  const SC = 1.36; // px per (m/s)
  const vN = 517;
  const vJ = 250;
  const lenN = vN * SC * race;
  const lenJ = vJ * SC * race;

  const knobA = -130 + 260 * Math.min(1, (T - 200) / 500);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="kin-box">
            <rect x={BX0 + 6} y={BY0 + 6} width={BX1 - BX0 - 12} height={BY1 - BY0 - 12} rx={18} />
          </clipPath>
          <linearGradient id="kin-heat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.heat} stopOpacity={0.9} />
            <stop offset="100%" stopColor={C.kin} stopOpacity={0.2} />
          </linearGradient>
        </defs>

        {/* ===================== kotak gas ===================== */}
        <g opacity={boxIn}>
          <ellipse cx={(BX0 + BX1) / 2} cy={BY1 + 46} rx={360} ry={16} fill="#000" opacity={0.35} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={24} fill="#0c1634" fillOpacity={0.9} />
          <rect x={BX0 + 20} y={BY0 + 20} width={BX1 - BX0 - 40} height={BY1 - BY0 - 40} rx={16} fill="url(#soft-cyan)" opacity={0.18} />
          {/* pemanas di dasar: menyala sesuai T */}
          <rect x={BX0 + 40} y={BY1 + 8} width={BX1 - BX0 - 80} height={16} rx={8} fill="#2a2f4f" />
          <rect x={BX0 + 40} y={BY1 + 8} width={BX1 - BX0 - 80} height={16} rx={8} fill="url(#kin-heat)" opacity={Math.max(0, hotness)} />
          <Glow x={(BX0 + BX1) / 2} y={BY1 + 10} r={300} color="heat" opacity={Math.max(0, hotness) * 0.45} />
          <g clipPath="url(#kin-box)">
            {mols.map((m) => (
              <g key={m.i}>
                {m.hit > 0.01 ? <circle cx={m.x} cy={m.y} r={26} fill="url(#soft-press)" opacity={m.hit * (0.4 + 0.6 * wallHi)} /> : null}
                <Diatom x={m.x} y={m.y} rot={m.rot} />
              </g>
            ))}
            {trail.map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r={7 * (1 - k / 7)} fill={C.cyan} opacity={0.35 * (1 - k / 6)} />
            ))}
          </g>
          {/* titik tumbukan menyala merah muda di dinding (lebih panas → lebih terang) */}
          {mols.map((m) => {
            if (m.hit <= 0.02) return null;
            const op = m.hit * wallHi * Math.min(1, 0.55 + 0.45 * sp * sp);
            const horiz = m.dx < m.dy;
            const wx = horiz ? (m.x - LO_X < HI_X - m.x ? BX0 + 4 : BX1 - 4) : m.x;
            const wy = horiz ? m.y : m.y - LO_Y < HI_Y - m.y ? BY0 + 4 : BY1 - 4;
            const L = 16 + 10 * sp;
            return horiz ? (
              <line key={m.i} x1={wx} x2={wx} y1={wy - L} y2={wy + L} stroke={C.press} strokeWidth={6} strokeLinecap="round" opacity={op} />
            ) : (
              <line key={m.i} x1={wx - L} x2={wx + L} y1={wy} y2={wy} stroke={C.press} strokeWidth={6} strokeLinecap="round" opacity={op} />
            );
          })}
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={24} fill="none" stroke="#c9d4f5" strokeWidth={8} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={24} fill="none" stroke={C.press} strokeWidth={8} opacity={0.35 * wallHi * (0.6 + 0.4 * Math.sin(t * 6))} />
          <Ripple x={BX1} y={460} p={ramp(t, tWall - 0.2, tWall + 1.3)} r={150} color="press" />
        </g>

        {/* ===================== pengukur tekanan ===================== */}
        <g opacity={boxIn}>
          <rect x={BX1} y={gy - 6} width={gx - BX1 - 40} height={12} fill="#7d8bb5" />
          <circle cx={gx} cy={gy} r={50} fill="#0f1838" stroke="#dfe7ff" strokeWidth={4} />
          {Array.from({length: 9}, (_, i) => {
            const a = ((-120 + i * 30) * Math.PI) / 180;
            return <line key={i} x1={gx + 34 * Math.sin(a)} y1={gy - 34 * Math.cos(a)} x2={gx + 43 * Math.sin(a)} y2={gy - 43 * Math.cos(a)} stroke={C.muted} strokeWidth={2} />;
          })}
          <line x1={gx} y1={gy} x2={gx + 38 * Math.sin(needle)} y2={gy - 38 * Math.cos(needle)} stroke={C.press} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={gx} cy={gy} r={6} fill={C.press} />
          <Label x={gx} y={gy + 76} size={30} font="serif" italic weight={600} color={C.press}>
            p
          </Label>
        </g>

        {/* ===================== kenop suhu + batang K rata-rata ===================== */}
        <g opacity={knobIn}>
          <circle cx={190} cy={812} r={44} fill="#141d40" stroke="#c9d4f5" strokeWidth={3} />
          {Array.from({length: 11}, (_, i) => {
            const a = ((-130 + i * 26) * Math.PI) / 180;
            return <line key={i} x1={190 + 50 * Math.sin(a)} y1={812 - 50 * Math.cos(a)} x2={190 + 57 * Math.sin(a)} y2={812 - 57 * Math.cos(a)} stroke={i > 5 ? C.heat : C.pot} strokeWidth={2.5} />;
          })}
          <g transform={`rotate(${knobA} 190 812)`}>
            <rect x={185} y={774} width={10} height={30} rx={5} fill={C.kin} />
          </g>
          <Label x={260} y={812} size={34} font="mono" weight={600} color={C.ink} anchor="start" opacity={1 - hotness}>
            T = {Math.round(T)} K
          </Label>
          <Label x={260} y={812} size={34} font="mono" weight={600} color={C.heat} anchor="start" opacity={hotness}>
            T = {Math.round(T)} K
          </Label>
        </g>
        <g opacity={kBarIn}>
          <Label x={520} y={772} size={26} color={C.kin} anchor="start">
            K rata-rata ∝ T
          </Label>
          <rect x={520} y={800} width={260} height={24} rx={12} fill="#141d40" stroke={C.kin} strokeWidth={2} />
          <rect x={524} y={804} width={(252 * T) / 600} height={16} rx={8} fill={C.kin} />
          <circle cx={524 + (252 * T) / 600} cy={812} r={14} fill="url(#soft-kin)" />
        </g>

        {/* ===================== grafik gaya dinding ===================== */}
        <g opacity={graphIn * graphOut}>
          <rect x={GX0 - 30} y={470} width={GX1 - GX0 + 60} height={GY - 440} rx={18} fill="#0b1330" opacity={0.7} stroke={C.line} strokeWidth={2} />
          <path d={spikes} stroke={C.press} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          <line x1={GX0} x2={GX1} y1={GY} y2={GY} stroke={C.muted} strokeWidth={2.5} />
          <line x1={GX0} x2={GX1} y1={avgY} y2={avgY} stroke={C.press} strokeWidth={3} strokeDasharray="12 8" />
          <Label x={GX0} y={500} size={26} color={C.muted} anchor="start">
            tumbukan pada dinding kanan
          </Label>
          <line x1={GX1 - 330} x2={GX1 - 290} y1={500} y2={500} stroke={C.press} strokeWidth={3} strokeDasharray="10 6" />
          <Label x={GX1} y={500} size={26} weight={600} color={C.press} anchor="end">
            tekanan p (rata-rata)
          </Label>
        </g>

        {/* ===================== balapan N₂ vs jet ===================== */}
        <g opacity={raceIn}>
          <Label x={RX0} y={500} size={30} weight={600} color={C.cyan} anchor="start">
            molekul N<TSub>2</TSub> (300 K)
          </Label>
          <rect x={RX0} y={530} width={740} height={40} rx={20} fill="#0f1838" stroke={C.line} strokeWidth={2} />
          <rect x={RX0} y={530} width={Math.max(0.1, lenN)} height={40} rx={20} fill={C.cyan} opacity={0.75} />
          <Stream pts={[[RX0 + 10, 550], [RX0 + Math.max(20, lenN - 20), 550]]} color="cyan" n={7} speed={1.1} r={5} jitter={2} opacity={Math.min(0.9, race * 18)} />
          <Diatom x={RX0 + lenN + 26} y={550 + 2 * Math.sin(t * 7)} rot={t * 400} s={1.4} />
          <Label x={RX0 + 740} y={500} size={30} font="mono" weight={600} color={C.cyan} anchor="end" opacity={ramp(race, 0.85, 1)}>
            ≈ 517 m/s
          </Label>

          <Label x={RX0} y={680} size={30} weight={600} color="#dfe7ff" anchor="start" opacity={jetLbl}>
            pesawat jet
          </Label>
          <rect x={RX0} y={710} width={740} height={40} rx={20} fill="#0f1838" stroke={C.line} strokeWidth={2} />
          <rect x={RX0} y={710} width={Math.max(0.1, lenJ)} height={40} rx={20} fill="#aeb9dc" opacity={0.6} />
          <Jet x={RX0 + lenJ + 50} y={730} t={t} />
          <Label x={RX0 + 340} y={790} size={30} font="mono" weight={600} color="#dfe7ff" anchor="end" opacity={ramp(race, 0.85, 1)}>
            ≈ 250 m/s
          </Label>
          <g opacity={twoX}>
            <line x1={RX0 + vJ * SC + 120} x2={RX0 + vN * SC + 26} y1={660} y2={660} stroke={C.gold} strokeWidth={3} strokeDasharray="8 6" />
            <Label x={(RX0 + vJ * SC + 120 + RX0 + vN * SC + 26) / 2} y={636} size={30} weight={600} color={C.gold}>
              ≈ 2× lebih cepat
            </Label>
          </g>
          <Twinkles x={RX0 + vN * SC} y={550} rx={60} ry={40} n={5} color="cyan" opacity={ramp(race, 0.9, 1)} />
          <Ripple x={RX0 + vN * SC + 26} y={550} p={ramp(t, tRace + 2.4, tRace + 3.7)} r={120} color="cyan" />
        </g>

        <Motes x={450} y={460} rx={360} ry={260} n={22} color="cyan" opacity={0.35 * boxIn} seed={4} />
      </Stage>

      {/* ===================== catatan & kartu rumus ===================== */}
      <Note x={1410} y={420} p={noteN} color={C.cyan} size={34}>
        1 liter udara ≈ 2,4 × 10<sup style={{fontSize: '0.62em', verticalAlign: '0.55em', lineHeight: 0}}>22</sup> molekul
      </Note>
      <Formula x={1410} y={300} p={slot(t, cue(2) + 0.2, cue(3) + 0.1)} accent={C.press} size={68} caption="k = 1,381 × 10⁻²³ J/K · tetapan Boltzmann">
        <V color="press">p</V>
        <V>V</V> = <V color="cyan">N</V>
        <V color="gold">k</V>
        <V color="heat">T</V>
      </Formula>
      <Formula x={1410} y={300} p={slot(t, cue(3) + 0.1, cue(4) + 0.1)} accent={C.kin} size={64} caption="energi kinetik rata-rata satu molekul">
        <Tint c="kin">
          ⟨<V>K</V>⟩
        </Tint>{' '}
        = <Frac n="3" d="2" /> <V color="gold">k</V>
        <V color="heat">T</V>
      </Formula>
      <Formula x={1410} y={300} p={slot(t, cue(4) + 0.1, dur + 2)} accent={C.cyan} size={58} caption="N₂ pada 300 K (m = 4,65 × 10⁻²⁶ kg)">
        <V>v</V>
        <Sub>rms</Sub> ={' '}
        <Sqrt>
          <Frac
            n={
              <>
                3<V color="gold">k</V>
                <V color="heat">T</V>
              </>
            }
            d={<V>m</V>}
            size={0.8}
          />
        </Sqrt>{' '}
        ≈ <Tint c="cyan">517 m/s</Tint>
      </Formula>
    </AbsoluteFill>
  );
};
