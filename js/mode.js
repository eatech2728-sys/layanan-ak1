// ==============================================================
// Mode Baru / Perpanjangan
// Peralihan tampilan antara pendaftaran baru dan perpanjangan
// ==============================================================

  let currentMode = 'baru';

  function terapkanTampilanMode() {
    const wrapBaru = document.getElementById('modeBaruWrap');
    const wrapPerpanjangan = document.getElementById('modePerpanjanganWrap');
    const mobileRail = document.getElementById('mobileRail');
    const h1 = document.getElementById('pageTitleH1');
    const sub = document.getElementById('pageTitleSub');
    const modeLabel = document.getElementById('modeSwitchLabel');

    if (currentMode === 'perpanjangan') {
      wrapBaru.style.display = 'none';
      wrapPerpanjangan.style.display = 'grid';
      if (mobileRail) mobileRail.style.display = 'none';
      h1.textContent = 'Formulir Perpanjangan AK-1';
      sub.textContent = 'Lengkapi data & unggah berkas terbaru untuk memperpanjang kartu AK-1 Anda.';
      modeLabel.textContent = 'Perpanjang AK-1';
      updateProgressPerpanjangan();
    } else {
      wrapPerpanjangan.style.display = 'none';
      wrapBaru.style.display = 'grid';
      if (mobileRail) mobileRail.style.display = '';
      h1.textContent = 'Formulir Pendaftaran AK-1';
      sub.textContent = 'Lengkapi Seluruh Data dan Upload Dokumen Persyaratan Sesuai Petunjuk.';
      modeLabel.textContent = 'Daftar Baru';
      updateProgress();
    }

    perbaruiLabelModeDiPopup();
  }

  function pilihModeBaru() {
    currentMode = 'baru';
    terapkanTampilanMode();
  }

  function pilihModePerpanjangan() {
    currentMode = 'perpanjangan';
    terapkanTampilanMode();
  }
