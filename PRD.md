# SplitDulu — PRD MVP v1

Status: **locked for implementation** · 11 Oktober 2026

## 1. Ringkasan

SplitDulu membantu satu orang membagi tagihan dan langsung tahu siapa perlu transfer berapa. Pengguna memasukkan bagian tiap orang atau pesanan per item, lalu SplitDulu membagi diskon, pajak, dan service secara proporsional. Hasil bisa disalin untuk WhatsApp atau dikirim sebagai struk gambar. Semua data tagihan tetap di browser pengguna.

**Janji produk:** buka → masukkan bill → lihat angka yang pas → kirim. Target pengalaman untuk bill sederhana: kurang dari satu menit, tanpa akun dan tanpa nuansa aplikasi akuntansi.

**Pengguna utama:** orang yang membayar bill untuk teman, pasangan, atau grup kecil dan ingin menagih dengan jelas.

## 2. Scope v1

### Termasuk

- Alur **Home → Input Bill → Result → Share**.
- **Quick Split:** subtotal sebelum diskon dan nominal dasar setiap orang.
- **Detail per Item:** nama, harga satuan, kuantitas, dan satu atau lebih peserta per item. Harga item bersama dibagi rata.
- 2–12 peserta, maksimal 20 item. Nama peserta unik tanpa membedakan huruf besar/kecil.
- Pada input nama peserta, `Enter` berpindah ke peserta berikutnya; dari nama terakhir yang terisi, `Enter` menambah peserta baru dan langsung memfokuskan inputnya (sampai batas 12).
- Diskon nominal rupiah, dibagi proporsional dari bagian dasar.
- Pajak dan service masing-masing dapat berupa persen atau nominal rupiah. Keduanya dibagi proporsional dari bagian sesudah diskon.
- Perhitungan langsung saat input berubah, cek keseimbangan bill, satu pilihan **Siapa yang bayar?**, dan instruksi transfer ke pembayar.
- Draft otomatis serta lima bill terbaru di `localStorage`, hanya pada perangkat/browser yang sama.
- Salin ringkasan teks tanpa emoji untuk WhatsApp.
- Pratinjau, share, dan download struk personal maupun semua peserta sebagai PNG 1080 × 1350 px per halaman, dengan watermark SplitDulu tertanam di setiap gambar. Struk semua peserta memuat menu, rumus pembagian item, subtotal, diskon, pajak, service, dan total tiap orang; bill panjang otomatis berhalaman.

### Di luar v1

OCR, AI scanner, QRIS atau pembayaran, sinkronisasi cloud, friend system, login, kolaborasi real-time, multi-currency, expense tracking, tautan hasil publik, native app, dan analytics yang membawa data bill ke server.

## 3. Alur & layar

| Layar | Tujuan | Tindakan utama |
| --- | --- | --- |
| Home | Menjelaskan manfaat dan membuka bill | Mulai Split; buka salah satu dari lima bill terbaru |
| Input Bill | Semua input dalam satu workspace; pilih Quick atau Detail | Tambah orang/item, biaya, pembayar; lihat total langsung; Lihat Hasil |
| Result | Menunjukkan total, bagian setiap orang, dan transfer | Copy untuk WhatsApp; buka struk semua/personal; edit bill |
| Share | Melihat gambar final dan mengirim/unduh | Navigasi halaman; share semua PNG (Web Share API jika didukung), unduh halaman aktif, atau unduh semua sebagai ZIP berisi PNG |

Pergantian mode menyimpan input kedua mode dalam draft; hanya mode aktif yang dihitung. Kembali dari hasil tidak menghapus isian. Memuat bill terbaru membuat salinan kerja dari snapshot lokal itu; penyimpanan berikutnya memperbarui entri yang sama. **Bill baru** mereset draft tanpa menghapus riwayat.

## 4. Aturan input & hitung

Semua nilai uang adalah **rupiah bulat**; tidak ada pecahan rupiah atau mata uang lain. Harga item adalah harga **per unit**, sehingga jumlah baris = harga × kuantitas. `31k` boleh diinput sebagai Rp31.000. Nilai persen menerima maksimal dua digit desimal, misalnya `10,5` menjadi 10,5%.

1. **Subtotal dasar:** Quick = subtotal yang diisi pengguna; jumlah bagian peserta wajib sama persis. Detail = jumlah semua `harga × qty`; subtotal tercetak di struk boleh diisi untuk pembanding.
2. **Item bersama:** setiap jumlah baris dibagi sama rata ke peserta terpilih. Sisa satuan rupiah diberikan deterministik menurut urutan peserta di bill.
3. **Diskon:** nominal tetap, 0 sampai subtotal. Dibagi proporsional menurut subtotal dasar tiap peserta.
4. **Basis setelah diskon:** subtotal dasar − diskon. Pajak persen dan service persen masing-masing dihitung **independen** atas basis ini, lalu dibulatkan sekali ke rupiah terdekat (0,5 naik). Tidak ada pajak atas service.
5. **Pajak/service nominal:** gunakan nominal yang diisi. Semua pool pajak/service dibagi proporsional menurut bagian setiap orang sesudah diskon. Jika diskon 100% membuat semua bobot nol, gunakan bagian dasar sebagai bobot cadangan.
6. **Pembulatan alokasi:** metode *largest remainder* untuk setiap pool (item bersama, diskon, pajak, service); urutan peserta di bill memecahkan nilai sisa yang sama. Total alokasi selalu tepat sama dengan pool asal.
7. **Total orang:** bagian dasar − alokasi diskon + alokasi pajak + alokasi service. Total tagihan = subtotal − diskon + pajak + service. Jumlah total orang wajib sama persis dengan total tagihan.
8. **Pembayaran:** tepat satu orang telah membayar seluruh bill. Setiap peserta lain dengan bagian positif mentransfer tepat sebesar bagiannya ke pembayar. Pembayar tidak mentransfer ke dirinya sendiri. Jumlah transfer = total tagihan − bagian pembayar.

