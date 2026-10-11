// ==============================================================
// Jam & hari layanan
// Hari libur nasional, waktu WITA, checkWorkday, gerbang layanan
// ==============================================================

  const HOLIDAY_API = 'https://api-harilibur.vercel.app/api';
  const JAM_BUKA_LAYANAN  = 8;
  const JAM_TUTUP_LAYANAN = 16;

  let cacheLiburNasional = { tanggal: null, nama: null };

  function getWaktuWITA() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
    });
    const bagian = {};
    fmt.formatToParts(now).forEach(p => { bagian[p.type] = p.value; });

    const petaHari = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const jam = parseInt(bagian.hour, 10) % 24;

    return {
      tahun: parseInt(bagian.year, 10),
      bulan: parseInt(bagian.month, 10),
      tanggal: parseInt(bagian.day, 10),
      jam: jam,
      menit: parseInt(bagian.minute, 10),
      hari: petaHari[bagian.weekday],
      tanggalStr: `${bagian.year}-${bagian.month}-${bagian.day}`
    };
  }

  async function ambilNamaLiburNasional(tanggalStr, tahun) {
    if (cacheLiburNasional.tanggal === tanggalStr) return cacheLiburNasional.nama;
    let nama = null;
    try {
      const res = await fetchWithTimeout(`${HOLIDAY_API}?year=${tahun}`, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        const match = Array.isArray(data) ? data.find(h => h.holiday_date === tanggalStr && h.is_national_holiday) : null;
        if (match) nama = match.holiday_name;
      }
    } catch (err) {
      console.warn('Gagal memeriksa kalender hari libur nasional (memakai pengecekan hari/jam kerja biasa):', err);
    }
    cacheLiburNasional = { tanggal: tanggalStr, nama };
    return nama;
  }

  let layananTerkunci = false;
  let gateDitutupManual = false;
  let statusTerkunciSebelumnya = null;
  // BARU: true kalau halaman dibuka lewat tautan QR code "Cek Status"
  // dari dokumen cetak AK-1 (?cekStatus=<no registrasi>). Perusahaan
  // yang scan QR ini boleh melihat status pengajuan KAPAN SAJA, jadi
  // gerbang jam/hari layanan (day-gate) SENGAJA tidak ditampilkan
  // untuk kasus akses ini — mereka cuma mau mengecek, bukan mendaftar.
  let aksesHanyaCekStatus = false;

  async function checkWorkday() {
    const banner = document.getElementById('workdayBanner');
    const bannerText = document.getElementById('workdayBannerText');
    const gate = document.getElementById('dayGate');
    const gateDate = document.getElementById('dayGateDate');
    const gateReason = document.getElementById('dayGateReason');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnP = document.getElementById('submitBtnPerpanjangan');

    const w = getWaktuWITA();
    const namaHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][w.hari];
    const jamTampil = String(w.jam).padStart(2, '0') + '.' + String(w.menit).padStart(2, '0');
    const tglObj = new Date(w.tahun, w.bulan - 1, w.tanggal);
    const tglTampil = tglObj.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    let terkunci = false;
    let alasanList = [];

    if (w.hari === 0 || w.hari === 6) {
      terkunci = true;
      alasanList.push(`Hari ini ${namaHari}, termasuk akhir pekan yang wajib libur.`);
    }

    const dalamJamKerja = w.jam >= JAM_BUKA_LAYANAN && w.jam < JAM_TUTUP_LAYANAN;
    if (!dalamJamKerja) {
      terkunci = true;
      if (w.jam < JAM_BUKA_LAYANAN) {
        alasanList.push(`Saat ini pukul ${jamTampil} WITA — layanan baru buka pukul 08.00 WITA.`);
      } else {
        alasanList.push(`Saat ini pukul ${jamTampil} WITA — layanan sudah tutup sejak pukul 16.00 WITA.`);
      }
    }

    const namaLibur = await ambilNamaLiburNasional(w.tanggalStr, w.tahun);
    if (namaLibur) {
      terkunci = true;
      alasanList.push(`Hari ini ditetapkan sebagai hari libur nasional: "${namaLibur}".`);
    }

    layananTerkunci = terkunci;

    gateDate.textContent = `${tglTampil}, pukul ${jamTampil} WITA`;
    gateReason.textContent = alasanList.join(' ');

    const baruSajaTertutup = terkunci && (statusTerkunciSebelumnya === false || statusTerkunciSebelumnya === null);
    if (baruSajaTertutup) gateDitutupManual = false;

    if (terkunci) {
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnP) submitBtnP.disabled = true;
      if (banner) banner.style.background = 'rgba(193,39,45,.28)';
      if (bannerText) bannerText.textContent = `🔒 Pendaftaran ditutup saat ini (${namaHari}, ${jamTampil} WITA) — layanan hanya buka Senin–Jumat, 08.00–16.00 WITA, di luar hari libur nasional.`;

      if (!gateDitutupManual && !aksesHanyaCekStatus) {
        gate.classList.add('show');
        updateScrollLock();
        if (baruSajaTertutup) {
          toast('error', 'Pendaftaran ditutup saat ini', 'Silakan kembali pada jam & hari layanan berikutnya.', 6000);
        }
      }
    } else {
      gate.classList.remove('show');
      updateScrollLock();
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtnP) submitBtnP.disabled = false;
      if (banner) banner.style.background = 'rgba(255,255,255,.14)';
      if (bannerText) bannerText.textContent = `✅ Layanan dibuka sekarang (${namaHari}, ${jamTampil} WITA). Jam layanan: 08.00–16.00 WITA, Senin–Jumat.`;
      gateDitutupManual = false;
    }

    statusTerkunciSebelumnya = terkunci;
  }

  function tutupGateManual() {
    gateDitutupManual = true;
    const gate = document.getElementById('dayGate');
    gate.classList.remove('show');
    updateScrollLock();
    toast(
      'info',
      'Anda bisa melihat-lihat persyaratan',
      'Formulir tetap tidak dapat dikirim di luar jam layanan. Notifikasi ini akan muncul lagi jika Anda mencoba mengirim data.',
      5500
    );
  }
