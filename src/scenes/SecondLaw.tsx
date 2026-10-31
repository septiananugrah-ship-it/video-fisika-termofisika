import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { EASE_IN_OUT, cyc, mix, ramp } from "../anim";
import {
  Arrow,
  Formula,
  Frac,
  Glow,
  Label,
  Motes,
  Note,
  Ripple,
  Stage,
  Stream,
  Sub,
  Twinkles,
} from "../components/primitives";
import { useScene } from "../SceneContext";
import { C } from "../theme";

// Hukum kedua (Clausius): kalor mengalir spontan panas → dingin.
//  Bagian A: dua balok bersentuhan lewat batang; suhu mendekat eksponensial (80 °C & 20 °C → 50 °C), butir kalor jingga panas → dingin;
//  percobaan sebaliknya (dingin → panas) dicoret.
//  Bagian B: mesin kalor — Q_p dari sumber panas → mesin → W (hijau) + Q_d ke lingkungan dingin; lebar pita ∝ energi
//  (mesin nyata ≈ 30 %: W = 0,3 Q_p, Q_d = 0,7 Q_p). η_Carnot = 1 − T_d/T_p; 600 K & 300 K → 50 %; mesin nyata ≈ 25–40 %.

const slot = (t: number, a: number, b: number) =>
  Math.min(ramp(t, a, a + 0.5), 1 - ramp(t, b - 0.45, b - 0.05, EASE_IN_OUT));

const HX = 560;
const CXB = 1360;
const BY = 470;

const Block: React.FC<{
  cx: number;
  temp: number;
  t: number;
  seed: number;
}> = ({ cx, temp, t, seed }) => {
  const h = (temp - 20) / 60; // 0 dingin … 1 panas
  const col = interpolateColors(h, [0, 0.5, 1], [C.pot, "#b08cff", C.heat]);
  const amp = 2 + 7 * h;
  return (
    <g>
      <Glow x={cx} y={BY} r={220} color="heat" opacity={0.55 * h} />
      <Glow x={cx} y={BY} r={220} color="pot" opacity={0.55 * (1 - h)} />
      <rect
        x={cx - 140}
        y={BY - 110}
        width={280}
        height={220}
        rx={18}
        fill="#121a3a"
        stroke={col}
        strokeWidth={4}
      />
      <rect
        x={cx - 140}
        y={BY - 110}
        width={280}
        height={220}
        rx={18}
        fill={col}
        opacity={0.18}
      />
      {Array.from({ length: 20 }, (_, i) => {
        const c = i % 5;
        const r = Math.floor(i / 5);
        const x =
          cx - 100 + c * 50 + amp * Math.sin(t * (9 + h * 6) + i * 1.7 + seed);
        const y =
          BY - 75 + r * 50 + amp * Math.cos(t * (8 + h * 6) + i * 2.3 + seed);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={11}
              fill={col}
              stroke="#0b1126"
              strokeWidth={1.5}
            />
            <circle cx={x - 3} cy={y - 3} r={3} fill="#fff" opacity={0.6} />
          </g>
        );
      })}
      {/* termometer di atas */}
      <rect
        x={cx - 9}
        y={BY - 230}
        width={18}
        height={96}
        rx={9}
        fill="#141e40"
        stroke={C.muted}
        strokeWidth={1.5}
      />
      <rect
        x={cx - 5}
        y={BY - 140 - 86 * h}
        width={10}
        height={86 * h + 4}
        rx={5}
        fill={col}
      />
      <circle
        cx={cx}
        cy={BY - 128}
        r={14}
        fill={col}
        stroke={C.muted}
        strokeWidth={1.5}
      />
      <Label
        x={cx + 30}
        y={BY - 190}
        size={32}
        color={col}
        anchor="start"
        font="mono"
        weight={600}
      >
        {Math.round(temp)} °C
      </Label>
    </g>
  );
};

