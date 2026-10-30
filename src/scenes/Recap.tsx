import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Sup, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Enam kartu rangkuman, masing-masing dengan animasi mini yang terus berulang (dihitung analitik):
// suhu = gerak molekul (laju ∝ √T) · Q = mcΔT + dataran kalor laten · tiga cara perpindahan · ΔU = Q − W ·
// entropi naik (kalor panas → dingin) · faktor Boltzmann (populasi tingkat energi bergantung kT);
// lalu pertanyaan kunci ("dari mana kalornya, dan ke mana ia pergi?").
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const tri = (u: number) => 1 - Math.abs(2 * (((u % 1) + 1) % 1) - 1); // gelombang segitiga (pantul dinding), kontinu
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;

/** 01 · Molekul memantul di kotak: dingin lambat, panas cepat (laju ∝ √T). */
const MiniMol: React.FC<{t: number}> = ({t}) => {
  const box = (x0: number, col: string, v: number, seed: number) => (
    <g>
      <rect x={x0} y={6} width={130} height={56} rx={8} fill={col} fillOpacity={0.08} stroke={col} strokeOpacity={0.6} strokeWidth={1.5} />
      {Array.from({length: 6}, (_, i) => {
        const x = x0 + 8 + 114 * tri(t * v * (0.6 + 0.5 * rand(i + seed)) + rand(i * 3 + seed));
        const y = 14 + 40 * tri(t * v * (0.5 + 0.5 * rand(i * 7 + seed)) + rand(i * 5 + seed));
        return <circle key={i} cx={x} cy={y} r={4.5} fill={C.cyan} />;
      })}
    </g>
  );
  return (
    <g>
      {box(10, C.pot, 0.18, 1)}
      {box(160, C.heat, 0.5, 4)}
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.pot}>
        dingin: lambat
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.heat}>
        panas: cepat
      </text>
    </g>
  );
};

/** 02 · Kurva pemanasan: naik (mcΔT), datar saat berubah wujud (kalor laten). */
const HC: [number, number][] = [
  [12, 58],
  [70, 44],
  [140, 44],
  [210, 18],
  [296, 18],
];
const MiniHeat: React.FC<{t: number}> = ({t}) => {
  const q = ph(t, 4.5);
  const [x, y] = pointAlong(HC, q);
  return (
    <g>
      <polyline points={HC.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.faint} strokeWidth={2} />
      <line x1={70} y1={44} x2={140} y2={44} stroke={C.gold} strokeWidth={3.5} opacity={0.7} />
      <line x1={210} y1={18} x2={296} y2={18} stroke={C.gold} strokeWidth={3.5} opacity={0.7} />
      <circle cx={x} cy={y} r={12} fill="url(#soft-kin)" opacity={cyc(q)} />
      <circle cx={x} cy={y} r={5} fill="#fff" opacity={cyc(q)} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.kin}>
        naik: mcΔT
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.gold}>
        datar: laten
      </text>
    </g>
  );
};

/** 03 · Konduksi (batang), konveksi (arus melingkar), radiasi (gelombang). */
const MiniTransfer: React.FC<{t: number}> = ({t}) => {
  const wig: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = 214 + i * 2.8;
    wig.push(`${x.toFixed(1)},${(34 - 9 * Math.sin((x - t * 60) * 0.25)).toFixed(1)}`);
  }
  return (
    <g>
      <rect x={10} y={28} width={86} height={12} rx={6} fill="#3c4c84" />
      <circle cx={14} cy={34} r={10} fill="url(#soft-heat)" />
      {[0, 1, 2].map((i) => {
        const q = ph(t, 1.8, i * 0.6);
        return <circle key={i} cx={14 + q * 80} cy={34} r={4} fill={C.kin} opacity={cyc(q)} />;
      })}
      <ellipse cx={150} cy={34} rx={30} ry={20} fill="none" stroke={C.kin} strokeOpacity={0.3} strokeWidth={1.5} />
      {[0, 1, 2, 3].map((i) => {
        const a = t * 2 + (i * Math.PI) / 2;
        return <circle key={i} cx={150 + 30 * Math.cos(a)} cy={34 - 20 * Math.sin(a)} r={4} fill={C.kin} />;
      })}
      <circle cx={208} cy={34} r={12} fill="url(#soft-heat)" />
      <circle cx={208} cy={34} r={5} fill={C.heat} />
      <polyline points={wig.join(' ')} fill="none" stroke={C.heat} strokeWidth={2.4} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.kin}>
        padat · fluida
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.heat}>
        ruang hampa
      </text>
    </g>
  );
};

