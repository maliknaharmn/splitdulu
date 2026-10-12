# SplitDulu

MVP pembagi bill untuk grup kecil. Quick Split dan Detail per Item menghitung bagian tiap orang, diskon, pajak, service, dan transfer ke satu pembayar. Tekan `Enter` untuk lanjut mengisi nama orang berikutnya. Struk personal dan struk penuh terperinci diekspor sebagai PNG 1080 × 1350 per halaman; struk panjang dapat dibagikan sekaligus atau diunduh sebagai ZIP berisi seluruh PNG. Data hanya tersimpan di `localStorage` browser ini.

## Menjalankan lokal

Butuh Node.js 20.9 atau lebih baru.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tidak ada variabel environment, akun, atau layanan backend yang diperlukan.

Jika lingkungan lokal membatasi file watcher dan `npm run dev` menampilkan `EMFILE`, jalankan `WATCHPACK_POLLING=true npm run dev` (macOS/Linux).

## Verifikasi

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Keputusan produk, desain, aturan hitung, dan urutan implementasi ada di `PRD.md`, `DESIGN.md`, `TECHNICAL.md`, serta `IMPLEMENTATION_PLAN.md`.
