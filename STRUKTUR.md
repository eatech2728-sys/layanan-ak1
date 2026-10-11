# Struktur Registrasi AK.1 (setelah dipecah)

index.html yang tadinya ±4.700 baris kini hanya berisi kerangka HTML (±1.190 baris).
Gaya tampilan ada di folder `css/`, kode program di folder `js/`.
Isi kode TIDAK diubah, hanya dipindah per topik.

```
index.html          kerangka halaman (markup, modal, formulir)
css/                gaya tampilan (14 file)
js/                 kode program (24 file)
sw.js, manifest.webmanifest, icons/, background1.png, sampul_dinkop.jpg   (tetap di tempat lama)
```

## Mau mengubah apa → buka file mana

| Keperluan | File |
|---|---|
| Warna, font, kop surat | css/base.css |
| Sidebar & tab bar HP | css/layout.css |
| Tampilan formulir & kolom upload | css/form.css |
| Stempel & notifikasi sukses | css/sukses.css |
| Footer | css/footer.css |
| Toast, badge draf, banner offline, pesan error field | css/feedback.css |
| Modal review & FAQ | css/modal.css |
| Tombol melayang (WA, menu, survei), banner pasang aplikasi | css/fab.css |
| Pesan "pendaftaran ditutup" | css/gate.css |
| Kartu bukti & modal panduan alur | css/bukti-panduan.css |
| Popup menu awal, status NIK, modal duplikat | css/entry.css |
| Modal cek status & survei SKM | css/status-survei.css |
| Animasi pembuka | css/intro.css + js/intro.js |
| Efek suara notifikasi (nada sukses/gagal/salah isi/survei, dll.) | js/suara.js (+ css/suara.css untuk tombol speaker) |
| Alamat Apps Script (WEB_APP_URL) | js/api.js |
| Jam/hari layanan, hari libur | js/jam-layanan.js |
| Kirim form, validasi submit | js/kirim-form.js |
| Pengecekan NIK | js/nik.js |
| Survei kepuasan (SKM) | js/survei.js |
| Draf otomatis | js/draft.js |
| Kompres foto/berkas | js/foto.js |
| Pendidikan & pelatihan | js/pendidikan.js |
| Cek status pengajuan | js/cek-status.js |
| Bukti, QR, bagikan WhatsApp | js/bukti.js |
| Pasang aplikasi (PWA) | js/pwa.js |

Perubahan teks/field di formulir tetap di index.html.

## Aturan penting
1. Urutan `<link css>` dan `<script js>` di index.html jangan diubah. Beberapa file memakai
   variabel/fungsi dari file sebelumnya.
2. File baru di dalam css/ atau js/ harus ditambahkan juga ke daftar cache di `sw.js`
   (kalau sw.js menyimpan daftar file untuk mode offline), lalu naikkan nomor versi cache-nya.
   Kalau tidak, pengguna yang sudah memasang aplikasi bisa terus memakai file lama.
3. Ubah satu bagian cukup ganti satu file itu saja, lalu unggah file tersebut.
4. Alamat gambar di CSS memakai `../` (mis. `../sampul_dinkop.jpg`) karena CSS ada di folder css/.
