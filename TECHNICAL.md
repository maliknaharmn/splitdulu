# SplitDulu — Technical Design v1

Status: **locked for implementation** · aturan produk di `PRD.md`, tampilan di `DESIGN.md`

## Stack & batas arsitektur

Next.js App Router + TypeScript, Tailwind CSS v4, komponen shadcn/ui yang berada di repo, Lucide React, Montserrat lokal melalui `@fontsource`, dan Vitest untuk calculation engine. Halaman statis; seluruh state dan hitungan berjalan di client. Tidak ada database, API route, server action, auth, cookie tracking, atau request yang mengirim data bill. Deployment dapat memakai hosting Next.js biasa; `npm run build` adalah gate minimum dan memakai Webpack secara eksplisit agar tidak bergantung pada subprocess CSS Turbopack yang dibatasi sandbox lokal.

Route: `/` (Home), `/split` (editor), `/result` (hasil + dialog share). Provider client di layout menjaga draft ketika navigasi. Route hasil memeriksa ulang validitas, jadi URL langsung tanpa bill valid kembali ke editor.

## Model data

```ts
type Mode = "quick" | "itemized";
type Charge = { kind: "percent" | "amount"; value: number };
type Participant = { id: string; name: string; quickAmount: number };
type Item = { id: string; name: string; unitPrice: number; quantity: number; participantIds: string[] };
type BillDraft = {
  id: string;
  title: string;
  mode: Mode;
  participants: Participant[];
  quickSubtotal: number;
  items: Item[];
  discount: number;
  tax: Charge;
  service: Charge;
  expectedSubtotal: number | null;
  expectedTotal: number | null;
  payerId: string | null;
  createdAt: string;
  updatedAt: string;
};
```

`Charge.value` adalah basis point (1/100 persen) untuk `percent`, rupiah untuk `amount`. Uang disimpan integer, bukan string format. Nilai input tunggal maksimum Rp1.000.000.000; subtotal maksimum Rp1.000.000.000.000. Identitas peserta/item berupa ID stabil, bukan nama. `createdAt/updatedAt` string ISO. Bilangan yang melampaui `Number.MAX_SAFE_INTEGER` ditolak.

## Calculation engine murni

`calculateBill(BillDraft)` menghasilkan subtotal, diskon, pool pajak/service, total, alokasi per orang, rincian item, settlement, check differences, dan error. Fungsi tidak mengakses React, DOM, waktu, atau storage.

- `allocate(total, weights)` menghitung kuota dengan `BigInt`, memberi pembulatan bawah lalu sisa ke fraksi terbesar; seri diselesaikan berdasarkan urutan peserta. Tidak memakai pembulatan floating point per orang.
- Bagi rata item adalah kasus bobot sama; urutan peserta bill, bukan urutan klik chip, menentukan sisa rupiah.
- Pool pajak/service persen memakai `roundHalfUp((subtotal - discount) × basisPoints / 10000)` sekali. Kedua persen independen; nominal tidak dihitung ulang.
- Setelah pool diskon, pajak, service dibagi, invariant diperiksa: jumlah alokasi sama dengan pool, jumlah bagian sama dengan total, dan jumlah transfer sama dengan total minus bagian pembayar.
- Check differences disimpan bertanda (`aktual − tercetak`). Quick shares vs subtotal wajib; subtotal struk opsional hanya Detail; total struk opsional di kedua mode.
- Preview dapat dihitung meski check belum cocok, tetapi `canProceed` hanya benar tanpa error dan selisih nol.

Contoh unit test mencakup shared item dengan sisa rupiah, diskon proporsional, persen sesudah diskon, biaya nominal pada diskon 100%, ketidakcocokan struk, input invalid, dan invariant settlement.

## State & storage

Provider memuat `localStorage` setelah hydration, menggunakan key `splitdulu:v1` dan payload `{ version: 1, draft, recent }`. `recent` maksimum lima snapshot bill valid, urut `updatedAt` terbaru. Draft disimpan otomatis setelah perubahan, recent disimpan saat membuka hasil. Parser runtime menolak tipe/shape asing dan membatasi panjang array/angka; data rusak diabaikan, bukan dijalankan. `localStorage` error ditangkap dan ditampilkan, tanpa menghalangi pemakaian sesi. Hapus peserta membersihkan relasi item dan pembayar dalam satu update.

## Receipt & share

Renderer Canvas 2D memakai data hasil engine yang sama dengan halaman hasil. `receiptLines` membentuk setiap baris item dari hasil alokasi dan data harga/qty/owner; `planFullReceipt` menghitung segmentasi halaman berdasar tinggi baris/header/ringkasan, termasuk pemecahan satu orang yang mempunyai banyak item. Tes memastikan 12 peserta × 20 item tidak kehilangan baris dan ringkasan tiap orang tepat sekali. Font Montserrat dari aset lokal ditunggu melalui `document.fonts.load` sebelum render. Tidak ada gambar eksternal atau CORS. Preview berasal dari PNG renderer yang sama. `renderReceiptPages` mengekspor satu atau lebih bitmap 1080 × 1350 lewat `canvas.toBlob("image/png")`; watermark dan nomor halaman digambar langsung di setiap canvas. Nama file disanitasi, dengan sufiks `-halaman-N` jika perlu. Tombol Share memakai `navigator.canShare({files})` + `navigator.share` untuk seluruh halaman; bila unsupported, satu halaman diunduh sebagai PNG dan beberapa halaman dibundel dalam ZIP tanpa dependency tambahan. `AbortError` dianggap pembatalan pengguna. Object URL dicabut setelah dipakai.

## Struktur kode

```text
app/                  routes, metadata, global styles
components/ui/        komponen shadcn/ui lokal
components/           editor, result, brand, receipt dialog
lib/bill.ts           tipe, default draft, validasi & kalkulasi
lib/format.ts         parsing input dan format IDR/tanggal
lib/storage.ts        parser dan localStorage
lib/receipt.ts        renderer PNG dan share/download
lib/receipt-plan.ts   baris item dan pagination struk penuh
lib/zip.ts            bundel PNG berhalaman untuk fallback share/download
providers/            React context draft/recent
public/               favicon/brand SVG
```

## QA & batas risiko

Jalankan unit test engine, lint, typecheck/build, lalu smoke test manual 320–430 px dan desktop: dua mode, item bersama, mismatch, refresh/recent, copy, PNG personal/penuh, dan fallback share. Browser tanpa Web Share tetap dapat download. Storage lokal dapat hilang jika pengguna menghapus data browser; UI menyatakannya. PNG menampung maksimal 12 peserta/20 item sesuai batas editor; watermark yang tertanam tetap bisa dipotong/diedit oleh penerima gambar seperti semua bitmap.
