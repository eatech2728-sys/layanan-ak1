// ==============================================================
// Validasi & kirim form
// Klik submit, validasi lanjutan, prosesKirimForm & prosesKirimFormPerpanjangan
// ==============================================================

function handleFormSubmitClick(event) {
    event.preventDefault();

    // Paksa "commit" nilai input yang sedang fokus (misal keyboard HP
    // yang masih dalam mode prediksi/autocomplete) sebelum divalidasi,
    // supaya field yang sudah diisi tidak salah terdeteksi kosong.
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // Beri jeda singkat SETELAH blur() — di sebagian HP (terutama
    // Android dengan keyboard Gboard/Samsung Keyboard), nilai yang
    // sedang diketik butuh sepersekian detik untuk benar-benar
    // "terkunci" ke dalam field setelah keyboard ditutup. Tanpa jeda
    // ini, field yang TERLIHAT terisi di layar bisa saja masih kosong
    // saat kode membaca nilainya, menyebabkan validasi salah gagal
    // meski pengguna sudah mengisi dengan benar.
    setTimeout(lanjutkanValidasiFormBaru_, 80);
}

function lanjutkanValidasiFormBaru_() {
    if (typeof perbaruiInfoRegistrasi_ === 'function') perbaruiInfoRegistrasi_();   // pastikan tanggal = hari ini
    if (layananTerkunci) {
      gateDitutupManual = false;
      const gate = document.getElementById('dayGate');
      gate.classList.add('show');
      updateScrollLock();
      gate.scrollIntoView({ behavior: 'smooth' });
      toast('error', 'Pendaftaran ditutup saat ini', 'Layanan hanya menerima pendaftaran pada hari & jam kerja (Senin–Jumat, 08.00–16.00 WITA, di luar hari libur nasional).', 6000);
      return;
    }

    if (!validasiSemuaField(document.getElementById('registrationForm'))) return;

    if (nikSedangTerdaftar) {
      openDupModal(
        `NIK ini terdeteksi sudah terdaftar tahun ini atas nama "${nikSedangTerdaftar.nama}". Data tidak dapat dikirim ulang untuk mencegah duplikasi.`,
        nikSedangTerdaftar.noReg
      );
      return;
    }

    openReviewModal();
}

  let sedangKirim = false;

  async function prosesKirimForm() {
    if (sedangKirim) return;
    sedangKirim = true;
    const submitBtn = document.getElementById('submitBtn');
    const loadingText = document.getElementById('loadingText');
    submitBtn.disabled = true;
    loadingText.classList.remove('hidden');

    try {
      const fileKtp   = await ambilFilePayload('file_ktp');
      const fileAkta  = await ambilFilePayload('file_akta');
      const fileKK    = await ambilFilePayload('file_kk');
      const fileIdSD  = await ambilFilePayload('file_ijazah_sd');
      const fileIdSMP = await ambilFilePayload('file_ijazah_smp');
      const fileIdSMA = await ambilFilePayload('file_ijazah_sma');
      const fileIdPT  = await ambilFilePayload('file_ijazah_pt');
      const fileFoto  = await ambilFilePayload('file_foto');

      const entriPelatihan = Array.from(document.querySelectorAll('#nonformalList .nonformal-entry')).slice(0, MAKS_PELATIHAN);
      const pendidikanNonFormal = await Promise.all(
        entriPelatihan.map(async (entry) => {
          const fileInput = entry.querySelector('.nf_file');
          const sertifikat = fileInput.id ? await ambilFilePayload(fileInput.id) : null;
          return {
            instansi: entry.querySelector('.nf_instansi').value,
            jurusan: entry.querySelector('.nf_jurusan').value,
            tahun_lulus: entry.querySelector('.nf_tahun').value,
            sertifikat: sertifikat
          };
        })
      );

      const payload = {
        jenis: 'baru',
        no_reg: document.getElementById('no_reg').value,
        tgl_reg: document.getElementById('tgl_reg').value,
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        ttl: document.getElementById('tempat_lahir').value + ", " + document.getElementById('tanggal_lahir').value,
        tempat_lahir: document.getElementById('tempat_lahir').value,
        tanggal_lahir: document.getElementById('tanggal_lahir').value,
        jenis_kelamin: document.getElementById('jenis_kelamin').value,
        status: document.getElementById('status_hubungan').value,
        agama: document.getElementById('agama').value,
        domisili: document.getElementById('domisili').value,
        tujuan_kerja: document.getElementById('tujuan_kerja').value,
        sd_nama: document.getElementById('sd_nama').value,
        sd_jurusan: document.getElementById('sd_jurusan').value,
        sd_lulus: document.getElementById('sd_lulus').value,
        smp_nama: document.getElementById('smp_nama').value,
        smp_jurusan: document.getElementById('smp_jurusan').value,
        smp_lulus: document.getElementById('smp_lulus').value,
        sma_nama: document.getElementById('sma_nama').value,
        sma_jurusan: document.getElementById('sma_jurusan').value,
        sma_lulus: document.getElementById('sma_lulus').value,
        pt_nama: document.getElementById('pt_nama').value || "-",
        pt_jurusan: document.getElementById('pt_jurusan').value || "-",
        pt_lulus: document.getElementById('pt_lulus').value || "-",
        pendidikan_non_formal: pendidikanNonFormal,
        kontak: document.getElementById('kontak').value,
        email: document.getElementById('email').value,
        konfirmasi_fisik: document.getElementById('konfirmasi_fisik').checked ? "Ya (Sanggup Membawa)" : "Tidak",
        konfirmasi_privasi: document.getElementById('konfirmasi_privasi').checked ? "Ya (Setuju)" : "Tidak",
        file_ktp: fileKtp,
        file_akta: fileAkta,
        file_kk: fileKK,
        file_ijazah_sd: fileIdSD,
        file_ijazah_smp: fileIdSMP,
        file_ijazah_sma: fileIdSMA,
        file_ijazah_pt: fileIdPT,
        file_foto: fileFoto
      };

      const response = await fetchWithTimeout(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
      const result = await response.json();

      if (result.status === "success" && !result.no_reg) {
        console.error('Server melaporkan sukses tapi no_reg kosong. Respons lengkap:', result);
        toast(
          'info',
          'Data terkirim, tapi nomor belum bisa ditampilkan',
          'Kemungkinan besar data Anda SUDAH tersimpan di server, hanya nomor registrasinya gagal tampil di layar karena koneksi terputus sesaat. Coba klik "Periksa & Kirim Data" sekali lagi dengan NIK yang sama — jika sudah tersimpan, sistem akan langsung menunjukkan nomor registrasi Anda tanpa mengirim data dua kali. Jika masih bermasalah, hubungi admin dengan menyebutkan NIK dan waktu pengiriman.',
          12000
        );
      } else if (result.status === "success") {
        mulaiAlurSetelahSukses(result.no_reg, 'Data Berhasil Terkirim!', 'Registrasi AK.1 Anda telah kami terima.', 'BERKAS DITERIMA', 'Baru');

        resetSeksiPendidikanVisual();

        document.querySelectorAll('#modeBaruWrap .file-drop').forEach(d => {
          d.classList.remove('filled', 'compressing', 'is-pdf');
          const n = d.querySelector('.file-name');
          n.textContent = n.dataset.default;
          const note = d.querySelector('.file-compress-note');
          if (note) note.textContent = '';
          const thumb = d.querySelector('.file-thumb');
          if (thumb) thumb.removeAttribute('src');
        });
        Object.keys(compressedFileStore).forEach(k => delete compressedFileStore[k]);

        document.getElementById('registrationForm').reset();
        document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
        document.querySelectorAll('.field-error.show').forEach(f => f.classList.remove('show'));
        clearDraft();
        if (typeof wizReset === 'function') wizReset();
        updateProgress();
      } else if (result.status === "duplicate") {
        openDupModal(result.message, result.no_reg);
        toast('error', 'NIK sudah terdaftar', `Nomor registrasi sebelumnya: ${result.no_reg}`, 6500);
      } else if (result.status === "closed") {
        toast('error', 'Pendaftaran ditolak server', result.message || 'Saat ini di luar jam layanan.', 7000);
        checkWorkday();
      } else {
        toast('error', 'Gagal menyimpan data', result.message || 'Silakan coba kirim kembali beberapa saat lagi.', 7000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const isTimeout = error && error.message === 'TIMEOUT';
      toast(
        'error',
        isTimeout ? 'Waktu tunggu habis' : 'Masalah jaringan',
        isTimeout
          ? 'Server tidak merespons dalam waktu yang wajar. Data isian Anda tetap tersimpan otomatis di perangkat ini — silakan coba lagi.'
          : 'Terjadi kendala koneksi atau server saat mengirim data berkas. Data isian Anda tetap tersimpan otomatis di perangkat ini — silakan coba lagi.',
        7000
      );
    } finally {
      submitBtn.disabled = false;
      loadingText.classList.add('hidden');
      sedangKirim = false;
    }
  }

function handlePerpanjanganSubmitClick(event) {
    event.preventDefault();

    // Sama seperti form Daftar Baru: paksa commit nilai field yang
    // sedang fokus sebelum divalidasi.
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    setTimeout(lanjutkanValidasiFormPerpanjangan_, 80);
}

function lanjutkanValidasiFormPerpanjangan_() {
    if (layananTerkunci) {
      gateDitutupManual = false;
      const gate = document.getElementById('dayGate');
      gate.classList.add('show');
      updateScrollLock();
      gate.scrollIntoView({ behavior: 'smooth' });
      toast('error', 'Pendaftaran ditutup saat ini', 'Layanan hanya menerima pengajuan pada hari & jam kerja (Senin–Jumat, 08.00–16.00 WITA, di luar hari libur nasional).', 6000);
      return;
    }

    if (!validasiSemuaField(document.getElementById('perpanjanganForm'))) return;

    if (nikPerpanjanganSedangTerdaftar) {
      openDupModal(
        `Pengajuan perpanjangan dengan NIK ini terdeteksi sudah pernah dikirim atas nama "${nikPerpanjanganSedangTerdaftar.nama}". Data tidak dapat dikirim ulang untuk mencegah duplikasi.`,
        nikPerpanjanganSedangTerdaftar.noReg
      );
      return;
    }

    openReviewModalPerpanjangan();
  }

  let sedangKirimPerpanjangan = false;

  async function prosesKirimFormPerpanjangan() {
    if (sedangKirimPerpanjangan) return;
    sedangKirimPerpanjangan = true;
    const submitBtn = document.getElementById('submitBtnPerpanjangan');
    const loadingText = document.getElementById('loadingTextPerpanjangan');
    submitBtn.disabled = true;
    loadingText.classList.remove('hidden');

    try {
      const fileKtp       = await ambilFilePayload('file_p_ktp');
      const fileKartuLama = await ambilFilePayload('file_p_kartu_lama');
      const fileFoto       = await ambilFilePayload('file_p_foto');

      const payload = {
        jenis: 'perpanjangan',
        nik: document.getElementById('p_nik').value,
        nama: document.getElementById('p_nama').value,
        no_reg_lama: document.getElementById('p_no_reg_lama').value || '-',
        alasan_perpanjangan: document.getElementById('p_alasan').value,
        domisili: document.getElementById('p_domisili').value,
        tujuan_kerja: document.getElementById('p_tujuan_kerja').value,
        kontak: document.getElementById('p_kontak').value,
        email: document.getElementById('p_email').value,
        konfirmasi_fisik: document.getElementById('p_konfirmasi_fisik').checked ? "Ya (Sanggup Membawa)" : "Tidak",
        konfirmasi_privasi: document.getElementById('p_konfirmasi_privasi').checked ? "Ya (Setuju)" : "Tidak",
        file_ktp: fileKtp,
        file_kartu_lama: fileKartuLama,
        file_foto: fileFoto
      };

      const response = await fetchWithTimeout(WEB_APP_URL, { method: "POST", body: JSON.stringify(payload) });
      const result = await response.json();

      if (result.status === "success" && !result.no_reg) {
        toast(
          'info',
          'Data terkirim, tapi nomor belum bisa ditampilkan',
          'Kemungkinan besar pengajuan Anda SUDAH tersimpan di server, hanya nomor registrasinya gagal tampil di layar karena koneksi terputus sesaat. Coba kirim ulang dengan NIK yang sama, atau hubungi admin dengan menyebutkan NIK dan waktu pengiriman.',
          12000
        );
      } else if (result.status === "success") {
        mulaiAlurSetelahSukses(result.no_reg, 'Pengajuan Perpanjangan Terkirim!', 'Permohonan perpanjangan AK-1 Anda telah kami terima.', 'PENGAJUAN DITERIMA', 'Perpanjangan');

        document.querySelectorAll('#modePerpanjanganWrap .file-drop').forEach(d => {
          d.classList.remove('filled', 'compressing', 'is-pdf');
          const n = d.querySelector('.file-name');
          n.textContent = n.dataset.default;
          const note = d.querySelector('.file-compress-note');
          if (note) note.textContent = '';
          const thumb = d.querySelector('.file-thumb');
          if (thumb) thumb.removeAttribute('src');
        });
        Object.keys(compressedFileStore).forEach(k => delete compressedFileStore[k]);

        document.getElementById('perpanjanganForm').reset();
        document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
        document.querySelectorAll('.field-error.show').forEach(f => f.classList.remove('show'));
        clearDraftPerpanjangan();
        updateProgressPerpanjangan();
      } else if (result.status === "duplicate") {
        openDupModal(result.message, result.no_reg);
        toast('error', 'Belum bisa diproses', `Nomor registrasi terkait: ${result.no_reg}`, 6500);
      } else if (result.status === "closed") {
        toast('error', 'Pengajuan ditolak server', result.message || 'Saat ini di luar jam layanan.', 7000);
        checkWorkday();
      } else {
        toast('error', 'Gagal menyimpan data', result.message || 'Silakan coba kirim kembali beberapa saat lagi.', 7000);
      }
    } catch (error) {
      console.error("Error submitting perpanjangan form:", error);
      const isTimeout = error && error.message === 'TIMEOUT';
      toast(
        'error',
        isTimeout ? 'Waktu tunggu habis' : 'Masalah jaringan',
        isTimeout
          ? 'Server tidak merespons dalam waktu yang wajar. Silakan coba lagi.'
          : 'Terjadi kendala koneksi atau server saat mengirim data berkas. Silakan coba lagi.',
        7000
      );
    } finally {
      submitBtn.disabled = false;
      loadingText.classList.add('hidden');
      sedangKirimPerpanjangan = false;
    }
  }
