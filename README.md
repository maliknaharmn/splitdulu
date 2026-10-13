# SplitDulu

**Split bill tanpa ribet.** SplitDulu adalah aplikasi web untuk membagi tagihan bersama, menghitung bagian setiap orang sampai rupiah terakhir, dan membagikan hasilnya. Tanpa akun atau backend.

[Coba SplitDulu](https://splitdulu.vercel.app/)

## Fitur

- **Quick Split:** isi subtotal dan nominal dasar masing-masing orang tanpa memasukkan menu.
- **Detail per Item:** tambahkan pesanan, jumlah, dan orang yang ikut berbagi setiap item.
- **Perhitungan langsung:** diskon, pajak, dan service dibagi proporsional; subtotal dan total struk dapat dicek sebelum melihat hasil.
- **Who Paid?:** pilih orang yang membayar dulu, lalu lihat nominal transfer dari peserta lain.
- **Bagikan hasil:** salin ringkasan untuk WhatsApp atau bagikan struk personal dan struk lengkap sebagai PNG 1080 × 1350. Struk beberapa halaman dapat diunduh sebagai ZIP.
- **Riwayat lokal:** lanjutkan bill terbaru di browser yang sama.

## Menjalankan lokal

Gunakan Node.js 20.9 atau lebih baru. Tidak ada variabel environment yang wajib diisi.

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000`. Jika file watcher menampilkan `EMFILE` di macOS/Linux, jalankan `WATCHPACK_POLLING=true npm run dev`.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Penyimpanan data

Draft dan riwayat bill disimpan di `localStorage` browser. Data tidak disinkronkan antarperangkat dan akan hilang jika data situs/browser dihapus.

## Lisensi dan identitas

Kode sumber SplitDulu dilisensikan dengan [MIT](LICENSE) © 2026 Malik Nahar. Lisensi ini tidak mencakup nama SplitDulu, logo, wordmark, atau karya visual identitasnya, termasuk bentuk vektor pada `components/brand.tsx` dan `public/favicon.svg`. Gunakan nama dan visual lain untuk fork yang dipublikasikan, atau minta izin terlebih dahulu. Dependensi pihak ketiga mengikuti lisensi masing-masing.
