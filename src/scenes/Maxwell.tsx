import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, smoothPath} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Sqrt, Stream, Sub, Sup, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Sebaran Maxwell–Boltzmann untuk N₂ (m = 4,65×10⁻²⁶ kg):
// f(v) = 4π (m/2πkT)^{3/2} v² e^{−mv²/2kT} = (4/√π) v²/a³ · e^{−v²/a²}, a = v_puncak = √(2kT/m).
// 300 K: a = 422 m/s; 900 K: a = 731 m/s (= 422·√3). Luas di bawah kurva tetap 1 → kurva panas lebih rendah & lebar.
// Ambang contoh v_a = 1000 m/s (½mv² = 2,3×10⁻²⁰ J ≈ 14 kJ/mol). Fraksi v > v_a:
// erfc(x) + (2x/√π)e^{−x²}, x = v_a/a → 300 K: 1,06 % ("≈ 1 %"), 900 K: 29,1 % ("≈ 29 %").

const KB = 1.381e-23;
const M = 4.65e-26;
const vp = (T: number) => Math.sqrt((2 * KB * T) / M);
const fMB = (v: number, T: number) => {
  const a = vp(T);
  return (4 / Math.sqrt(Math.PI)) * ((v * v) / (a * a * a)) * Math.exp(-(v * v) / (a * a));
};

// sumbu grafik
const AX0 = 1010;
const AY0 = 800;
const AW = 760;
const AH = 400;
const VMAX = 1600;
const FMAX = 0.0023;
const gx = (v: number) => AX0 + (v / VMAX) * AW;
const gy = (f: number) => AY0 - (f / FMAX) * AH;
const VA = 1000;
const NB = 32;
const BINW = VMAX / NB;

// kotak molekul
const BX0 = 120;
const BX1 = 820;
const BY0 = 230;
const BY1 = 780;
const MR = 12;
const LO_X = BX0 + 6 + MR;
const HI_X = BX1 - 6 - MR;
const LO_Y = BY0 + 6 + MR;
const HI_Y = BY1 - 6 - MR;
const PXV = 0.26; // px/s per (m/s) — gerak lambat
const NMOL = 44;

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const foldD = (u: number, lo: number, hi: number) => {
  const L = hi - lo;
  const m = (((u - lo) % (2 * L)) + 2 * L) % (2 * L);
  return m < L ? {p: lo + m, d: 1} : {p: lo + 2 * L - m, d: -1};
};

const gauss = (k: number) => Math.sqrt(-2 * Math.log(Math.max(1e-6, rand(k)))) * Math.cos(2 * Math.PI * rand(k + 0.5));
const chi3 = (k: number) => Math.sqrt(gauss(k) ** 2 + gauss(k + 11.3) ** 2 + gauss(k + 23.7) ** 2);
const SIG300 = vp(300) / Math.SQRT2;
const MOLS = Array.from({length: NMOL}, (_, i) => {
  const v = SIG300 * chi3(i * 3.71 + 1); // laju nyata (m/s) pada 300 K
  const a = rand(i * 7.7 + 2) * Math.PI * 2;
  return {v, cx: Math.cos(a), cy: Math.sin(a), x0: LO_X + rand(i * 1.3 + 5) * (HI_X - LO_X), y0: LO_Y + rand(i * 2.9 + 8) * (HI_Y - LO_Y)};
});
const SLOW = MOLS.reduce((b, m, i) => (m.v < MOLS[b].v ? i : b), 0);
const FAST = MOLS.reduce((b, m, i) => (m.v > MOLS[b].v ? i : b), 0);

const speedCol = (v: number) => interpolateColors(v, [0, 350, 700, 1100], [C.pot, C.cyan, C.kin, C.heat]);

const curvePts = (T: number, v0 = 0, v1 = VMAX, n = 120): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const v = v0 + ((v1 - v0) * i) / n;
    return [gx(v), gy(fMB(v, T))];
  });

