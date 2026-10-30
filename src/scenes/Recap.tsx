import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Enam kartu rangkuman, masing-masing dengan animasi mini yang terus berulang (dihitung analitik):
// gelombang berjalan v = λf · superposisi · gelombang berdiri · cahaya (EM) · sinar-X Bragg · gelombang elektron λ = h/p;
// lalu pertanyaan kunci ("berapa panjang gelombangnya, dan apa yang membatasinya?").
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;
const TW = 2 * Math.PI;
const line = (f: (x: number) => number, x0: number, x1: number, n = 60) => {
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push(`${x.toFixed(1)},${f(x).toFixed(1)}`);
  }
  return out.join(' ');
};

/** 01 · Gelombang berjalan: pola maju (v hijau), titik medium hanya naik-turun. */
const MiniTravel: React.FC<{t: number}> = ({t}) => {
  const lam = 96;
  const f = 0.6;
  const y = (x: number) => 34 - 18 * Math.sin((TW * (x - lam * f * t)) / lam);
  return (
    <g>
      <line x1={10} y1={34} x2={300} y2={34} stroke={C.faint} strokeWidth={1.5} />
      <polyline points={line(y, 10, 300, 70)} fill="none" stroke={C.cyan} strokeWidth={2.8} />
      <line x1={150} y1={8} x2={150} y2={60} stroke={C.ink} strokeWidth={1} strokeDasharray="2 3" opacity={0.4} />
      <circle cx={150} cy={y(150)} r={5.5} fill="#fff" />
      <circle cx={150} cy={y(150)} r={12} fill="url(#soft-white)" />
      <line x1={226} y1={6} x2={286} y2={6} stroke={C.work} strokeWidth={3} markerEnd="url(#arrow-work)" />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.work}>
        pola maju
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        naik-turun
      </text>
    </g>
  );
};

/** 02 · Superposisi: dua pulsa berpapasan (toska + ungu), jumlahnya putih; bergantian menguatkan & meniadakan. */
const MiniSup: React.FC<{t: number}> = ({t}) => {
  const P = 3.2;
  const q = ph(t, P);
  const sgn = Math.floor((t + 100 * P) / P) % 2 === 0 ? 1 : -1;
  const x1 = -20 + q * 350;
  const x2 = 330 - q * 350;
  const g = (x: number, c: number) => Math.exp(-(((x - c) / 18) ** 2));
  const o = cyc(q) * 1.1;
  const val = sgn * (2 * Math.min(1, q * 5) - 1); // −1..1, menyambung saat siklus berganti
  const pos = (1 + val) / 2;
  return (
    <g>
      <line x1={10} y1={36} x2={300} y2={36} stroke={C.faint} strokeWidth={1.5} />
      <g opacity={Math.min(1, o)}>
        <polyline points={line((x) => 36 - 22 * g(x, x1), 10, 300, 80)} fill="none" stroke={C.cyan} strokeWidth={1.8} opacity={0.75} />
        <polyline points={line((x) => 36 - 22 * sgn * g(x, x2), 10, 300, 80)} fill="none" stroke={C.spr} strokeWidth={1.8} opacity={0.75} />
        <polyline points={line((x) => 36 - 22 * (g(x, x1) + sgn * g(x, x2)), 10, 300, 80)} fill="none" stroke="#fff" strokeWidth={2.8} />
      </g>
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill="#fff" opacity={0.45 + 0.55 * pos}>
        menguatkan
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" opacity={1 - 0.55 * pos}>
        meniadakan
      </text>
    </g>
  );
};

/** 03 · Gelombang berdiri n = 3: simpul (merah) tetap, perut berdenyut. */
const MiniStand: React.FC<{t: number}> = ({t}) => {
  const a = 20 * Math.cos(TW * 0.8 * t);
  const L0 = 20;
  const L1 = 290;
  const y = (x: number, amp: number) => 34 - amp * Math.sin((3 * Math.PI * (x - L0)) / (L1 - L0));
  return (
    <g>
      <rect x={L0 - 8} y={14} width={6} height={40} fill="#5b6a9e" />
      <rect x={L1 + 2} y={14} width={6} height={40} fill="#5b6a9e" />
      <polyline points={line((x) => y(x, 20), L0, L1, 60)} fill="none" stroke={C.cyan} strokeWidth={1} strokeDasharray="3 4" opacity={0.45} />
      <polyline points={line((x) => y(x, -20), L0, L1, 60)} fill="none" stroke={C.cyan} strokeWidth={1} strokeDasharray="3 4" opacity={0.45} />
      <polyline points={line((x) => y(x, a), L0, L1, 60)} fill="none" stroke={C.cyan} strokeWidth={2.8} />
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={L0 + ((L1 - L0) * k) / 3} cy={34} r={4.5} fill={C.heat} />
      ))}
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.heat}>
        simpul tetap
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.gold}>
        f diskret
      </text>
    </g>
  );
};

