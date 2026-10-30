import React from 'react';
import {AbsoluteFill, Img, interpolateColors, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa kalor:
//  · atas: balok panas (kiri) dan balok dingin (kanan); butir kalor jingga mengalir panas → dingin,
//    suhu keduanya mendekat T = T_m ± ΔT·e^(−t/τ) dan laju aliran ikut mengecil (∝ beda suhu);
//  · bawah: batang kisi atom yang bergetar; profil suhu mengikuti mode difusi pertama
//    T(x,t) = T_m + A·e^(−t/τ)·cos(πx/L) → kiri panas & cepat, kanan dingin & lambat, lalu merata.
//    Amplitudo getar ∝ √T (dalam kelvin, dilebih-lebihkan untuk layar), warna biru → merah sesuai suhu.
const CX = 960;
const CY = 470;
const fr = (v: number) => ((v % 1) + 1) % 1;
const TAU_T = 2.6; // tetapan waktu menuju setimbang (detik layar)
const T0 = 0.6; // kontak dimulai

const tcol = (f: number) => interpolateColors(Math.max(0, Math.min(1, f)), [0, 0.5, 1], [C.pot, '#d9cdf2', C.heat]);

// balok atas
const BW = 170;
const BH = 92;
const BY = 132;
const HX = 230;
const KX = 1690;
const FLOW: [number, number][] = Array.from({length: 40}, (_, i) => {
  const x = HX + BW / 2 + 10 + ((KX - HX - BW - 20) * i) / 39;
  return [x, BY + 16 * Math.sin((i / 39) * Math.PI * 3)];
});

// batang kisi bawah
const NX = 30;
const NY = 3;
const LX0 = 330;
const LX1 = 1590;
const LY = 852;

const MiniThermo: React.FC<{x: number; y0: number; y1: number; f: number; col: string}> = ({x, y0, y1, f, col}) => {
  const fy = y1 - (y1 - y0 - 4) * Math.max(0, Math.min(1, f));
  return (
    <g>
      <rect x={x - 7} y={y0 - 7} width={14} height={y1 - y0 + 7} rx={7} fill="#0c1631" stroke="#cfe0ff" strokeOpacity={0.7} strokeWidth={2} />
      <circle cx={x} cy={y1 + 9} r={12} fill={col} stroke="#cfe0ff" strokeOpacity={0.7} strokeWidth={2} />
      <rect x={x - 3} y={fy} width={6} height={y1 - fy + 6} rx={3} fill={col} />
    </g>
  );
};

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const rig = ramp(t, 0.0, 1.2);
  // kata "Panas" bergetar seperti udara panas
  const shimmer = ramp(t, 3.3, 3.9) * (1 - ramp(t, 6.6, 7.4, EASE_IN_OUT));
  const title = BRAND.title;
  const HL = 'Panas';
  const split = title.indexOf(HL);

  const dec = Math.exp(-Math.max(0, t - T0) / TAU_T);
  const fh = 0.5 + 0.5 * dec; // 0..1 (1 = panas)
  const fc = 0.5 - 0.5 * dec;
  const flow = rig * (0.15 + 0.85 * dec);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd2a8" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#ffd2a8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Glow x={CX} y={CY} r={720} color="kin" opacity={0.22 * a} />
          <Glow x={CX} y={CY} r={520} color="heat" opacity={0.12 * a} />
          <Glow x={HX} y={BY} r={300} color="heat" opacity={0.45 * rig * fh} />
          <Glow x={KX} y={BY} r={300} color="pot" opacity={0.45 * rig * (1 - fc)} />
          {/* berkas cahaya hangat, bergoyang pelan */}
          {Array.from({length: 6}, (_, i) => {
            const x = 260 + i * 290 + 40 * Math.sin(t * 0.5 + i * 1.3);
            const w = 70 + 40 * rand(i * 2.7);
            const sk = 120 + 60 * Math.sin(t * 0.3 + i);
            return <path key={i} d={`M${x},0 L${x + w},0 L${x + w + sk},860 L${x + sk - w * 0.6},860 Z`} fill="url(#ti-ray)" opacity={a * (0.5 + 0.4 * Math.sin(t * 0.9 + i * 2))} />;
          })}
          {/* bara kecil yang naik */}
          {Array.from({length: 16}, (_, i) => {
            const ph = fr(t * (0.08 + rand(i) * 0.06) + rand(i * 3.3));
            const x = 120 + rand(i * 7.7) * 1680 + 20 * Math.sin(t * 1.2 + i);
            const y = 820 - ph * 600;
            const side = Math.abs(x - CX) > 620 ? 1 : 0.25;
            return <circle key={i} cx={x} cy={y} r={1.5 + rand(i * 2.1) * 2} fill={rand(i * 4.4) > 0.5 ? '#ffb27a' : '#ff8a8f'} opacity={0.5 * cyc(ph) * side * a} />;
          })}

          {/* balok panas & dingin, kalor mengalir di antaranya */}
          <g opacity={rig}>
            <path d={FLOW.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.kin} strokeOpacity={0.12 + 0.1 * dec} strokeWidth={8} strokeLinecap="round" />
            <Stream pts={FLOW} color="kin" n={12} speed={0.16 + 0.12 * dec} r={6} jitter={3} opacity={flow} />
            {[
              {x: HX, f: fh},
              {x: KX, f: fc},
            ].map(({x, f}, k) => {
              const col = tcol(f);
              return (
                <g key={k}>
                  <rect x={x - BW / 2} y={BY - BH / 2} width={BW} height={BH} rx={14} fill={interpolateColors(f, [0, 1], ['#112a58', '#5a1824'])} stroke={col} strokeWidth={3.5} />
                  {Array.from({length: 8}, (_, i) => {
                    const amp = 1 + 7 * f;
                    const sp = 2 + 5 * f;
                    const cx = x - 54 + (i % 4) * 36 + amp * Math.sin(t * sp * 1.3 + i * 2.1 + k);
                    const cy = BY - 18 + Math.floor(i / 4) * 36 + amp * Math.sin(t * sp * 1.1 + i * 3.7);
                    return <circle key={i} cx={cx} cy={cy} r={9} fill={col} stroke="#fff" strokeOpacity={0.45} strokeWidth={1.2} />;
                  })}
                  <MiniThermo x={x + (k ? -BW / 2 - 30 : BW / 2 + 30)} y0={BY - 50} y1={BY + 30} f={0.15 + 0.7 * f} col={col} />
                </g>
              );
            })}
            {/* gelombang udara panas di atas balok panas */}
            {[0, 1, 2].map((k) => {
              const ph = fr(t * 0.7 + k / 3);
              return <path key={k} d={`M${HX - 50 + k * 50},${BY - 56 - ph * 26} q8,-8 0,-16 q-8,-8 0,-16`} fill="none" stroke={C.heat} strokeWidth={2.5} opacity={cyc(ph) * 0.7 * fh} />;
            })}
          </g>

          {/* batang kisi: suhu merata */}
          <g opacity={rig}>
            <rect x={LX0 - 40} y={LY - 58} width={LX1 - LX0 + 80} height={116} rx={20} fill="#0d1838" stroke={C.line} strokeWidth={2} />
            {Array.from({length: NX * NY}, (_, i) => {
              const ix = i % NX;
              const iy = Math.floor(i / NX);
              const u = ix / (NX - 1);
              const f = 0.5 + 0.5 * dec * Math.cos(Math.PI * u);
              const amp = 1.2 + 9 * Math.sqrt(f) * f;
              const sp = 2.5 + 6 * f;
              const x0 = LX0 + (LX1 - LX0) * u;
              const y0 = LY - 30 + iy * 30;
              const dx = amp * (Math.sin(t * sp * 1.3 + i * 2.17) + 0.4 * Math.sin(t * sp * 2.9 + i * 1.3));
              const dy = amp * (Math.sin(t * sp * 1.07 + i * 3.71) + 0.4 * Math.cos(t * sp * 2.3 + i * 0.7));
              return <circle key={i} cx={x0 + dx} cy={y0 + dy} r={8} fill={tcol(f)} opacity={0.9} />;
            })}
            <text x={LX0 - 70} y={LY + 9} textAnchor="end" fontFamily={FONT.mono} fontSize={24} fill={tcol(0.5 + 0.5 * dec)}>
              panas
            </text>
            <text x={LX1 + 70} y={LY + 9} fontFamily={FONT.mono} fontSize={24} fill={tcol(0.5 - 0.5 * dec)}>
              dingin
            </text>
          </g>

          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="kin" rings={2} width={2} />
          <Ripple x={1080} y={CY - 30} p={ramp(t, 3.4, 5.2, (x) => x)} r={520} color="heat" rings={2} width={2} />
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="kin" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split && i < split + HL.length;
              // huruf "Panas" bergoyang naik seperti udara panas
              const k = i - split;
              const wv = hot ? -8 * shimmer * Math.sin(t * 5.2 - k * 1.1) : 0;
              const sk = hot ? 3 * shimmer * Math.sin(t * 3.7 - k * 0.9) : 0;
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
                    color: hot ? C.kin : C.ink,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 60 + bob + wv}px`,
                    transform: `skewX(${sk}deg)`,
                    textShadow: hot ? `0 0 ${40 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(255,138,61,0.65)` : '0 0 40px rgba(255,200,140,0.22)',
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
            <span style={{color: C.kin}}>kalor</span> selalu mengalir dari <span style={{color: C.heat}}>panas</span> ke <span style={{color: C.pot}}>dingin</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
