import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, smoothPath} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Sup, Tint, TSub, TSup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C} from '../theme';

// Faktor Boltzmann (AUDIT): N₂/N₁ = e^(−ΔE/kT); kT(300 K) = 4,14×10⁻²¹ J = 0,0259 eV ≈ 2,49 kJ/mol (1 eV = 96,485 kJ/mol).
// HCl: hν/kT ≈ 14 → e^(−13,8) ≈ 1×10⁻⁶. Rotasi: E_J = B·J(J+1), B ≈ 10,6 cm⁻¹ ≪ kT/hc ≈ 208 cm⁻¹ → B/kT ≈ 0,05;
// populasi N_J ∝ (2J+1)·e^(−B·J(J+1)/kT): naik lalu turun, puncak di J ≈ √(kT/2B) − ½ ≈ 2,7 → J = 3 (kualitatif).
// Tingkat kuantum = hijau (C.work).

const GREEN = C.work;
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

// ---------- dua tingkat ----------
const LX0 = 230;
const LX1 = 770;
const Y1 = 740;
const Y2 = 450;
const NDOT = 28;
const RANK = Array.from({length: NDOT}, (_, i) => i)
  .map((i) => ({i, r: rand(i * 4.77 + 2)}))
  .sort((a, b) => a.r - b.r)
  .reduce((acc, o, k) => {
    acc[o.i] = k;
    return acc;
  }, [] as number[]);

// ---------- tangga HCl ----------
const AXX = 470;
const E0 = 800; // tinggi v = 0 / J = 0
const KT = 34; // px per kT
const BKT = 0.05;
const JMAX = 16;
const popJ = (J: number) => (2 * J + 1) * Math.exp(-BKT * J * (J + 1));
const POPMAX = popJ(3);

// skala log peluang
const LGX = 1300;
const LGY0 = 475;
const LGD = 52; // px per dekade

