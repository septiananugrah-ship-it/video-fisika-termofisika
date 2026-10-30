import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Entropi (AUDIT): ΔS = Q/T (reversibel). Contoh angka konsisten dengan adegan hukum kedua:
// Q = 600 J dari T_p = 600 K ke T_d = 300 K → ΔS_panas = −600/600 = −1 J/K, ΔS_dingin = +600/300 = +2 J/K,
// ΔS_total = Q(1/T_d − 1/T_p) = +1 J/K > 0.

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const BASE = 640; // garis nol batang ΔS
const KS = 90; // px per J/K
const BW = 120;

/** Benda bersuhu: balok dengan gradien warna (−1 dingin … 0 netral … +1 panas). */
const Body: React.FC<{x: number; y: number; w: number; h: number; k: number; op: number; t: number; label: React.ReactNode}> = ({x, y, w, h, k, op, t, label}) => {
  if (op <= 0.001) return null;
  const col = interpolateColors(k, [-1, 0, 1], [C.pot, '#7d87b8', C.heat]);
  const hot = Math.max(0, k);
  const cold = Math.max(0, -k);
  const id = `ent-body-${Math.round(x)}`;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity={0.95} />
          <stop offset="100%" stopColor="#141c3c" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <ellipse cx={x} cy={y + h / 2 + 16} rx={w * 0.6} ry={14} fill="#000" opacity={0.35} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={22} fill={`url(#${id})`} stroke={col} strokeWidth={3} />
      <rect x={x - w / 2 + 14} y={y - h / 2 + 10} width={w - 28} height={10} rx={5} fill="#fff" opacity={0.18} />
      {/* panas: garis kilau naik; dingin: kristal es berkelip */}
      {hot > 0.01
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.6 + i / 3) % 1;
            const xx = x - w * 0.25 + i * w * 0.25;
            const yy = y - h / 2 - 10 - ph * 70;
            return (
              <path
                key={i}
                d={`M${xx},${yy + 30} q10,-10 0,-20 q-10,-10 0,-20`}
                fill="none"
                stroke={C.heat}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={hot * cyc(ph) * 0.8}
              />
            );
          })
        : null}
      {cold > 0.01
        ? [0, 1, 2, 3, 4].map((i) => {
            const xx = x - w / 2 + 26 + rand(i * 3.3) * (w - 52);
            const yy = y - h / 2 + 34 + rand(i * 5.1) * (h - 68);
            const s = 8 + 4 * Math.sin(t * 1.6 + i * 1.7);
            return (
              <g key={i} opacity={cold * (0.45 + 0.35 * Math.sin(t * 2 + i))} stroke="#dff1ff" strokeWidth={2} strokeLinecap="round">
                <line x1={xx - s} y1={yy} x2={xx + s} y2={yy} />
                <line x1={xx - s * 0.5} y1={yy - s * 0.87} x2={xx + s * 0.5} y2={yy + s * 0.87} />
                <line x1={xx - s * 0.5} y1={yy + s * 0.87} x2={xx + s * 0.5} y2={yy - s * 0.87} />
              </g>
            );
          })
        : null}
      {/* molekul di dalam bergetar (lebih panas = lebih kuat) */}
      {Array.from({length: 9}, (_, i) => {
        const amp = 3 + 6 * (k + 1);
        const bx = x - w / 2 + 30 + (i % 3) * ((w - 60) / 2) + amp * Math.sin(t * (6 + 3 * (k + 1)) + i * 1.9);
        const by = y - h / 2 + 46 + Math.floor(i / 3) * ((h - 80) / 2) + amp * Math.cos(t * (5 + 3 * (k + 1)) + i * 2.3);
        return <circle key={i} cx={bx} cy={by} r={6} fill="#fff" opacity={0.28} />;
      })}
      <Label x={x} y={y} size={46} font="serif" italic weight={600} color={C.ink}>
        {label}
      </Label>
    </g>
  );
};

