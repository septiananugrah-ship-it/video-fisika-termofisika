# Audit angka & konvensi — Ke Mana Panas Pergi (Termofisika)

Konvensi: suhu kamar ≈ 300 K, k = 1,381×10⁻²³ J/K, gas dianggap ideal, c air ≈ 4200 J/(kg·K) (nilai 25 °C: 4181–4186). Mengubah angka = rekam ulang baris.

| Adegan | Angka di narasi | Cek |
|---|---|---|
| temperature | T(K) = t(°C) + 273,15; nol mutlak; kesetimbangan termal (hukum ke-0) | ✓ |
| heat | Q = mcΔT; c air ≈ 4186 ("≈ 4200"), c besi ≈ 450 J/(kg·K); 1 kg × 10 K → 41,9 kJ ("≈ 42 kJ"); rasio 4186/450 ≈ 9,3 ("≈ 9×") | ✓ |
| phase | L_lebur es = 334 kJ/kg; 334/4,186 = 79,8 K ("hampir 80 °C"); L_uap air (100 °C) = 2257 kJ/kg ("≈ 2260") | ✓ |
| transfer | konduksi, konveksi, radiasi; P = eσAT⁴ → T × 2 ⇒ P × 16 | ✓ |
| firstlaw | ΔU = Q − W (W = usaha oleh gas); W = pΔV pada p tetap | ✓ |
| processes | isobarik, isokhorik (W = 0), isotermal (gas ideal ΔU = 0 → Q = W), adiabatik (Q = 0; pompa sepeda menghangat); usaha = luas di bawah kurva p–V | ✓ |
| secondlaw | Clausius; η_Carnot = 1 − T_d/T_p; 600 K & 300 K → 50 %; mesin nyata ≈ 25–40 % | ✓ |
| entropy | ΔS = Q/T (reversibel); Q dari T_p ke T_d: ΔS_total = Q(1/T_d − 1/T_p) > 0 | ✓ |
| kinetic | pV = NkT; ⟨K⟩ = (3/2)kT; N₂ (m = 4,65×10⁻²⁶ kg) di 300 K: v_rms = √(3kT/m) = 517 m/s; pesawat jet jelajah ≈ 250 m/s | ✓ |
| maxwell | distribusi Maxwell–Boltzmann; T naik → puncak bergeser & melebar, ekor energi tinggi menebal; reaksi butuh E ≥ Eₐ | ✓ |
| boltzmann | N₂/N₁ ∝ e^(−ΔE/kT); kT (300 K) = 4,14×10⁻²¹ J = 0,0259 eV ("≈ 0,026 eV") = 2,49 kJ/mol ("≈ 2,5"); HCl hν/kT ≈ 14 → e^(−13,8) ≈ 1×10⁻⁶; rotasi HCl: B ≈ 10,6 cm⁻¹ ≪ kT/hc ≈ 208 cm⁻¹ → banyak tingkat terisi | ✓ |
| microstates | S = k ln W (makam Boltzmann, Wina); ekspansi bebas ke ruang hampa; ΔG = ΔH − TΔS | ✓ |
| thermos | dinding ganda vakum (konduksi & konveksi), lapisan perak (radiasi), tutup (penguapan/kalor laten) | ✓ |
| fridge | Q_buang = Q_ambil + W; COP kulkas ≈ 2–4 (tidak disebut angka) | ✓ |
| calorimeter | ΔcH° glukosa = −2803 kJ/mol ÷ 180,16 g/mol = 15,6 kJ/g; 15 560 J / (2 kg · 4186) = 1,86 K ("hampir 2 °C", kapasitas bom diabaikan) | ✓ |

## Konvensi
- Molekul digambar bergerak acak dengan laju sesuai suhu (lebih panas = lebih cepat), diperlambat untuk layar ("gerak lambat").
- Kalor yang mengalir = butir jingga dari panas ke dingin; usaha = hijau; energi dalam = ungu; entropi = emas.
- Diagram p–V: isotermal p ∝ 1/V; adiabatik lebih curam (pV^γ tetap, γ = 1,4 untuk udara).
