import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Ripple, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa gelombang berjalan:
//  · atas: deretan partikel medium; partikel ke-i mengulang getaran sumber dengan tunda (beda fase),
//    y_i = A sin(kx_i − ωt) setelah muka gelombang tiba → pola berjalan, tiap partikel hanya naik-turun;
//  · bawah: lingkaran fase emas di sumber; tinggi titiknya diteruskan ke kanan dengan cepat rambat VT
//    sehingga terbentuk gelombang kosinus berjalan (toska).
const CX = 960;
const CY = 470;
const fr = (v: number) => ((v % 1) + 1) % 1;

const NP = 31;
const ROW_Y = 132;
const RX0 = 300;
const RX1 = 1620;
const RAMP = 34;
const RLAM = 440;
const RV = 380; // px/s
const RT0 = 0.3; // sumber mulai bergetar
const MARK = 19;
const rowY = (x: number, t: number) => {
  const tau = t - RT0 - (x - RX0) / RV;
  if (tau <= 0) return 0;
  return RAMP * Math.min(1, tau / 0.5) * Math.sin(((2 * Math.PI) / RLAM) * RV * tau);
};

// lingkaran acuan bawah
const RCX = 250;
const RCY = 852;
const RR = 46;
const ROM = (2 * Math.PI) / 1.6;
const X0T = 330;
const X1T = 1690;
const VT = 300; // px/s

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const rig = ramp(t, 0.0, 1.2);
  // gelombang yang menyapu huruf "Berjalan"
  const wave = ramp(t, 3.3, 3.8) * (1 - ramp(t, 6.4, 7.2, EASE_IN_OUT));
  const title = BRAND.title;
  const split = title.indexOf('Berjalan');

  const phi = ROM * Math.max(0, t - 0.6);
  const Py = RCY - RR * Math.cos(phi);
  const Px = RCX - RR * Math.sin(phi);
  const reach = Math.min(X1T, X0T + VT * Math.max(0, t - 0.6));
  const nT = 90;
  const trace =
    reach > X0T + 4
      ? Array.from({length: nT + 1}, (_, i) => {
          const X = X0T + ((reach - X0T) * i) / nT;
          const tau = t - (X - X0T) / VT;
          return `${i ? 'L' : 'M'}${X.toFixed(1)},${(RCY - RR * Math.cos(ROM * Math.max(0, tau - 0.6))).toFixed(1)}`;
        }).join(' ')
      : '';

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe3b0" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#ffe3b0" stopOpacity={0} />
            </linearGradient>
            <radialGradient id="ti-bob" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffd27a" />
              <stop offset="100%" stopColor="#7a4a10" />
            </radialGradient>
            <linearGradient id="ti-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity={1} />
              <stop offset="80%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask id="ti-mask">
              <rect x={X0T - 10} y={RCY - 80} width={X1T - X0T + 20} height={160} fill="url(#ti-fade)" />
            </mask>
          </defs>
          <Glow x={CX} y={CY} r={720} color="cyan" opacity={0.26 * a} />
          <Glow x={CX} y={CY} r={520} color="gold" opacity={0.18 * a} />
          <Glow x={CX} y={130} r={460} color="gold" opacity={0.16 * rig} />
          {/* berkas cahaya, bergoyang pelan */}
          {Array.from({length: 6}, (_, i) => {
            const x = 260 + i * 290 + 40 * Math.sin(t * 0.5 + i * 1.3);
            const w = 70 + 40 * rand(i * 2.7);
            const sk = 120 + 60 * Math.sin(t * 0.3 + i);
            return <path key={i} d={`M${x},0 L${x + w},0 L${x + w + sk},860 L${x + sk - w * 0.6},860 Z`} fill="url(#ti-ray)" opacity={a * (0.5 + 0.4 * Math.sin(t * 0.9 + i * 2))} />;
          })}
          {/* debu cahaya yang melayang bergelombang */}
          {Array.from({length: 16}, (_, i) => {
            const ph = fr(t * (0.05 + rand(i) * 0.05) + rand(i * 3.3));
            const y = 260 + rand(i * 7.7) * 460;
            const dir = rand(i * 1.9) > 0.5 ? 1 : -1;
            const x = dir > 0 ? -20 + ph * 1960 : 1940 - ph * 1960;
            const side = Math.abs(x - CX) > 600 ? 1 : 0.2;
            return <circle key={i} cx={x} cy={y + 14 * Math.sin(t * 1.6 + i)} r={1.5 + rand(i * 2.1) * 2} fill="#d9f3ff" opacity={0.45 * cyc(ph) * side * a} />;
          })}

          {/* deretan partikel: pola berjalan, partikel hanya naik-turun */}
          <g opacity={rig}>
            <line x1={RX0 - 30} y1={ROW_Y} x2={RX1 + 30} y2={ROW_Y} stroke={C.line} strokeWidth={2} strokeDasharray="5 9" />
            {(() => {
              const pts = Array.from({length: NP}, (_, i) => {
                const x = RX0 + ((RX1 - RX0) * i) / (NP - 1);
                return [x, ROW_Y - rowY(x, t)] as [number, number];
              });
              const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
              return (
                <>
                  <path d={d} fill="none" stroke={C.cyan} strokeOpacity={0.18} strokeWidth={10} strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={2.5} strokeLinejoin="round" />
                  <line x1={pts[MARK][0]} y1={ROW_Y - RAMP - 12} x2={pts[MARK][0]} y2={ROW_Y + RAMP + 12} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="3 5" />
                  {pts.map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r={i === MARK ? 26 : 18} fill={`url(#soft-${i === MARK ? 'gold' : 'cyan'})`} opacity={0.6} />
                      <circle cx={x} cy={y} r={i === MARK ? 10 : 7.5} fill={i === MARK ? 'url(#ti-bob)' : '#bfeeff'} />
                    </g>
                  ))}
                </>
              );
            })()}
          </g>

          {/* lingkaran acuan + jejak kosinus */}
          <g opacity={rig}>
            <circle cx={RCX} cy={RCY} r={RR} fill="none" stroke={C.gold} strokeOpacity={0.25} strokeWidth={10} />
            <circle cx={RCX} cy={RCY} r={RR} fill="none" stroke={C.gold} strokeWidth={3} />
            <line x1={RCX} y1={RCY} x2={Px} y2={Py} stroke={C.gold} strokeWidth={2.5} />
            <line x1={Px} y1={Py} x2={X0T} y2={Py} stroke={C.gold} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 6" />
            <circle cx={Px} cy={Py} r={18} fill="url(#soft-gold)" />
            <circle cx={Px} cy={Py} r={6.5} fill="#fff3c4" />
            <line x1={X0T} y1={RCY} x2={X1T} y2={RCY} stroke={C.line} strokeWidth={2} />
            <g mask="url(#ti-mask)">
              <path d={trace} fill="none" stroke={C.cyan} strokeOpacity={0.22} strokeWidth={12} strokeLinejoin="round" />
              <path d={trace} fill="none" stroke={C.cyan} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
            <circle cx={X0T} cy={Py} r={16} fill="url(#soft-cyan)" />
            <circle cx={X0T} cy={Py} r={5.5} fill="#fff" />
          </g>

          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="gold" rings={2} width={2} />
          <Ripple x={1180} y={CY - 30} p={ramp(t, 3.4, 5.2, (x) => x)} r={520} color="cyan" rings={2} width={2} />
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="gold" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split;
              // huruf "Berjalan" naik-turun mengikuti gelombang yang merambat
              const wv = hot ? -12 * wave * Math.cos(t * 4.2 - (i - split) * 0.8) : 0;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT.head,
                    fontWeight: 700,
                    fontSize: 142,
                    letterSpacing: -4,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                    color: hot ? C.cyan : C.ink,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 60 + bob + wv}px`,
                    textShadow: hot ? `0 0 ${40 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(79,214,255,0.6)` : '0 0 40px rgba(255,200,140,0.22)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{fontFamily: FONT.head, fontSize: 50, color: C.ink, fontWeight: 500, marginTop: 8, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
          <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.1, 3.1)}}>{BRAND.course}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 34,
              padding: '10px 26px 10px 14px',
              borderRadius: 999,
              border: '1.5px solid rgba(255,201,74,0.38)',
              background: 'rgba(30,22,40,0.55)',
              opacity: brand,
              translate: `0px ${(1 - brand) * 14}px`,
              boxShadow: `0 0 ${24 + 10 * Math.sin(t * 1.8)}px rgba(255,201,74,0.22)`,
            }}
          >
            <Img src={staticFile('scientian-logo.png')} style={{width: 46, height: 46, rotate: `${4 * Math.sin(t * 0.9)}deg`}} />
            <div style={{fontFamily: FONT.head, fontSize: 30, color: C.ink, fontWeight: 500, letterSpacing: 2}}>
              Explore <span style={{color: C.gold, fontWeight: 600}}>Science</span> with Yayan
            </div>
          </div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, marginTop: 40, opacity: ramp(t, 4.2, 5.2), letterSpacing: 3 + 2 * (1 - ramp(t, 4.2, 5.6))}}>
            <span style={{color: C.cyan}}>pola</span> <span style={{color: C.work}}>berjalan</span>, medium <span style={{color: C.gold}}>tetap di tempat</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