/** Batang ΔS (emas) dari garis nol; v dalam J/K, p 0..1. */
const SBar: React.FC<{x: number; v: number; p: number; t: number; dim?: boolean; seed: number}> = ({x, v, p, t, dim, seed}) => {
  if (p <= 0.001) return null;
  const hgt = Math.abs(v) * KS * p;
  const y = v >= 0 ? BASE - hgt : BASE;
  return (
    <g>
      <rect x={x - BW / 2} y={y} width={BW} height={hgt} rx={8} fill={C.gold} opacity={dim ? 0.35 : 0.85} />
      <rect x={x - BW / 2} y={y} width={BW} height={hgt} rx={8} fill="none" stroke={dim ? C.heat : C.gold} strokeWidth={3} strokeDasharray={dim ? '10 7' : undefined} />
      <rect x={x - BW / 2 + 10} y={y + 6} width={14} height={Math.max(0, hgt - 12)} rx={6} fill="#fff" opacity={0.22} />
      {/* butir emas naik (positif) atau turun (negatif) di dalam batang */}
      {Array.from({length: 5}, (_, i) => {
        const ph = (t * 0.45 + i / 5 + seed * 0.13) % 1;
        const yy = v >= 0 ? BASE - ph * hgt : BASE + ph * hgt;
        return <circle key={i} cx={x - 26 + ((i * 37) % 60)} cy={yy} r={4} fill="#fff" opacity={cyc(ph) * 0.55 * p} />;
      })}
      <line x1={x - BW / 2 - 8} x2={x + BW / 2 + 8} y1={v >= 0 ? y : y + hgt} y2={v >= 0 ? y : y + hgt} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
    </g>
  );
};

