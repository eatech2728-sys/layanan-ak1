/**
 * =====================================================================
 * sw.js — Service Worker untuk Formulir AK-1 (PWA)
 * =====================================================================
 * Tugasnya HANYA dua:
 *  1. Meng-cache "shell" aplikasi (HTML/CSS/JS/ikon) supaya form bisa
 *     tetap TERBUKA walau koneksi sedang lambat/terputus sesaat, dan
 *     supaya browser mau menampilkan prompt "Pasang Aplikasi".
 *  2. SENGAJA TIDAK PERNAH meng-cache permintaan ke Google Apps Script
 *     (Domain script.google.com / script.googleusercontent.com) —
 *     data seperti nomor registrasi, status hari/jam kerja, cek NIK,
 *     dan pengiriman formulir HARUS SELALU live dari server, tidak
 *     boleh basi karena ke-cache.
 *
 * PENTING SAAT UPDATE FORM DI KEMUDIAN HARI: naikkan angka versi di
 * CACHE_NAME setiap kali Anda mengubah isi ASSETS_TO_CACHE atau file
 * HTML/CSS/JS utamanya, supaya pengguna yang sudah pernah install
 * otomatis dapat versi terbaru (bukan versi lama yang ke-cache).
 * =====================================================================
 */

const CACHE_NAME = 'ak1-wakatobi-v1';

// Sesuaikan daftar ini dengan nama file HTML utama Anda yang
// sebenarnya di server (path relatif terhadap lokasi sw.js ini).
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Domain backend yang TIDAK BOLEH di-cache sama sekali — selalu network.
const DOMAIN_TANPA_CACHE = ['script.google.com', 'script.googleusercontent.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.warn('Gagal meng-cache sebagian shell PWA:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Jangan pernah ikut campur permintaan ke backend Apps Script —
  // biarkan browser menanganinya langsung (selalu live, tidak di-cache).
  if (DOMAIN_TANPA_CACHE.some((d) => url.indexOf(d) !== -1)) {
    return;
  }

  // Hanya proses permintaan GET; permintaan lain (mis. POST submit
  // form) dibiarkan lewat apa adanya.
  if (event.request.method !== 'GET') return;

  // Strategi: "stale-while-revalidate" — tampilkan versi ter-cache
  // secepatnya (kalau ada) supaya form langsung terbuka, SAMBIL tetap
  // mengambil versi terbaru dari jaringan di latar belakang untuk
  // memperbarui cache bagi kunjungan berikutnya.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const jaringan = fetch(event.request)
        .then((responseBaru) => {
          if (responseBaru && responseBaru.status === 200) {
            const clone = responseBaru.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return responseBaru;
        })
        .catch(() => cached); // offline & tidak ada di cache -> biarkan gagal wajar

      return cached || jaringan;
    })
  );
});
