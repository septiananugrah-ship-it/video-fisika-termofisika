import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Glow, Label, Motes, Ripple, Stage, Stream, Twinkles, pointAlong} from '../components/primitives';
import {Plot, px, py, type Axes} from '../components/physics';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Termos (potongan): dinding ganda dengan ruang hampa (konduksi & konveksi terhenti: rantai molekul terputus, tanpa fluida),
// lapisan perak memantulkan radiasi (paket gelombang inframerah terpantul di dinding), tutup menahan uap (kalor laten).
// Grafik mini: suhu minuman vs jam — termos (τ ≈ 24 jam) vs cangkir terbuka (τ ≈ 1 jam), ilustrasi Newton cooling.

const CX = 640;
const TOP = 250;
const LIQ = 432;
const fp = (d: number) => {
  const nw = 110 - d;
  const bw = 190 - d;
  const B = 850 - d;
  const r = 50 - d * 0.5;
  return [
    `M${CX - nw},${TOP}`,
    `L${CX - nw},300`,
    `C${CX - nw},345 ${CX - bw},335 ${CX - bw},388`,
    `L${CX - bw},${B - r}`,
    `Q${CX - bw},${B} ${CX - bw + r},${B}`,
    `L${CX + bw - r},${B}`,
    `Q${CX + bw},${B} ${CX + bw},${B - r}`,
    `L${CX + bw},388`,
    `C${CX + bw},335 ${CX + nw},345 ${CX + nw},300`,
    `L${CX + nw},${TOP} Z`,
  ].join(' ');
};
const XIN_R = CX + 134; // dinding dalam kanan (bagian tegak)
const XIN_L = CX - 134;

const AX: Axes = {x0: 1200, y0: 590, w: 500, h: 290, xmax: 12, ymax: 100};
const Tflask = (h: number) => 25 + 65 * Math.exp(-h / 24);
const Tcup = (h: number) => 25 + 65 * Math.exp(-h / 1.0);
const curve = (f: (h: number) => number, h1: number) => {
  const n = 60;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const h = (h1 * i) / n;
    pts.push(`${px(AX, h).toFixed(1)},${py(AX, f(h)).toFixed(1)}`);
  }
  return pts.join(' ');
};