/** 04 · Hukum pertama: kalor Q masuk ke gas, sebagian jadi usaha W (piston naik), sisanya energi dalam U. */
const MiniFirst: React.FC<{t: number}> = ({t}) => {
  const s = Math.sin(t * 1.5);
  const pyP = 22 - 7 * s;
  const up = 0.5 + 0.5 * Math.cos(t * 1.5);
  return (
    <g>
      <rect x={30} y={10} width={90} height={52} rx={4} fill="none" stroke={C.muted} strokeWidth={2} />
      <rect x={32} y={pyP + 6} width={86} height={54 - pyP} fill={C.spr} opacity={0.3 + 0.12 * Math.sin(t * 3)} />
      <rect x={32} y={pyP} width={86} height={7} rx={2} fill="#9fb0e6" />
      <line x1={75} y1={pyP} x2={75} y2={pyP - 14} stroke={C.work} strokeWidth={3} opacity={up} markerEnd="url(#arrow-work)" />
      {[0, 1, 2].map((i) => {
        const q = ph(t, 1.4, i * 0.47);
        return <circle key={i} cx={52 + i * 22} cy={74 - q * 26} r={3.5} fill={C.kin} opacity={cyc(q)} />;
      })}
      {/* neraca: Q → U → W */}
      <line x1={150} y1={34} x2={196} y2={34} stroke={C.kin} strokeWidth={4} markerEnd="url(#arrow-kin)" />
      <circle cx={226} cy={34} r={18} fill={C.spr} fillOpacity={0.25 + 0.1 * Math.sin(t * 3)} stroke={C.spr} strokeWidth={2} />
      <text x={226} y={35} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={18} fill={C.spr}>
        U
      </text>
      <line x1={248} y1={34} x2={292} y2={34} stroke={C.work} strokeWidth={3} markerEnd="url(#arrow-work)" />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.kin}>
        Q masuk
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.work}>
        W keluar
      </text>
    </g>
  );
};

/** 05 · Kalor mengalir panas → dingin, entropi total (emas) terus naik. */
const MiniEntropy: React.FC<{t: number}> = ({t}) => {
  const q = ph(t, 4);
  const sCurve = (u: number): [number, number] => [222 + u * 76, 56 - 40 * (1 - Math.exp(-2.4 * u)) / (1 - Math.exp(-2.4))];
  const n = 24;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = sCurve((q * i) / n);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const [hx, hy] = sCurve(q);
  return (
    <g>
      <rect x={10} y={12} width={56} height={44} rx={8} fill={C.heat} fillOpacity={0.3} stroke={C.heat} strokeWidth={2} />
      <rect x={136} y={12} width={56} height={44} rx={8} fill={C.pot} fillOpacity={0.3} stroke={C.pot} strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => {
        const p = ph(t, 1.6, i * 0.4);
        return <circle key={i} cx={66 + p * 70} cy={34 + 6 * Math.sin(t * 3 + i)} r={4} fill={C.kin} opacity={cyc(p)} />;
      })}
      <line x1={222} y1={58} x2={302} y2={58} stroke={C.faint} strokeWidth={1.5} />
      <line x1={222} y1={58} x2={222} y2={10} stroke={C.faint} strokeWidth={1.5} />
      <g opacity={Math.min(1, cyc(q) * 1.2)}>
        <polyline points={pts.join(' ')} fill="none" stroke={C.gold} strokeWidth={2.8} />
        <circle cx={hx} cy={hy} r={10} fill="url(#soft-gold)" />
        <circle cx={hx} cy={hy} r={3.5} fill="#fff" />
      </g>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.kin}>
        panas → dingin
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.gold}>
        S total naik
      </text>
    </g>
  );
};

/** 06 · Faktor Boltzmann: populasi tingkat energi N ∝ e^(−E/kT); kT naik-turun pelan → tingkat atas makin/kurang terisi. */
const MiniBoltz: React.FC<{t: number}> = ({t}) => {
  const kT = 1.15 + 0.6 * Math.sin(t * 0.7);
  const lv = [58, 42, 26, 10];
  return (
    <g>
      {lv.map((y, i) => {
        const pop = 7 * Math.exp(-i / kT);
        return (
          <g key={i}>
            <line x1={14} y1={y} x2={184} y2={y} stroke={C.pot} strokeWidth={2} opacity={0.8} />
            {Array.from({length: 7}, (_, j) => (
              <circle key={j} cx={28 + j * 22 + 1.5 * Math.sin(t * 5 + i + j)} cy={y - 5} r={4} fill={C.cyan} opacity={Math.max(0, Math.min(1, pop - j))} />
            ))}
          </g>
        );
      })}
      <rect x={214} y={8} width={14} height={52} rx={7} fill="none" stroke={C.muted} strokeWidth={1.5} />
      <rect x={217} y={58 - 48 * ((kT - 0.5) / 1.3)} width={8} height={48 * ((kT - 0.5) / 1.3)} rx={4} fill={C.heat} />
      <text x={246} y={34} fontFamily={FONT.serif} fontStyle="italic" fontSize={18} fill={C.heat} dominantBaseline="central">
        kT
      </text>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.pot}>
        tingkat energi
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        T naik → atas
      </text>
    </g>
  );
};

