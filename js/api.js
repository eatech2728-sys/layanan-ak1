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


  // Info registrasi: tanggal terisi otomatis (WITA), nomor perkiraan hanya tampil bila berhasil dimuat.
  let noRegDimuat_ = '';
  function isiTanggalRegistrasi_() {
    const el = document.getElementById('tgl_reg');
    if (!el) return;
    const tz = 'Asia/Makassar';
    const sekarang = new Date();
    el.value = sekarang.toLocaleDateString('en-CA', { timeZone: tz });
    const tampil = document.getElementById('tgl_reg_tampil');
    if (tampil) tampil.textContent = sekarang.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });
  }
  function perbaruiInfoRegistrasi_() {
    isiTanggalRegistrasi_();
    const el = document.getElementById('no_reg');
    if (el) el.value = noRegDimuat_;
    const wrap = document.getElementById('regNoWrap');
    const tampil = document.getElementById('no_reg_tampil');
    if (wrap) wrap.hidden = !noRegDimuat_;
    if (tampil) tampil.textContent = noRegDimuat_ || '-';
  }
  isiTanggalRegistrasi_();

  window.addEventListener("DOMContentLoaded", function() {
    fetchWithTimeout(WEB_APP_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          noRegDimuat_ = String(data.next_reg || '');
        } else {
          noRegDimuat_ = '';
        }
        perbaruiInfoRegistrasi_();
      })
      .catch(err => {
        noRegDimuat_ = '';   // gagal memuat: kolom disembunyikan, tidak menampilkan pesan error ke pengguna
        perbaruiInfoRegistrasi_();
        console.error(err);
      });
    updatePelatihanLimitNote();
  });
