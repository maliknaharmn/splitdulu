# SplitDulu — Design System & UX v1

Status: **locked for implementation** · selaras dengan `PRD.md`

## Arah visual

**Friendly utility:** bersih, ringan, sedikit fun; angka dan tindakan lebih menonjol daripada dekorasi. Tidak memakai emoji, ilustrasi karakter, ikon uang generik, atau gaya invoice perusahaan. Bahasa utama Indonesia dengan kata English yang wajar seperti “Quick Split” dan “Share”.

### Brand

- **Logo:** lockup primer mengikuti referensi: mark `S` lime utuh di kiri dan wordmark horizontal `SplitDulu` ink, dengan `Split` bold dan `Dulu` extra-bold. Beri ruang aman di viewBox dan header agar mark maupun huruf tidak terpotong. Favicon mark yang sudah ada tetap, tidak diubah. Mark harus tetap terbaca monokrom.
- **Tipografi:** Montserrat lokal, 400/500 untuk isi, 600 untuk label, 700/800 untuk judul dan total. Angka memakai `font-variant-numeric: tabular-nums`.
- **Palet:** background `#F8F9F3`, surface `#FFFFFF`, ink `#171B16`, muted `#687064`, chartreuse `#C8F269`, chartreuse gelap `#9FC949`, lavender lembut `#EBE7F7`, border `#E5E9DF`, error `#B13A30`.
- **Radius:** tombol/field 14 px, card 22–28 px, receipt 42 px. Bayangan tipis; jangan mengandalkan bayangan untuk keterbacaan.
- **Ikon:** Lucide React dengan stroke 1,75–2. Geometri dekoratif menggunakan SVG/CSS sederhana, tanpa aset berlisensi tertutup.

### Layout

- Mobile-first: padding horizontal 20 px pada 320–430 px; konten input maksimum 700 px; desktop memperluas ruang kosong, bukan menambah dashboard.
- Jarak dasar 8 px; kelompok 16/24/32 px. Tombol dan field setidaknya 44 px tinggi; action bawah editor sticky dengan ruang aman perangkat.
- Tetap jelas pada 320 px tanpa horizontal scroll. Judul/tagihan panjang membungkus di UI. Semua input memiliki label nyata dan status error teks.

## Spesifikasi layar

### Home

Header dengan lockup; hero `Split bill tanpa ribet.` dan subcopy singkat. Tombol `Mulai Split` memulai bill baru. Kartu struk dekoratif memberi gambaran hasil, bukan form demo yang bisa membingungkan. Di bawah hero tampil maksimum lima bill terbaru dengan judul, tanggal, total, dan tombol buka; tampilkan teks `Disimpan di browser ini`.

### Input Bill

Satu workspace bertahap secara visual: judul bill → tab `Quick Split / Detail per Item` → Orang → Nominal/Pesanan → Diskon, Pajak & Service → `Siapa yang bayar?` → `Cek total struk`. Mode aktif ditandai lime dan `aria-selected`; data mode lain tetap di draft. Kartu orang ringkas dengan nama editable; `Enter` melanjutkan fokus ke nama berikutnya dan menambah orang setelah nama terakhir terisi. Kartu item menampung nama, harga/unit, qty, pilihan peserta berbentuk chip, dan hapus. Pesan validasi muncul dekat section serta pada ringkasan status. Bar bawah memperlihatkan total live dan `Lihat Hasil`.

### Result

Angka total besar di atas, lalu kartu `Siapa bayar berapa` dengan rincian yang dapat dibuka per orang. Section gelap `Transfer ke [pembayar]` memperjelas settlement. Aksi utama `Copy untuk WhatsApp`; `Struk Semua` dan `Struk [nama]` membuka preview gambar. Aksi `Edit bill` kembali ke input tanpa kehilangan isi.

### Share

Preview 4:5 berada dalam dialog/panel yang dapat ditutup. Pilihan `Semua` atau peserta personal; untuk struk penuh yang berhalaman, pager berada sebelum preview, lalu aksi `Share semua`, `PNG halaman ini`, dan `Download semua PNG (.zip)`. Status proses dan kegagalan terlihat dalam teks, bukan hanya warna. Pratinjau dan file ekspor menggunakan renderer yang sama sehingga angka/layout cocok.

## Receipt art direction

**Modern receipt + editorial card.** Kanvas warm off-white 1080 × 1350; lingkaran/arc chartreuse sebagai aksen; kartu putih di tengah; logo kecil, nama bill, tanggal, angka utama besar, garis tipis, rincian, dan watermark `dibuat dengan SplitDulu` di dalam bitmap. Gunakan huruf gelap dengan kontras tinggi. Tidak ada emoji atau ilustrasi template.

Area aman crop kotak adalah **y=135–1215 px**; nama penerima, total, daftar nominal utama, dan watermark berada di area ini. Pada struk penuh, setiap peserta mendapat heading total, seluruh menu miliknya, formula `qty × harga/unit ÷ jumlah peserta` bila shared, dan subtotal/diskon/pajak/service miliknya. Bagi otomatis ke beberapa kanvas 1080 × 1350 bila tidak muat, dengan label lanjutan dan nomor halaman; tidak boleh meringkas atau membuang menu. Halaman lanjutan dengan sedikit konten diseimbangkan secara vertikal. Pada struk personal, tampilkan seluruh item yang menjadi bagiannya (maksimum 20), dengan dua kolom saat perlu, lalu diskon/pajak/service miliknya. Label panjang dipersingkat secara visual dengan elipsis, nilai rupiah tidak dipersingkat. Share bukan screenshot UI.

## State & aksesibilitas

Tombol disabled tetap menjelaskan alasannya melalui pesan validasi. Focus ring terlihat; chip owner memakai `aria-pressed`; dialog punya label dan tombol tutup; hasil/validasi memakai live region yang tidak mengganggu input setiap ketikan. Ikon selalu berpasangan dengan label atau `aria-label`. Kontras teks kecil dijaga, khususnya di atas lime. Reduced motion menonaktifkan transisi dekoratif. Tidak ada informasi yang hanya dibedakan oleh warna.