export const SecondLaw: React.FC = () => {
  const { t, cue, wordOf, dur } = useScene();
  const appear = ramp(t, -0.4, 0.7, EASE_IN_OUT);

  /* ---------- bagian A ---------- */
  const aOut = ramp(t, cue(2) - 0.6, cue(2) + 0.3, EASE_IN_OUT);
  const A = appear * (1 - aOut);
  const tau = Math.max(0, t - cue(1));
  const dT = 30 * Math.exp(-tau / 7);
  const flow = ramp(t, cue(1) - 0.2, cue(1) + 0.6);
  const q =
    ramp(t, wordOf(0, "mana") - 0.4, wordOf(0, "mana") + 0.4) *
    (1 - ramp(t, cue(1) - 0.2, cue(1) + 0.4, EASE_IN_OUT));
  const fwd = ramp(t, wordOf(1, "panas") - 0.4, wordOf(1, "panas") + 0.5);
  const rev = ramp(t, wordOf(1, "tidak") - 0.6, wordOf(1, "tidak"));
  const xMark = ramp(
    t,
    wordOf(1, "tidak") - 0.1,
    wordOf(1, "tidak") + 0.5,
    EASE_IN_OUT,
  );
  const n0 = slot(t, wordOf(0, "kekal") - 0.4, cue(1));
  const n1 = slot(t, wordOf(1, "sendirinya") - 0.4, cue(2) - 0.3);

  /* ---------- bagian B ---------- */
  const B = appear * ramp(t, cue(2) - 0.2, cue(2) + 0.7, EASE_IN_OUT);
  const sQp = ramp(
    t,
    wordOf(2, "mengambil") - 0.3,
    wordOf(2, "mengambil") + 1.0,
    EASE_IN_OUT,
  );
  const sW = ramp(
    t,
    wordOf(2, "usaha") - 0.5,
    wordOf(2, "usaha") + 0.8,
    EASE_IN_OUT,
  );
  const sQd = ramp(
    t,
    wordOf(2, "membuang") - 0.3,
    wordOf(2, "membuang") + 1.0,
    EASE_IN_OUT,
  );
  const run = sQp;
  // sudut roda = ∫ laju (laju naik halus bersama sQp)
  const tR = wordOf(2, "mengambil") - 0.3;
  const ang =
    140 *
    (t <= tR ? 0 : t < tR + 1.3 ? (t - tR) ** 2 / 2.6 : 0.65 + (t - tR - 1.3));
  const f3 = slot(t, wordOf(3, "Efisiensi") - 0.3, cue(4));
  const f4 = ramp(t, cue(4) - 0.1, cue(4) + 0.5);
  const kv = ramp(t, wordOf(4, "enam") - 0.4, wordOf(4, "enam") + 0.4);
  const barC = ramp(
    t,
    wordOf(4, "lima") - 0.4,
    wordOf(4, "lima") + 0.9,
    EASE_IN_OUT,
  );
  const barR = ramp(
    t,
    wordOf(4, "nyata") - 0.4,
    wordOf(4, "nyata") + 0.9,
    EASE_IN_OUT,
  );
  const bars = ramp(t, cue(4) + 0.2, cue(4) + 1.0);

  const QW = 130;
  const WW = QW * 0.3;
  const DW = QW * 0.7;
  const EX = 640;
  const EY = 520;
  const ER = 88;
  const BB = 830; // dasar batang
  const BH = 330; // 100 %
  const shiftX = 300 * (1 - ramp(t, cue(3) - 0.9, cue(3) + 0.5, EASE_IN_OUT));
  const realEta = 0.32 + 0.02 * Math.sin(t * 1.3);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="sl-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a5a" />
            <stop offset="100%" stopColor="#8a1c26" />
          </linearGradient>
          <linearGradient id="sl-cold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4f9a" />
            <stop offset="100%" stopColor="#4da8ff" />
          </linearGradient>
          <linearGradient id="sl-qd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.kin} />
            <stop offset="100%" stopColor="#9fb6ff" />
          </linearGradient>
          <linearGradient id="sl-rod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa6cc" />
            <stop offset="100%" stopColor="#2a3358" />
          </linearGradient>
          <clipPath id="sl-cQp">
            <rect x={400} y={280} width={500} height={(EY - 286) * sQp + 6} />
          </clipPath>
          <clipPath id="sl-cW">
            <rect
              x={EX + ER - 10}
              y={400}
              width={(1040 - EX - ER) * sW + 10}
              height={240}
            />
          </clipPath>
          <clipPath id="sl-cQd">
            <rect x={400} y={EY} width={500} height={(764 - EY) * sQd + 4} />
          </clipPath>
        </defs>

        {/* ================= A: panas → dingin ================= */}
        {A > 0.001 ? (
          <g
            opacity={A}
            transform={`translate(960 ${BY}) scale(${1 - 0.06 * aOut}) translate(-960 ${-BY})`}
          >
            <Motes
              x={960}
              y={470}
              rx={620}
              ry={260}
              n={22}
              color="kin"
              opacity={0.3}
              seed={8}
            />
            <rect
              x={700}
              y={BY - 18}
              width={520}
              height={36}
              rx={8}
              fill="url(#sl-rod)"
              stroke="#aebbe0"
              strokeWidth={1.5}
            />
            <Stream
              pts={[
                [710, BY],
                [1210, BY],
              ]}
              color="kin"
              n={7}
              speed={0.45 * (0.3 + dT / 30)}
              r={6}
              jitter={6}
              opacity={flow}
            />
            <Block cx={HX} temp={50 + dT} t={t} seed={0} />
            <Block cx={CXB} temp={50 - dT} t={t} seed={3} />
            <Label x={HX} y={BY + 146} size={26} color={C.heat} weight={600}>
              benda panas
            </Label>
            <Label x={CXB} y={BY + 146} size={26} color={C.pot} weight={600}>
              benda dingin
            </Label>
            {/* ke mana? */}
            <g opacity={q}>
              <Arrow
                x1={740}
                y1={390}
                x2={1180}
                y2={390}
                color="muted"
                width={4}
                dash="10 10"
                both
              />
              <Label x={960} y={340} size={60} color={C.gold} weight={700}>
                ?
              </Label>
            </g>
            {/* spontan: panas → dingin */}
            <g opacity={fwd}>
              <Arrow
                x1={730}
                y1={390}
                x2={1190}
                y2={390}
                color="kin"
                width={8}
              />
              <Label x={960} y={345} size={25} color={C.kin} weight={600}>
                dengan sendirinya
              </Label>
            </g>
            {/* sebaliknya: dicoba, gagal */}
            <g opacity={rev}>
              <Arrow
                x1={1190}
                y1={556}
                x2={730}
                y2={556}
                color="pot"
                width={5}
                dash="12 10"
              />
              {[0, 1, 2].map((k) => {
                const ph = (t * 0.5 + k / 3) % 1;
                return (
                  <circle
                    key={k}
                    cx={1180 - 200 * Math.sin(Math.PI * ph)}
                    cy={556}
                    r={6}
                    fill={C.pot}
                    opacity={cyc(ph) * 0.9}
                  />
                );
              })}
              <path
                d={`M${930},${526} L${930 + 60 * Math.min(1, xMark * 2)},${526 + 60 * Math.min(1, xMark * 2)}`}
                stroke={C.heat}
                strokeWidth={9}
                strokeLinecap="round"
              />
              <path
                d={`M${990},${526} L${990 - 60 * Math.max(0, xMark * 2 - 1)},${526 + 60 * Math.max(0, xMark * 2 - 1)}`}
                stroke={C.heat}
                strokeWidth={9}
                strokeLinecap="round"
              />
              <Label
                x={960}
                y={622}
                size={24}
                color={C.heat}
                weight={600}
                opacity={xMark}
              >
                tidak pernah sebaliknya
              </Label>
            </g>
            <Ripple
              x={960}
              y={556}
              p={(t - wordOf(1, "tidak") - 0.3) / 1.2}
              r={100}
              color="heat"
              rings={2}
            />
          </g>
        ) : null}

        {/* ================= B: mesin kalor ================= */}
        {B > 0.001 ? (
          <g opacity={B}>
            <g transform={`translate(${shiftX} 0)`}>
              <Motes
                x={640}
                y={520}
                rx={380}
                ry={300}
                n={18}
                color="kin"
                opacity={0.3}
                seed={9}
              />
              {/* sumber panas */}
              <Glow x={EX} y={240} r={320} color="heat" opacity={0.35} />
              <rect
                x={300}
                y={196}
                width={680}
                height={90}
                rx={16}
                fill="url(#sl-hot)"
                stroke="#ffb09a"
                strokeWidth={2}
              />
              {Array.from({ length: 6 }, (_, k) => (
                <path
                  key={k}
                  d={`M${340 + k * 110},${214 + 4 * Math.sin(t * 2 + k)} q14,-8 28,0 t28,0`}
                  fill="none"
                  stroke="#ffd6c8"
                  strokeWidth={2}
                  opacity={0.35}
                />
              ))}
              <Label
                x={330}
                y={252}
                size={26}
                color="#fff2ee"
                anchor="start"
                weight={600}
              >
                sumber panas
              </Label>
              <Label
                x={950}
                y={252}
                size={30}
                color="#fff2ee"
                anchor="end"
                font="serif"
                italic
                weight={600}
              >
                T
                <tspan baselineShift="sub" fontSize="0.65em">
                  p
                </tspan>
              </Label>
              <Label
                x={890}
                y={252}
                size={26}
                color="#fff2ee"
                anchor="end"
                font="mono"
                weight={600}
                opacity={kv}
              >
                600 K ·
              </Label>
              {/* lingkungan dingin */}
              <Glow x={EX} y={805} r={300} color="pot" opacity={0.3} />
              <rect
                x={300}
                y={764}
                width={680}
                height={88}
                rx={16}
                fill="url(#sl-cold)"
                stroke="#a9d4ff"
                strokeWidth={2}
              />
              <Label
                x={330}
                y={808}
                size={26}
                color="#eef6ff"
                anchor="start"
                weight={600}
              >
                lingkungan dingin
              </Label>
              <Label
                x={950}
                y={808}
                size={30}
                color="#eef6ff"
                anchor="end"
                font="serif"
                italic
                weight={600}
              >
                T
                <tspan baselineShift="sub" fontSize="0.65em">
                  d
                </tspan>
              </Label>
              <Label
                x={890}
                y={808}
                size={26}
                color="#eef6ff"
                anchor="end"
                font="mono"
                weight={600}
                opacity={kv}
              >
                300 K ·
              </Label>
              {/* pita Q_p */}
              <g clipPath="url(#sl-cQp)">
                <path
                  d={`M${EX - QW / 2},286 L${EX + QW / 2},286 L${EX + QW / 2 - 8},${EY - ER + 8} L${EX - QW / 2 + 8},${EY - ER + 8} Z`}
                  fill={C.kin}
                  opacity={0.5}
                />
                <Stream
                  pts={[
                    [EX, 290],
                    [EX, EY - ER],
                  ]}
                  color="kin"
                  n={5}
                  speed={0.7}
                  r={6}
                  jitter={22}
                />
              </g>
              <Label
                x={EX - QW / 2 - 18}
                y={362}
                size={38}
                color={C.kin}
                anchor="end"
                font="serif"
                italic
                weight={600}
                opacity={sQp}
              >
                Q
                <tspan baselineShift="sub" fontSize="0.6em">
                  p
                </tspan>
              </Label>
              {/* pita W */}
              <g clipPath="url(#sl-cW)">
                <rect
                  x={EX + ER - 6}
                  y={EY - WW / 2}
                  width={1000 - EX - ER}
                  height={WW}
                  fill={C.work}
                  opacity={0.55}
                />
                <path
                  d={`M994,${EY - WW / 2 - 14} L1030,${EY} L994,${EY + WW / 2 + 14} Z`}
                  fill={C.work}
                />
                <Stream
                  pts={[
                    [EX + ER, EY],
                    [1000, EY],
                  ]}
                  color="work"
                  n={4}
                  speed={0.7}
                  r={5}
                  jitter={6}
                />
              </g>
              <Label
                x={1050}
                y={EY - 4}
                size={40}
                color={C.work}
                anchor="start"
                font="serif"
                italic
                weight={600}
                opacity={sW}
              >
                W
              </Label>
              <Label
                x={1050}
                y={EY + 36}
                size={21}
                color={C.muted}
                anchor="start"
                opacity={sW}
              >
                usaha (sebagian)
              </Label>
              {/* pita Q_d */}
              <g clipPath="url(#sl-cQd)">
                <path
                  d={`M${EX - DW / 2 + 6},${EY + ER - 8} L${EX + DW / 2 - 6},${EY + ER - 8} L${EX + DW / 2},764 L${EX - DW / 2},764 Z`}
                  fill="url(#sl-qd)"
                  opacity={0.5}
                />
                <Stream
                  pts={[
                    [EX, EY + ER],
                    [EX, 762],
                  ]}
                  color="kin"
                  n={4}
                  speed={0.7}
                  r={5}
                  jitter={14}
                  seed={3}
                />
              </g>
              <Label
                x={EX - DW / 2 - 18}
                y={688}
                size={38}
                color={C.kin}
                anchor="end"
                font="serif"
                italic
                weight={600}
                opacity={sQd}
              >
                Q
                <tspan baselineShift="sub" fontSize="0.6em">
                  d
                </tspan>
              </Label>
              <Label
                x={EX + DW / 2 + 18}
                y={688}
                size={21}
                color={C.muted}
                anchor="start"
                opacity={sQd}
              >
                sisa dibuang
              </Label>
              {/* mesin */}
              <Glow x={EX} y={EY} r={170} color="work" opacity={0.35 * run} />
              <circle
                cx={EX}
                cy={EY}
                r={ER}
                fill="#141d40"
                stroke="#c3cdee"
                strokeWidth={4}
              />
              <g transform={`rotate(${ang} ${EX} ${EY})`}>
                <circle
                  cx={EX}
                  cy={EY}
                  r={ER - 18}
                  fill="none"
                  stroke="#7d8bbd"
                  strokeWidth={8}
                />
                {Array.from({ length: 6 }, (_, k) => {
                  const a = (k / 6) * Math.PI * 2;
                  return (
                    <line
                      key={k}
                      x1={EX}
                      y1={EY}
                      x2={EX + (ER - 20) * Math.cos(a)}
                      y2={EY + (ER - 20) * Math.sin(a)}
                      stroke="#9aa8d4"
                      strokeWidth={5}
                    />
                  );
                })}
                <circle cx={EX + (ER - 18)} cy={EY} r={9} fill={C.work} />
              </g>
              <circle cx={EX} cy={EY} r={14} fill="#c3cdee" />
              <Label
                x={EX - ER - 20}
                y={EY}
                size={26}
                color={C.ink}
                anchor="end"
                weight={600}
              >
                mesin kalor
              </Label>
            </g>
            {/* batang efisiensi */}
            <g opacity={bars}>
              <line
                x1={1230}
                y1={BB}
                x2={1760}
                y2={BB}
                stroke={C.muted}
                strokeWidth={2.5}
              />
              <line
                x1={1250}
                y1={BB - BH}
                x2={1740}
                y2={BB - BH}
                stroke={C.muted}
                strokeWidth={1.5}
                strokeDasharray="6 8"
                opacity={0.6}
              />
              <Label
                x={1250}
                y={BB - BH - 22}
                size={20}
                color={C.muted}
                anchor="start"
                font="mono"
              >
                100 %
              </Label>
              <line
                x1={1250}
                y1={BB - BH * 0.5}
                x2={1740}
                y2={BB - BH * 0.5}
                stroke={C.gold}
                strokeWidth={2}
                strokeDasharray="8 8"
                strokeDashoffset={-t * 14}
                opacity={barC}
              />
              {/* Carnot */}
              <rect
                x={1300}
                y={BB - BH * 0.5 * barC}
                width={130}
                height={BH * 0.5 * barC}
                rx={8}
                fill={C.work}
                opacity={0.32}
                stroke={C.work}
                strokeWidth={3}
                strokeDasharray="10 7"
              />
              <Label
                x={1365}
                y={BB - BH * 0.5 * barC - 28}
                size={30}
                color={C.gold}
                weight={700}
                opacity={barC}
              >
                50 %
              </Label>
              <Label x={1365} y={BB + 26} size={22} color={C.muted}>
                batas Carnot
              </Label>
              {/* mesin nyata */}
              <rect
                x={1570}
                y={BB - BH * realEta * barR}
                width={130}
                height={BH * realEta * barR}
                rx={8}
                fill={C.work}
                opacity={0.85}
              />
              <rect
                x={1570}
                y={BB - BH * realEta * barR}
                width={130}
                height={6}
                rx={3}
                fill="#fff"
                opacity={0.35 * barR}
              />
              <g opacity={barR}>
                <line
                  x1={1635}
                  y1={BB - BH * 0.25}
                  x2={1635}
                  y2={BB - BH * 0.4}
                  stroke={C.ink}
                  strokeWidth={2.5}
                />
                <line
                  x1={1620}
                  y1={BB - BH * 0.25}
                  x2={1650}
                  y2={BB - BH * 0.25}
                  stroke={C.ink}
                  strokeWidth={2.5}
                />
                <line
                  x1={1620}
                  y1={BB - BH * 0.4}
                  x2={1650}
                  y2={BB - BH * 0.4}
                  stroke={C.ink}
                  strokeWidth={2.5}
                />
                <Label
                  x={1708}
                  y={BB - BH * 0.32}
                  size={22}
                  color={C.work}
                  weight={600}
                  anchor="start"
                >
                  ≈ 25–40 %
                </Label>
              </g>
              <Label x={1635} y={BB + 26} size={22} color={C.muted}>
                mesin nyata
              </Label>
            </g>
            <Twinkles
              x={1365}
              y={BB - BH * 0.5 - 28}
              rx={70}
              ry={26}
              n={4}
              opacity={barC * (1 - ramp(t, dur - 1, dur))}
            />
            <Ripple
              x={1365}
              y={BB - BH * 0.5}
              p={(t - wordOf(4, "lima") - 0.5) / 1.4}
              r={120}
              color="gold"
              rings={2}
            />
          </g>
        ) : null}
        <Glow
          x={1490}
          y={300}
          r={260}
          color="gold"
          opacity={0.3 * Math.max(f3, f4 * kv)}
        />
      </Stage>

      <Note x={960} y={790} p={n0 * (1 - aOut)} color={C.spr} size={29}>
        hukum pertama: energi <span style={{ color: C.spr }}>kekal</span> — tapi
        ke mana?
      </Note>
      <Note x={960} y={790} p={n1 * (1 - aOut)} color={C.kin} size={29}>
        hukum kedua: kalor mengalir spontan{" "}
        <span style={{ color: C.heat }}>panas</span> →{" "}
        <span style={{ color: C.pot }}>dingin</span>
      </Note>
      <Formula
        x={1490}
        y={300}
        p={f3}
        accent={C.gold}
        size={58}
        caption="efisiensi terbaik yang mungkin"
      >
        <span style={{ fontStyle: "italic" }}>η</span>
        <Sub>Carnot</Sub> = 1 −{" "}
        <Frac
          n={
            <>
              <span style={{ fontStyle: "italic", color: C.pot }}>T</span>
              <Sub color={C.pot}>d</Sub>
            </>
          }
          d={
            <>
              <span style={{ fontStyle: "italic", color: C.heat }}>T</span>
              <Sub color={C.heat}>p</Sub>
            </>
          }
        />
      </Formula>
      <Formula
        x={1490}
        y={300}
        p={f4}
        accent={C.work}
        size={58}
        caption="mesin nyata jauh di bawahnya"
      >
        <span style={{ fontStyle: "italic" }}>η</span> = 1 −{" "}
        <Frac
          n={<span style={{ color: C.pot }}>300 K</span>}
          d={<span style={{ color: C.heat }}>600 K</span>}
        />{" "}
        ={" "}
        <span style={{ color: C.gold, opacity: mix(0.25, 1, barC) }}>50 %</span>
      </Formula>
    </AbsoluteFill>
  );
};
