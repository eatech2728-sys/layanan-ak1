// ==============================================================
// Draf otomatis
// Simpan/pulihkan draf (pendaftaran baru & perpanjangan)
// ==============================================================

  const DRAFT_KEY = 'ak1_draft_v1';
  const DRAFT_FIELD_IDS = [
    'tgl_reg','nik','nama','tempat_lahir','tanggal_lahir','jenis_kelamin','status_hubungan','agama',
    'domisili','tujuan_kerja','sd_nama','sd_jurusan','sd_lulus','smp_nama','smp_jurusan','smp_lulus',
    'sma_nama','sma_jurusan','sma_lulus','pt_nama','pt_jurusan','pt_lulus','kontak','email'
  ];
  let draftSaveTimer = null;

  function setupAutosaveListeners() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('input', () => {
      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(saveDraft, 700);
    });
    form.addEventListener('change', () => {
      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(saveDraft, 300);
    });
  }

  function saveDraft() {
    try {
      const data = {};
      DRAFT_FIELD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
      });
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data }));
      showDraftBadge();
    } catch (err) {
      console.warn('Gagal menyimpan draf otomatis:', err);
    }
  }

  function showDraftBadge() {
    const badge = document.getElementById('draftBadge');
    if (!badge) return;
    document.getElementById('draftBadgeText').textContent = 'Draf tersimpan otomatis';
    badge.classList.add('show');
    clearTimeout(showDraftBadge._t);
    showDraftBadge._t = setTimeout(() => badge.classList.remove('show'), 2200);
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return;

      let adaIsi = false;
      Object.keys(parsed.data).forEach(id => {
        if (id === 'tgl_reg') return;   // tanggal registrasi selalu hari ini, tidak dipulihkan dari draf
        const el = document.getElementById(id);
        const val = parsed.data[id];
        if (el && val) {
          el.value = val;
          adaIsi = true;
        }
      });

      if (adaIsi) {
        bukaJenjangDariIsian_();   // buka kembali baris SMP/SMA/PT yang ada isinya
        updateProgress();
        toast('info', 'Draf sebelumnya dipulihkan', 'Data teks yang pernah Anda isi di perangkat ini telah dimuat kembali. Berkas (KTP, foto, dll) perlu dipilih ulang karena tidak ikut tersimpan.', 7000);
      }
    } catch (err) {
      console.warn('Gagal memulihkan draf:', err);
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* abaikan */ }
  }

  function hapusDraftManual() {
    clearDraft();
    document.getElementById('registrationForm').reset();
    document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
    document.querySelectorAll('.field-error.show').forEach(f => f.classList.remove('show'));
    resetSeksiPendidikanVisual();
    if (typeof wizReset === 'function') wizReset();
    document.querySelectorAll('#modeBaruWrap .file-drop').forEach(d => {
      d.classList.remove('filled', 'compressing', 'is-pdf');
      const n = d.querySelector('.file-name');
      if (n) n.textContent = n.dataset.default;
    });
    updateProgress();
    toast('success', 'Draf dihapus', 'Formulir Daftar Baru sudah dikosongkan kembali.', 4000);
  }

  const DRAFT_KEY_PERPANJANGAN = 'ak1_draft_perpanjangan_v1';
  const DRAFT_FIELD_IDS_PERPANJANGAN = [
    'p_nik','p_nama','p_no_reg_lama','p_alasan','p_domisili','p_tujuan_kerja','p_kontak','p_email'
  ];
  let draftSaveTimerPerpanjangan = null;

  function setupAutosaveListenersPerpanjangan() {
    const form = document.getElementById('perpanjanganForm');
    form.addEventListener('input', () => {
      clearTimeout(draftSaveTimerPerpanjangan);
      draftSaveTimerPerpanjangan = setTimeout(saveDraftPerpanjangan, 700);
    });
    form.addEventListener('change', () => {
      clearTimeout(draftSaveTimerPerpanjangan);
      draftSaveTimerPerpanjangan = setTimeout(saveDraftPerpanjangan, 300);
    });
  }

  function saveDraftPerpanjangan() {
    try {
      const data = {};
      DRAFT_FIELD_IDS_PERPANJANGAN.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
      });
      localStorage.setItem(DRAFT_KEY_PERPANJANGAN, JSON.stringify({ savedAt: Date.now(), data }));
      showDraftBadge();
    } catch (err) {
      console.warn('Gagal menyimpan draf perpanjangan otomatis:', err);
    }
  }

  function restoreDraftPerpanjangan() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY_PERPANJANGAN);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return;

      let adaIsi = false;
      Object.keys(parsed.data).forEach(id => {
        const el = document.getElementById(id);
        const val = parsed.data[id];
        if (el && val) {
          el.value = val;
          adaIsi = true;
        }
      });

      if (adaIsi) {
        updateProgressPerpanjangan();
        toast('info', 'Draf perpanjangan dipulihkan', 'Data teks yang pernah Anda isi telah dimuat kembali. Berkas perlu dipilih ulang karena tidak ikut tersimpan.', 7000);
      }
    } catch (err) {
      console.warn('Gagal memulihkan draf perpanjangan:', err);
    }
  }

  function clearDraftPerpanjangan() {
    try { localStorage.removeItem(DRAFT_KEY_PERPANJANGAN); } catch (err) { /* abaikan */ }
  }

  function hapusDraftPerpanjanganManual() {
    clearDraftPerpanjangan();
    document.getElementById('perpanjanganForm').reset();
    document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
    document.querySelectorAll('.field-error.show').forEach(f => f.classList.remove('show'));
    document.querySelectorAll('#modePerpanjanganWrap .file-drop').forEach(d => {
      d.classList.remove('filled', 'compressing', 'is-pdf');
      const n = d.querySelector('.file-name');
      if (n) n.textContent = n.dataset.default;
    });
    updateProgressPerpanjangan();
    toast('success', 'Draf dihapus', 'Formulir Perpanjangan sudah dikosongkan kembali.', 4000);
  }
