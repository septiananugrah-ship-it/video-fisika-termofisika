// Naskah narasi "Ke Mana Panas Pergi" — Fisika Umum: Termofisika.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka sudah dicek di naskah/AUDIT.md (g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 kPa, kecuali disebut lain).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 konsep, 2 termofisika di dunia kimia & jembatan kuantum, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Es, kopi, dan mesin",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Genggam sebongkah es. Tanganmu terasa dingin, dan esnya perlahan mencair.",
        "hl": [
          "mencair"
        ],
        "pause": 0.7
      },
      {
        "text": "Secangkir kopi panas di meja, lama-lama menjadi hangat, lalu dingin.",
        "hl": [
          "lama-lama"
        ],
        "pause": 0.7
      },
      {
        "text": "Mesin mobil membakar bensin, tetapi sebagian besar energinya justru terbuang sebagai panas.",
        "hl": [
          "terbuang sebagai panas"
        ],
        "pause": 0.8
      },
      {
        "text": "Semuanya diatur oleh satu aturan yang tidak pernah dilanggar:",
        "pause": 0.4
      },
      {
        "text": "panas selalu mengalir dari yang panas ke yang dingin.",
        "hl": [
          "dari yang panas ke yang dingin"
        ],
        "pause": 0.9
      },
      {
        "text": "Di balik aturan itu ada triliunan molekul yang bergerak acak, dan di situlah termofisika bertemu kimia.",
        "hl": [
          "bergerak acak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Ke Mana Panas Pergi",
    "mood": "title",
    "fixed": 8,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Video ini membahas termofisika dalam tiga bagian.",
        "hl": [
          "termofisika"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian pertama, konsep: suhu, kalor, perubahan wujud, perpindahan kalor, dan hukum-hukum termodinamika.",
        "hl": [
          "konsep"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian kedua, termofisika di dunia kimia: teori kinetik gas, sebaran kecepatan molekul, faktor Boltzmann, dan entropi mikroskopis.",
        "hl": [
          "dunia kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian ketiga, penerapan: termos, kulkas, dan kalorimeter bom.",
        "hl": [
          "penerapan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "temperature",
    "chapter": "01",
    "title": "Suhu: gerak acak molekul",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Apa sebenarnya suhu? Di tingkat molekul, suhu adalah ukuran energi kinetik rata-rata gerak acak partikel.",
        "hl": [
          "energi kinetik rata-rata"
        ],
        "pause": 0.7
      },
      {
        "text": "Makin panas sebuah benda, makin cepat molekul-molekulnya bergetar dan berlarian.",
        "hl": [
          "makin cepat"
        ],
        "pause": 0.7
      },
      {
        "text": "Dalam fisika dan kimia, suhu diukur dalam kelvin: kelvin sama dengan derajat Celsius ditambah dua ratus tujuh puluh tiga koma satu lima.",
        "hl": [
          "kelvin"
        ],
        "pause": 0.7
      },
      {
        "text": "Nol kelvin adalah nol mutlak, suhu terendah yang mungkin, ketika gerak termal mencapai batas paling kecil.",
        "hl": [
          "nol mutlak"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila dua benda bersentuhan cukup lama, suhunya menjadi sama. Inilah kesetimbangan termal, dasar cara kerja termometer.",
        "hl": [
          "kesetimbangan termal"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "heat",
    "chapter": "02",
    "title": "Kalor dan kalor jenis",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kalor adalah energi yang berpindah karena perbedaan suhu. Kalor bukan sesuatu yang disimpan benda, melainkan energi yang sedang mengalir.",
        "hl": [
          "energi yang sedang mengalir"
        ],
        "pause": 0.7
      },
      {
        "text": "Kalor yang dibutuhkan untuk menaikkan suhu: Q sama dengan m c delta T.",
        "hl": [
          "m c delta T"
        ],
        "pause": 0.7
      },
      {
        "text": "c adalah kalor jenis, seberapa banyak energi yang dibutuhkan satu kilogram zat untuk naik satu derajat.",
        "hl": [
          "kalor jenis"
        ],
        "pause": 0.7
      },
      {
        "text": "Air punya kalor jenis sangat besar, sekitar empat ribu dua ratus joule per kilogram per kelvin. Besi hanya sekitar empat ratus lima puluh.",
        "hl": [
          "empat ribu dua ratus"
        ],
        "pause": 0.7
      },
      {
        "text": "Memanaskan satu kilogram air sepuluh derajat butuh sekitar empat puluh dua kilojoule, kira-kira sembilan kali lebih banyak daripada besi.",
        "hl": [
          "empat puluh dua kilojoule"
        ],
        "pause": 0.7
      },
      {
        "text": "Itulah sebabnya laut menyimpan panas dan meredam perubahan suhu di bumi.",
        "hl": [
          "laut menyimpan panas"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "phase",
    "chapter": "03",
    "title": "Perubahan wujud dan kalor laten",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Panaskan es yang suhunya di bawah nol. Suhunya naik, lalu tiba-tiba berhenti di nol derajat, padahal pemanas terus menyala.",
        "hl": [
          "tiba-tiba berhenti"
        ],
        "pause": 0.7
      },
      {
        "text": "Energinya tidak hilang. Energi itu dipakai untuk memutus ikatan antarmolekul es, mengubah padat menjadi cair.",
        "hl": [
          "memutus ikatan"
        ],
        "pause": 0.7
      },
      {
        "text": "Energi ini disebut kalor laten. Untuk mencairkan satu kilogram es dibutuhkan sekitar tiga ratus tiga puluh empat kilojoule.",
        "hl": [
          "tiga ratus tiga puluh empat kilojoule"
        ],
        "pause": 0.7
      },
      {
        "text": "Jumlah itu cukup untuk memanaskan satu kilogram air hampir delapan puluh derajat.",
        "hl": [
          "delapan puluh derajat"
        ],
        "pause": 0.7
      },
      {
        "text": "Menguapkan air jauh lebih mahal: sekitar dua ribu dua ratus enam puluh kilojoule per kilogram, karena molekul harus dipisahkan sepenuhnya.",
        "hl": [
          "dua ribu dua ratus enam puluh"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "transfer",
    "chapter": "04",
    "title": "Konduksi, konveksi, dan radiasi",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kalor berpindah dengan tiga cara.",
        "hl": [
          "tiga cara"
        ],
        "pause": 0.7
      },
      {
        "text": "Konduksi: molekul yang bergetar kuat menabrak tetangganya, meneruskan energi tanpa ikut berpindah. Logam penghantar yang baik, kayu dan udara penghantar yang buruk.",
        "hl": [
          "Konduksi"
        ],
        "pause": 0.7
      },
      {
        "text": "Konveksi: fluida yang panas memuai, menjadi lebih ringan, lalu naik membawa energinya, seperti air yang mendidih di panci.",
        "hl": [
          "Konveksi"
        ],
        "pause": 0.7
      },
      {
        "text": "Radiasi: setiap benda memancarkan gelombang elektromagnetik. Tidak perlu medium, sehingga panas matahari bisa sampai ke bumi melewati ruang hampa.",
        "hl": [
          "Radiasi"
        ],
        "pause": 0.7
      },
      {
        "text": "Daya pancar radiasi sebanding dengan suhu mutlak pangkat empat. Suhu dinaikkan dua kali, pancarannya enam belas kali.",
        "hl": [
          "pangkat empat"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "firstlaw",
    "chapter": "05",
    "title": "Hukum pertama termodinamika",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang ambil gas di dalam silinder berpiston.",
        "hl": [
          "silinder berpiston"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila kita beri kalor Q, energi itu bisa menaikkan energi dalam gas, atau dipakai gas untuk mendorong piston, yaitu melakukan usaha W.",
        "hl": [
          "usaha W"
        ],
        "pause": 0.7
      },
      {
        "text": "Hukum pertama termodinamika: delta U sama dengan Q dikurangi W.",
        "hl": [
          "delta U sama dengan Q dikurangi W"
        ],
        "pause": 0.7
      },
      {
        "text": "Ini tidak lain adalah hukum kekekalan energi, ditulis untuk kalor dan usaha.",
        "hl": [
          "kekekalan energi"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tekanan tetap, usaha gas sama dengan tekanan kali perubahan volume: p delta V.",
        "hl": [
          "p delta V"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "processes",
    "chapter": "06",
    "title": "Proses-proses gas",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Keadaan gas bisa digambar pada diagram tekanan terhadap volume.",
        "hl": [
          "diagram tekanan terhadap volume"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada proses isobarik, tekanannya tetap. Pada proses isokhorik, volumenya tetap, sehingga gas tidak melakukan usaha.",
        "hl": [
          "isobarik",
          "isokhorik"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada proses isotermal, suhunya tetap. Kalor yang masuk seluruhnya diubah menjadi usaha.",
        "hl": [
          "isotermal"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada proses adiabatik, tidak ada kalor yang keluar-masuk. Gas yang ditekan cepat menjadi panas, seperti pompa sepeda yang menghangat.",
        "hl": [
          "adiabatik"
        ],
        "pause": 0.7
      },
      {
        "text": "Luas daerah di bawah kurva pada diagram itu sama dengan usaha yang dilakukan gas.",
        "hl": [
          "Luas daerah"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "secondlaw",
    "chapter": "07",
    "title": "Hukum kedua: arah aliran panas",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Hukum pertama mengatakan energi kekal. Tetapi ia tidak mengatakan ke mana energi mengalir.",
        "hl": [
          "ke mana"
        ],
        "pause": 0.7
      },
      {
        "text": "Hukum kedua termodinamika: kalor mengalir dengan sendirinya dari benda panas ke benda dingin, tidak pernah sebaliknya.",
        "hl": [
          "tidak pernah sebaliknya"
        ],
        "pause": 0.7
      },
      {
        "text": "Mesin kalor mengambil kalor dari sumber panas, mengubah sebagian menjadi usaha, dan membuang sisanya ke lingkungan yang dingin.",
        "hl": [
          "membuang sisanya"
        ],
        "pause": 0.7
      },
      {
        "text": "Efisiensi terbaik yang mungkin, efisiensi Carnot, sama dengan satu dikurangi T dingin per T panas.",
        "hl": [
          "efisiensi Carnot"
        ],
        "pause": 0.7
      },
      {
        "text": "Mesin yang bekerja antara enam ratus kelvin dan tiga ratus kelvin paling banter hanya lima puluh persen efisien. Mesin nyata jauh di bawahnya.",
        "hl": [
          "lima puluh persen"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "entropy",
    "chapter": "08",
    "title": "Entropi",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Untuk mengukur arah itu, fisikawan memakai besaran baru: entropi.",
        "hl": [
          "entropi"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila kalor Q masuk ke benda bersuhu T, entropinya bertambah Q per T.",
        "hl": [
          "Q per T"
        ],
        "pause": 0.7
      },
      {
        "text": "Kalor yang sama, masuk ke benda dingin, menambah entropi lebih banyak daripada saat keluar dari benda panas.",
        "hl": [
          "lebih banyak"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena itu aliran panas dari panas ke dingin selalu menaikkan entropi total. Inilah bentuk lain hukum kedua: entropi alam semesta tidak pernah berkurang.",
        "hl": [
          "tidak pernah berkurang"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "kinetic",
    "chapter": "09",
    "title": "Teori kinetik gas",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang lihat gas sebagai triliunan molekul yang bertumbukan.",
        "hl": [
          "triliunan molekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekanan berasal dari tumbukan molekul dengan dinding, dan suhu menentukan seberapa keras tumbukannya.",
        "hl": [
          "tumbukan molekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari situ lahir persamaan gas ideal, p V sama dengan N k T, dengan k tetapan Boltzmann.",
        "hl": [
          "p V sama dengan N k T"
        ],
        "pause": 0.7
      },
      {
        "text": "Energi kinetik rata-rata satu molekul ternyata hanya bergantung pada suhu: tiga per dua k T.",
        "hl": [
          "tiga per dua k T"
        ],
        "pause": 0.7
      },
      {
        "text": "Molekul nitrogen di udara kamar melesat dengan kecepatan akar rata-rata kuadrat sekitar lima ratus tujuh belas meter per detik, lebih cepat dari pesawat jet.",
        "hl": [
          "lima ratus tujuh belas"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "maxwell",
    "chapter": "10",
    "title": "Sebaran kecepatan molekul",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Tetapi tidak semua molekul secepat itu. Ada yang lambat, ada yang sangat cepat.",
        "hl": [
          "tidak semua molekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Sebaran kecepatannya mengikuti kurva Maxwell–Boltzmann: naik dari nol, memuncak, lalu turun dengan ekor panjang.",
        "hl": [
          "Maxwell–Boltzmann"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila suhu naik, puncaknya bergeser ke kanan dan kurvanya melebar. Ekor molekul yang sangat cepat menebal.",
        "hl": [
          "ekor"
        ],
        "pause": 0.7
      },
      {
        "text": "Ekor inilah yang penting dalam kimia: hanya molekul di ekor yang punya cukup energi untuk melewati energi aktivasi dan bereaksi.",
        "hl": [
          "energi aktivasi"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "boltzmann",
    "chapter": "11",
    "title": "Faktor Boltzmann",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Ada satu rumus yang menghubungkan suhu dengan tingkat-tingkat energi kuantum: faktor Boltzmann.",
        "hl": [
          "faktor Boltzmann"
        ],
        "pause": 0.7
      },
      {
        "text": "Peluang sebuah molekul berada di tingkat energi yang lebih tinggi delta E sebanding dengan e pangkat minus delta E per k T.",
        "hl": [
          "e pangkat minus delta E per k T"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada suhu kamar, k T sekitar nol koma nol dua enam elektronvolt, atau dua koma lima kilojoule per mol.",
        "hl": [
          "dua koma lima kilojoule per mol"
        ],
        "pause": 0.7
      },
      {
        "text": "Ingat getaran hidrogen klorida: anak tangganya sekitar empat belas kali k T, jadi hanya sekitar satu dari sejuta molekul yang tereksitasi.",
        "hl": [
          "satu dari sejuta"
        ],
        "pause": 0.7
      },
      {
        "text": "Sebaliknya, tingkat rotasi molekul sangat rapat, sehingga banyak tingkat rotasi terisi pada suhu kamar.",
        "hl": [
          "tingkat rotasi"
        ],
        "pause": 0.7
      },
      {
        "text": "Faktor Boltzmann inilah jembatan antara termodinamika dan kimia kuantum.",
        "hl": [
          "jembatan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "microstates",
    "chapter": "12",
    "title": "Entropi dan susunan mikroskopis",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Apa arti entropi di tingkat molekul? Ludwig Boltzmann menjawabnya: S sama dengan k log W.",
        "hl": [
          "S sama dengan k log W"
        ],
        "pause": 0.7
      },
      {
        "text": "W adalah banyaknya cara molekul dapat disusun yang tampak sama dari luar.",
        "hl": [
          "banyaknya cara"
        ],
        "pause": 0.7
      },
      {
        "text": "Buka sekat di antara gas dan ruang hampa. Molekul menyebar memenuhi kedua ruang, karena susunan menyebar jauh lebih banyak jumlahnya daripada susunan berkumpul.",
        "hl": [
          "jauh lebih banyak"
        ],
        "pause": 0.7
      },
      {
        "text": "Peluang semua molekul kembali berkumpul di satu sisi begitu kecil sehingga praktis tidak pernah terjadi. Itulah asal arah waktu.",
        "hl": [
          "arah waktu"
        ],
        "pause": 0.7
      },
      {
        "text": "Dalam kimia, perubahan entropi bersama perubahan entalpi menentukan apakah reaksi dapat berlangsung, lewat energi bebas Gibbs.",
        "hl": [
          "energi bebas Gibbs"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "thermos",
    "chapter": "13",
    "title": "Termos",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Termos menahan ketiga cara perpindahan kalor sekaligus.",
        "hl": [
          "ketiga cara"
        ],
        "pause": 0.7
      },
      {
        "text": "Dindingnya ganda dengan ruang hampa di antaranya, sehingga konduksi dan konveksi hampir terhenti.",
        "hl": [
          "ruang hampa"
        ],
        "pause": 0.7
      },
      {
        "text": "Permukaannya dilapisi perak mengilap yang memantulkan radiasi kembali ke dalam.",
        "hl": [
          "memantulkan radiasi"
        ],
        "pause": 0.7
      },
      {
        "text": "Tutupnya yang rapat mencegah penguapan, yang membawa kalor laten dalam jumlah besar.",
        "hl": [
          "penguapan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "fridge",
    "chapter": "14",
    "title": "Kulkas: memompa panas",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kulkas tampak melanggar hukum kedua: ia membuat bagian dalam lebih dingin daripada ruangan.",
        "hl": [
          "melanggar hukum kedua"
        ],
        "pause": 0.7
      },
      {
        "text": "Tetapi kulkas tidak melanggar apa pun. Ia memakai usaha dari listrik untuk memompa kalor dari dalam ke luar.",
        "hl": [
          "memompa kalor"
        ],
        "pause": 0.7
      },
      {
        "text": "Cairan pendingin menguap di dalam kulkas, menyerap kalor laten, lalu dimampatkan kompresor dan melepaskan kalor itu di kisi-kisi belakang yang terasa hangat.",
        "hl": [
          "kisi-kisi belakang"
        ],
        "pause": 0.7
      },
      {
        "text": "Kalor yang dibuang ke ruangan selalu lebih besar daripada kalor yang diambil dari dalam, sehingga entropi total tetap bertambah.",
        "hl": [
          "entropi total tetap bertambah"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "calorimeter",
    "chapter": "15",
    "title": "Kalorimeter bom",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana kimiawan mengukur energi yang dilepaskan pembakaran?",
        "hl": [
          "energi yang dilepaskan"
        ],
        "pause": 0.7
      },
      {
        "text": "Sampel dibakar dalam wadah baja tertutup berisi oksigen, yang dicelupkan ke dalam air.",
        "hl": [
          "wadah baja"
        ],
        "pause": 0.7
      },
      {
        "text": "Kalor pembakaran menaikkan suhu air, dan dari Q sama dengan m c delta T, energinya dapat dihitung.",
        "hl": [
          "m c delta T"
        ],
        "pause": 0.7
      },
      {
        "text": "Satu gram glukosa melepaskan sekitar lima belas koma enam kilojoule. Dalam dua kilogram air, suhunya hanya naik hampir dua derajat.",
        "hl": [
          "lima belas koma enam kilojoule"
        ],
        "pause": 0.7
      },
      {
        "text": "Dengan cara inilah kandungan energi makanan dan bahan bakar ditentukan.",
        "hl": [
          "kandungan energi makanan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "16",
    "title": "Rangkuman",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 1.6,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.5
      },
      {
        "text": "Suhu adalah ukuran gerak acak molekul. Kalor adalah energi yang mengalir karena perbedaan suhu, Q sama dengan m c delta T, ditambah kalor laten saat berubah wujud.",
        "hl": [
          "gerak acak molekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Kalor berpindah lewat konduksi, konveksi, dan radiasi.",
        "hl": [
          "konduksi, konveksi, dan radiasi"
        ],
        "pause": 0.7
      },
      {
        "text": "Hukum pertama: energi kekal. Hukum kedua: panas mengalir dari panas ke dingin, dan entropi total tidak pernah berkurang.",
        "hl": [
          "entropi total tidak pernah berkurang"
        ],
        "pause": 0.7
      },
      {
        "text": "Di tingkat molekul, suhu menentukan sebaran kecepatan dan, lewat faktor Boltzmann, populasi tingkat-tingkat energi kuantum.",
        "hl": [
          "faktor Boltzmann"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi, setiap kali melihat sesuatu memanas atau mendingin, tanyakan: dari mana kalornya, dan ke mana ia pergi?",
        "hl": [
          "ke mana ia pergi"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 16,
    "lines": []
  }
];
