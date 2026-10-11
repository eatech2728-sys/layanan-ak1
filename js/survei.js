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

  function openSkmModal(noReg, jenis) {
    renderSkmUnsurList();
    skmSudahDiisi = false;
    skmNoRegAktif = noReg;
    skmJenisAktif = jenis;
    document.getElementById('skmNoRegTampil').textContent = noReg;

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
