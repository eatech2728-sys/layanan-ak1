// ==============================================================
// Koneksi ke Apps Script
// Alamat WEB_APP_URL, fetchWithTimeout, pengambilan nomor registrasi otomatis
// ==============================================================

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXmh0laoRlJx1GkeyWUGp6HF4pQTqIggUzSQ6u-ye2WletvIsFLQFLukH_5VBBiR0C/exec";
  const FETCH_TIMEOUT_MS = 30000;

  /**
   * fetchWithTimeout — pembungkus fetch() dengan batas waktu tunggu.
   * Semua panggilan fetch ke Apps Script memakai ini supaya tombol
   * "Sedang memproses..." tidak macet tanpa batas kalau koneksi hang.
   *
   * CATATAN KEAMANAN & VALIDASI SERVER (Code.gs):
   * Validasi yang ada di file ini (hari/jam layanan, format NIK, ukuran
   * berkas, cek duplikasi NIK) HANYA berjalan di browser pengguna dan
   * BISA DILEWATI kalau seseorang memanggil endpoint Apps Script ini
   * langsung. Pastikan Code.gs juga memvalidasi ulang hal yang sama:
   *  - Tolak request di luar Senin-Jumat 08.00-16.00 WITA (cek waktu
   *    server, bukan payload dari klien).
   *  - Tolak NIK yang bukan 16 digit angka.
   *  - Tolak/kompres ulang berkas berukuran di atas batas yang wajar.
   *  - Cek ulang duplikasi NIK sebelum menyimpan baris baru.
   */
  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }


  window.addEventListener("DOMContentLoaded", function() {
    fetchWithTimeout(WEB_APP_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          document.getElementById('no_reg').value = data.next_reg;
        } else {
          document.getElementById('no_reg').value = "Gagal memuat nomor";
        }
      })
      .catch(err => {
        document.getElementById('no_reg').value = err && err.message === 'TIMEOUT' ? "Waktu muat habis" : "Error koneksi";
        console.error(err);
      });
    updatePelatihanLimitNote();
  });