/** Paket gelombang inframerah sepanjang lintasan (berbelok di dinding = terpantul). */
const Wave: React.FC<{pts: [number, number][]; ph: number; color: string; op: number}> = ({pts, ph, color, op}) => {
  if (op <= 0.001) return null;
  const head = ph * 1.3;
  const tail = head - 0.32;
  const a = Math.max(0, tail);
  const b = Math.min(1, head);
  if (b <= a) return null;
  const n = 26;
  const out: string[] = [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  for (let i = 0; i <= n; i++) {
    const u = a + ((b - a) * i) / n;
    const [x, y] = pointAlong(pts, u);
    const [x1, y1] = pointAlong(pts, Math.max(0, u - 0.01));
    const [x2, y2] = pointAlong(pts, Math.min(1, u + 0.01));
    const dl = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / dl;
    const ny = (x2 - x1) / dl;
    const env = Math.sin((Math.PI * (u - tail)) / (head - tail));
    const s = 10 * env * Math.sin((u * len) / 5.5);
    out.push(`${(x + nx * s).toFixed(1)},${(y + ny * s).toFixed(1)}`);
  }
  return <polyline points={out.join(' ')} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={op * cyc(ph)} />;
};

/** Kapsul status satu jalur kalor: "bocor" (jingga) → "tertahan"/"dipantulkan" (biru), silang-pudar. */
const Pill: React.FC<{x: number; y: number; name: string; done: string; p: number; b: number; t: number; k: number}> = ({x, y, name, done, p, b, t, k}) => {
  if (p <= 0.001) return null;
  const bob = 2 * Math.sin(t * 1.4 + k);
  return (
    <g opacity={p} transform={`translate(${x},${y + bob + (1 - p) * 12})`}>
      <rect x={-150} y={-30} width={300} height={60} rx={30} fill="#0d1534" stroke={C.kin} strokeWidth={2} opacity={1 - b} />
      <rect x={-150} y={-30} width={300} height={60} rx={30} fill="#0d1a3c" stroke={C.pot} strokeWidth={2.5} opacity={b} />
      <circle cx={-122} cy={0} r={9} fill={C.kin} opacity={(1 - b) * (0.6 + 0.4 * Math.sin(t * 5 + k))} />
      <g opacity={b} stroke={C.pot} strokeWidth={3.5} strokeLinecap="round">
        <line x1={-129} y1={-7} x2={-115} y2={7} />
        <line x1={-129} y1={7} x2={-115} y2={-7} />
      </g>
      <Label x={-102} y={0} size={24} anchor="start" weight={600}>
        {name}
      </Label>
      <Label x={136} y={0} size={18} anchor="end" font="mono" color={C.kin} opacity={1 - b}>
        bocor
      </Label>
      <Label x={136} y={0} size={18} anchor="end" font="mono" color={C.pot} opacity={b}>
        {done}
      </Label>
    </g>
  );
};

export const Thermos: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);

  const tK = wordOf(0, 'ketiga');
  const tCond = wordOf(1, 'konduksi');
  const tConv = wordOf(1, 'konveksi');
  const tHampa = wordOf(1, 'hampa');
  const tPerak = wordOf(2, 'perak');
  const tRefl = wordOf(2, 'memantulkan');
  const tTutup = wordOf(3, 'tutup');
  const tUap = wordOf(3, 'mencegah');
  const tLaten = wordOf(3, 'laten');

  const bCond = ramp(t, tCond - 0.1, tCond + 0.6);
  const bConv = ramp(t, tConv - 0.1, tConv + 0.6);
  const refl = ramp(t, tRefl - 0.4, tRefl + 0.6);
  const lidP = ramp(t, tTutup - 0.2, tTutup + 1.5, EASE_IN_OUT);
  const bUap = ramp(t, Math.max(tUap, tTutup + 1.3) - 0.1, Math.max(tUap, tTutup + 1.3) + 0.5);
  const inset1 = ramp(t, tCond - 0.6, tCond + 0.3);
  const inset2 = ramp(t, tConv - 0.6, tConv + 0.3);
  const hampaL = ramp(t, tHampa - 0.3, tHampa + 0.4);
  const perakL = ramp(t, tPerak - 0.3, tPerak + 0.4);
  const latenL = ramp(t, tLaten - 0.4, tLaten + 0.4);
  const cam = 1 + 0.035 * ramp(t, cue(2) - 0.3, cue(2) + 1.2, EASE_IN_OUT) * (1 - ramp(t, cue(3) - 0.2, cue(3) + 1.0, EASE_IN_OUT));

  // grafik: jam yang ditampilkan berjalan sepanjang adegan
  const plotP = ramp(t, cue(0) + 0.6, cue(0) + 1.6);
  const hNow = 12 * ramp(t, cue(0) + 1.0, dur - 1.4, (x) => x);

  // tutup: dari meja (kanan) melambung ke leher termos
  const lidX = mix(985, CX, lidP);
  const lidY = mix(806, TOP - 38, lidP) - 150 * Math.sin(Math.PI * lidP);
  const lidRot = -24 * Math.sin(Math.PI * lidP);
  const lidLand = (t - (tTutup + 1.3)) / 1.2;

  const yTop = mix(150, 306, lidP);

  // jalur radiasi: sumber di cairan → dinding dalam berlapis perak → kembali
  const rays: [number, number][][] = Array.from({length: 6}, (_, k) => {
    const side = k % 2 === 0 ? 1 : -1;
    const y0 = 495 + 52 * k;
    const sx = CX + side * 18;
    const m = [0.28, -0.22, 0.1][k % 3];
    const xw = side > 0 ? XIN_R : XIN_L;
    const dx = Math.abs(xw - sx);
    const hy = y0 + dx * m;
    return [
      [sx, y0],
      [xw, hy],
      [xw - side * dx * 0.85, hy + dx * 0.85 * m],
    ];
  });

  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <defs>
          <linearGradient id="th-steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a3866" />
            <stop offset="45%" stopColor="#5a6ca6" />
            <stop offset="100%" stopColor="#1f2a52" />
          </linearGradient>
          <linearGradient id="th-silver" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d9e2f5" />
            <stop offset="30%" stopColor="#8f9cbc" />
            <stop offset="55%" stopColor="#f4f7ff" />
            <stop offset="100%" stopColor="#9aa7c8" />
          </linearGradient>
          <linearGradient id="th-coffee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c0602c" />
            <stop offset="100%" stopColor="#4a1d10" />
          </linearGradient>
          <clipPath id="th-in">
            <path d={fp(56)} />
          </clipPath>
          <clipPath id="th-i1">
            <circle cx={240} cy={400} r={112} />
          </clipPath>
          <clipPath id="th-i2">
            <circle cx={240} cy={690} r={112} />
          </clipPath>
        </defs>
        <Motes x={CX} y={540} rx={420} ry={330} n={26} color="kin" opacity={0.35 * intro} seed={3} />
        {/* meja */}
        <g opacity={intro}>
          <line x1={360} y1={872} x2={1110} y2={872} stroke={C.line} strokeWidth={3} />
          <rect x={360} y={874} width={750} height={14} fill="url(#ground)" opacity={0.7} />
        </g>

        <g opacity={intro} transform={`translate(${CX},560) scale(${cam}) translate(${-CX},-560)`}>
          <ellipse cx={CX} cy={872} rx={215} ry={13} fill="#000" opacity={0.35} />
          <Glow x={CX} y={630} r={330} color="kin" opacity={0.35} />
          {/* lapisan dinding: casing baja → ruang hampa → kaca berlapis perak → isi */}
          <path d={fp(0)} fill="url(#th-steel)" />
          <path d={fp(14)} fill="#03050c" />
          <path d={fp(46)} fill="url(#th-silver)" />
          <path d={fp(56)} fill="#0c1430" />
          {/* cairan panas + molekul yang bergerak cepat */}
          <g clipPath="url(#th-in)">
            <path
              d={`M${CX - 200},${LIQ + 4 * Math.sin(t * 2.1)} ${Array.from({length: 21}, (_, i) => {
                const x = CX - 200 + i * 20;
                return `L${x},${(LIQ + 4 * Math.sin(t * 2.1 + i * 0.7)).toFixed(1)}`;
              }).join(' ')} L${CX + 200},860 L${CX - 200},860 Z`}
              fill="url(#th-coffee)"
            />
            {Array.from({length: 24}, (_, i) => {
              const bx = CX - 112 + rand(i * 3.3) * 224;
              const by = LIQ + 34 + rand(i * 7.1) * 340;
              const x = bx + 9 * Math.sin(t * 6.3 + i * 1.7) + 5 * Math.sin(t * 10.9 + i * 2.9);
              const y = by + 9 * Math.cos(t * 5.7 + i * 2.3) + 5 * Math.sin(t * 9.4 + i);
              return <circle key={i} cx={x} cy={y} r={4.2} fill="#ffd2a8" opacity={0.75} />;
            })}
            {/* uap naik (terbawa keluar sebelum ditutup; terperangkap di bawah sumbat setelah ditutup) */}
            {Array.from({length: 10}, (_, i) => {
              const ph = (((t * 0.33 + i / 10) % 1) + 1) % 1;
              const x = CX + (rand(i + 1) - 0.5) * 70 + 12 * Math.sin(t * 1.3 + i);
              const y = mix(LIQ - 2, yTop, ph);
              return <circle key={i} cx={x} cy={y} r={10 + 14 * ph * (1 - 0.5 * lidP)} fill="#e3ecff" opacity={cyc(ph) * 0.3} />;
            })}
          </g>
          {/* uap yang lolos keluar leher (sebelum ditutup) */}
          {Array.from({length: 8}, (_, i) => {
            const ph = (((t * 0.3 + i / 8 + 0.05) % 1) + 1) % 1;
            const x = CX + (rand(i + 11) - 0.5) * 80 + 20 * Math.sin(t * 1.1 + i * 1.9) * ph;
            const y = mix(TOP + 10, 160, ph);
            const o = cyc(ph) * (1 - lidP);
            return (
              <g key={i} opacity={o}>
                <circle cx={x} cy={y} r={14 + 22 * ph} fill="#e3ecff" opacity={0.22} />
                {i % 2 === 0 ? <circle cx={x + 4} cy={y} r={4.5} fill={C.kin} /> : null}
              </g>
            );
          })}
          {/* bibir leher menyegel ruang hampa */}
          <rect x={CX - 114} y={TOP - 8} width={228} height={20} rx={6} fill="#4a5a92" stroke="#8b9ad0" strokeWidth={1.5} />
          {/* tetes embun di bawah sumbat (uap tertahan) */}
          {[0, 1, 2, 3, 4].map((k) => (
            <ellipse key={k} cx={CX - 36 + k * 18} cy={TOP + 52 + 3 * Math.sin(t * 2 + k)} rx={3.5} ry={5} fill="#cfe2ff" opacity={lidP * 0.7} />
          ))}

          {/* radiasi: paket gelombang dipantulkan lapisan perak */}
          {rays.map((pts, k) => {
            const ph = (((t * 0.42 + k / 6) % 1) + 1) % 1;
            const uC = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
            const total = uC + Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
            const glint = Math.exp(-(((ph * 1.3 - uC / total) / 0.07) ** 2)) * refl;
            return (
              <g key={k}>
                <Wave pts={pts} ph={ph} color={C.heat} op={refl} />
                <circle cx={pts[1][0]} cy={pts[1][1]} r={16} fill="url(#soft-white)" opacity={glint} />
                <circle cx={pts[1][0]} cy={pts[1][1]} r={3.5} fill="#fff" opacity={glint} />
              </g>
            );
          })}
          {/* kilau perak menyapu dinding saat narasi "perak" */}
          {[-1, 1].map((s) => {
            const yy = 400 + ((t * 120) % 420);
            const ph = ((t * 120) % 420) / 420;
            return <circle key={s} cx={CX + s * 139} cy={yy} r={22} fill="url(#soft-white)" opacity={perakL * cyc(ph) * 0.9} />;
          })}

          {/* kebocoran sebelum ditahan: konduksi (kiri) & radiasi (kanan) */}
          <Stream
            pts={[
              [CX - 90, 640],
              [CX - 200, 640],
              [CX - 280, 630],
            ]}
            color="kin"
            n={6}
            speed={0.5}
            r={6}
            opacity={(1 - bCond) * intro}
          />
          <Stream
            pts={[
              [CX - 60, 760],
              [CX - 200, 790],
              [CX - 270, 800],
            ]}
            color="kin"
            n={5}
            speed={0.45}
            r={5}
            opacity={(1 - bConv) * intro}
            seed={2}
          />
          <Stream
            pts={[
              [CX + 70, 560],
              [CX + 200, 540],
              [CX + 300, 520],
            ]}
            color="heat"
            n={6}
            speed={0.55}
            r={6}
            opacity={(1 - refl) * intro}
            seed={4}
          />

          {/* tutup + sumbat */}
          <g transform={`translate(${lidX},${lidY}) rotate(${lidRot})`}>
            <ellipse cx={0} cy={68} rx={100} ry={8} fill="#000" opacity={0.3 * (1 - lidP)} />
            <rect x={-54} y={20} width={108} height={52} rx={10} fill="#5a4636" stroke="#8a6a50" strokeWidth={2} />
            <rect x={-124} y={-34} width={248} height={56} rx={14} fill="#3a4878" stroke="#8b9ad0" strokeWidth={2} />
            <rect x={-110} y={-26} width={220} height={8} rx={4} fill="#9fb0e6" opacity={0.35} />
            {[-80, -40, 0, 40, 80].map((x) => (
              <line key={x} x1={x} y1={-20} x2={x} y2={16} stroke="#2a3460" strokeWidth={3} />
            ))}
          </g>
          <Ripple x={CX} y={TOP - 20} p={lidLand} r={180} color="pot" rings={2} />

          {/* label */}
          <g opacity={hampaL}>
            <line x1={CX + 176 - 16} y1={660} x2={862} y2={660} stroke={C.muted} strokeWidth={1.5} />
            <circle cx={CX + 160} cy={660} r={4} fill={C.ink} />
            <Label x={872} y={660} size={24} anchor="start" color={C.ink}>
              ruang hampa
            </Label>
          </g>
          <g opacity={perakL}>
            <line x1={CX + 139} y1={470} x2={862} y2={470} stroke={C.muted} strokeWidth={1.5} />
            <circle cx={CX + 139} cy={470} r={4} fill="#fff" />
            <Label x={872} y={470} size={24} anchor="start" color="#e6ecff">
              lapisan perak
            </Label>
          </g>
          <g opacity={latenL}>
            <Label x={CX + 132} y={336} size={22} anchor="start" color={C.kin}>
              kalor laten tertahan
            </Label>
          </g>
        </g>

        {/* --------- kaca pembesar 1: konduksi (rantai molekul terputus di ruang hampa) --------- */}
        <g opacity={inset1 * intro}>
          <line x1={348} y1={410} x2={CX - 176} y2={420} stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 5" />
          <g clipPath="url(#th-i1)">
            <rect x={120} y={280} width={70} height={240} fill="url(#th-steel)" />
            <rect x={190} y={280} width={72} height={240} fill="#03050c" />
            <rect x={262} y={280} width={20} height={240} fill="url(#th-silver)" />
            <rect x={282} y={280} width={80} height={240} fill="#7a3519" />
            {[-48, 0, 48].map((dy, r) => {
              const beads = [
                {x: 150, a: 1.2, c: C.pot},
                {x: 176, a: 1.2, c: C.pot},
                {x: 272, a: 4, c: '#e9eefc'},
                {x: 304, a: 7, c: C.kin},
                {x: 334, a: 7, c: C.kin},
              ];
              const pos = beads.map((b, i) => [b.x + b.a * Math.sin(t * (7 + i) + r * 1.7 + i), 400 + dy + b.a * Math.cos(t * (6.1 + i) + r + i * 2)]);
              return (
                <g key={r}>
                  <line x1={pos[0][0]} y1={pos[0][1]} x2={pos[1][0]} y2={pos[1][1]} stroke={C.muted} strokeWidth={2} />
                  <line x1={pos[2][0]} y1={pos[2][1]} x2={pos[3][0]} y2={pos[3][1]} stroke={C.muted} strokeWidth={2} />
                  <line x1={pos[3][0]} y1={pos[3][1]} x2={pos[4][0]} y2={pos[4][1]} stroke={C.muted} strokeWidth={2} />
                  {beads.map((b, i) => (
                    <circle key={i} cx={pos[i][0]} cy={pos[i][1]} r={9} fill={b.c} stroke="#0a0f22" strokeWidth={1.5} />
                  ))}
                </g>
              );
            })}
            <Stream
              pts={[
                [350, 400],
                [300, 400],
                [266, 400],
              ]}
              color="kin"
              n={3}
              speed={0.7}
              r={5}
              jitter={20}
              opacity={bCond}
            />
            <g opacity={bCond} stroke={C.ink} strokeWidth={4} strokeLinecap="round">
              <line x1={214} y1={388} x2={238} y2={412} />
              <line x1={214} y1={412} x2={238} y2={388} />
            </g>
            <text x={226} y={470} textAnchor="middle" fontFamily={FONT.mono} fontSize={15} fill={C.muted}>
              hampa
            </text>
          </g>
          <circle cx={240} cy={400} r={112} fill="none" stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
          <Label x={240} y={264} size={26} weight={600} color={C.ink}>
            konduksi
          </Label>
        </g>

        {/* --------- kaca pembesar 2: konveksi (tanpa fluida, tanpa arus) --------- */}
        <g opacity={inset2 * intro}>
          <line x1={348} y1={700} x2={CX - 176} y2={700} stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 5" />
          <g clipPath="url(#th-i2)">
            <rect x={120} y={570} width={40} height={240} fill="url(#th-steel)" />
            <rect x={160} y={570} width={90} height={240} fill="#03050c" />
            <rect x={250} y={570} width={16} height={240} fill="url(#th-silver)" />
            <rect x={266} y={570} width={96} height={240} fill="#7a3519" />
            {/* arus konveksi di dalam cairan (ada fluida) */}
            <ellipse cx={312} cy={690} rx={26} ry={66} fill="none" stroke={C.kin} strokeOpacity={0.35} strokeWidth={2} />
            {Array.from({length: 6}, (_, i) => {
              const a = t * 1.6 + (i * Math.PI) / 3;
              return <circle key={i} cx={312 + 26 * Math.cos(a)} cy={690 - 66 * Math.sin(a)} r={5} fill={C.kin} />;
            })}
            {/* bayangan arus di ruang hampa, dicoret */}
            <ellipse cx={205} cy={690} rx={24} ry={62} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="6 7" strokeDashoffset={-t * 10} opacity={0.6 * (1 - 0.5 * bConv)} />
            <g opacity={bConv} stroke={C.ink} strokeWidth={4} strokeLinecap="round">
              <line x1={193} y1={678} x2={217} y2={702} />
              <line x1={193} y1={702} x2={217} y2={678} />
            </g>
            <text x={205} y={754} textAnchor="middle" fontFamily={FONT.mono} fontSize={15} fill={C.muted}>
              tanpa fluida
            </text>
          </g>
          <circle cx={240} cy={690} r={112} fill="none" stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
          <Label x={240} y={556} size={26} weight={600} color={C.ink}>
            konveksi
          </Label>
        </g>

        {/* --------- grafik suhu vs jam --------- */}
        <g opacity={plotP}>
          <Label x={1460} y={232} size={24} color={C.muted}>
            suhu minuman (ilustrasi)
          </Label>
          <Plot a={AX} xLabel="t" yLabel={<>T (°C)</>} xTicks={[0, 4, 8, 12]} yTicks={[25, 50, 75, 100]} />
          <Label x={AX.x0 + AX.w + 46} y={AX.y0 + 28} size={18} font="mono" color={C.muted} anchor="start">
            jam
          </Label>
          <polyline points={curve(Tcup, Math.max(0.001, hNow))} fill="none" stroke={C.pot} strokeWidth={4} strokeLinejoin="round" />
          <polyline points={curve(Tflask, Math.max(0.001, hNow))} fill="none" stroke={C.kin} strokeWidth={4.5} strokeLinejoin="round" />
          {(
            [
              [Tflask, C.kin, 'kin', 'termos', -30],
              [Tcup, C.pot, 'pot', 'cangkir terbuka', 30],
            ] as const
          ).map(([f, col, h, name, dy]) => {
            const x = px(AX, hNow);
            const y = py(AX, f(hNow));
            return (
              <g key={name}>
                <Glow x={x} y={y} r={30} color={h} still />
                <circle cx={x} cy={y} r={7} fill="#fff" stroke={col} strokeWidth={3} />
                <Label x={Math.min(x + 14, 1660)} y={y + dy} size={22} anchor="start" color={col} weight={600}>
                  {name} {Math.round(f(hNow))} °C
                </Label>
              </g>
            );
          })}
        </g>

        {/* --------- status jalur kalor --------- */}
        {[
          {name: 'konduksi', done: 'tertahan', x: 1320, y: 714, a: tK - 0.2, b: bCond},
          {name: 'konveksi', done: 'tertahan', x: 1640, y: 714, a: tK + 0.1, b: bConv},
          {name: 'radiasi', done: 'dipantul', x: 1320, y: 794, a: tK + 0.4, b: refl},
          {name: 'penguapan', done: 'tertahan', x: 1640, y: 794, a: cue(3) - 0.1, b: bUap},
        ].map((s, k) => (
          <Pill key={s.name} x={s.x} y={s.y} name={s.name} done={s.done} p={ramp(t, s.a, s.a + 0.6)} b={s.b} t={t} k={k} />
        ))}
        <Ripple x={1320} y={714} p={(t - tCond) / 1.1} r={150} color="pot" rings={2} width={2} />
        <Ripple x={1640} y={714} p={(t - tConv) / 1.1} r={150} color="pot" rings={2} width={2} />
        <Ripple x={1320} y={794} p={(t - tRefl) / 1.1} r={150} color="pot" rings={2} width={2} />
        <Ripple x={1640} y={794} p={(t - tUap - 0.4) / 1.1} r={150} color="pot" rings={2} width={2} />
        <Twinkles x={1480} y={754} rx={320} ry={60} n={5} color="pot" opacity={bUap * 0.8} seed={9} />
        <Label x={1480} y={850} size={22} color={C.muted} opacity={ramp(t, tK, tK + 0.8) * (1 - bUap)}>
          jalur kalor keluar termos
        </Label>
        <Label x={1480} y={850} size={22} color={C.pot} opacity={bUap}>
          semua jalur ditahan → minuman tetap panas
        </Label>
      </Stage>
    </AbsoluteFill>
  );
};
