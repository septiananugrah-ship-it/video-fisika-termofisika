import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand} from '../anim';
import {Arrow, Formula, Glow, Label, Motes, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Hukum pertama: ΔU = Q − W (W = usaha OLEH gas).
//  Silinder berpiston dengan beban tetap → tekanan gas tetap (isobarik): W = pΔV.
//  Kalor Q (jingga) masuk dari nyala api; sebagian menaikkan energi dalam (ungu: molekul makin cepat, laju ∝ √T),
//  sebagian menjadi usaha (hijau: piston naik mengangkat beban). Lebar pita ∝ energi (ilustratif: ΔU 60 %, W 40 %).
//  Fase gerak molekul = ∫ laju dt (tanpa loncatan saat laju naik).

const slot = (t: number, a: number, b: number) => Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));
const tri = (u: number) => {
  const v = ((u % 2) + 2) % 2;
  return 1 - Math.abs(v - 1);
};
/** ∫ (linear 0→1 di [a, b]) dt */
const rampInt = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? (b - a) / 2 + (t - b) : (t - a) ** 2 / (2 * (b - a)));

const Flame: React.FC<{x: number; y: number; s?: number; t: number; k?: number}> = ({x, y, s = 1, t, k = 0}) => {
  if (s <= 0.01) return null;
  const f = 1 + 0.13 * Math.sin(t * 11 + k * 1.7) + 0.07 * Math.sin(t * 17.3 + k);
  const sw = 3 * Math.sin(t * 7 + k * 2.3);
  const d = (w: number, h: number) => `M${-w},0 C${-w * 1.25},${-h * 0.42} ${-w * 0.3 + sw},${-h * 0.66} ${sw},${-h} C${w * 0.3 + sw},${-h * 0.66} ${w * 1.25},${-h * 0.42} ${w},0 Q0,${w * 0.55} ${-w},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d(15, 50 * f)} fill={C.kin} opacity={0.85} />
      <path d={d(9, 32 * f)} fill={C.gold} />
      <path d={d(4, 15 * f)} fill="#fff6e0" />
    </g>
  );
};

const CX0 = 370; // dinding dalam kiri
const CX1 = 630; // dinding dalam kanan
const CB = 780; // dasar dalam
const YP0 = 540; // muka bawah piston awal
const YP1 = 430; // akhir
const NM = 22;

// pita Sankey
const SX0 = 900;
const SXS = 1160;
const SX1 = 1490;
const QY = 400;
const QH = 150;
const UH = 90;
const WH = 60;
const UY = 270;
const WY = 520;
const band = (x0: number, y0top: number, y0bot: number, x1: number, y1top: number, y1bot: number) => {
  const m = (x0 + x1) / 2;
  return `M${x0},${y0top} C${m},${y0top} ${m},${y1top} ${x1},${y1top} L${x1},${y1bot} C${m},${y1bot} ${m},${y0bot} ${x0},${y0bot} Z`;
};

export const FirstLaw: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();
  const appear = ramp(t, -0.4, 0.7, EASE_IN_OUT);
  const cyl = ramp(t, cue(0) - 0.6, cue(0) + 0.8, EASE_IN_OUT);

  /* ---------- waktu ---------- */
  const tQ = wordOf(1, 'kalor');
  const fire = 0.18 + 0.82 * ramp(t, tQ - 0.4, tQ + 0.5);
  const heatP = ramp(t, tQ, tQ + 6, (x) => x);
  const tPush = wordOf(1, 'mendorong');
  const rise = ramp(t, tPush - 0.6, wordOf(1, 'usaha') + 1.2, EASE_IN_OUT);
  const yp = mix(YP0, YP1, rise) + 1.2 * Math.sin(t * 13) * (0.5 + 0.5 * heatP);
  const sQ = ramp(t, tQ - 0.2, tQ + 1.2, EASE_IN_OUT);
  const sU = ramp(t, wordOf(1, 'energi', 1) - 0.4, wordOf(1, 'energi', 1) + 1.0, EASE_IN_OUT);
  const sW = ramp(t, tPush - 0.3, tPush + 1.1, EASE_IN_OUT);
  const sankeyOut = ramp(t, cue(4) - 0.4, cue(4) + 0.5, EASE_IN_OUT);
  const sankey = 1 - sankeyOut;
  const f2 = slot(t, wordOf(2, 'delta') - 0.4, cue(3));
  const f3 = slot(t, cue(3) - 0.1, cue(4));
  const f4 = ramp(t, wordOf(4, 'usaha') - 0.3, wordOf(4, 'usaha') + 0.5);
  const pv = ramp(t, cue(4) + 0.1, cue(4) + 1.1, EASE_IN_OUT);
  const sweep = ramp(t, wordOf(4, 'kali') - 0.6, cueEnd(4), EASE_IN_OUT);
  const dvBand = ramp(t, wordOf(4, 'volume') - 0.5, wordOf(4, 'volume') + 0.4);
  const pArrows = ramp(t, wordOf(4, 'tekanan') - 0.4, wordOf(4, 'tekanan') + 0.4);
  const cons = ramp(t, cue(3) + 0.2, cue(3) + 1.0) * (1 - sankeyOut);

  /* ---------- molekul ---------- */
  const phi = t + 0.75 * rampInt(t, tQ, tQ + 6); // laju naik ≈ ×1,75
  const yTop = yp + 12;
  const mols = Array.from({length: NM}, (_, i) => {
    const vx = 0.22 + 0.2 * rand(i + 3);
    const vy = 0.2 + 0.2 * rand(i + 13);
    const P = (ph: number): [number, number] => [CX0 + 12 + tri(rand(i) * 2 + vx * ph) * (CX1 - CX0 - 24), yTop + tri(rand(i + 7) * 2 + vy * ph) * (CB - 12 - yTop)];
    return {p: P(phi), tr: [1, 2, 3].map((k) => P(phi - k * 0.07 * (1 + 0.75 * heatP)))};
  });

  // geometri piston & beban
  const pistonTop = yp - 34;
  const wTop = pistonTop - 78;

  // pV mini
  const GX0 = 960;
  const GY0 = 600;
  const v1x = 1090;
  const v2x = 1390;
  const pY = 380;
  const dotX = mix(v1x, v2x, sweep);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="fl-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4c5884" />
            <stop offset="50%" stopColor="#a9b5dc" />
            <stop offset="100%" stopColor="#3a446e" />
          </linearGradient>
          <linearGradient id="fl-piston" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c3cdee" />
            <stop offset="100%" stopColor="#5a6694" />
          </linearGradient>
          <linearGradient id="fl-qband" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.kin} stopOpacity="0.15" />
            <stop offset="100%" stopColor={C.kin} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="fl-gas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.cyan} stopOpacity="0.05" />
            <stop offset="100%" stopColor={C.kin} stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {/* ================= silinder ================= */}
        <g opacity={appear * cyl}>
          <Motes x={500} y={560} rx={250} ry={300} n={18} color="cyan" opacity={0.35} seed={2} />
          <Glow x={500} y={(yp + CB) / 2} r={240} color="spr" opacity={0.7 * heatP} />
          {/* gas */}
          <rect x={CX0} y={yp} width={CX1 - CX0} height={CB - yp} fill="url(#fl-gas)" />
          <rect x={CX0} y={yp} width={CX1 - CX0} height={CB - yp} fill={C.spr} opacity={0.12 * heatP} />
          {/* ΔV pita */}
          <g opacity={dvBand}>
            <rect x={CX0} y={YP1} width={CX1 - CX0} height={YP0 - YP1} fill={C.work} opacity={0.18 + 0.05 * Math.sin(t * 3)} />
            <line x1={CX0} y1={YP0} x2={CX1} y2={YP0} stroke={C.work} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={-t * 18} />
            <path d={`M${CX1 + 34},${YP1} L${CX1 + 46},${YP1} L${CX1 + 46},${YP0} L${CX1 + 34},${YP0}`} fill="none" stroke={C.work} strokeWidth={3} />
            <Label x={CX1 + 60} y={(YP0 + YP1) / 2} size={32} color={C.work} anchor="start" font="serif" italic weight={600}>
              ΔV
            </Label>
          </g>
          {mols.map((m, i) => (
            <g key={i}>
              {m.tr.map(([x, y], k) => (
                <circle key={k} cx={x} cy={y} r={7 - k * 1.6} fill={C.cyan} opacity={(0.18 + 0.2 * heatP) * (1 - k / 3)} />
              ))}
              <circle cx={m.p[0]} cy={m.p[1]} r={24} fill="url(#soft-cyan)" opacity={0.5} />
              <circle cx={m.p[0]} cy={m.p[1]} r={9} fill={C.cyan} />
              <circle cx={m.p[0] - 2.5} cy={m.p[1] - 2.5} r={3} fill="#fff" opacity={0.8} />
            </g>
          ))}
          {/* panah tekanan */}
          <g opacity={pArrows}>
            {[420, 500, 580].map((x, k) => (
              <Arrow key={k} x1={x} y1={yp + 66} x2={x} y2={yp + 14} color="press" width={5} pulse={false} />
            ))}
            <Label x={CX0 + 24} y={yp + 90} size={30} color={C.press} anchor="start" font="serif" italic weight={600}>
              p
            </Label>
          </g>
          {/* dinding */}
          <rect x={CX0 - 16} y={250} width={16} height={CB - 250 + 16} fill="url(#fl-wall)" />
          <rect x={CX1} y={250} width={16} height={CB - 250 + 16} fill="url(#fl-wall)" />
          <rect x={CX0 - 16} y={CB} width={CX1 - CX0 + 32} height={16} fill="#4c5884" />
          {/* piston + beban */}
          <rect x={CX0 + 2} y={pistonTop} width={CX1 - CX0 - 4} height={34} rx={5} fill="url(#fl-piston)" stroke="#e1e7fb" strokeWidth={1.5} />
          <rect x={CX0 + 2} y={pistonTop + 26} width={CX1 - CX0 - 4} height={4} fill="#2a3358" opacity={0.6} />
          <rect x={440} y={wTop} width={120} height={78} rx={8} fill="url(#crate)" stroke={C.force} strokeWidth={2.5} />
          <rect x={448} y={wTop + 7} width={104} height={7} rx={3} fill="#fff" opacity={0.12} />
          <Label x={500} y={wTop + 40} size={24} color={C.force} weight={600}>
            beban
          </Label>
          {/* garis gerak saat naik */}
          {[0, 1, 2].map((k) => (
            <line key={k} x1={452 + k * 48} y1={wTop - 14} x2={452 + k * 48} y2={wTop - 14 - 34} stroke={C.work} strokeWidth={3} strokeLinecap="round" opacity={0.7 * Math.sin(Math.PI * rise)} />
          ))}
          <Label x={CX0 - 30} y={pistonTop + 17} size={23} color={C.muted} anchor="end" opacity={ramp(t, cue(0) + 0.4, cue(0) + 1.2)}>
            piston
          </Label>
          <Label x={CX0 - 30} y={700} size={23} color={C.cyan} anchor="end" opacity={ramp(t, cue(0) + 0.8, cue(0) + 1.6)}>
            gas
          </Label>
          {/* api */}
          <rect x={410} y={852} width={180} height={12} rx={5} fill="#2a3560" stroke="#6a78a8" strokeWidth={2} />
          <Glow x={500} y={820} r={150} color="kin" opacity={0.55 * fire} />
          {Array.from({length: 5}, (_, k) => (
            <Flame key={k} x={440 + k * 30} y={852} s={0.95 * fire} t={t} k={k} />
          ))}
          {/* aliran kalor masuk */}
          {[450, 500, 550].map((x, k) => (
            <Stream
              key={k}
              pts={[
                [x, 830],
                [x + 10, 760],
                [x - 6, 680],
              ]}
              color="kin"
              n={4}
              speed={0.6}
              r={4.5}
              opacity={sQ * (0.6 + 0.4 * (1 - sankeyOut))}
              seed={k}
            />
          ))}
          {/* kalor dari api → pita Q */}
          <Stream
            pts={[
              [600, 850],
              [760, 760],
              [840, 560],
              [892, QY + 40],
            ]}
            color="kin"
            n={6}
            speed={0.45}
            r={4}
            jitter={4}
            opacity={0.7 * sQ * sankey}
            seed={7}
          />
          {/* usaha: gas → piston → beban */}
          <Stream
            pts={[
              [600, yp + 70],
              [600, wTop - 10],
            ]}
            color="work"
            n={4}
            speed={0.7}
            r={5}
            jitter={2}
            opacity={sW * (1 - 0.8 * ramp(t, cue(2), cue(2) + 1))}
          />
          <Ripple x={500} y={wTop} p={(t - tPush) / 1.5} r={110} color="work" rings={2} />
        </g>

        {/* ================= pita energi (Sankey) ================= */}
        {sankey > 0.001 ? (
          <g opacity={appear * sankey}>
            <defs>
              <clipPath id="fl-clipQ">
                <rect x={SX0 - 10} y={150} width={(SXS - SX0 + 20) * sQ} height={500} />
              </clipPath>
              <clipPath id="fl-clipU">
                <rect x={SXS} y={150} width={(SX1 - SXS + 40) * sU} height={500} />
              </clipPath>
              <clipPath id="fl-clipW">
                <rect x={SXS} y={150} width={(SX1 - SXS + 40) * sW} height={500} />
              </clipPath>
            </defs>
            <g clipPath="url(#fl-clipQ)">
              <rect x={SX0} y={QY - QH / 2} width={SXS - SX0} height={QH} fill="url(#fl-qband)" />
              <rect x={SX0} y={QY - QH / 2} width={SXS - SX0} height={4} fill={C.kin} />
              <Stream
                pts={[
                  [SX0, QY],
                  [SXS, QY],
                ]}
                color="kin"
                n={5}
                speed={0.5}
                r={6}
                jitter={22}
              />
            </g>
            <g clipPath="url(#fl-clipU)">
              <path d={band(SXS, QY - QH / 2, QY - QH / 2 + UH, SX1, UY - UH / 2, UY + UH / 2)} fill={C.spr} opacity={0.45} />
              <path d={`M${SX1},${UY - UH / 2 - 14} L${SX1 + 34},${UY} L${SX1},${UY + UH / 2 + 14} Z`} fill={C.spr} opacity={0.85} />
              <Stream
                pts={[
                  [SXS, QY - QH / 2 + UH / 2],
                  [(SXS + SX1) / 2, (QY - QH / 2 + UH / 2 + UY) / 2],
                  [SX1, UY],
                ]}
                color="spr"
                n={5}
                speed={0.5}
                r={6}
                jitter={14}
                seed={2}
              />
            </g>
            <g clipPath="url(#fl-clipW)">
              <path d={band(SXS, QY + QH / 2 - WH, QY + QH / 2, SX1, WY - WH / 2, WY + WH / 2)} fill={C.work} opacity={0.45} />
              <path d={`M${SX1},${WY - WH / 2 - 14} L${SX1 + 30},${WY} L${SX1},${WY + WH / 2 + 14} Z`} fill={C.work} opacity={0.85} />
              <Stream
                pts={[
                  [SXS, QY + QH / 2 - WH / 2],
                  [(SXS + SX1) / 2, (QY + QH / 2 - WH / 2 + WY) / 2],
                  [SX1, WY],
                ]}
                color="work"
                n={4}
                speed={0.5}
                r={5}
                jitter={9}
                seed={5}
              />
            </g>
            <Label x={SX0 - 18} y={QY} size={54} color={C.kin} anchor="end" font="serif" italic weight={600} opacity={sQ}>
              Q
            </Label>
            <Label x={SX0 + 12} y={QY + QH / 2 + 28} size={21} color={C.muted} anchor="start" opacity={sQ}>
              kalor masuk
            </Label>
            <Label x={SX1 + 52} y={UY - 8} size={48} color={C.spr} anchor="start" font="serif" italic weight={600} opacity={sU}>
              ΔU
            </Label>
            <Label x={SX1 + 52} y={UY + 36} size={21} color={C.muted} anchor="start" opacity={sU}>
              molekul makin cepat
            </Label>
            <Label x={SX1 + 48} y={WY - 8} size={48} color={C.work} anchor="start" font="serif" italic weight={600} opacity={sW}>
              W
            </Label>
            <Label x={SX1 + 48} y={WY + 36} size={21} color={C.muted} anchor="start" opacity={sW}>
              beban terangkat
            </Label>
            {/* kekekalan: Q = ΔU + W (lebar pita) */}
            <g opacity={cons}>
              <path d={`M${SXS - 8},${QY - QH / 2} L${SXS - 22},${QY - QH / 2} L${SXS - 22},${QY + QH / 2} L${SXS - 8},${QY + QH / 2}`} fill="none" stroke={C.gold} strokeWidth={3} />
              <Twinkles x={SXS} y={QY} rx={60} ry={80} n={4} />
            </g>
          </g>
        ) : null}

        {/* ================= W = pΔV di diagram p–V ================= */}
        {pv > 0.001 ? (
          <g opacity={pv}>
            <Glow x={1240} y={480} r={300} color="work" opacity={0.25 * sweep} />
            <line x1={GX0} y1={GY0} x2={GX0 + 600} y2={GY0} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
            <line x1={GX0} y1={GY0} x2={GX0} y2={GY0 - 380} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
            <Label x={GX0} y={196} size={28} color={C.press} font="serif" italic weight={600}>
              p
            </Label>
            <Label x={GX0 + 626} y={GY0} size={28} color={C.muted} font="serif" italic anchor="start">
              V
            </Label>
            <rect x={v1x} y={pY} width={(v2x - v1x) * sweep} height={GY0 - pY} fill={C.work} opacity={0.3} />
            <line x1={dotX} y1={pY} x2={dotX} y2={GY0} stroke={C.work} strokeWidth={3} opacity={0.8 * Math.sin(Math.PI * Math.min(1, sweep * 1.02))} />
            <line x1={GX0} y1={pY} x2={v1x} y2={pY} stroke={C.press} strokeWidth={2} strokeDasharray="6 7" opacity={0.7} />
            <line x1={v1x} y1={pY} x2={v2x} y2={pY} stroke={C.press} strokeWidth={6} strokeLinecap="round" />
            <line x1={v1x} y1={pY} x2={v1x} y2={GY0} stroke={C.muted} strokeWidth={2} strokeDasharray="5 7" />
            <line x1={v2x} y1={pY} x2={v2x} y2={GY0} stroke={C.muted} strokeWidth={2} strokeDasharray="5 7" opacity={sweep} />
            <circle cx={dotX} cy={pY} r={22} fill="url(#soft-press)" />
            <circle cx={dotX} cy={pY} r={9} fill={C.press} stroke="#fff" strokeWidth={2} />
            <Label x={GX0 - 18} y={pY} size={24} color={C.press} anchor="end" font="mono">
              p tetap
            </Label>
            <g opacity={sweep}>
              <path d={`M${v1x},${GY0 + 18} L${v1x},${GY0 + 30} L${v2x},${GY0 + 30} L${v2x},${GY0 + 18}`} fill="none" stroke={C.work} strokeWidth={3} />
              <Label x={(v1x + v2x) / 2} y={GY0 + 56} size={30} color={C.work} font="serif" italic weight={600}>
                ΔV
              </Label>
              <Label x={(v1x + v2x) / 2} y={(pY + GY0) / 2} size={34} color={C.ink} weight={600}>
                W = luas
              </Label>
            </g>
          </g>
        ) : null}
        <Glow x={1300} y={760} r={260} color="spr" opacity={0.3 * f2} />
      </Stage>

      <Formula x={1300} y={760} p={f2} accent={C.spr} size={64} caption="hukum pertama termodinamika">
        <span style={{color: C.spr}}>
          Δ<span style={{fontStyle: 'italic'}}>U</span>
        </span>{' '}
        = <span style={{color: C.kin, fontStyle: 'italic'}}>Q</span> − <span style={{color: C.work, fontStyle: 'italic'}}>W</span>
      </Formula>
      <Formula x={1300} y={760} p={f3} accent={C.gold} size={60} caption="kekekalan energi: masuk = tersimpan + keluar">
        <span style={{color: C.kin, fontStyle: 'italic'}}>Q</span> ={' '}
        <span style={{color: C.spr}}>
          Δ<span style={{fontStyle: 'italic'}}>U</span>
        </span>{' '}
        + <span style={{color: C.work, fontStyle: 'italic'}}>W</span>
      </Formula>
      <Formula x={1270} y={790} p={f4} accent={C.work} size={60} caption="pada tekanan tetap">
        <span style={{color: C.work, fontStyle: 'italic'}}>W</span> = <span style={{color: C.press, fontStyle: 'italic'}}>p</span> Δ
        <span style={{fontStyle: 'italic'}}>V</span>
      </Formula>
    </AbsoluteFill>
  );
};
