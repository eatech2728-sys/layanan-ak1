// ==============================================================
// Pendidikan & pelatihan
// Tambah jenjang pendidikan, baris pelatihan, reset seksi
// ==============================================================

  const MAKS_PELATIHAN = 3;   // batas maksimal baris pelatihan


  let levelPendidikanSaatIni = 1;

  function tambahJenjangPendidikan() {
    levelPendidikanSaatIni++;

    if (levelPendidikanSaatIni === 2) {
      document.getElementById('row-smp').style.display = 'block';
      document.getElementById('smp_nama').required = true;
      document.getElementById('smp_lulus').required = true;
    } else if (levelPendidikanSaatIni === 3) {
      document.getElementById('row-sma').style.display = 'block';
      document.getElementById('sma_nama').required = true;
      document.getElementById('sma_lulus').required = true;
      document.getElementById('sma_jurusan').required = true;
    } else if (levelPendidikanSaatIni === 4) {
      document.getElementById('row-pt').style.display = 'block';
      document.getElementById('pt_nama').required = true;
      document.getElementById('pt_lulus').required = true;
      document.getElementById('pt_jurusan').required = true;
      document.getElementById('btnTambahPendidikan').style.display = 'none';
    }

    updateProgress();
  }

  let pelatihanCount = 0;

  function buatBarisPelatihan(index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'nonformal-entry divider-row';
    wrapper.dataset.index = index;
    wrapper.innerHTML = `
      <div class="grid3">
        <div class="field">
          <label>Nama Instansi/Lembaga Pelatihan <span style="color:var(--ink-soft); font-weight:400;">(opsional)</span></label>
          <input type="text" class="nf_instansi" placeholder="Nama lembaga/instansi pelatihan">
        </div>
        <div class="field">
          <label>Tahun Lulus <span style="color:var(--ink-soft); font-weight:400;">(opsional)</span></label>
          <select class="year-select nf_tahun"><option value="" selected>-- Pilih Tahun --</option></select>
        </div>
        <div class="field">
          <label>Upload Sertifikat <span style="color:var(--ink-soft); font-weight:400;">(opsional)</span></label>
          <div class="file-drop nf_drop" id="drop_pelatihan_${index}">
            <div class="file-drop-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>
              <span class="file-name" data-default="Maks 3MB">Maks 3MB</span>
            </div>
            <input type="file" class="nf_file" id="file_pelatihan_${index}" accept="image/*,application/pdf" onchange="handleFile(this,'drop_pelatihan_${index}')">
          </div>
        </div>
      </div>
      <div class="field" style="margin-top:14px;">
        <label>Jurusan/Bidang Pelatihan <span style="color:var(--ink-soft); font-weight:400;">(opsional)</span></label>
        <input type="text" class="nf_jurusan" placeholder="Nama jurusan/bidang pelatihan">
      </div>
      <div style="text-align:right; margin-top:10px;"><button type="button" class="btn-hapus-pelatihan" onclick="hapusPelatihan(this)" style="background:none;border:1px solid var(--red);color:var(--red);padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Hapus Pelatihan Ini</button></div>
    `;
    return wrapper;
  }

  function updatePelatihanLimitNote() {
    const note = document.getElementById('pelatihanLimitNote');
    const btn = document.getElementById('btnTambahPelatihan');
    if (pelatihanCount >= MAKS_PELATIHAN) {
      note.textContent = `Sudah mencapai batas maksimal ${MAKS_PELATIHAN} pelatihan yang dapat dicatat.`;
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      note.textContent = `${pelatihanCount} dari maksimal ${MAKS_PELATIHAN} pelatihan ditambahkan.`;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  function tambahPelatihan() {
    if (pelatihanCount >= MAKS_PELATIHAN) {
      alert(`Maaf, sistem hanya dapat mencatat maksimal ${MAKS_PELATIHAN} pelatihan/kursus.`);
      return;
    }
    pelatihanCount++;
    const container = document.getElementById('nonformalList');
    const row = buatBarisPelatihan(pelatihanCount);
    container.appendChild(row);
    isiPilihanTahunPada(row.querySelectorAll('select.year-select'));
    setupFileDropExtras();
    setupFileDragAndDrop();
    updatePelatihanLimitNote();
    updateProgress();
  }

  function hapusPelatihan(btn) {
    const entry = btn.closest('.nonformal-entry');
    if (entry) entry.remove();
    pelatihanCount = document.querySelectorAll('#nonformalList .nonformal-entry').length;
    updatePelatihanLimitNote();
    updateProgress();
  }

  function resetSeksiPendidikanVisual() {
    levelPendidikanSaatIni = 1;
    document.getElementById('row-smp').style.display = 'none';
    document.getElementById('row-sma').style.display = 'none';
    document.getElementById('row-pt').style.display = 'none';
    document.getElementById('btnTambahPendidikan').style.display = 'inline-flex';

    const fields = ['smp_nama', 'smp_lulus', 'smp_jurusan', 'file_ijazah_smp', 'sma_nama', 'sma_lulus', 'sma_jurusan', 'file_ijazah_sma', 'pt_nama', 'pt_lulus', 'pt_jurusan', 'file_ijazah_pt'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = false;
    });

    document.getElementById('nonformalList').innerHTML = '';
    pelatihanCount = 0;
    updatePelatihanLimitNote();
  }