**Cek bill:** Quick membandingkan jumlah bagian dengan subtotal wajib. Detail dapat membandingkan subtotal item dengan **Subtotal di struk** opsional. Kedua mode dapat membandingkan hasil akhir dengan **Total di struk** opsional. Perbedaan ditampilkan sebagai angka rupiah dan tombol ke hasil dinonaktifkan hingga cocok; tanpa angka pembanding opsional, UI mengatakan “Perhitungan siap”, bukan mengklaim cocok dengan struk fisik.

## 5. Validasi dan keadaan khusus

- Minimal dua nama terisi dan berbeda; pembayar harus salah satu peserta aktif.
- Quick memerlukan subtotal positif dan jumlah bagian yang cocok. Bagian individu boleh nol.
- Detail memerlukan minimal satu item bernama dengan qty 1–99, harga tidak negatif, dan minimal satu peserta aktif pada setiap item. Subtotal keseluruhan harus positif.
- Diskon lebih besar dari subtotal, nominal negatif, persen di luar 0–100%, angka tidak bulat, atau nilai di luar batas aman ditolak dengan pesan dekat input.
- Menghapus peserta menghapusnya dari semua item dan mengosongkan pilihan pembayar jika perlu; item yang kehilangan semua pemilik harus diperbaiki sebelum hasil.
- Perhitungan tetap memberi pratinjau ketika memungkinkan, tetapi hasil/share hanya tersedia setelah semua validasi dan cek bill lulus.
- Draft/riwayat rusak atau versi tak dikenal diabaikan dengan aman. Jika penyimpanan browser diblokir atau penuh, sesi tetap berjalan dan pengguna melihat pemberitahuan.
- Share file memakai fitur perangkat bila tersedia. Untuk struk berhalaman, semua PNG dikirim sekaligus jika didukung; fallback mengunduh satu ZIP berisi semua PNG. Struk satu halaman tetap fallback ke PNG. Pembatalan dialog share tidak memicu unduhan.
- Label panjang dipotong hanya **secara visual** di PNG. Angka dan identitas tiap peserta tetap ditampilkan; nama/item penuh tetap ada di hasil web dan teks salinan.

## 6. Kriteria penerimaan

1. Kedua mode dapat mencapai hasil tanpa akun atau koneksi API; perubahan input mengubah pratinjau angka seketika.
2. Untuk setiap bill valid, `Σ bagian peserta = total tagihan` dan `Σ transfer = total tagihan − bagian pembayar` tepat sampai rupiah terakhir.
3. Bill Quick dengan subtotal Rp76.000, bagian Rp31.000/Rp45.000, diskon Rp22.600, pajak 10%, service 5% menghasilkan total Rp61.410; pembagian tetap konsisten dengan aturan pembulatan di atas.
4. Item Rp10.000 milik tiga orang terbagi Rp3.334/Rp3.333/Rp3.333 menurut urutan peserta.
5. Ketidakcocokan subtotal atau total struk muncul jelas dan mencegah lanjut, tanpa membuang draft.
6. Setelah refresh, draft tetap ada; maksimal lima bill valid muncul di Recent Bills, dapat dibuka, dan hanya disimpan lokal.
7. Copy menghasilkan nama, total tiap peserta, pembayar, instruksi transfer, dan total bill tanpa emoji.
8. Struk personal menampilkan bagian orang itu dan rincian biaya; struk penuh menampilkan semua menu serta perhitungan setiap peserta tanpa ada baris yang terpotong atau hilang. Setiap halaman PNG tepat 1080 × 1350, watermark ada pada bitmap, dan informasi utama tetap berada dalam area tengah yang aman untuk crop 1:1.
9. Menekan `Enter` pada nama pertama memfokuskan nama kedua; pada nama terakhir yang sudah diisi menambah dan memfokuskan peserta baru, tanpa melebihi 12 peserta.
10. Flow dapat digunakan dengan satu tangan pada lebar 320–430 px, keyboard terlihat jelas, pesan error terbaca, dan tombol utama punya target sentuh memadai.

## 7. Batasan peluncuran

v1 adalah alat hitung, bukan bukti pembayaran. Tanggal/judul bill bersifat catatan lokal; tidak ada nomor rekening atau instruksi pembayaran otomatis. Link situs pada watermark adalah identitas brand, bukan link hasil yang bisa dibuka orang lain.
