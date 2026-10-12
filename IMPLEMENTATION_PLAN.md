# SplitDulu — Implementation Plan v1

Status: **MVP implemented; QA dasar lulus** · sumber keputusan: `PRD.md`, `DESIGN.md`, `TECHNICAL.md`

## Urutan kerja

| Tahap | Output | Gate selesai |
| --- | --- | --- |
| 1. Foundation | Next.js, TypeScript, Tailwind v4, shadcn/ui, Montserrat, brand SVG/favicon | Dev server dan build awal jalan |
| 2. Calculation core | Tipe bill, parser input, alokasi rupiah deterministik, validasi, test | Semua invariant/edge case utama lulus |
| 3. Client state | Context, draft otomatis, recent lima bill, recovery storage | Refresh dan buka recent tidak mengubah angka |
| 4. Alur UI | Home, workspace Quick/Detail, result, settlement, copy WA | Bisa menyelesaikan bill valid end-to-end di mobile |
| 5. Share graphics | Personal/full receipt, pagination canvas PNG, share/download ZIP fallback | Tiap halaman 1080 × 1350, semua menu/perhitungan lengkap, watermark pada bitmap |
| 6. QA | Lint, test, build, smoke viewport/browser | Tidak ada error blocker; batas v1 tercatat |

## Prioritas implementasi

1. Kebenaran angka dan pembulatan, termasuk ketidakcocokan bill.
2. Input cepat di layar kecil, validasi yang jelas, dan state tidak hilang.
3. Settlement yang langsung menjawab siapa transfer ke siapa.
4. Struk yang enak dibagikan dan tetap terbaca saat preview kotak.
5. Polish visual tanpa menambah scope produk.

## Skenario QA minimum

- Quick: Rp76.000, bagian Rp31.000/Rp45.000, diskon Rp22.600, tax 10%, service 5%; total dan transfer pas.
- Detail: item Rp10.000 untuk tiga orang; Rp3.334/Rp3.333/Rp3.333.
- Tiga orang dengan kombinasi item pribadi/shared, qty >1, diskon, charge persen/nominal, pembayar berbeda.
- Diskon 100% dengan tax/service nominal; charge persen menjadi Rp0.
- Bagian Quick kurang/lebih dari subtotal, item tanpa owner, diskon berlebih, nama duplikat, subtotal/total struk mismatch.
- Refresh draft, simpan enam hasil untuk memastikan recent tinggal lima, buka bill lama, reset bill baru.
- Copy WhatsApp, download dan share PNG (atau fallback), cek dimensi dan watermark; cek lebar 320/375/430 px serta desktop.
- `Enter` pada nama orang 1 → 2 → orang baru; struk penuh tiga orang dan stress 12 × 20 item tidak kehilangan detail, dengan share/download seluruh halaman.

## Kriteria rilis

Semua fitur wajib di PRD bekerja tanpa backend, tes calculation lulus, produksi berhasil dibuild, dan QA dasar tidak menemukan kesalahan pembulatan, alokasi, atau alur share. Deployment publik, analytics, dan fitur v1.1 adalah langkah terpisah setelah MVP lokal siap.

## Hasil QA lokal

- `npm test`: 16 test lulus, termasuk pembulatan/alokasi, invariant settlement, input angka, storage rusak/terbatas, pagination struk penuh, dan bundel ZIP.
- `npm run lint`, `npm run typecheck`, dan `npm run build`: lulus; `/`, `/split`, `/result` terbangun sebagai halaman statis. Script build memakai Webpack karena Turbopack di sandbox lokal terhalang izin membuka port subprocess CSS.
- Browser: contoh Quick Rp76.000 → total Rp61.410, bagian Rp25.049/Rp36.361; hasil tetap setelah refresh dan muncul di recent.
- Browser: Detail per Item tiga orang dengan item shared ×2, diskon, pajak persen, service nominal → total Rp49.000; mismatch Rp1 memblokir hasil dan cocok kembali setelah diperbaiki.
- Browser: teks WhatsApp, preview struk personal/penuh, PNG 1080 × 1350, dan watermark pada bitmap terverifikasi. Fitur share native mengikuti dukungan perangkat; dialog sistem tidak diautomasi dalam QA lokal.
- Browser terisolasi dari draft pengguna: `Enter` memindahkan fokus nama 1 → 2 dan menambah/fokus nama 3; bill tiga orang dengan item pribadi/shared, qty 2, diskon, pajak, dan service menghasilkan Rp73.600. Struk penuh memuat rumus item dan rincian per orang pada dua halaman; pager berfungsi.
- Preview pada lebar 320 px tidak overflow horizontal; PNG halaman lanjutan berukuran natural 1080 × 1350. Struk personal satu halaman tetap terbuka/tertutup normal. Arsip fallback ZIP lulus `unzip -t` untuk semua halaman.