const ITEMS: {title: string; color: string; hue: Hue; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Suhu = gerak molekul',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V>K</V>
        <Sub>rata-rata</Sub> = <Frac n="3" d="2" size={0.62} /> <V>k</V>
        <V color={C.heat}>T</V>
      </span>
    ),
    Mini: MiniMol,
  },
  {
    title: 'Kalor & kalor laten',
    color: C.kin,
    hue: 'kin',
    size: 36,
    body: (
      <span>
        <V color={C.kin}>Q</V> = <V>m</V>
        <V>c</V>Δ<V color={C.heat}>T</V>
        <span style={{color: C.muted}}> · </span>
        <V color={C.kin}>Q</V> = <V>m</V>
        <V color={C.gold}>L</V>
      </span>
    ),
    Mini: MiniHeat,
  },
  {
    title: 'Tiga cara berpindah',
    color: C.heat,
    hue: 'heat',
    size: 29,
    body: <span style={{fontFamily: FONT.head, fontWeight: 500}}>konduksi · konveksi · radiasi</span>,
    Mini: MiniTransfer,
  },
  {
    title: 'Hukum pertama',
    color: C.spr,
    hue: 'spr',
    body: (
      <span>
        Δ<V color={C.spr}>U</V> = <V color={C.kin}>Q</V> − <V color={C.work}>W</V>
      </span>
    ),
    Mini: MiniFirst,
  },
  {
    title: 'Hukum kedua & entropi',
    color: C.gold,
    hue: 'gold',
    body: (
      <span>
        Δ<V color={C.gold}>S</V>
        <Sub>total</Sub> ≥ 0
      </span>
    ),
    Mini: MiniEntropy,
  },
  {
    title: 'Faktor Boltzmann',
    color: C.pot,
    hue: 'pot',
    size: 38,
    body: (
      <span>
        <Frac n={<span><V>N</V><Sub>2</Sub></span>} d={<span><V>N</V><Sub>1</Sub></span>} size={0.62} /> = <V>e</V>
        <Sup>
          −Δ<V>E</V>/<V>k</V>
          <V color={C.heat}>T</V>
        </Sup>
      </span>
    ),
    Mini: MiniBoltz,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [cue(1), Math.max(cue(1) + 1.6, wordOf(1, 'kalor') - 0.3), cue(2), cue(3), Math.max(cue(3) + 1.6, wordOf(3, 'kedua') - 0.3), cue(4)];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const tA = wordOf(5, 'kalornya');
  const tB = wordOf(5, 'pergi');
  const hlA = ramp(t, tA - 0.5, tA + 0.3);
  const hlB = ramp(t, tB - 0.5, tB + 0.3);
  // kartu yang diacu pertanyaan ikut menyala lagi: "dari mana kalornya" → kartu 2 (kalor), "ke mana ia pergi" → kartu 3 (perpindahan)
  const reA = hlA * (1 - 0.6 * hlB);
  const reB = hlB;
  const reOf = (i: number) => (i === 1 ? reA : i === 2 ? reB : 0);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={36} color="kin" opacity={0.3} seed={5} />
        {/* latar: butir hangat naik & butir dingin turun pelan */}
        {Array.from({length: 24}, (_, k) => {
          const hot = k % 2 === 0;
          const p = ph(t, 9 + 5 * rand(k), rand(k * 3.3) * 14);
          const x = 100 + rand(k * 5.1) * 1720 + 14 * Math.sin(t * 0.8 + k);
          const y = hot ? 880 - p * 700 : 180 + p * 700;
          return <circle key={k} cx={x} cy={y} r={2.5 + 1.5 * rand(k + 2)} fill={hot ? C.kin : C.pot} opacity={cyc(p) * 0.35} />;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, starts[i] - 0.2, starts[i] + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, starts[i], nextOf(i), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <Glow x={COLS[1]} y={ROWS[0]} r={300} color="kin" opacity={0.4 * reA} />
        <Glow x={COLS[2]} y={ROWS[0]} r={300} color="heat" opacity={0.35 * reB} />
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="kin"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1730, 800],
              [1780, 800],
              [1830, 800],
            ]}
            color="heat"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
        <Ripple x={760} y={800} p={(t - tA + 0.3) / 1.4} r={260} color="kin" rings={2} />
        <Ripple x={1360} y={800} p={(t - tB + 0.3) / 1.4} r={260} color="heat" rings={2} />
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const re = reOf(i);
        const act = Math.max(win(t, starts[i], nextOf(i), 0.5, 0.6), re);
        const dimI = dim + (1 - dim) * re;
        const mini = ramp(t, starts[i] + 0.4, starts[i] + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dimI,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: it.size ?? 40, marginTop: 10, whiteSpace: 'nowrap', textAlign: 'center', height: 82, lineHeight: '82px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 2, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 770,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 46,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{color: C.kin, textShadow: `0 0 ${26 * hlA}px ${C.kin}aa`}}>Dari mana kalornya</span>, dan{' '}
        <span style={{color: C.heat, textShadow: `0 0 ${26 * hlB}px ${C.heat}aa`}}>ke mana ia pergi</span>?
      </div>
    </AbsoluteFill>
  );
};