export const Maxwell: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---------- suhu: 300 K → 900 K (laju ∝ √T, sepotong linear dalam s = √(T/300)) ----------
  const ta = wordOf(2, 'suhu') - 0.2;
  const tb = ta + 2.6;
  const s = 1 + (Math.sqrt(3) - 1) * Math.min(1, Math.max(0, (t - ta) / (tb - ta)));
  const T = 300 * s * s;
  // τ = ∫ s dt
  const tau = t <= ta ? t : t <= tb ? ta + (t - ta) + ((Math.sqrt(3) - 1) * (t - ta) ** 2) / (2 * (tb - ta)) : ta + (tb - ta) * (1 + Math.sqrt(3)) / 2 + Math.sqrt(3) * (t - tb);
  const hot = (T - 300) / 600;

  // ---------- fase ----------
  const boxIn = ramp(t, -0.5, 0.6);
  const tagSF = win2(t, wordOf(0, 'lambat') - 0.3, cue(1) + 0.5);
  const tagFast = win2(t, wordOf(0, 'sangat') - 0.3, cue(1) + 0.5);
  const axesIn = ramp(t, cue(0) + 1.0, cue(0) + 1.8);
  const build = ramp(t, cue(0) + 1.6, wordOf(1, 'kurva') + 0.6, EASE_IN_OUT);
  const flying = Math.min(ramp(t, cue(0) + 1.4, cue(0) + 2.0), 1 - ramp(t, cue(1) + 5.5, cue(1) + 6.5, EASE_IN_OUT));
  const curveP = ramp(t, wordOf(1, 'kurva') - 0.2, wordOf(1, 'kurva') + 1.6, EASE_IN_OUT);
  const histDim = mix(0.85, 0.35, ramp(t, wordOf(1, 'memuncak'), wordOf(1, 'memuncak') + 1));
  const peakHi = win2(t, wordOf(1, 'memuncak') - 0.3, cue(2));
  const tailHi = win2(t, wordOf(1, 'ekor') - 0.3, cue(2) + 0.3);
  const ghost = ramp(t, ta - 0.3, ta + 0.4);
  const shiftLbl = Math.min(ramp(t, wordOf(2, 'kanan') - 0.3, wordOf(2, 'kanan') + 0.5), 1 - ramp(t, cue(3) - 0.2, cue(3) + 0.5, EASE_IN_OUT));
  const wideLbl = ramp(t, wordOf(2, 'melebar') - 0.3, wordOf(2, 'melebar') + 0.5);
  const thr = ramp(t, cue(3) + 0.1, cue(3) + 0.8);
  const tailFill = ramp(t, wordOf(3, 'ekor') - 0.2, wordOf(3, 'ekor') + 0.8);
  const tailThick = ramp(t, wordOf(2, 'ekor') - 0.3, wordOf(2, 'ekor') + 0.6);
  const react = ramp(t, wordOf(3, 'aktivasi') - 0.3, wordOf(3, 'aktivasi') + 0.6);
  const pctIn = ramp(t, wordOf(3, 'cukup') - 0.3, wordOf(3, 'cukup') + 0.5);

  // ---------- molekul ----------
  const mols = MOLS.map((m, i) => {
    const vx = m.v * PXV * m.cx;
    const vy = m.v * PXV * m.cy;
    const fx = foldD(m.x0 + vx * tau, LO_X, HI_X);
    const fy = foldD(m.y0 + vy * tau, LO_Y, HI_Y);
    const vNow = m.v * s;
    return {x: fx.p, y: fy.p, sx: -fx.d * vx * s * 0.16, sy: -fy.d * vy * s * 0.16, vNow, i};
  });

  // ---------- histogram ----------
  const bars = Array.from({length: NB}, (_, i) => {
    const v = (i + 0.5) * BINW;
    const f = fMB(v, T);
    const noise = 1 + 0.45 * (1 - build) * (rand(i * 4.3 + 1) - 0.5) * 2 + 0.03 * Math.sin(t * 2.3 + i * 1.7);
    return {x: gx(i * BINW), w: (BINW / VMAX) * AW, h: Math.max(0, (f / FMAX) * AH * build * noise), v};
  });

  // butir yang terbang dari kotak ke batang histogram
  const NF = 12;
  const flyers = Array.from({length: NF}, (_, i) => {
    const raw = t * 0.55 + i / NF;
    const k = Math.floor(raw);
    const ph = raw - k;
    const v = Math.min(VMAX - 10, vp(T) / Math.SQRT2 * chi3(i * 13.1 + k * 7.3 + 2));
    const bi = Math.floor(v / BINW);
    const ex = gx((bi + 0.5) * BINW);
    const ey = AY0 - (bars[bi]?.h ?? 0) - 6;
    const sx = BX1 - 10;
    const sy = BY0 + 80 + rand(i * 3.3 + k * 1.7) * 400;
    const q = ramp(ph, 0, 1, EASE_IN_OUT);
    const mx = (sx + ex) / 2;
    const my = Math.min(sy, ey) - 140;
    const x = (1 - q) ** 2 * sx + 2 * (1 - q) * q * mx + q * q * ex;
    const y = (1 - q) ** 2 * sy + 2 * (1 - q) * q * my + q * q * ey;
    return {x, y, op: cyc(ph), col: speedCol(v), i};
  });

  // ---------- kurva ----------
  const curCol = interpolateColors(hot, [0, 1], [C.cyan, C.heat]);
  const curD = smoothPath(curvePts(T));
  const ghostD = smoothPath(curvePts(300));
  const areaD = `${curD} L${gx(VMAX)},${AY0} L${gx(0)},${AY0} Z`;
  const tailCur = smoothPath(curvePts(T, VA, VMAX, 40));
  const tailCurD = `${tailCur} L${gx(VMAX)},${AY0} L${gx(VA)},${AY0} Z`;
  const tail300 = smoothPath(curvePts(300, VA, VMAX, 40));
  const tail300D = `${tail300} L${gx(VMAX)},${AY0} L${gx(VA)},${AY0} Z`;
  const pkX = gx(vp(T));
  const pkY = gy(fMB(vp(T), T));
  const pk300X = gx(vp(300));
  const pk300Y = gy(fMB(vp(300), 300));
  // tanda lebar setengah puncak (FWHM) kurva sekarang
  const halfW = (() => {
    const a = vp(T);
    // v²e^{−v²/a²} = ½·a²/e → u = v/a: u²e^{1−u²} = ½ → u ≈ 0,4816 dan 1,6366 (konstan)
    return [0.4816 * a, 1.6366 * a];
  })();

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="mx-box">
            <rect x={BX0 + 5} y={BY0 + 5} width={BX1 - BX0 - 10} height={BY1 - BY0 - 10} rx={18} />
          </clipPath>
          <linearGradient id="mx-legend" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.pot} />
            <stop offset="33%" stopColor={C.cyan} />
            <stop offset="66%" stopColor={C.kin} />
            <stop offset="100%" stopColor={C.heat} />
          </linearGradient>
          <linearGradient id="mx-tail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity={0.85} />
            <stop offset="100%" stopColor={C.gold} stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {/* ===================== kotak molekul ===================== */}
        <g opacity={boxIn}>
          <ellipse cx={(BX0 + BX1) / 2} cy={BY1 + 26} rx={360} ry={14} fill="#000" opacity={0.35} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={22} fill="#0c1634" fillOpacity={0.9} />
          <Glow x={(BX0 + BX1) / 2} y={(BY0 + BY1) / 2} r={420} color="heat" opacity={hot * 0.35} />
          <g clipPath="url(#mx-box)">
            {mols.map((m) => {
              const col = speedCol(m.vNow);
              const gold = ramp(m.vNow, VA - 60, VA + 60, (x) => x) * react;
              return (
                <g key={m.i}>
                  <line x1={m.x} y1={m.y} x2={m.x + m.sx} y2={m.y + m.sy} stroke={col} strokeWidth={8} strokeLinecap="round" opacity={0.28} />
                  {gold > 0.01 ? <circle cx={m.x} cy={m.y} r={22} fill="none" stroke={C.gold} strokeWidth={3} opacity={gold} /> : null}
                  {gold > 0.01 ? <circle cx={m.x} cy={m.y} r={30} fill="url(#soft-gold)" opacity={gold} /> : null}
                  <circle cx={m.x} cy={m.y} r={MR} fill={col} />
                  <circle cx={m.x - 3.5} cy={m.y - 4} r={4} fill="#fff" opacity={0.55} />
                </g>
              );
            })}
          </g>
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={22} fill="none" stroke="#c9d4f5" strokeWidth={6} />
          {/* penanda molekul lambat & sangat cepat */}
          {[
            {i: SLOW, op: tagSF, txt: 'lambat', col: C.pot},
            {i: FAST, op: tagFast, txt: 'sangat cepat', col: C.heat},
          ].map(({i, op, txt, col}) =>
            op > 0.01 ? (
              <g key={txt} opacity={op}>
                <circle cx={mols[i].x} cy={mols[i].y} r={26 + 3 * Math.sin(t * 5)} fill="none" stroke={col} strokeWidth={3} />
                <Label x={mols[i].x} y={mols[i].y - 50} size={28} weight={600} color={col}>
                  {txt}
                </Label>
              </g>
            ) : null,
          )}
          <rect x={BX0 + 120} y={826} width={BX1 - BX0 - 240} height={14} rx={7} fill="url(#mx-legend)" opacity={0.9} />
          <Label x={BX0 + 104} y={833} size={24} color={C.pot} anchor="end">
            lambat
          </Label>
          <Label x={BX1 - 104} y={833} size={24} color={C.heat} anchor="start">
            cepat
          </Label>
          <Label x={BX1} y={BY0 - 30} size={30} font="mono" weight={600} color={curCol} anchor="end">
            T = {Math.round(T)} K
          </Label>
        </g>

        {/* ===================== butir terbang → histogram ===================== */}
        <g opacity={flying}>
          {flyers.map((f) => (
            <g key={f.i} opacity={f.op}>
              <circle cx={f.x} cy={f.y} r={16} fill="url(#soft-cyan)" />
              <circle cx={f.x} cy={f.y} r={6} fill={f.col} />
            </g>
          ))}
        </g>

        {/* ===================== grafik ===================== */}
        <g opacity={axesIn}>
          {[400, 800, 1200, 1600].map((v) => (
            <g key={v}>
              <line x1={gx(v)} y1={AY0 - 6} x2={gx(v)} y2={AY0 + 6} stroke={C.muted} strokeWidth={2} />
              <Label x={gx(v)} y={AY0 + 28} size={22} font="mono" color={C.muted}>
                {v}
              </Label>
            </g>
          ))}
          <line x1={AX0} y1={AY0} x2={AX0 + AW + 30} y2={AY0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={AX0} y1={AY0 + 8} x2={AX0} y2={AY0 - AH - 20} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <Label x={AX0 + AW + 10} y={AY0 + 62} size={24} color={C.muted} anchor="end">
            laju v (m/s)
          </Label>
          <Label x={AX0 + 16} y={AY0 - AH - 14} size={26} font="serif" italic anchor="start" color={C.ink}>
            f(v) · jumlah molekul
          </Label>
        </g>

        {/* batang histogram */}
        <g opacity={axesIn * histDim}>
          {bars.map((b, i) => (
            <rect key={i} x={b.x + 1.5} y={AY0 - b.h} width={b.w - 3} height={b.h} rx={3} fill={speedCol(b.v)} opacity={0.75} />
          ))}
        </g>

        {/* bayangan kurva 300 K */}
        <g opacity={ghost}>
          <path d={ghostD} fill="none" stroke={C.pot} strokeWidth={3.5} strokeDasharray="10 8" />
          <Label x={pk300X - 30} y={pk300Y - 30} size={28} font="mono" weight={600} color={C.pot} anchor="end">
            300 K
          </Label>
        </g>

        {/* kurva sekarang */}
        <path d={areaD} fill={curCol} opacity={0.1 * curveP} />
        <DrawCurve d={curD} p={curveP} color={curCol} />
        <Label x={pkX + 40} y={pkY - 30} size={28} font="mono" weight={600} color={curCol} anchor="start" opacity={ghost * ramp(T, 330, 420)}>
          {Math.round(T / 10) * 10} K
        </Label>
        {/* puncak & ekor (baris 1) */}
        <g opacity={peakHi * (1 - ghost)}>
          <circle cx={pk300X} cy={pk300Y} r={12 + 3 * Math.sin(t * 5)} fill="none" stroke={C.cyan} strokeWidth={3} />
          <Label x={pk300X + 26} y={pk300Y - 34} size={26} color={C.cyan} anchor="start">
            puncak ≈ 422 m/s
          </Label>
        </g>
        <g opacity={tailHi * (1 - ghost)}>
          <Arrow x1={gx(1050)} y1={gy(0.0009)} x2={gx(1250)} y2={gy(0.00012)} color="cyan" width={4} />
          <Label x={gx(1060)} y={gy(0.0012)} size={26} color={C.cyan} anchor="start">
            ekor panjang
          </Label>
        </g>
        {/* pergeseran & pelebaran (baris 2) */}
        <g opacity={shiftLbl}>
          <Arrow x1={pk300X + 6} y1={pk300Y + 24} x2={Math.max(pk300X + 8, pkX - 6)} y2={pk300Y + 24} color="heat" width={5} pulse={false} />
          <Label x={(pk300X + pkX) / 2 + 10} y={pk300Y + 56} size={26} color={C.heat} opacity={ramp(pkX - pk300X, 60, 140)}>
            bergeser
          </Label>
        </g>
        <g opacity={wideLbl * (1 - thr)}>
          <line x1={gx(halfW[0])} x2={gx(halfW[1])} y1={(pkY + AY0) / 2} y2={(pkY + AY0) / 2} stroke={C.heat} strokeWidth={3} markerStart="url(#arrow-heat)" markerEnd="url(#arrow-heat)" />
          <Label x={gx(vp(T))} y={(pkY + AY0) / 2 + 30} size={26} color={C.heat}>
            melebar
          </Label>
        </g>
        <g opacity={tailThick * (1 - thr)}>
          <Twinkles x={gx(1250)} y={AY0 - 50} rx={120} ry={40} n={4} color="heat" />
        </g>

        {/* ambang Eₐ & ekor berarsir (baris 3) */}
        <g opacity={thr}>
          <path d={tail300D} fill={C.pot} opacity={0.55 * tailFill} />
          <path d={tailCurD} fill="url(#mx-tail)" opacity={tailFill} />
          {Array.from({length: 8}, (_, i) => {
            const ph = (t * 0.4 + i / 8) % 1;
            const v = VA + 40 + ((i * 83) % 520);
            const top = gy(fMB(v, T));
            return <circle key={i} cx={gx(v)} cy={AY0 - ph * (AY0 - top)} r={3.5} fill="#fff" opacity={cyc(ph) * 0.6 * tailFill} />;
          })}
          <line x1={gx(VA)} x2={gx(VA)} y1={AY0} y2={AY0 - AH + 30} stroke={C.gold} strokeWidth={3.5} strokeDasharray="12 8" />
          <Label x={gx(VA)} y={AY0 - AH + 6} size={30} font="serif" italic weight={600} color={C.gold}>
            E<TSub>a</TSub>
          </Label>
          <Label x={gx(VA) + 18} y={AY0 - AH + 56} size={24} color={C.gold} anchor="start">
            cukup energi →
          </Label>
          <g opacity={pctIn}>
            <Label x={gx(1310)} y={gy(0.0013)} size={30} font="mono" weight={600} color={C.gold}>
              900 K: ≈ 29 %
            </Label>
            <Label x={gx(1310)} y={gy(0.00106)} size={26} font="mono" color={C.pot}>
              300 K: ≈ 1 %
            </Label>
          </g>
          <Ripple x={gx(1150)} y={AY0 - 50} p={ramp(t, wordOf(3, 'aktivasi'), wordOf(3, 'aktivasi') + 1.4)} r={160} color="gold" />
        </g>

        <Motes x={1390} y={600} rx={420} ry={240} n={16} color="cyan" opacity={0.3 * axesIn} seed={5} />
        <Stream
          pts={[
            [BX1 - 20, 520],
            [910, 470],
            [gx(1150), AY0 - 60],
          ]}
          color="gold"
          n={6}
          speed={0.45}
          r={6}
          opacity={react * 0.8}
        />
      </Stage>

      {/* ===================== kartu rumus ===================== */}
      <Formula x={1390} y={262} p={slot(t, wordOf(1, 'maxwell') - 0.2, ta)} accent={C.cyan} size={58} caption="sebaran Maxwell–Boltzmann · N₂">
        <V>f</V>(<V>v</V>) ∝ <V>v</V>
        <Sup>2</Sup>
        &nbsp;<V>e</V>
        <Sup>
          −<V>m</V>
          <V>v</V>²/2<V color="gold">k</V>
          <V color="heat">T</V>
        </Sup>
      </Formula>
      <Formula x={1390} y={262} p={slot(t, ta, cue(3) + 0.1)} accent={C.heat} size={56} caption="300 K: 422 m/s → 900 K: 731 m/s">
        <V>v</V>
        <Sub>puncak</Sub> ={' '}
        <Sqrt>
          <Frac
            n={
              <>
                2<V color="gold">k</V>
                <V color="heat">T</V>
              </>
            }
            d={<V>m</V>}
            size={0.78}
          />
        </Sqrt>{' '}
        ∝ <Sqrt>
          <V color="heat">T</V>
        </Sqrt>
      </Formula>
      <Formula x={1390} y={262} p={slot(t, cue(3) + 0.1, dur + 2)} accent={C.gold} size={60} caption="hanya molekul di ekor yang bisa bereaksi">
        <Frac n="1" d="2" size={0.7} />
        <V>m</V>
        <V>v</V>
        <Sup>2</Sup> ≥ <Tint c="gold">
          <V>E</V>
          <Sub>a</Sub>
        </Tint>
      </Formula>
    </AbsoluteFill>
  );
};

/** Kurva yang tergambar (pathLength tetap) dengan pendar garis. */
const DrawCurve: React.FC<{d: string; p: number; color: string}> = ({d, p, color}) =>
  p <= 0.001 ? null : (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={14} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - p)} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={5} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - p)} strokeLinecap="round" />
    </g>
  );

/** Muncul di a lalu hilang menjelang b. */
function win2(t: number, a: number, b: number) {
  return Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.5, b, EASE_IN_OUT));
}
