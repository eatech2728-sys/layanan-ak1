// ==============================================================
// Survei kepuasan (SKM)
// Survei tertunda, daftar unsur, validasi & kirim survei
// ==============================================================

  const SKM_PENDING_KEY = 'ak1_skm_pending_v1';
  let surveiTertunda = false;
  let dataSuksesTertunda = null;

  function tampilkanFabSurvei() {
    const btn = document.getElementById('fabSurvei');
    if (btn) btn.classList.add('show');
  }
  function sembunyikanFabSurvei() {
    const btn = document.getElementById('fabSurvei');
    if (btn) btn.classList.remove('show');
  }

  function simpanSurveiTertunda() {
    try { localStorage.setItem(SKM_PENDING_KEY, JSON.stringify(dataSuksesTertunda)); } catch (err) { /* abaikan */ }
  }
  function hapusSurveiTertundaTersimpan() {
    try { localStorage.removeItem(SKM_PENDING_KEY); } catch (err) { /* abaikan */ }
  }

  /**
   * mulaiAlurSetelahSukses — dipanggil begitu data (Daftar Baru / Perpanjangan)
   * BERHASIL tersimpan di server. Nomor registrasi & bukti/QR TIDAK langsung
   * ditampilkan di sini; peserta wajib mengisi Survei Kepuasan Masyarakat
   * terlebih dahulu. Notifikasi sukses baru muncul setelah survei terkirim
   * (lihat tampilkanNotifikasiSuksesFinal).
   */
  function mulaiAlurSetelahSukses(noRegFinal, judul, sub, stampTitle, jenisPengajuanUntukSurvei) {
    // Alur baru: survei sudah diisi SEBELUM data dikirim -> kirim penilaian otomatis, lalu tampilkan hasil.
    if (skmPraKirim && skmPraKirim.jenis === (jenisPengajuanUntukSurvei || 'Baru')) {
      selesaikanDenganSurveiPra_(noRegFinal, judul, sub, stampTitle);
      return;
    }
    dataSuksesTertunda = { noRegFinal, judul, sub, stampTitle, jenis: jenisPengajuanUntukSurvei || 'Baru' };
    surveiTertunda = true;
    simpanSurveiTertunda();
    tampilkanFabSurvei();

    openSkmModal(noRegFinal, jenisPengajuanUntukSurvei || 'Baru');
    toast(
      'info',
      'Satu langkah lagi',
      'Data Anda sudah tersimpan. Mohon isi Survei Kepuasan Masyarakat berikut untuk menyelesaikan proses & menampilkan nomor registrasi Anda.',
      7000
    );
  }

  /**
   * tampilkanNotifikasiSuksesFinal — baru dipanggil SETELAH survei berhasil
   * dikirim. Di sinilah stempel, notifikasi bukti registrasi, dan QR code
   * ditampilkan.
   */
  function tampilkanNotifikasiSuksesFinal() {
    if (!dataSuksesTertunda) return;
    const { noRegFinal, judul, sub, stampTitle } = dataSuksesTertunda;

    document.getElementById('stampDate').textContent = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('finalNoReg').textContent = noRegFinal;
    document.getElementById('notifSuccessTitle').textContent = judul;
    document.getElementById('notifSuccessSub').textContent = sub;
    document.getElementById('stampOverlayTitle').textContent = stampTitle;

    const overlay = document.getElementById('stampOverlay');
    overlay.classList.add('show');
    setTimeout(() => { overlay.classList.remove('show'); }, 3200);

    document.getElementById('permanentNotification').classList.add('show');
    buatQrBukti(noRegFinal);
    toast('success', judul, `Nomor registrasi Anda: ${noRegFinal}`, 6000);

    surveiTertunda = false;
    dataSuksesTertunda = null;
    hapusSurveiTertundaTersimpan();
    sembunyikanFabSurvei();
  }

  /**
   * bukaKembaliSurveiTertunda — dipanggil dari tombol pintasan mengambang.
   * Berguna kalau modal survei sempat tidak terlihat (misal ukuran layar
   * berubah / peserta sempat scroll jauh), atau setelah survei tertunda
   * dipulihkan dari draf di perangkat yang sama.
   */
  function bukaKembaliSurveiTertunda() {
    if (!surveiTertunda) return;
    const modal = document.getElementById('skmModal');
    if (modal) {
      modal.classList.add('show');
      modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    updateScrollLock();
    toast('info', 'Survei dibuka kembali', 'Mohon lengkapi seluruh 9 unsur penilaian untuk menyelesaikan proses registrasi Anda.', 4500);
  }

  /**
   * pulihkanSurveiTertunda — dijalankan saat halaman dibuka. Kalau di
   * perangkat ini masih ada survei yang belum diselesaikan dari
   * pengiriman sebelumnya (misal tab ditutup sebelum sempat mengisi),
   * survei akan otomatis dimunculkan lagi sampai benar-benar diisi.
   */
  function pulihkanSurveiTertunda() {
    try {
      const raw = localStorage.getItem(SKM_PENDING_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.noRegFinal) return false;

      dataSuksesTertunda = parsed;
      surveiTertunda = true;
      tampilkanFabSurvei();
      openSkmModal(parsed.noRegFinal, parsed.jenis || 'Baru');
      toast(
        'info',
        'Survei sebelumnya belum selesai',
        `Registrasi Anda (No. ${parsed.noRegFinal}) sudah tersimpan, namun Survei Kepuasan belum diselesaikan. Mohon lengkapi terlebih dahulu.`,
        8000
      );
      return true;
    } catch (err) {
      console.warn('Gagal memulihkan survei tertunda:', err);
      return false;
    }
  }

  window.addEventListener('beforeunload', function (e) {
    if (surveiTertunda) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  const SKM_UNSUR = [
    { key: 'u1', label: 'Persyaratan', desc: 'Kesesuaian persyaratan pelayanan dengan jenis layanannya.' },
    { key: 'u2', label: 'Sistem, Mekanisme, dan Prosedur', desc: 'Kemudahan tahapan/alur pelayanan yang diberikan.' },
    { key: 'u3', label: 'Waktu Penyelesaian', desc: 'Kesesuaian waktu penyelesaian dengan yang ditetapkan.' },
    { key: 'u4', label: 'Biaya/Tarif', desc: 'Kewajaran biaya/tarif dalam pelayanan (layanan ini tidak dipungut biaya).' },
    { key: 'u5', label: 'Produk Spesifikasi Jenis Pelayanan', desc: 'Kesesuaian hasil pelayanan dengan ketentuan yang ditetapkan.' },
    { key: 'u6', label: 'Kompetensi Pelaksana', desc: 'Kemampuan dan keterampilan petugas dalam memberikan pelayanan.' },
    { key: 'u7', label: 'Perilaku Pelaksana', desc: 'Sikap petugas dalam memberikan pelayanan.' },
    { key: 'u8', label: 'Penanganan Pengaduan, Saran dan Masukan', desc: 'Penanganan pengaduan/masukan pengguna layanan.' },
    { key: 'u9', label: 'Sarana dan Prasarana', desc: 'Kualitas sarana dan prasarana pelayanan.' }
  ];
  const SKM_SKALA = [
    { nilai: 1, label: 'Tidak Baik' },
    { nilai: 2, label: 'Kurang Baik' },
    { nilai: 3, label: 'Baik' },
    { nilai: 4, label: 'Sangat Baik' }
  ];

  // ---------- Alur "survei dulu, baru kirim" ----------
  // Peserta mengisi survei SEBELUM pendaftaran dikirim. Jawaban ditahan di memori; setelah
  // pendaftaran berhasil & nomor registrasi didapat, penilaian dikirim otomatis bersama nomornya.
  let skmMode = 'pasca';          // 'pra' = sebelum kirim, 'pasca' = setelah data tersimpan (pemulihan lama)
  let skmPraKirim = null;         // { jenis, jawaban, saran }
  let skmLanjutFn = null;         // fungsi kirim pendaftaran yang dijalankan setelah survei diisi
  const SKM_ANTRIAN_KEY = 'ak1_skm_antrian_v1';

  const SKM_INTRO_PASCA = document.getElementById('skmIntro') ? document.getElementById('skmIntro').innerHTML : '';

  function aturTampilanSkm_(mode) {
    skmMode = mode;
    const intro = document.getElementById('skmIntro');
    const btn = document.getElementById('btnKirimSkm');
    const batal = document.getElementById('btnBatalSkm');
    if (mode === 'pra') {
      if (intro) intro.innerHTML = '<b>Satu langkah sebelum pendaftaran dikirim:</b> mohon isi survei singkat ini terlebih dahulu. ' +
        'Pendaftaran Anda <b>baru dikirim setelah survei selesai</b>, dan nomor registrasi ditampilkan sesudahnya. ' +
        'Survei mengikuti 9 unsur pelayanan publik (Permenpan RB No. 14 Tahun 2017) untuk membantu kami meningkatkan layanan.';
      if (btn) btn.textContent = 'Kirim Survei & Daftarkan';
      if (batal) batal.style.display = '';
    } else {
      if (intro) intro.innerHTML = SKM_INTRO_PASCA;
      if (btn) btn.textContent = 'Kirim Penilaian';
      if (batal) batal.style.display = 'none';
    }
  }

  /** Dipanggil saat peserta menekan "Ya, Kirim Sekarang": minta survei dulu, baru jalankan pengiriman. */
  function mintaSurveiLaluKirim_(jenis, lanjutFn) {
    if (skmPraKirim && skmPraKirim.jenis === jenis) { lanjutFn(); return; }   // sudah pernah diisi (mis. kirim ulang setelah gagal)
    skmLanjutFn = lanjutFn;
    openSkmModal('', jenis, 'pra');
    toast('info', 'Isi survei dulu', 'Pendaftaran dikirim otomatis setelah survei singkat ini selesai diisi.', 5000);
  }

  function batalkanSurveiPra() {
    skmLanjutFn = null;
    document.getElementById('skmModal').classList.remove('show');
    updateScrollLock();
    toast('info', 'Pendaftaran belum dikirim', 'Anda bisa memeriksa formulir kembali, lalu menekan "Periksa & Kirim Data" saat siap.', 4500);
  }

  async function kirimPayloadSurvei_(payload, percobaan) {
    for (let i = 0; i < percobaan; i++) {
      try {
        const res = await fetchWithTimeout(WEB_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
        const hasil = await res.json();
        if (hasil && hasil.status === 'success') return true;
      } catch (err) { /* coba lagi */ }
      if (i < percobaan - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
    return false;
  }
  function baca_antrian_() { try { return JSON.parse(localStorage.getItem(SKM_ANTRIAN_KEY) || '[]'); } catch (e) { return []; } }
  function tulis_antrian_(arr) { try { localStorage.setItem(SKM_ANTRIAN_KEY, JSON.stringify(arr)); } catch (e) { /* abaikan */ } }

  /** Penilaian yang belum terkirim (jaringan putus) dicoba lagi diam-diam saat halaman dibuka / online. */
  let antrianSedangJalan_ = false;
  async function prosesAntrianSurvei_() {
    if (antrianSedangJalan_) return;
    antrianSedangJalan_ = true;
    try {
      for (const item of baca_antrian_()) {
        const ok = await kirimPayloadSurvei_(item.payload, 1);
        let sisa = baca_antrian_().filter(x => x.payload.no_reg !== item.payload.no_reg);
        if (!ok && (item.gagal || 0) < 5) sisa.push({ payload: item.payload, gagal: (item.gagal || 0) + 1 });
        tulis_antrian_(sisa);
      }
    } finally { antrianSedangJalan_ = false; }
  }
  window.addEventListener('load', () => setTimeout(prosesAntrianSurvei_, 3000));
  window.addEventListener('online', prosesAntrianSurvei_);

  async function selesaikanDenganSurveiPra_(noRegFinal, judul, sub, stampTitle) {
    const pra = skmPraKirim;
    skmPraKirim = null;
    dataSuksesTertunda = { noRegFinal, judul, sub, stampTitle, jenis: pra.jenis };
    const payload = { tipe_submit: 'survei_skm', no_reg: noRegFinal, jenis_pengajuan: pra.jenis, jawaban: pra.jawaban, saran: pra.saran };
    // Simpan ke antrian dulu: kalau tab ditutup di tengah jalan, penilaian tetap terkirim di kunjungan berikutnya.
    tulis_antrian_(baca_antrian_().concat([{ payload, gagal: 0 }]));
    const ok = await kirimPayloadSurvei_(payload, 3);
    if (ok) tulis_antrian_(baca_antrian_().filter(x => x.payload.no_reg !== noRegFinal));
    tampilkanNotifikasiSuksesFinal();
    if (ok) toast('success', 'Terima kasih!', 'Penilaian Anda terhadap layanan AK-1 sudah kami terima.', 4500);
  }

  let skmSudahDiisi = false;
  let skmNoRegAktif = '';
  let skmJenisAktif = 'Baru';
  let skmDirenderkan = false;

  function renderSkmUnsurList() {
    if (skmDirenderkan) return;
    const wrap = document.getElementById('skmUnsurList');
    if (!wrap) return;

    wrap.innerHTML = SKM_UNSUR.map((u, idx) => {
      const opsi = SKM_SKALA.map(s => `
        <label class="skm-scale-opt" data-key="${u.key}" data-nilai="${s.nilai}">
          <input type="radio" name="skm_${u.key}" value="${s.nilai}" onchange="tandaiSkmDipilih('${u.key}', ${s.nilai})">
          <span>${s.nilai} - ${s.label}</span>
        </label>
      `).join('');
      return `
        <div class="skm-unsur-block" id="skmBlok_${u.key}">
          <div class="skm-unsur-title"><span class="skm-unsur-num">${idx + 1}</span>${u.label}</div>
          <p class="skm-unsur-desc">${u.desc}</p>
          <div class="skm-scale">${opsi}</div>
        </div>
      `;
    }).join('');

    skmDirenderkan = true;
  }

  function tandaiSkmDipilih(key, nilai) {
    const blok = document.getElementById('skmBlok_' + key);
    if (!blok) return;
    blok.classList.remove('has-error');
    blok.querySelectorAll('.skm-scale-opt').forEach(opt => {
      opt.classList.toggle('checked', Number(opt.dataset.nilai) === nilai);
    });
  }

  function openSkmModal(noReg, jenis, mode) {
    renderSkmUnsurList();
    aturTampilanSkm_(mode || 'pasca');
    skmSudahDiisi = false;
    skmNoRegAktif = noReg;
    skmJenisAktif = jenis;
    const elNoReg = document.getElementById('skmNoRegTampil');
    if (elNoReg) elNoReg.textContent = noReg;   // tidak ada pada mode 'pra' (nomor belum ada)

    document.querySelectorAll('#skmUnsurList input[type=radio]').forEach(r => { r.checked = false; });
    document.querySelectorAll('#skmUnsurList .skm-scale-opt.checked').forEach(o => o.classList.remove('checked'));
    document.querySelectorAll('#skmUnsurList .skm-unsur-block.has-error').forEach(b => b.classList.remove('has-error'));
    const saran = document.getElementById('skmSaran');
    if (saran) saran.value = '';

    document.getElementById('skmModal').classList.add('show');
    updateScrollLock();
  }

  function validasiSkm() {
    let semuaTerisi = true;
    let blokPertamaError = null;

    SKM_UNSUR.forEach(u => {
      const terpilih = document.querySelector(`#skmUnsurList input[name="skm_${u.key}"]:checked`);
      const blok = document.getElementById('skmBlok_' + u.key);
      if (!terpilih) {
        semuaTerisi = false;
        if (blok) blok.classList.add('has-error');
        if (!blokPertamaError) blokPertamaError = blok;
      } else if (blok) {
        blok.classList.remove('has-error');
      }
    });

    if (!semuaTerisi) {
      if (blokPertamaError) blokPertamaError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('error', 'Survei belum lengkap', 'Mohon isi penilaian untuk seluruh 9 unsur pelayanan sebelum mengirim.', 5000);
      return false;
    }
    return true;
  }

  async function kirimSurveiSkm() {
    if (!validasiSkm()) return;

    if (skmMode === 'pra') {
      // Tahan jawaban, tutup survei, lalu kirim pendaftaran. Penilaian dikirim otomatis setelah nomor registrasi ada.
      const jawabanPra = {};
      SKM_UNSUR.forEach(u => {
        const t = document.querySelector(`#skmUnsurList input[name="skm_${u.key}"]:checked`);
        jawabanPra[u.key] = t ? Number(t.value) : null;
      });
      skmPraKirim = { jenis: skmJenisAktif, jawaban: jawabanPra, saran: document.getElementById('skmSaran').value || '' };
      document.getElementById('skmModal').classList.remove('show');
      updateScrollLock();
      const fn = skmLanjutFn; skmLanjutFn = null;
      if (fn) fn();
      return;
    }

    const btn = document.getElementById('btnKirimSkm');
    const loadingText = document.getElementById('skmLoadingText');
    btn.disabled = true;
    loadingText.classList.remove('hidden');

    try {
      const jawaban = {};
      SKM_UNSUR.forEach(u => {
        const terpilih = document.querySelector(`#skmUnsurList input[name="skm_${u.key}"]:checked`);
        jawaban[u.key] = terpilih ? Number(terpilih.value) : null;
      });

      const payload = {
        tipe_submit: 'survei_skm',
        no_reg: skmNoRegAktif,
        jenis_pengajuan: skmJenisAktif,
        jawaban: jawaban,
        saran: document.getElementById('skmSaran').value || ''
      };

      const response = await fetchWithTimeout(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
      const result = await response.json();

      if (result.status === 'success') {
        skmSudahDiisi = true;
        document.getElementById('skmModal').classList.remove('show');
        toast('success', 'Terima kasih!', 'Penilaian Anda terhadap layanan AK-1 sudah kami terima.', 4500);
        tampilkanNotifikasiSuksesFinal();
        updateScrollLock();
      } else {
        toast('error', 'Gagal mengirim survei', result.message || 'Silakan coba kirim kembali beberapa saat lagi.', 7000);
      }
    } catch (err) {
      console.error('Error mengirim survei SKM:', err);
      const isTimeout = err && err.message === 'TIMEOUT';
      toast('error', isTimeout ? 'Waktu tunggu habis' : 'Masalah jaringan', isTimeout ? 'Server tidak merespons. Silakan coba lagi.' : 'Terjadi kendala koneksi saat mengirim penilaian. Silakan coba lagi.', 7000);
    } finally {
      btn.disabled = false;
      loadingText.classList.add('hidden');
    }
  }
