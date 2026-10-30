import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, TSub, Twinkles, V} from '../components/primitives';
import {Plot, px, py, type Axes} from '../components/physics';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kalorimeter bom (potongan): bom baja berisi sampel + O₂ dicelup dalam ember air berpengaduk & bertermometer.
// Penyalaan → kalor mengalir dari bom ke air → suhu air naik. Glukosa 1 g: ΔcH° = −2803 kJ/mol ÷ 180,16 g/mol ≈ 15,6 kJ;
// 2 kg air, c ≈ 4200 J/(kg·K): ΔT = 15 600 / (2·4200) ≈ 1,86 K ("hampir 2 °C"; kapasitas bom diabaikan).
// Grafik ΔT(t) dihitung: ΔT = 1,86·(1 − e^{−(t − t_nyala)/τ}).

const DT = 1.86;
const T0 = 25;
const AX: Axes = {x0: 1110, y0: 600, w: 560, h: 280, xmax: 12, ymax: 2.5};
const BX = 550; // pusat bom
const TX = 742; // termometer

export const Calorimeter: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);

  const c1 = cue(1);
  const c3 = cue(3);
  const c4 = cue(4);
  const tSam = wordOf(1, 'sampel');
  const tBaja = wordOf(1, 'baja');
  const tOks = wordOf(1, 'oksigen');
  const tAir = wordOf(1, 'air');
  const tIgn = wordOf(2, 'pembakaran');
  const tDelta = wordOf(2, 'delta');
  const tKg = Math.max(wordOf(3, 'kilogram'), c3 + 0.8);
  const tDer = wordOf(3, 'derajat');
  const tMak = wordOf(4, 'makanan');
  const tBB = wordOf(4, 'bahan');

  // waktu grafik (menit tampilan) — dipetakan dari waktu adegan
  const tP0 = c1 + 0.3;
  const tP1 = c4 + 0.6;
  const toMin = (s: number) => (12 * (s - tP0)) / (tP1 - tP0);
  const mNow = Math.max(0, Math.min(12, toMin(t)));
  const mIgn = toMin(tIgn);
  const dT = (m: number) => (m <= mIgn ? 0 : DT * (1 - Math.exp(-(m - mIgn) / 1.8)));
  const dTnow = dT(toMin(t));
  const T = T0 + dTnow;
  const since = t - tIgn;
  const ign = since > 0 ? 1 : 0;
  const flash = since > 0 ? Math.exp(-since / 0.35) : 0;
  const flame = since > 0 ? Math.exp(-since / 1.4) * Math.min(1, since * 8) : 0;
  const heatB = since > 0 ? Math.exp(-since / 3.2) * Math.min(1, since * 4) : 0; // bom lebih panas dari air → aliran kalor

  const flameIcon = 1 - ramp(t, c1 + 0.1, c1 + 0.9, EASE_IN_OUT);
  const plotP = ramp(t, c1 + 0.2, c1 + 1.0);
  const lbSam = ramp(t, tSam - 0.3, tSam + 0.4);
  const lbBaja = ramp(t, tBaja - 0.3, tBaja + 0.4);
  const o2 = ramp(t, tOks - 0.4, tOks + 0.4);
  const lbAir = ramp(t, tAir - 0.3, tAir + 0.4);
  const f1 = win(t, tDelta - 1.0, c3 + 0.1, 0.7, 0.5);
  const note = win(t, c3 + 0.1, c4 - 0.4, 0.6, 0.5);
  const f2 = win(t, tKg - 0.6, c4 - 0.3, 0.7, 0.5);
  const res = ramp(t, tDer - 0.5, tDer + 0.4);
  const icons = ramp(t, c4 + 0.1, c4 + 0.9);
  const ic = [ramp(t, tMak - 0.4, tMak + 0.4), ramp(t, tMak, tMak + 0.8), ramp(t, tBB - 0.4, tBB + 0.4)];
  const cam = 1 + 0.045 * ramp(t, tIgn - 0.8, tIgn + 0.4, EASE_IN_OUT) * (1 - ramp(t, c3 - 0.3, c3 + 1.0, EASE_IN_OUT));

  const colTop = 700 - (T - 24.5) * 120;
  const waterCol = interpolateColors(dTnow, [0, DT], ['#1d5fa8', '#3a5aa8']);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <defs>
          <linearGradient id="cl-jacket" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a3866" />
            <stop offset="50%" stopColor="#3c4c84" />
            <stop offset="100%" stopColor="#1c2650" />
          </linearGradient>
          <linearGradient id="cl-steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7d8bb5" />
            <stop offset="40%" stopColor="#d6def2" />
            <stop offset="100%" stopColor="#5b6894" />
          </linearGradient>
          <linearGradient id="cl-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={waterCol} stopOpacity={0.85} />
            <stop offset="100%" stopColor="#0d2a5c" stopOpacity={0.95} />
          </linearGradient>
          <clipPath id="cl-bucket">
            <rect x={302} y={362} width={496} height={466} rx={14} />
          </clipPath>
        </defs>
        <Motes x={550} y={540} rx={400} ry={320} n={24} color="cyan" opacity={0.3 * intro} seed={31} />

        <g opacity={intro} transform={`translate(${BX},640) scale(${cam}) translate(${-BX},-640)`}>
          <ellipse cx={550} cy={866} rx={320} ry={12} fill="#000" opacity={0.35} />
          {/* jaket isolasi */}
          <rect x={250} y={300} width={600} height={560} rx={26} fill="url(#cl-jacket)" stroke="#6a7bb8" strokeWidth={2} />
          {Array.from({length: 9}, (_, i) => (
            <line key={i} x1={262} y1={330 + i * 60} x2={290} y2={316 + i * 60} stroke="#5a6aa0" strokeWidth={2} opacity={0.5} />
          ))}
          {Array.from({length: 9}, (_, i) => (
            <line key={i} x1={810} y1={330 + i * 60} x2={838} y2={316 + i * 60} stroke="#5a6aa0" strokeWidth={2} opacity={0.5} />
          ))}
          {/* ember air */}
          <rect x={300} y={360} width={500} height={470} rx={16} fill="#0a1430" stroke="#9fb0e6" strokeWidth={3} />
          <g clipPath="url(#cl-bucket)">
            <path
              d={`M300,${420 + 3 * Math.sin(t * 2)} ${Array.from({length: 26}, (_, i) => `L${300 + i * 20},${(420 + 3 * Math.sin(t * 2.4 + i * 0.6)).toFixed(1)}`).join(' ')} L820,840 L300,840 Z`}
              fill="url(#cl-water)"
            />
            <Glow x={BX} y={660} r={260} color="kin" opacity={0.25 * dTnow + 0.6 * heatB} still />
            {/* air diaduk: butir berputar */}
            {Array.from({length: 22}, (_, i) => {
              const r0 = 0.3 + 0.7 * rand(i * 3.1);
              const a = t * (0.9 + 0.12 * dTnow) * (i % 2 ? 1 : 0.8) + rand(i) * 6.28;
              const cxL = i % 2 ? 400 : 700;
              return <circle key={i} cx={cxL + 70 * r0 * Math.cos(a)} cy={620 + 170 * r0 * Math.sin(a)} r={3} fill={C.cyan} opacity={0.35} />;
            })}
            {/* kalor mengalir dari bom ke air */}
            {Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2 + 0.3;
              const sx = BX + 90 * Math.cos(a);
              const sy = 670 + 140 * Math.sin(a);
              return (
                <Stream
                  key={k}
                  pts={[
                    [sx, sy],
                    [BX + 160 * Math.cos(a), 670 + 200 * Math.sin(a)],
                    [BX + 230 * Math.cos(a), 670 + 250 * Math.sin(a)],
                  ]}
                  color="kin"
                  n={4}
                  speed={0.6}
                  r={5}
                  opacity={Math.min(1, heatB * 1.6)}
                  seed={k}
                />
              );
            })}
          </g>
          {/* tutup jaket */}
          <rect x={236} y={284} width={628} height={30} rx={10} fill="#3a4878" stroke="#8b9ad0" strokeWidth={2} />

          {/* pengaduk */}
          <rect x={336} y={226} width={50} height={44} rx={8} fill="#26305a" stroke="#8b9ad0" strokeWidth={2} />
          <circle cx={361} cy={248} r={9} fill="none" stroke="#9fb0e6" strokeWidth={2} strokeDasharray="5 5" transform={`rotate(${t * 300},361,248)`} />
          <line x1={361} y1={270} x2={361} y2={742} stroke="#9fb0e6" strokeWidth={5} />
          <ellipse cx={361 - 22 * Math.cos(t * 9)} cy={744} rx={22 * Math.abs(Math.cos(t * 9))} ry={7} fill="#c7d2f0" />
          <ellipse cx={361 + 22 * Math.cos(t * 9)} cy={744} rx={22 * Math.abs(Math.cos(t * 9))} ry={7} fill="#9fb0e6" />

          {/* kabel penyala */}
          <path d={`M${BX - 18},230 L${BX - 18},520`} stroke="#c9a46a" strokeWidth={3} />
          <path d={`M${BX + 18},230 L${BX + 18},520`} stroke="#c9a46a" strokeWidth={3} />
          {/* bom baja */}
          <Glow x={BX} y={660} r={170} color="heat" opacity={0.9 * heatB + flash} still />
          <rect x={BX - 82} y={540} width={164} height={264} rx={34} fill="url(#cl-steel)" />
          <rect x={BX - 66} y={556} width={132} height={232} rx={24} fill="#0b1022" />
          <rect x={BX - 66} y={556} width={132} height={232} rx={24} fill={C.heat} opacity={0.35 * heatB + 0.6 * flash} />
          <rect x={BX - 98} y={518} width={196} height={30} rx={8} fill="url(#cl-steel)" stroke="#e8eeff" strokeWidth={1.5} />
          <circle cx={BX - 18} cy={518} r={7} fill="#c9a46a" />
          <circle cx={BX + 18} cy={518} r={7} fill="#c9a46a" />
          {/* elektroda di dalam bom → cawan sampel */}
          <path d={`M${BX - 18},548 L${BX - 18},742 L${BX - 6},748`} stroke="#c9a46a" strokeWidth={2} fill="none" />
          <path d={`M${BX + 18},548 L${BX + 18},742 L${BX + 6},748`} stroke="#c9a46a" strokeWidth={2} fill="none" />
          <path d={`M${BX - 34},752 L${BX + 34},752 L${BX + 24},776 L${BX - 24},776 Z`} fill="#9aa6d6" />
          <ellipse cx={BX} cy={750} rx={18} ry={7} fill="#f4efe0" opacity={1 - 0.8 * ign * Math.min(1, since / 2)} />
          {/* O₂ */}
          <g opacity={o2 * (1 - 0.6 * ign * Math.min(1, since / 2))}>
            {Array.from({length: 9}, (_, i) => {
              const bx = BX - 44 + rand(i * 2.7) * 88;
              const by = 580 + rand(i * 4.1) * 140;
              const x = bx + 12 * Math.sin(t * 3.1 + i * 1.9);
              const y = by + 12 * Math.cos(t * 2.7 + i * 2.3);
              const a = t * 2 + i;
              return (
                <g key={i}>
                  <circle cx={x - 5 * Math.cos(a)} cy={y - 5 * Math.sin(a)} r={5.5} fill="#ff6a6a" />
                  <circle cx={x + 5 * Math.cos(a)} cy={y + 5 * Math.sin(a)} r={5.5} fill="#ff6a6a" />
                </g>
              );
            })}
          </g>
          {/* penyalaan: kilat + nyala */}
          <Ripple x={BX} y={748} p={since / 0.9} r={120} color="kin" rings={3} />
          <g opacity={flame}>
            {[0, 1, 2].map((k) => {
              const h = (40 + 14 * Math.sin(t * 17 + k * 2)) * (1 - k * 0.25);
              const w = 16 - k * 4;
              return <path key={k} d={`M${BX - w},750 C${BX - w},${750 - h * 0.6} ${BX},${750 - h * 0.7} ${BX},${750 - h} C${BX},${750 - h * 0.7} ${BX + w},${750 - h * 0.6} ${BX + w},750 Z`} fill={[C.heat, C.kin, '#ffe7a8'][k]} />;
            })}
          </g>
          <circle cx={BX} cy={720} r={40} fill="url(#soft-white)" opacity={flash} />

          {/* termometer */}
          <rect x={TX - 9} y={210} width={18} height={560} rx={9} fill="#0d1534" stroke="#cfd8f2" strokeWidth={2} />
          <rect x={TX - 4} y={colTop} width={8} height={770 - colTop} fill={C.heat} />
          <circle cx={TX} cy={774} r={16} fill={C.heat} stroke="#cfd8f2" strokeWidth={2} />
          {[25, 26, 27].map((v) => {
            const y = 700 - (v - 24.5) * 120;
            return (
              <g key={v}>
                <line x1={TX + 9} y1={y} x2={TX + 20} y2={y} stroke="#cfd8f2" strokeWidth={2} />
                <text x={TX + 26} y={y} dominantBaseline="central" fontFamily={FONT.mono} fontSize={15} fill={C.muted}>
                  {v}
                </text>
              </g>
            );
          })}
          <rect x={TX - 74} y={168} width={148} height={40} rx={10} fill="#0d1534" stroke={C.muted} strokeOpacity={0.4} strokeWidth={2} />
          <rect x={TX - 74} y={168} width={148} height={40} rx={10} fill="none" stroke={C.kin} strokeWidth={2} opacity={Math.min(1, dTnow)} />
          <text x={TX} y={189} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={24} fill={C.ink}>
            {T.toFixed(2).replace('.', ',')} °C
          </text>

          {/* label komponen */}
          <Label x={232} y={248} size={22} anchor="end" color={C.muted} opacity={lbAir}>
            pengaduk
          </Label>
          <g opacity={lbBaja}>
            <line x1={BX + 84} y1={610} x2={872} y2={610} stroke={C.muted} strokeWidth={1.5} />
            <Label x={882} y={610} size={23} anchor="start" color="#dfe6ff">
              bom baja
            </Label>
          </g>
          <g opacity={lbSam}>
            <line x1={BX + 36} y1={764} x2={872} y2={764} stroke={C.muted} strokeWidth={1.5} />
            <Label x={882} y={764} size={23} anchor="start" color="#f4efe0">
              sampel
            </Label>
          </g>
          <Label x={BX} y={600} size={22} weight={600} color="#ffb0b0" opacity={o2 * (1 - ign)}>
            O<TSub>2</TSub>
          </Label>
          <g opacity={lbAir}>
            <line x1={TX + 16} y1={470} x2={872} y2={470} stroke={C.muted} strokeWidth={1.5} />
            <Label x={882} y={470} size={23} anchor="start" color={C.cyan}>
              air 2 kg
            </Label>
          </g>
          <Label x={882} y={330} size={23} anchor="start" color={C.muted} opacity={lbAir}>
            termometer
          </Label>
          <line x1={TX + 30} y1={330} x2={872} y2={330} stroke={C.muted} strokeWidth={1.5} opacity={lbAir} />
        </g>

        {/* --------- baris 0: nyala terbuka — energinya kabur ke segala arah --------- */}
        <g opacity={flameIcon * intro}>
          <Glow x={1390} y={430} r={220} color="kin" opacity={0.5} />
          <ellipse cx={1390} cy={500} rx={70} ry={14} fill="#5b6894" />
          {[0, 1, 2].map((k) => {
            const h = (120 + 20 * Math.sin(t * 9 + k * 2)) * (1 - k * 0.25);
            const w = 46 - k * 12;
            return <path key={k} d={`M${1390 - w},496 C${1390 - w},${496 - h * 0.6} ${1390},${496 - h * 0.7} ${1390 + 6 * Math.sin(t * 5)},${496 - h} C${1390},${496 - h * 0.7} ${1390 + w},${496 - h * 0.6} ${1390 + w},496 Z`} fill={[C.heat, C.kin, '#ffe7a8'][k]} />;
          })}
          {Array.from({length: 10}, (_, k) => {
            const a = (k / 10) * Math.PI * 2;
            const ph = (((t * 0.5 + k * 0.13) % 1) + 1) % 1;
            const r = 70 + ph * 200;
            return <circle key={k} cx={1390 + r * Math.cos(a)} cy={430 + r * Math.sin(a) * 0.8} r={6} fill={C.kin} opacity={cyc(ph)} />;
          })}
          <Label x={1390} y={640} size={34} weight={600} color={C.ink}>
            energi = <tspan fill={C.kin}>? kJ</tspan>
          </Label>
        </g>

        {/* --------- grafik ΔT(t) --------- */}
        <g opacity={plotP}>
          <Label x={1390} y={240} size={24} color={C.muted}>
            suhu air setelah penyalaan
          </Label>
          <Plot a={AX} xLabel="t" yLabel={<>ΔT (°C)</>} xTicks={[0, 4, 8, 12]} yTicks={[0.5, 1, 1.5, 2]} />
          <Label x={AX.x0 + AX.w + 46} y={AX.y0 + 28} size={18} font="mono" color={C.muted} anchor="start">
            menit
          </Label>
          <polyline
            points={Array.from({length: 81}, (_, i) => {
              const m = (mNow * i) / 80;
              return `${px(AX, m).toFixed(1)},${py(AX, dT(m)).toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke={C.kin}
            strokeWidth={4.5}
            strokeLinejoin="round"
          />
          <line x1={px(AX, mIgn)} y1={AX.y0} x2={px(AX, mIgn)} y2={AX.y0 - AX.h} stroke={C.heat} strokeWidth={2} strokeDasharray="5 7" opacity={ign * 0.7} />
          <Label x={px(AX, mIgn) + 8} y={AX.y0 - AX.h - 6} size={19} anchor="start" color={C.heat} opacity={ign}>
            nyala
          </Label>
          <line x1={AX.x0} y1={py(AX, DT)} x2={AX.x0 + AX.w} y2={py(AX, DT)} stroke={C.gold} strokeWidth={2} strokeDasharray="8 8" opacity={res * 0.8} />
          <Glow x={px(AX, mNow)} y={py(AX, dT(mNow))} r={34} color="kin" still />
          <circle cx={px(AX, mNow)} cy={py(AX, dT(mNow))} r={7} fill="#fff" stroke={C.kin} strokeWidth={3} />
          <Label x={Math.min(px(AX, mNow) + 16, 1560)} y={py(AX, dT(mNow)) - 30} size={22} anchor="start" color={C.kin} weight={600} opacity={1 - res}>
            ΔT = {dTnow.toFixed(2).replace('.', ',')} °C
          </Label>
          <Label x={1440} y={py(AX, DT) - 28} size={26} anchor="start" color={C.gold} weight={700} opacity={res}>
            ΔT ≈ 1,9 °C
          </Label>
          <Twinkles x={1520} y={py(AX, DT) - 30} rx={80} ry={30} n={4} color="gold" opacity={res} seed={6} />
        </g>
        <Ripple x={1520} y={py(AX, DT) - 30} p={(t - tDer) / 1.2} r={150} color="gold" rings={2} width={2} />

        {/* --------- baris 4: ikon energi makanan & bahan bakar --------- */}
        <g opacity={icons}>
          {[1160, 1400, 1640].map((x, k) => {
            const p = ic[k];
            const bob = 4 * Math.sin(t * 1.6 + k);
            return (
              <g key={k} opacity={p} transform={`translate(${x},${780 + bob + (1 - p) * 16})`}>
                <Glow x={0} y={0} r={80} color="kin" opacity={0.4} />
                {k === 0 ? (
                  <g>
                    <path d="M-44,-4 L44,-4 C40,30 -40,30 -44,-4 Z" fill="#c89a5a" />
                    {Array.from({length: 7}, (_, i) => (
                      <ellipse key={i} cx={-30 + i * 10} cy={-8 - 5 * Math.sin((i / 6) * Math.PI)} rx={7} ry={4} fill="#f4efe0" />
                    ))}
                  </g>
                ) : k === 1 ? (
                  <g>
                    <rect x={-28} y={-30} width={56} height={56} rx={6} fill="#f4f6ff" stroke="#c7d2f0" strokeWidth={2} transform={`rotate(${8 * Math.sin(t)})`} />
                    <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={18} fill="#3a4878">
                      1 g
                    </text>
                  </g>
                ) : (
                  <g>
                    <path d="M0,-40 C20,-12 30,4 30,16 A30,30 0 0 1 -30,16 C-30,4 -20,-12 0,-40 Z" fill="#e0a43a" stroke="#ffd27a" strokeWidth={2} />
                    <ellipse cx={-10} cy={10} rx={6} ry={10} fill="#fff" opacity={0.35} />
                  </g>
                )}
                {Array.from({length: 3}, (_, i) => {
                  const ph = (((t * 0.6 + i / 3 + k * 0.2) % 1) + 1) % 1;
                  return <circle key={i} cx={(i - 1) * 18 + 4 * Math.sin(t * 3 + i)} cy={-44 - ph * 50} r={5} fill={C.kin} opacity={cyc(ph)} />;
                })}
                <Label x={0} y={64} size={23} color={C.ink}>
                  {['makanan', 'glukosa · 15,6 kJ/g', 'bahan bakar'][k]}
                </Label>
              </g>
            );
          })}
        </g>
      </Stage>
      <Formula x={1390} y={790} p={f1} accent={C.kin} caption="m = massa air, c ≈ 4200 J/(kg·K)">
        <V color={C.kin}>Q</V> = <V>m</V> <V>c</V> Δ<V color={C.heat}>T</V>
      </Formula>
      <Note x={1390} y={688} p={note} color={C.kin} size={30}>
        1 g glukosa → ≈ <span style={{color: C.kin}}>15,6 kJ</span>
      </Note>
      <Formula x={1390} y={806} p={f2} accent={C.gold} size={56}>
        Δ<V color={C.heat}>T</V> = <Frac n="15 600 J" d="2 kg × 4200" size={0.62} /> ≈ <span style={{color: C.gold}}>1,9 °C</span>
      </Formula>
    </AbsoluteFill>
  );
};