/** 04 · Cahaya: tiga warna (λ berbeda) merambat dengan laju sama c. */
const MiniLight: React.FC<{t: number}> = ({t}) => {
  const rows = [
    {y: 14, lam: 64, c: '#ff5a5a'},
    {y: 34, lam: 50, c: '#5cf07a'},
    {y: 54, lam: 38, c: '#7a86ff'},
  ];
  const v = 70;
  return (
    <g>
      {rows.map((r) => (
        <polyline key={r.lam} points={line((x) => r.y - 7 * Math.sin((TW * (x - v * t)) / r.lam), 10, 300, 70)} fill="none" stroke={r.c} strokeWidth={2.4} />
      ))}
      <circle cx={18} cy={34} r={16} fill="url(#soft-gold)" opacity={0.7 + 0.3 * Math.sin(t * 4)} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.gold}>
        λ berbeda
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        c sama
      </text>
    </g>
  );
};

/** 05 · Sinar-X memantul dari bidang-bidang atom kristal (Bragg). */
const MiniBragg: React.FC<{t: number}> = ({t}) => {
  const q = ph(t, 2.2);
  const XR = '#d9c8ff';
  const rays = [
    {hy: 24, hx: 160},
    {hy: 44, hx: 160},
  ];
  return (
    <g>
      {[24, 44, 64].map((y) =>
        Array.from({length: 8}, (_, k) => <circle key={`${y}-${k}`} cx={70 + k * 26} cy={y} r={4.5} fill={C.ink} opacity={0.75} />),
      )}
      {rays.map((r, i) => {
        const a: [number, number] = [r.hx - 120, r.hy - 120 * 0.42];
        const b: [number, number] = [r.hx + 120, r.hy - 120 * 0.42];
        const u = q;
        const p: [number, number] = u < 0.5 ? [a[0] + (r.hx - a[0]) * u * 2, a[1] + (r.hy - a[1]) * u * 2] : [r.hx + (b[0] - r.hx) * (u - 0.5) * 2, r.hy + (b[1] - r.hy) * (u - 0.5) * 2];
        return (
          <g key={i}>
            <polyline points={`${a[0]},${a[1]} ${r.hx},${r.hy} ${b[0]},${b[1]}`} fill="none" stroke={XR} strokeWidth={1.8} opacity={0.6} />
            <circle cx={p[0]} cy={p[1]} r={4} fill="#fff" opacity={cyc(q) * 1.1} />
            <circle cx={p[0]} cy={p[1]} r={10} fill="url(#soft-spr)" opacity={cyc(q)} />
          </g>
        );
      })}
      <circle cx={160} cy={24} r={14} fill="url(#soft-gold)" opacity={0.4 + 0.4 * Math.sin(Math.PI * q)} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill="#d9c8ff">
        pantulan
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        susunan atom
      </text>
    </g>
  );
};

/** 06 · Elektron sebagai paket gelombang ungu yang melaju. */
const MiniMatter: React.FC<{t: number}> = ({t}) => {
  const q = ph(t, 3);
  const c = -10 + q * 330;
  const y = (x: number) => 34 - 20 * Math.exp(-(((x - c) / 36) ** 2)) * Math.cos((TW * (x - c)) / 22 - t * 6);
  return (
    <g opacity={Math.min(1, cyc(q) * 1.15)}>
      <line x1={10} y1={34} x2={300} y2={34} stroke={C.faint} strokeWidth={1.5} />
      <polyline points={line(y, 10, 300, 90)} fill="none" stroke={C.spr} strokeWidth={2.6} />
      <circle cx={c} cy={34} r={14} fill="url(#soft-spr)" />
      <circle cx={c} cy={34} r={3.5} fill="#fff" />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.spr}>
        elektron
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central">
        de Broglie
      </text>
    </g>
  );
};

