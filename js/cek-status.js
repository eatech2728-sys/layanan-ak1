// ==============================================================
// Cek status pengajuan
// jalankanCekStatus dan kartu hasil status
// ==============================================================

  async function jalankanCekStatus() {
    const input = document.getElementById('statusCheckInput');
    const btn = document.getElementById('btnCekStatusSubmit');
    const area = document.getElementById('statusResultArea');
    const query = input.value.trim();

    if (!query) {
      toast('error', 'Isi dulu NIK atau No. Registrasi', 'Masukkan NIK (16 digit) atau Nomor Registrasi AK-1 Anda.', 4000);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memeriksa…';
    area.innerHTML = '<div class="status-result-empty">Sedang memeriksa status…</div>';

    try {
      const res = await fetchWithTimeout(`${WEB_APP_URL}?cekStatus=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.status !== 'success' || !data.ditemukan || !Array.isArray(data.hasil) || data.hasil.length === 0) {
        area.innerHTML = '<div class="status-result-empty">Tidak ditemukan pengajuan dengan NIK/No. Registrasi tersebut. Periksa kembali penulisannya, atau hubungi admin jika Anda yakin sudah pernah mengajukan.</div>';
        return;
      }

      area.innerHTML = data.hasil.map(item => buatKartuStatus(item)).join('');
    } catch (err) {
      console.error('Gagal mengecek status:', err);
      const isTimeout = err && err.message === 'TIMEOUT';
      area.innerHTML = `<div class="status-result-empty">${isTimeout ? 'Server tidak merespons dalam waktu yang wajar.' : 'Terjadi kendala koneksi saat memeriksa status.'} Silakan coba lagi beberapa saat.</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Cek Status';
    }
  }

  function kelasStatusPill(statusProses) {
    const s = (statusProses || '').toLowerCase();
    if (s.includes('selesai') || s.includes('diambil')) return 'selesai';
    if (s.includes('siap')) return 'siap';
    if (s.includes('verifikasi') && !s.includes('menunggu')) return 'terverifikasi';
    return 'menunggu';
  }

  function buatKartuStatus(item) {
    const jenisLabel = item.jenis === 'Perpanjangan' ? 'Perpanjangan' : 'Daftar Baru';
    const jenisClass = item.jenis === 'Perpanjangan' ? 'perpanjangan' : '';
    const statusProses = item.status_proses || 'Menunggu Verifikasi';
    const pillClass = kelasStatusPill(statusProses);
    const catatan = item.catatan_admin
      ? `<div class="src-catatan"><b>Catatan Admin:</b> ${item.catatan_admin}</div>`
      : '';
    return `
      <div class="status-result-card">
        <div class="src-head">
          <span class="src-jenis ${jenisClass}">${jenisLabel}</span>
          <span class="src-noreg">${item.no_reg || '-'}</span>
        </div>
        <div style="font-size:13px; color:var(--ink); font-weight:700;">${item.nama || '-'}</div>
        <div style="font-size:11.5px; color:var(--ink-soft); margin-top:2px;">Tanggal: ${item.tanggal_reg || '-'}</div>
        <span class="status-pill ${pillClass}">${statusProses}</span>
        ${catatan}
      </div>
    `;
  }