export const Boltzmann: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---------- fase ----------
  const aIn = ramp(t, -0.4, 0.8);
  const aOut = 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.4, EASE_IN_OUT);
  const tHeat = wordOf(1, 'sebanding');
  const heatUp = ramp(t, tHeat - 1.2, tHeat + 1.0, EASE_IN_OUT);
  const heatDn = ramp(t, wordOf(1, 'minus') + 0.4, wordOf(1, 'minus') + 2.6, EASE_IN_OUT);
  const x = mix(3, mix(0.75, 3, heatDn), heatUp); // ΔE/kT
  const nUp = (NDOT * Math.exp(-x)) / (1 + Math.exp(-x));
  const plotIn = Math.min(ramp(t, cue(1) + 0.2, cue(1) + 0.9), 1 - ramp(t, cue(2) - 0.2, cue(2) + 0.4, EASE_IN_OUT));
  const blocks = ramp(t, wordOf(2, 'sekitar') - 0.2, wordOf(2, 'sekitar') + 1.4, EASE_IN_OUT);
  const ruler = ramp(t, cue(2) + 0.2, cue(2) + 1.0);
  const evMark = ramp(t, wordOf(2, 'elektronvolt') - 0.5, wordOf(2, 'elektronvolt') + 0.3);
  const kjMark = ramp(t, wordOf(2, 'kilojoule') - 0.5, wordOf(2, 'kilojoule') + 0.3);

  const bIn = ramp(t, cue(3) - 0.1, cue(3) + 0.8);
  const bOut = 1 - ramp(t, cue(5) - 0.4, cue(5) + 0.4, EASE_IN_OUT);
  const stack = ramp(t, wordOf(3, 'empat') - 0.3, wordOf(3, 'empat') + 2.2, (q) => q);
  const nStack = 14 * stack;
  const logIn = Math.min(ramp(t, wordOf(3, 'empat') - 0.4, wordOf(3, 'empat') + 0.3), 1 - ramp(t, cue(4) - 0.2, cue(4) + 0.4, EASE_IN_OUT));
  const millionP = ramp(t, wordOf(3, 'sejuta') - 0.4, wordOf(3, 'sejuta') + 0.4);
  const vib = Math.min(ramp(t, cue(3), cue(3) + 0.6), 1 - ramp(t, cue(4) - 0.3, cue(4) + 0.6, EASE_IN_OUT));
  const rotIn = ramp(t, cue(4) - 0.1, cue(4) + 0.8);
  const rotLv = ramp(t, wordOf(4, 'rapat') - 0.6, wordOf(4, 'rapat') + 1.2, (q) => q);
  const rotPop = ramp(t, wordOf(4, 'banyak') - 0.4, wordOf(4, 'banyak') + 1.6, EASE_IN_OUT);
  const vibDim = mix(1, 0.4, rotIn);

  const cIn = ramp(t, cue(5) - 0.1, cue(5) + 0.9);
  const arch = ramp(t, cue(5) + 0.1, cue(5) + 1.6, EASE_IN_OUT);
  const tBridge = wordOf(5, 'jembatan');

  // ---------- HCl bergetar lalu berputar ----------
  const hclA = rot(t, cue(4), 2.2) * rotIn; // sudut putar (rad)
  const bond = 92 + 9 * Math.sin(t * 2 * Math.PI * 1.1) * mix(1, 0.5, rotIn);
  const hx = 300;
  const hy = 360;
  const clX = hx - 0.28 * bond * Math.cos(hclA);
  const clY = hy - 0.28 * bond * Math.sin(hclA);
  const hX = hx + 0.72 * bond * Math.cos(hclA);
  const hY = hy + 0.72 * bond * Math.sin(hclA);

  // ---------- kurva e^(−x) ----------
  const PX0 = 1060;
  const PY0 = 800;
  const PW = 640;
  const PH = 300;
  const pxX = (u: number) => PX0 + (u / 5) * PW;
  const pyY = (r: number) => PY0 - r * PH;
  const expD = smoothPath(Array.from({length: 61}, (_, i) => [pxX((5 * i) / 60), pyY(Math.exp((-5 * i) / 60))] as [number, number]));

  // penggaris energi: 0..0,1 eV
  const RX0 = 1080;
  const RW = 660;
  const evX = (e: number) => RX0 + (e / 0.1) * RW;
  const KTEV = 0.0259;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===================== A: dua tingkat ===================== */}
        <g opacity={aIn * aOut}>
          {/* termometer */}
          <g>
            <rect x={120} y={400} width={36} height={330} rx={18} fill="#141d40" stroke="#c9d4f5" strokeWidth={3} />
            <circle cx={138} cy={758} r={32} fill={C.heat} stroke="#c9d4f5" strokeWidth={3} />
            <rect x={128} y={730 - 300 * mix(0.3, 0.9, (3 - x) / 2.25)} width={20} height={300 * mix(0.3, 0.9, (3 - x) / 2.25) + 10} rx={10} fill={C.heat} />
            <Glow x={138} y={758} r={90} color="heat" opacity={0.4 + 0.5 * ((3 - x) / 2.25)} />
            <Label x={138} y={366} size={30} font="serif" italic weight={600} color={C.heat}>
              T
            </Label>
          </g>
          {/* garis tingkat */}
          <line x1={LX0} x2={LX1} y1={Y1} y2={Y1} stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
          <line x1={LX0} x2={LX1} y1={Y2} y2={Y2} stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
          <line x1={LX0} x2={LX1} y1={Y1} y2={Y1} stroke={GREEN} strokeOpacity={0.2} strokeWidth={16} strokeLinecap="round" />
          <line x1={LX0} x2={LX1} y1={Y2} y2={Y2} stroke={GREEN} strokeOpacity={0.2} strokeWidth={16} strokeLinecap="round" />
          <Label x={LX0 - 14} y={Y1} size={30} font="serif" italic color={GREEN} anchor="end">
            E<TSub>1</TSub>
          </Label>
          <Label x={LX0 - 14} y={Y2} size={30} font="serif" italic color={GREEN} anchor="end">
            E<TSub>2</TSub>
          </Label>
          <Arrow x1={820} y1={Y1 - 8} x2={820} y2={Y2 + 14} color="work" width={4} both pulse={false} />
          <Label x={846} y={(Y1 + Y2) / 2} size={32} font="serif" italic weight={600} color={GREEN} anchor="start">
            ΔE
          </Label>
          {/* blok kT menumpuk di celah (baris 2): ΔE = 3 kT */}
          {[0, 1, 2].map((k) => {
            const p = ramp(blocks, k / 3, (k + 1) / 3);
            const hgt = (Y1 - Y2) / 3;
            return p > 0.001 ? (
              <g key={k} opacity={p}>
                <rect x={905} y={Y1 - (k + 1) * hgt + 3} width={70} height={hgt - 6} rx={8} fill={GREEN} fillOpacity={0.18 + 0.08 * (k % 2)} stroke={GREEN} strokeWidth={2} />
                <Label x={940} y={Y1 - (k + 0.5) * hgt} size={26} font="serif" italic color={GREEN}>
                  kT
                </Label>
              </g>
            ) : null;
          })}
          {/* populasi: titik molekul */}
          {Array.from({length: NDOT}, (_, i) => {
            const u = Math.max(0, Math.min(1, nUp - RANK[i]));
            // lompatan termal sesekali (naik sebentar lalu turun), halus
            const hopPh = (t * 0.23 + rand(i * 2.1) ) % 1;
            const hop = i % 7 === 3 ? Math.sin(Math.PI * Math.min(1, Math.max(0, (hopPh - 0.8) * 5))) * Math.exp(-x) * 2.2 : 0;
            const uu = Math.min(1, u + Math.min(1, hop) * (1 - u));
            const xx = LX0 + 22 + (i * (LX1 - LX0 - 44)) / (NDOT - 1) + 2.5 * Math.sin(t * 3.1 + i * 1.7);
            const yy = mix(Y1, Y2, uu) - 16 - 40 * Math.sin(Math.PI * uu) + 2 * Math.cos(t * 3.7 + i);
            return (
              <g key={i}>
                <circle cx={xx} cy={yy} r={20} fill="url(#soft-cyan)" opacity={0.7} />
                <circle cx={xx} cy={yy} r={8.5} fill={C.cyan} />
                <circle cx={xx - 2.5} cy={yy - 3} r={3} fill="#fff" opacity={0.6} />
              </g>
            );
          })}
          <Label x={(LX0 + LX1) / 2} y={Y2 - 70} size={28} font="mono" color={C.cyan}>
            {`atas ≈ ${Math.round(nUp)} dari ${NDOT}`}
          </Label>
        </g>

        {/* kurva e^(−ΔE/kT) */}
        <g opacity={plotIn * aOut}>
          <line x1={PX0} y1={PY0} x2={PX0 + PW + 30} y2={PY0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={PX0} y1={PY0 + 8} x2={PX0} y2={PY0 - PH - 30} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <path d={`${expD} L${pxX(5)},${PY0} L${PX0},${PY0} Z`} fill={GREEN} opacity={0.1} />
          <path d={expD} fill="none" stroke={GREEN} strokeWidth={5} />
          <line x1={pxX(x)} x2={pxX(x)} y1={PY0} y2={pyY(Math.exp(-x))} stroke={C.heat} strokeWidth={2.5} strokeDasharray="6 6" />
          <circle cx={pxX(x)} cy={pyY(Math.exp(-x))} r={11} fill={C.heat} />
          <circle cx={pxX(x)} cy={pyY(Math.exp(-x))} r={28} fill="url(#soft-heat)" />
          <Label x={PX0 + PW + 14} y={PY0 + 40} size={26} font="serif" italic color={C.ink} anchor="end">
            ΔE / kT
          </Label>
          <Label x={PX0 + 18} y={PY0 - PH - 24} size={26} font="serif" italic color={C.ink} anchor="start">
            N<TSub>2</TSub> / N<TSub>1</TSub>
          </Label>
          {[1, 2, 3, 4].map((u) => (
            <Label key={u} x={pxX(u)} y={PY0 + 26} size={22} font="mono" color={C.muted}>
              {u}
            </Label>
          ))}
          <Label x={pxX(x) + 24} y={pyY(Math.exp(-x)) - 30} size={24} color={C.heat} anchor="start" opacity={1 - ramp(x, 1.6, 2.6, (q) => q)}>
            T tinggi
          </Label>
          <Label x={pxX(x) + 24} y={pyY(Math.exp(-x)) - 30} size={24} color={C.pot} anchor="start" opacity={ramp(x, 1.6, 2.6, (q) => q)}>
            T rendah
          </Label>
        </g>

        {/* penggaris energi eV ↔ kJ/mol */}
        <g opacity={ruler * aOut}>
          <Label x={RX0} y={512} size={26} color={C.muted} anchor="start">
            skala energi
          </Label>
          <line x1={RX0} x2={RX0 + RW} y1={620} y2={620} stroke={C.muted} strokeWidth={3} />
          {[0, 0.02, 0.04, 0.06, 0.08, 0.1].map((e) => (
            <g key={e}>
              <line x1={evX(e)} x2={evX(e)} y1={606} y2={620} stroke={C.muted} strokeWidth={2} />
              <Label x={evX(e)} y={586} size={22} font="mono" color={C.muted}>
                {e.toFixed(2).replace('.', ',')}
              </Label>
            </g>
          ))}
          <Label x={RX0 + RW + 16} y={586} size={22} font="mono" color={C.muted} anchor="start">
            eV
          </Label>
          {[0, 2, 4, 6, 8].map((kj) => (
            <g key={kj}>
              <line x1={evX(kj / 96.485)} x2={evX(kj / 96.485)} y1={620} y2={634} stroke={C.muted} strokeWidth={2} />
              <Label x={evX(kj / 96.485)} y={656} size={22} font="mono" color={C.muted}>
                {kj}
              </Label>
            </g>
          ))}
          <Label x={RX0 + RW + 16} y={656} size={22} font="mono" color={C.muted} anchor="start">
            kJ/mol
          </Label>
          <rect x={RX0} y={612} width={evX(KTEV) - RX0} height={16} rx={8} fill={GREEN} opacity={0.85} />
          <circle cx={evX(KTEV)} cy={620} r={30} fill="url(#soft-work)" />
          <line x1={evX(KTEV)} x2={evX(KTEV)} y1={540} y2={710} stroke={GREEN} strokeWidth={3} strokeDasharray="6 6" />
          <Label x={evX(KTEV) + 12} y={548} size={28} font="mono" weight={600} color={GREEN} anchor="start" opacity={evMark}>
            kT ≈ 0,026 eV
          </Label>
          <Label x={evX(KTEV) + 12} y={700} size={28} font="mono" weight={600} color={GREEN} anchor="start" opacity={kjMark}>
            ≈ 2,5 kJ/mol
          </Label>
          <Twinkles x={evX(KTEV)} y={620} rx={50} ry={60} n={4} color="work" opacity={kjMark} />
        </g>

        {/* ===================== B: HCl, tangga getaran & rotasi ===================== */}
        <g opacity={bIn * bOut}>
          {/* molekul HCl */}
          <Glow x={hx} y={hy} r={150} color="work" opacity={0.35} />
          <line x1={clX} y1={clY} x2={hX} y2={hY} stroke="#cfd8f5" strokeWidth={8} strokeLinecap="round" />
          <circle cx={clX} cy={clY} r={ATOM.Cl.r * 0.9} fill={ATOM.Cl.fill} />
          <circle cx={clX - 12} cy={clY - 13} r={11} fill="#fff" opacity={0.4} />
          <circle cx={hX} cy={hY} r={ATOM.H.r * 0.8} fill={ATOM.H.fill} />
          <circle cx={hX - 7} cy={hY - 8} r={6} fill="#fff" opacity={0.6} />
          <Label x={clX} y={clY} size={26} weight={700} color="#0b2a16">
            Cl
          </Label>
          <Label x={hX} y={hY} size={22} weight={700} color="#1a2140">
            H
          </Label>
          <Label x={hx} y={hy + 110} size={30} weight={600} color={C.ink}>
            HCl
          </Label>
          <g opacity={rotIn}>
            <path d={`M${hx + 120},${hy - 40} A126,126 0 0 1 ${hx + 40},${hy + 120}`} fill="none" stroke={GREEN} strokeWidth={3} markerEnd="url(#arrow-work)" opacity={0.8} />
          </g>
          {/* legenda 1 kT */}
          <rect x={190} y={E0 - KT - 120} width={46} height={KT} rx={6} fill={GREEN} fillOpacity={0.25} stroke={GREEN} strokeWidth={2} />
          <Label x={250} y={E0 - KT / 2 - 120} size={26} font="serif" italic color={GREEN} anchor="start">
            = 1 kT
          </Label>
          <Label x={213} y={E0 - 62} size={22} color={C.muted}>
            (300 K)
          </Label>

          {/* sumbu energi */}
          <line x1={AXX} y1={E0 + 20} x2={AXX} y2={250} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <Label x={AXX} y={226} size={28} font="serif" italic color={C.ink}>
            E
          </Label>

          {/* tumpukan kT */}
          {Array.from({length: 14}, (_, k) => {
            const p = Math.max(0, Math.min(1, nStack - k));
            return p > 0.001 ? (
              <rect key={k} x={484} y={E0 - (k + 1) * KT + 2} width={34} height={(KT - 4) * p} rx={4} fill={GREEN} fillOpacity={0.22 + 0.1 * (k % 2)} stroke={GREEN} strokeWidth={1.5} opacity={vibDim} />
            ) : null;
          })}
          <Label x={501} y={E0 - 14 * KT - 26} size={26} font="mono" weight={600} color={GREEN} opacity={ramp(stack, 0.9, 1) * vibDim}>
            14 kT
          </Label>

          {/* tangga getaran */}
          <g opacity={vibDim}>
            <line x1={540} x2={780} y1={E0} y2={E0} stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
            <line x1={540} x2={780} y1={E0 - 14 * KT} y2={E0 - 14 * KT} stroke={GREEN} strokeWidth={5} strokeLinecap="round" strokeDasharray={undefined} />
            <Label x={660} y={E0 + 30} size={24} color={GREEN}>
              getaran v = 0
            </Label>
            <Label x={660} y={E0 - 14 * KT + 30} size={24} color={GREEN}>
              v = 1
            </Label>
            {Array.from({length: 12}, (_, i) => {
              const xx = 556 + i * 19.5 + 2 * Math.sin(t * 3 + i);
              return <circle key={i} cx={xx} cy={E0 - 14 + 1.5 * Math.cos(t * 4 + i * 1.3)} r={8} fill={C.cyan} />;
            })}
            {/* satu molekul sesekali tereksitasi (sangat jarang) */}
            {(() => {
              const ph = (t * 0.18) % 1;
              return <circle cx={700} cy={E0 - 14 * KT - 14} r={8} fill={C.gold} opacity={cyc(ph) * millionP} />;
            })()}
            <g opacity={millionP * vib}>
              <Label x={800} y={E0 - 14 * KT - 40} size={28} font="mono" weight={600} color={C.gold} anchor="start">
                ≈ 1 dari sejuta
              </Label>
            </g>
          </g>

          {/* skala log peluang (baris 3) */}
          <g opacity={logIn}>
            <line x1={LGX} y1={LGY0 - 10} x2={LGX} y2={LGY0 + 7 * LGD} stroke={C.muted} strokeWidth={3} />
            {[0, 2, 4, 6].map((d) => (
              <g key={d}>
                <line x1={LGX - 8} x2={LGX + 8} y1={LGY0 + d * LGD} y2={LGY0 + d * LGD} stroke={C.muted} strokeWidth={2} />
                <Label x={LGX - 18} y={LGY0 + d * LGD} size={26} font="mono" color={C.muted} anchor="end">
                  {d === 0 ? '1' : (
                    <>
                      10<TSup>−{d}</TSup>
                    </>
                  )}
                </Label>
              </g>
            ))}
            <Label x={LGX} y={LGY0 - 44} size={26} color={C.muted}>
              peluang di v = 1
            </Label>
            {(() => {
              const yy = LGY0 + nStack * 0.4343 * LGD;
              return (
                <g>
                  <line x1={LGX} x2={LGX} y1={LGY0} y2={yy} stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
                  <circle cx={LGX} cy={yy} r={12} fill={C.gold} />
                  <circle cx={LGX} cy={yy} r={30} fill="url(#soft-gold)" />
                  <Label x={LGX + 30} y={yy} size={26} font="mono" color={C.gold} anchor="start">
                    {`× e⁻¹ tiap kT`}
                  </Label>
                </g>
              );
            })()}
            <Ripple x={LGX} y={LGY0 + 14 * 0.4343 * LGD} p={ramp(t, wordOf(3, 'sejuta') - 0.1, wordOf(3, 'sejuta') + 1.3)} r={120} color="gold" />
          </g>

          {/* tangga rotasi (baris 4) */}
          <g opacity={rotIn}>
            <Label x={1060} y={E0 + 30} size={24} color={GREEN}>
              rotasi J
            </Label>
            {Array.from({length: JMAX + 1}, (_, J) => {
              const p = ramp(rotLv, J / (JMAX + 1), (J + 1) / (JMAX + 1));
              const y = E0 - KT * BKT * J * (J + 1);
              const pop = popJ(J) / POPMAX;
              return p > 0.001 ? (
                <g key={J} opacity={p}>
                  <line x1={960} x2={1160} y1={y} y2={y} stroke={GREEN} strokeWidth={2.5} opacity={0.35 + 0.65 * pop * rotPop + 0.3 * (1 - rotPop)} />
                </g>
              ) : null;
            })}
            <Label x={1170} y={E0 - KT * BKT * 16 * 17} size={22} font="mono" color={C.muted} anchor="start">
              J = 16
            </Label>
            <Label x={1170} y={E0 - KT * BKT * 10 * 11} size={22} font="mono" color={C.muted} anchor="start">
              J = 10
            </Label>
          </g>

          {/* grafik batang populasi rotasi */}
          <g opacity={rotIn}>
            <line x1={1250} x2={1790} y1={E0} y2={E0} stroke={C.muted} strokeWidth={3} />
            {Array.from({length: 16}, (_, J) => {
              const hgt = (popJ(J) / POPMAX) * 330 * ramp(rotPop, J / 24, J / 24 + 0.4);
              const bx = 1262 + J * 33;
              return (
                <g key={J}>
                  <rect x={bx} y={E0 - hgt} width={26} height={hgt} rx={5} fill={C.cyan} opacity={0.8} />
                  <rect x={bx + 4} y={E0 - hgt + 4} width={6} height={Math.max(0, hgt - 8)} rx={3} fill="#fff" opacity={0.25} />
                  {J % 5 === 0 ? (
                    <Label x={bx + 13} y={E0 + 26} size={22} font="mono" color={C.muted}>
                      {J}
                    </Label>
                  ) : null}
                </g>
              );
            })}
            <Label x={1808} y={E0 + 26} size={24} font="serif" italic color={C.ink} anchor="start">
              J
            </Label>
            <Label x={1262} y={E0 - 380} size={26} color={C.cyan} anchor="start">
              populasi tiap J: naik, lalu turun
            </Label>
            <Twinkles x={1370} y={E0 - 330} rx={70} ry={30} n={4} color="cyan" opacity={rotPop} />
          </g>
        </g>

        {/* ===================== C: jembatan ===================== */}
        <g opacity={cIn}>
          {/* pilar kiri: termodinamika */}
          <rect x={300} y={560} width={220} height={240} rx={14} fill="#1a1f3e" stroke={C.kin} strokeWidth={3} />
          <rect x={395} y={590} width={30} height={150} rx={15} fill="#141d40" stroke="#c9d4f5" strokeWidth={2.5} />
          <rect x={402} y={650 + 8 * Math.sin(t * 1.5)} width={16} height={90 - 8 * Math.sin(t * 1.5)} rx={8} fill={C.heat} />
          <circle cx={410} cy={758} r={24} fill={C.heat} />
          <Glow x={410} y={680} r={160} color="kin" opacity={0.4} />
          <Label x={410} y={846} size={34} weight={600} color={C.kin}>
            termodinamika
          </Label>
          {/* pilar kanan: kimia kuantum */}
          <rect x={1400} y={560} width={220} height={240} rx={14} fill="#122a24" stroke={GREEN} strokeWidth={3} />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={1440} x2={1580} y1={770 - k * 50} y2={770 - k * 50} stroke={GREEN} strokeWidth={4} opacity={0.6 + 0.4 * Math.sin(t * 2 + k)} />
          ))}
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={1470 + k * 40} cy={760} r={7} fill={C.cyan} />
          ))}
          <circle cx={1530} cy={710 - 0 * 50} r={7} fill={C.cyan} opacity={0.6} />
          <Glow x={1510} y={680} r={160} color="work" opacity={0.4} />
          <Label x={1510} y={846} size={34} weight={600} color={GREEN}>
            kimia kuantum
          </Label>
          {/* lengkung jembatan */}
          <path d="M520,580 Q960,240 1400,580" fill="none" stroke={C.gold} strokeOpacity={0.22} strokeWidth={22} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - arch)} />
          <path d="M520,580 Q960,240 1400,580" fill="none" stroke={C.gold} strokeWidth={6} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - arch)} />
          {Array.from({length: 9}, (_, k) => {
            const u = (k + 1) / 10;
            const xx = (1 - u) ** 2 * 520 + 2 * (1 - u) * u * 960 + u * u * 1400;
            const yy = (1 - u) ** 2 * 580 + 2 * (1 - u) * u * 240 + u * u * 580;
            return <line key={k} x1={xx} y1={yy + 4} x2={xx} y2={640} stroke={C.gold} strokeWidth={2} opacity={0.35 * ramp(arch, u, Math.min(1, u + 0.1))} />;
          })}
          <line x1={500} x2={1420} y1={640} y2={640} stroke={C.gold} strokeWidth={4} opacity={0.6 * arch} />
          <Stream
            pts={Array.from({length: 21}, (_, k) => {
              const u = k / 20;
              return [(1 - u) ** 2 * 520 + 2 * (1 - u) * u * 960 + u * u * 1400, (1 - u) ** 2 * 580 + 2 * (1 - u) * u * 240 + u * u * 580] as [number, number];
            })}
            color="gold"
            n={10}
            speed={0.3}
            r={6}
            jitter={2}
            opacity={arch}
          />
          <Stream pts={[[1400, 625], [520, 625]]} color="cyan" n={8} speed={0.3} r={5} jitter={2} opacity={arch * 0.7} />
          <Ripple x={960} y={420} p={ramp(t, tBridge - 0.1, tBridge + 1.5)} r={260} color="gold" />
          <Motes x={960} y={520} rx={600} ry={260} n={24} color="gold" opacity={0.4} seed={11} />
          <Label x={960} y={540} size={40} weight={600} color={C.gold} opacity={ramp(t, tBridge - 0.2, tBridge + 0.5)}>
            jembatan
          </Label>
        </g>
      </Stage>

      {/* ===================== kartu rumus ===================== */}
      <Formula x={1400} y={300} p={slot(t, wordOf(0, 'faktor') - 0.3, cue(2) + 0.1)} accent={GREEN} size={62} caption="faktor Boltzmann">
        <Frac
          n={
            <>
              <V>N</V>
              <Sub>2</Sub>
            </>
          }
          d={
            <>
              <V>N</V>
              <Sub>1</Sub>
            </>
          }
        />{' '}
        = <V>e</V>
        <Sup>
          −Δ<V color="work">E</V>/<V color="gold">k</V>
          <V color="heat">T</V>
        </Sup>
      </Formula>
      <Formula x={1400} y={300} p={slot(t, cue(2) + 0.1, cue(3) + 0.1)} accent={GREEN} size={58} caption="pada suhu kamar, T = 300 K">
        <V color="gold">k</V>
        <V color="heat">T</V> ≈ 0,026 eV ≈ <Tint c="work">2,5 kJ/mol</Tint>
      </Formula>
      <Formula x={1400} y={300} p={slot(t, cue(3) + 0.1, cue(4) + 0.1)} accent={C.gold} size={58} caption="getaran HCl: hν ≈ 14 kT">
        <V>e</V>
        <Sup>
          −<V>h</V>ν/<V>k</V>
          <V>T</V>
        </Sup>{' '}
        ≈ <V>e</V>
        <Sup>−14</Sup> ≈ <Tint c="gold">10</Tint>
        <Sup color={C.gold}>−6</Sup>
      </Formula>
      <Formula x={1400} y={300} p={slot(t, cue(4) + 0.1, cue(5) + 0.1)} accent={C.cyan} size={56} caption="B/kT ≈ 0,05 → banyak tingkat J terisi">
        <V>N</V>
        <Sub>J</Sub> ∝ (2<V>J</V> + 1) <V>e</V>
        <Sup>
          −<V>B</V>
          <V>J</V>(<V>J</V>+1)/<V>k</V>
          <V>T</V>
        </Sup>
      </Formula>
      <Formula x={960} y={300} p={slot(t, cue(5) + 0.5, dur + 2)} accent={C.gold} size={66} caption="termodinamika ↔ kimia kuantum">
        <V>e</V>
        <Sup>
          −Δ<V color="work">E</V>/<V color="gold">k</V>
          <V color="heat">T</V>
        </Sup>
      </Formula>
    </AbsoluteFill>
  );
};

/** Sudut putar yang mulai halus dari diam pada t0 (kecepatan sudut naik ke w rad/s). */
function rot(t: number, t0: number, w: number) {
  const d = Math.max(0, t - t0);
  const ramp1 = Math.min(d, 1);
  return w * (d > 1 ? d - 0.5 : (ramp1 * ramp1) / 2);
}