const ITEMS: {title: string; color: string; hue: Hue; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Gelombang berjalan',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V color={C.work}>v</V> = <V color={C.press}>λ</V>
        <V color={C.gold}>f</V>
      </span>
    ),
    Mini: MiniTravel,
  },
  {
    title: 'Superposisi',
    color: '#ffffff',
    hue: 'white',
    body: (
      <span>
        <V>y</V> = <V color={C.cyan}>y</V>
        <Sub color={C.cyan}>1</Sub> + <V color={C.spr}>y</V>
        <Sub color={C.spr}>2</Sub>
      </span>
    ),
    Mini: MiniSup,
  },
  {
    title: 'Gelombang berdiri',
    color: C.heat,
    hue: 'heat',
    size: 36,
    body: (
      <span>
        <V color={C.press}>λ</V>
        <Sub color={C.press}>n</Sub> = <Frac n={<span>2<V>L</V></span>} d={<V>n</V>} size={0.62} />
        <span style={{fontFamily: FONT.sans, fontSize: 20, color: C.muted}}> &nbsp;(hanya f tertentu)</span>
      </span>
    ),
    Mini: MiniStand,
  },
  {
    title: 'Cahaya: gelombang EM',
    color: C.gold,
    hue: 'gold',
    body: (
      <span>
        <V>c</V> = <V color={C.press}>λ</V>
        <V color={C.gold}>ν</V>
      </span>
    ),
    Mini: MiniLight,
  },
  {
    title: 'Sinar-X & kristal',
    color: C.pot,
    hue: 'pot',
    size: 36,
    body: (
      <span>
        <V>n</V>
        <V color={C.press}>λ</V> = 2<V>d</V> sin <V>θ</V>
      </span>
    ),
    Mini: MiniBragg,
  },
  {
    title: 'Elektron pun gelombang',
    color: C.spr,
    hue: 'spr',
    body: (
      <span>
        <V color={C.spr}>λ</V> = <Frac n={<V>h</V>} d={<V>p</V>} size={0.62} />
      </span>
    ),
    Mini: MiniMatter,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [cue(1), cue(2), cue(3), cue(4), Math.max(cue(4) + 1.6, wordOf(4, 'sinar') - 0.3), Math.max(cue(4) + 3.2, wordOf(4, 'elektron') - 0.3)];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const tL = wordOf(5, 'gelombangnya');
  const tB = wordOf(5, 'membatasinya');
  const hlL = ramp(t, tL - 0.5, tL + 0.3);
  const hlB = ramp(t, tB - 0.5, tB + 0.3);
  // kartu yang diacu pertanyaan ikut menyala lagi: λ → kartu 1, batas → kartu 3 (gelombang berdiri)
  const reL = hlL * (1 - 0.6 * hlB);
  const reB = hlB;
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={40} color="cyan" opacity={0.3} seed={5} />
        {/* latar: gelombang sinus tipis yang merambat */}
        {Array.from({length: 5}, (_, k) => {
          const y = 230 + k * 140;
          const amp = 10 + 6 * rand(k);
          const kk = 0.008 + 0.006 * rand(k + 3);
          const pts: string[] = [];
          for (let i = 0; i <= 48; i++) {
            const x = 60 + i * 37.5;
            pts.push(`${x.toFixed(1)},${(y + amp * Math.sin(x * kk - t * (0.8 + 0.5 * rand(k + 7)) + k)).toFixed(1)}`);
          }
          return <polyline key={k} points={pts.join(' ')} fill="none" stroke={[C.cyan, C.spr, C.press, C.work, C.gold][k]} strokeWidth={1.5} opacity={0.12} />;
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
        <Glow x={COLS[0]} y={ROWS[0]} r={300} color="press" opacity={0.4 * reL} />
        <Glow x={COLS[2]} y={ROWS[0]} r={300} color="heat" opacity={0.35 * reB} />
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="press"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1830, 800],
              [1780, 800],
              [1730, 800],
            ]}
            color="heat"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
        <Ripple x={720} y={800} p={(t - tL + 0.3) / 1.4} r={260} color="press" rings={2} />
        <Ripple x={1330} y={800} p={(t - tB + 0.3) / 1.4} r={260} color="heat" rings={2} />
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const re = i === 0 ? reL : i === 2 ? reB : 0;
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
        Berapa <span style={{color: C.press, textShadow: `0 0 ${26 * hlL}px ${C.press}aa`}}>panjang gelombangnya</span>, dan{' '}
        <span style={{color: C.heat, textShadow: `0 0 ${26 * hlB}px ${C.heat}aa`}}>apa yang membatasinya</span>?
      </div>
    </AbsoluteFill>
  );
};