export const Entropy: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();

  // ---------- fase ----------
  const tInilah = wordOf(3, 'inilah');
  const emIn = ramp(t, -0.4, 0.9);
  const emMove = ramp(t, cue(1) - 0.3, cue(1) + 1.0, EASE_IN_OUT);
  const emOut = 1 - ramp(t, cue(2) - 0.3, cue(2) + 0.5, EASE_IN_OUT);
  const emX = mix(960, 1460, emMove);
  const emY = mix(500, 560, emMove);
  const emS = mix(1, 0.72, emMove);
  const sWord = ramp(t, wordOf(0, 'entropi') - 0.3, wordOf(0, 'entropi') + 0.4);

  const bodyIn = ramp(t, cue(1) - 0.1, cue(1) + 0.8);
  const split = ramp(t, cue(2) - 0.2, cue(2) + 1.1, EASE_IN_OUT);
  const qIn1 = ramp(t, wordOf(1, 'masuk') - 0.3, wordOf(1, 'masuk') + 0.4) * (1 - split);
  const meter1 = ramp(t, wordOf(1, 'masuk'), cueEnd(1) + 0.3, EASE_IN_OUT);
  const hotIn = ramp(t, cue(2) + 0.2, cue(2) + 1.0);
  const flow = ramp(t, cue(2) + 0.6, cue(2) + 1.4);

  const barsIn = ramp(t, cue(2) - 0.1, cue(2) + 0.7);
  const barsOut = 1 - ramp(t, tInilah - 0.3, tInilah + 0.4, EASE_IN_OUT);
  const pCold = ramp(t, wordOf(2, 'dingin') - 0.2, wordOf(2, 'dingin') + 0.9, EASE_IN_OUT);
  const pHot = ramp(t, wordOf(2, 'keluar') - 0.2, wordOf(2, 'keluar') + 0.9, EASE_IN_OUT);
  const tTot = wordOf(3, 'total');
  const pTot = ramp(t, tTot - 0.4, tTot + 0.7, EASE_IN_OUT);
  const moreP = ramp(t, wordOf(2, 'banyak') - 0.3, wordOf(2, 'banyak') + 0.4);

  const mIn = ramp(t, tInilah - 0.1, tInilah + 0.7);
  const tNever = wordOf(3, 'pernah');
  // meter entropi semesta: naik terus dengan "gigi" kecil (tak pernah turun)
  const steps = Array.from({length: 9}, (_, i) => ramp(t, tInilah + 0.4 + i * 0.85, tInilah + 0.9 + i * 0.85, EASE_IN_OUT)).reduce((a, b) => a + b, 0);
  const mLevel = 0.22 + 0.07 * steps;

  // posisi benda
  const coldX = mix(600, 830, split);
  const bodyY = 620;
  const kCold = mix(0, -1, split);
  const arc: [number, number][] = [
    [450, 580],
    [520, 520],
    [600, 495],
    [680, 520],
    [720, 570],
  ];

  // kolom batang
  const XH = 1190;
  const XC = 1430;
  const XT = 1670;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===================== lambang S ===================== */}
        <g opacity={emIn * emOut} transform={`translate(${emX} ${emY}) scale(${emS})`}>
          <Glow x={0} y={0} r={320} color="gold" opacity={0.8} />
          <circle r={150} fill="#0d1430" stroke={C.gold} strokeWidth={4} />
          <circle r={176} fill="none" stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 14" opacity={0.6} transform={`rotate(${t * 14})`} />
          <circle r={204} fill="none" stroke={C.gold} strokeWidth={1.5} strokeDasharray="2 10" opacity={0.35} transform={`rotate(${-t * 9})`} />
          {[0, 1, 2].map((i) => {
            const a = t * 0.7 + (i * 2 * Math.PI) / 3;
            return <circle key={i} cx={176 * Math.cos(a)} cy={176 * Math.sin(a)} r={7} fill={C.gold} opacity={0.9} />;
          })}
          <text x={0} y={8} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={200} fill={C.gold}>
            S
          </text>
          <Motes x={0} y={0} rx={260} ry={240} n={26} color="gold" opacity={0.55} seed={3} />
          <Label x={0} y={262} size={46} weight={600} color={C.gold} opacity={sWord}>
            entropi
          </Label>
          <Label x={0} y={316} size={28} color={C.muted} opacity={sWord * (1 - emMove)}>
            ukuran arah alami proses
          </Label>
        </g>
        <Ripple x={960} y={500} p={ramp(t, wordOf(0, 'entropi') - 0.1, wordOf(0, 'entropi') + 1.4)} r={300} color="gold" />

        {/* ===================== satu benda menerima Q (baris 1) ===================== */}
        <Stream
          pts={[
            [120, bodyY],
            [300, bodyY - 14],
            [470, bodyY],
          ]}
          color="kin"
          n={9}
          speed={0.55}
          r={7}
          opacity={qIn1}
        />
        <Arrow x1={130} y1={bodyY + 50} x2={440} y2={bodyY + 50} color="kin" width={5} opacity={qIn1 * 0.8} />
        <Label x={290} y={bodyY - 60} size={40} font="serif" italic weight={600} color={C.kin} opacity={qIn1}>
          Q masuk
        </Label>
        {/* meter kecil ΔS di samping benda */}
        <g opacity={bodyIn * (1 - split)}>
          <rect x={752} y={520} width={34} height={200} rx={17} fill="#0d1430" stroke={C.gold} strokeWidth={2.5} />
          <rect x={758} y={714 - 188 * (0.15 + 0.6 * meter1)} width={22} height={188 * (0.15 + 0.6 * meter1)} rx={11} fill={C.gold} opacity={0.85} />
          <Label x={769} y={490} size={32} font="serif" italic weight={600} color={C.gold}>
            S ↑
          </Label>
        </g>

        {/* ===================== dua benda: panas → dingin ===================== */}
        <Body x={330} y={bodyY} w={210} h={170} k={1} op={hotIn} t={t} label={<>T<TSub>p</TSub></>} />
        <Body x={coldX} y={bodyY} w={210} h={170} k={kCold} op={bodyIn} t={t} label="T" />
        {/* label suhu benda dingin: silang-pudar T → T_d */}
        <Label x={coldX + 15} y={bodyY + 12} size={30} anchor="start" font="serif" italic weight={600} color={C.ink} opacity={split}>
          d
        </Label>
        <Label x={330} y={bodyY + 120} size={30} font="mono" color={C.heat} opacity={hotIn}>
          600 K
        </Label>
        <Label x={830} y={bodyY + 120} size={30} font="mono" color={C.pot} opacity={split}>
          300 K
        </Label>
        <Stream pts={arc} color="kin" n={8} speed={0.5} r={7} opacity={flow} jitter={3} />
        <Label x={590} y={445} size={34} font="serif" italic weight={600} color={C.kin} opacity={flow}>
          Q = 600 J
        </Label>
        <Glow x={330} y={bodyY} r={200} color="heat" opacity={hotIn * 0.5} />
        <Glow x={coldX} y={bodyY} r={200} color="pot" opacity={split * 0.45} />

        {/* ===================== batang ΔS ===================== */}
        <g opacity={barsIn * barsOut}>
          <Label x={1110} y={400} size={28} font="serif" italic color={C.gold} anchor="start">
            ΔS (J/K)
          </Label>
          <line x1={1100} x2={1780} y1={BASE} y2={BASE} stroke={C.muted} strokeWidth={3} />
          <SBar x={XH} v={-1} p={pHot} t={t} dim seed={1} />
          <SBar x={XC} v={2} p={pCold} t={t} seed={2} />
          <SBar x={XT} v={1} p={pTot} t={t} seed={3} />
          <Label x={XH} y={BASE + KS + 30} size={30} font="mono" color={C.heat} opacity={pHot}>
            −1
          </Label>
          <Label x={XC} y={BASE - 2 * KS - 32} size={30} font="mono" color={C.gold} opacity={pCold}>
            +2
          </Label>
          <Label x={XT} y={BASE - KS - 32} size={34} font="mono" weight={600} color={C.gold} opacity={pTot}>
            +1
          </Label>
          <Label x={XH} y={812} size={26} color={C.heat} opacity={pHot}>
            keluar dari panas
          </Label>
          <Label x={XH} y={846} size={24} font="serif" italic color={C.muted} opacity={pHot}>
            −Q/T<TSub>p</TSub>
          </Label>
          <Label x={XC} y={812} size={26} color={C.pot} opacity={pCold}>
            masuk ke dingin
          </Label>
          <Label x={XC} y={846} size={24} font="serif" italic color={C.muted} opacity={pCold}>
            +Q/T<TSub>d</TSub>
          </Label>
          <Label x={XT} y={812} size={28} weight={600} color={C.gold} opacity={pTot}>
            total
          </Label>
          {/* "lebih banyak": kurung pembanding tinggi batang */}
          <g opacity={moreP * (1 - pTot * 0.6)}>
            <line x1={XC + BW / 2 + 16} x2={XC + BW / 2 + 16} y1={BASE - 2 * KS} y2={BASE} stroke={C.gold} strokeWidth={2.5} />
            <Label x={XC + BW / 2 + 30} y={BASE - KS} size={26} color={C.gold} anchor="start">
              2×
            </Label>
          </g>
          <Ripple x={XT} y={BASE - KS} p={ramp(t, tTot + 0.2, tTot + 1.6)} r={150} color="gold" />
          <Twinkles x={XT} y={BASE - KS - 40} rx={90} ry={60} n={5} opacity={pTot} />
        </g>

        {/* ===================== meter entropi alam semesta ===================== */}
        <g opacity={mIn}>
          <Glow x={1450} y={mix(800, 260, mLevel)} r={220} color="gold" opacity={0.5} />
          <rect x={1400} y={250} width={100} height={560} rx={50} fill="#0d1430" stroke={C.gold} strokeWidth={3} />
          {Array.from({length: 11}, (_, i) => (
            <line key={i} x1={1500} x2={1520} y1={290 + i * 48} y2={290 + i * 48} stroke={C.muted} strokeWidth={2} opacity={0.6} />
          ))}
          <rect x={1412} y={798 - 536 * mLevel} width={76} height={536 * mLevel} rx={38} fill={C.gold} opacity={0.88} />
          <rect x={1424} y={810 - 536 * mLevel} width={14} height={Math.max(0, 536 * mLevel - 30)} rx={7} fill="#fff" opacity={0.25} />
          {Array.from({length: 6}, (_, i) => {
            const ph = (t * 0.35 + i / 6) % 1;
            return <circle key={i} cx={1435 + ((i * 23) % 40)} cy={798 - ph * 536 * mLevel} r={5} fill="#fff" opacity={cyc(ph) * 0.6} />;
          })}
          <Label x={1450} y={210} size={32} weight={600} color={C.gold}>
            S alam semesta
          </Label>
          <Arrow x1={1600} y1={760} x2={1600} y2={320} color="gold" width={7} />
          <Label x={1640} y={540} size={30} color={C.gold} anchor="start" opacity={ramp(t, tNever - 0.3, tNever + 0.4)}>
            tak pernah
          </Label>
          <Label x={1640} y={580} size={30} color={C.gold} anchor="start" opacity={ramp(t, tNever - 0.3, tNever + 0.4)}>
            turun
          </Label>
          <Twinkles x={1450} y={798 - 536 * mLevel} rx={80} ry={40} n={5} />
          <Motes x={1450} y={530} rx={200} ry={300} n={18} color="gold" opacity={0.4} seed={8} />
        </g>
      </Stage>

      {/* ===================== kartu rumus ===================== */}
      <Formula x={600} y={300} p={slot(t, cue(1) + 0.3, cue(3) + 0.3)} accent={C.gold} size={66} caption="kalor Q masuk ke benda bersuhu T">
        <Tint c="gold">
          Δ<V>S</V>
        </Tint>{' '}
        = <Frac n={<V color="kin">Q</V>} d={<V>T</V>} />
      </Formula>
      <Formula x={600} y={300} p={slot(t, cue(3) + 0.3, tInilah - 0.1)} accent={C.gold} size={56}>
        <Tint c="gold">
          Δ<V>S</V>
          <Sub>total</Sub>
        </Tint>{' '}
        ={' '}
        <Frac
          n={<V color="kin">Q</V>}
          d={
            <>
              <V color="pot">T</V>
              <Sub color={C.pot}>d</Sub>
            </>
          }
        />{' '}
        −{' '}
        <Frac
          n={<V color="kin">Q</V>}
          d={
            <>
              <V color="heat">T</V>
              <Sub color={C.heat}>p</Sub>
            </>
          }
        />{' '}
        &gt; 0
      </Formula>
      <Formula x={600} y={300} p={slot(t, tInilah - 0.1, dur + 2)} accent={C.gold} size={64} caption="hukum kedua, versi entropi">
        <Tint c="gold">
          Δ<V>S</V>
          <Sub>semesta</Sub>
        </Tint>{' '}
        ≥ 0
      </Formula>
    </AbsoluteFill>
  );
};
