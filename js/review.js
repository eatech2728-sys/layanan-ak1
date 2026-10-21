// ==============================================================
// Review data sebelum kirim
// Modal konfirmasi data (baru & perpanjangan)
// ==============================================================

  function labelTerpilih(selectEl) {
    if (!selectEl) return '-';
    const opt = selectEl.options[selectEl.selectedIndex];
    return opt ? opt.textContent : '-';
  }
  function nilaiAtauStrip(id) {
    const el = document.getElementById(id);
    return (el && el.value.trim()) ? el.value.trim() : '-';
  }
  function namaBerkas(id) {
    const el = document.getElementById(id);
    return (el && el.files && el.files[0]) ? el.files[0].name : 'Belum diunggah';
  }

  function buildReviewSection(judul, baris) {
    const rows = baris.map(([k, v]) => `<div class="review-row"><span class="rk">${k}</span><span class="rv">${v}</span></div>`).join('');
    return `<div class="review-group"><h4>${judul}</h4>${rows}</div>`;
  }

  function openReviewModal() {
    const body = document.getElementById('reviewBody');
    let html = '';

    html += buildReviewSection('I. Informasi Registrasi', [
      ['Tanggal Registrasi', nilaiAtauStrip('tgl_reg')]
    ]);

    html += buildReviewSection('II. Data Diri', [
      ['NIK', nilaiAtauStrip('nik')],
      ['Nama Lengkap', nilaiAtauStrip('nama')],
      ['Tempat, Tanggal Lahir', `${nilaiAtauStrip('tempat_lahir')}, ${nilaiAtauStrip('tanggal_lahir')}`],
      ['Jenis Kelamin', labelTerpilih(document.getElementById('jenis_kelamin'))],
      ['Status', labelTerpilih(document.getElementById('status_hubungan'))],
      ['Agama', labelTerpilih(document.getElementById('agama'))],
      ['Domisili', labelTerpilih(document.getElementById('domisili'))],
      ['Tujuan Tempat Kerja', nilaiAtauStrip('tujuan_kerja')],
      ['Berkas KTP', namaBerkas('file_ktp')],
      ['Berkas Akta Lahir', namaBerkas('file_akta')],
      ['Berkas Kartu Keluarga', namaBerkas('file_kk')]
    ]);

    const pendidikanRows = [['SD/Sederajat', `${nilaiAtauStrip('sd_nama')} (${nilaiAtauStrip('sd_lulus')})`]];
    if (document.getElementById('smp_nama').value.trim()) pendidikanRows.push(['SMP/Sederajat', `${nilaiAtauStrip('smp_nama')} (${nilaiAtauStrip('smp_lulus')})`]);
    if (document.getElementById('sma_nama').value.trim()) pendidikanRows.push(['SMA/Sederajat', `${nilaiAtauStrip('sma_nama')} — ${nilaiAtauStrip('sma_jurusan')} (${nilaiAtauStrip('sma_lulus')})`]);
    if (document.getElementById('pt_nama').value.trim()) pendidikanRows.push(['Perguruan Tinggi', `${nilaiAtauStrip('pt_nama')} — ${nilaiAtauStrip('pt_jurusan')} (${nilaiAtauStrip('pt_lulus')})`]);
    const jumlahPelatihan = document.querySelectorAll('#nonformalList .nonformal-entry').length;
    pendidikanRows.push(['Pelatihan/Kursus Non Formal', jumlahPelatihan > 0 ? `${jumlahPelatihan} entri dilampirkan` : 'Tidak ada']);
    html += buildReviewSection('III. Riwayat Pendidikan', pendidikanRows);

    html += buildReviewSection('IV. Kontak & Pas Foto', [
      ['Kontak WhatsApp', nilaiAtauStrip('kontak')],
      ['Email', nilaiAtauStrip('email')],
      ['Pas Foto', namaBerkas('file_foto')],
      ['Kesanggupan Bawa Fisik', document.getElementById('konfirmasi_fisik').checked ? 'Ya' : 'Belum dicentang'],
      ['Persetujuan Data Pribadi', document.getElementById('konfirmasi_privasi').checked ? 'Ya' : 'Belum dicentang']
    ]);

    html += `
      <div class="review-actions">
        <button type="button" class="btn-edit-review" onclick="closeReviewModal()">Periksa Lagi</button>
        <button type="button" class="btn-confirm-review" onclick="konfirmasiKirim()">Ya, Kirim Sekarang</button>
      </div>
    `;

    body.innerHTML = html;
    document.getElementById('reviewModal').classList.add('show');
  }
  function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('show');
  }
  function konfirmasiKirim() {
    closeReviewModal();
    mintaSurveiLaluKirim_('Baru', prosesKirimForm);   // survei WAJIB diisi dulu, baru data dikirim
  }

  function openReviewModalPerpanjangan() {
    const body = document.getElementById('reviewBodyPerpanjangan');
    let html = '';

    html += buildReviewSection('I. Data & Referensi Lama', [
      ['NIK', nilaiAtauStrip('p_nik')],
      ['Nama Lengkap', nilaiAtauStrip('p_nama')],
      ['No. Reg Lama', nilaiAtauStrip('p_no_reg_lama')],
      ['Alasan Perpanjangan', labelTerpilih(document.getElementById('p_alasan'))],
      ['Domisili', labelTerpilih(document.getElementById('p_domisili'))],
      ['Tujuan Tempat Kerja Terbaru', nilaiAtauStrip('p_tujuan_kerja')]
    ]);

    html += buildReviewSection('II. Berkas Terbaru', [
      ['KTP Terbaru', namaBerkas('file_p_ktp')],
      ['Kartu AK-1 Lama', namaBerkas('file_p_kartu_lama')],
      ['Pas Foto Terbaru', namaBerkas('file_p_foto')]
    ]);

    html += buildReviewSection('III. Kontak', [
      ['Kontak WhatsApp', nilaiAtauStrip('p_kontak')],
      ['Email', nilaiAtauStrip('p_email')],
      ['Kesanggupan Bawa Fisik', document.getElementById('p_konfirmasi_fisik').checked ? 'Ya' : 'Belum dicentang'],
      ['Persetujuan Data Pribadi', document.getElementById('p_konfirmasi_privasi').checked ? 'Ya' : 'Belum dicentang']
    ]);

    html += `
      <div class="review-actions">
        <button type="button" class="btn-edit-review" onclick="closeReviewModalPerpanjangan()">Periksa Lagi</button>
        <button type="button" class="btn-confirm-review" onclick="konfirmasiKirimPerpanjangan()">Ya, Kirim Sekarang</button>
      </div>
    `;

    body.innerHTML = html;
    document.getElementById('reviewModalPerpanjangan').classList.add('show');
  }
  function closeReviewModalPerpanjangan() {
    document.getElementById('reviewModalPerpanjangan').classList.remove('show');
  }
  function konfirmasiKirimPerpanjangan() {
    closeReviewModalPerpanjangan();
    mintaSurveiLaluKirim_('Perpanjangan', prosesKirimFormPerpanjangan);   // survei WAJIB diisi dulu
  }
