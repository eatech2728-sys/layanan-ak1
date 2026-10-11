// ==============================================================
// Pengecekan NIK
// Cek NIK real-time, cek silang tanggal lahir, modal duplikat
// ==============================================================

  let nikSedangTerdaftar = null;
  let nikPerpanjanganSedangTerdaftar = null;

  function tampilkanStatusNik(jenis, teks, targetWrapId = 'nikStatus', targetTextId = 'nikStatusText') {
    const wrap = document.getElementById(targetWrapId);
    const txt = document.getElementById(targetTextId);
    if (!wrap || !txt) return;
    wrap.className = 'nik-status show ' + jenis;
    txt.textContent = teks;
  }
  function sembunyikanStatusNik() {
    const wrap = document.getElementById('nikStatus');
    if (wrap) wrap.classList.remove('show');
    nikSedangTerdaftar = null;
  }
  function sembunyikanStatusNikPerpanjangan() {
    const wrap = document.getElementById('pNikStatus');
    if (wrap) wrap.classList.remove('show');
    nikPerpanjanganSedangTerdaftar = null;
  }

  async function cekNikRealtime(nik, mode) {
    const bersih = String(nik || '').trim();
    const wrapId = mode === 'perpanjangan' ? 'pNikStatus' : 'nikStatus';
    const textId = mode === 'perpanjangan' ? 'pNikStatusText' : 'nikStatusText';
    if (bersih.length !== 16) {
      if (mode === 'perpanjangan') sembunyikanStatusNikPerpanjangan(); else sembunyikanStatusNik();
      return;
    }

    tampilkanStatusNik('checking', 'Memeriksa status NIK…', wrapId, textId);
    try {
      const res = await fetchWithTimeout(`${WEB_APP_URL}?cekNik=${encodeURIComponent(bersih)}&jenis=${mode === 'perpanjangan' ? 'perpanjangan' : 'baru'}`);
      const data = await res.json();
      if (data.status === 'success' && data.terdaftar) {
        const info = { noReg: data.no_reg, nama: data.nama };
        if (mode === 'perpanjangan') nikPerpanjanganSedangTerdaftar = info; else nikSedangTerdaftar = info;
        tampilkanStatusNik('warn', `⚠️ ${mode === 'perpanjangan' ? 'Pengajuan perpanjangan' : 'NIK ini'} sudah terdaftar tahun ini atas nama "${data.nama}" (No. Reg ${data.no_reg}).`, wrapId, textId);
      } else if (data.status === 'success') {
        if (mode === 'perpanjangan') nikPerpanjanganSedangTerdaftar = null; else nikSedangTerdaftar = null;

        if (mode === 'perpanjangan' && data.riwayat_ditemukan && data.boleh_perpanjang_sekarang === false) {
          tampilkanStatusNik('warn', `⚠️ Kartu terakhir diproses ${data.tanggal_terakhir_diproses} (No. Reg ${data.no_reg_terakhir}) dan masih berlaku. Baru bisa diperpanjang mulai ${data.tanggal_boleh_perpanjang}.`, wrapId, textId);
        } else {
          tampilkanStatusNik('ok', '✓ Belum terdaftar tahun ini, aman untuk dilanjutkan.', wrapId, textId);
          setTimeout(() => { if (mode === 'perpanjangan') sembunyikanStatusNikPerpanjangan(); else sembunyikanStatusNik(); }, 4500);
        }
      } else {
        if (mode === 'perpanjangan') sembunyikanStatusNikPerpanjangan(); else sembunyikanStatusNik();
      }
    } catch (err) {
      console.warn('Gagal memeriksa status NIK:', err);
      if (mode === 'perpanjangan') sembunyikanStatusNikPerpanjangan(); else sembunyikanStatusNik();
    }
  }

  /**
   * cekSilangNikTanggalLahir — validasi ringan (bukan blokir keras): digit
   * ke-7 sampai ke-12 pada NIK Indonesia menyimpan tanggal lahir (DDMMYY),
   * dengan tanggal +40 untuk perempuan. Kalau tidak konsisten dengan
   * Tanggal Lahir & Jenis Kelamin yang diisi, tampilkan peringatan lembut
   * saja (bisa saja NIK memang tidak standar / sengaja beda).
   */
  function cekSilangNikTanggalLahir() {
    const nikInput = document.getElementById('nik');
    const tglInput = document.getElementById('tanggal_lahir');
    const jkInput = document.getElementById('jenis_kelamin');
    const warnBox = document.getElementById('nikCrossWarn');
    const warnText = document.getElementById('nikCrossWarnText');
    if (!nikInput || !tglInput || !warnBox || !warnText) return;

    const nik = nikInput.value.trim();
    const tglLahir = tglInput.value;
    if (nik.length !== 16 || !tglLahir) {
      warnBox.classList.remove('show');
      return;
    }

    const ddRaw = parseInt(nik.substring(6, 8), 10);
    const mm = parseInt(nik.substring(8, 10), 10);
    const yy = parseInt(nik.substring(10, 12), 10);
    const adalahPerempuan = ddRaw > 40;
    const dd = adalahPerempuan ? ddRaw - 40 : ddRaw;

    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) {
      warnBox.classList.remove('show');
      return;
    }

    const tgl = new Date(tglLahir + 'T00:00:00');
    const tahunInput2Digit = tgl.getFullYear() % 100;
    const cocokTanggal = tgl.getDate() === dd && (tgl.getMonth() + 1) === mm && tahunInput2Digit === yy;
    const jkTerpilih = jkInput ? jkInput.value : '';
    const cocokJk = !jkTerpilih || (adalahPerempuan ? jkTerpilih === 'Perempuan' : jkTerpilih === 'Laki-Laki');

    if (!cocokTanggal || !cocokJk) {
      warnText.textContent = 'Enam digit NIK (tanggal lahir) tampaknya tidak sesuai dengan Tanggal Lahir/Jenis Kelamin yang diisi. Silakan periksa kembali — jika NIK Anda memang sudah benar, isian ini bisa diabaikan.';
      warnBox.classList.add('show');
    } else {
      warnBox.classList.remove('show');
    }
  }

  function openDupModal(message, noReg) {
    document.getElementById('dupMessage').textContent = message || 'NIK ini sudah terdaftar tahun ini.';
    document.getElementById('dupNoReg').textContent = noReg || '-';
    document.getElementById('dupModal').classList.add('show');
  }
  function closeDupModal() {
    document.getElementById('dupModal').classList.remove('show');
  }
