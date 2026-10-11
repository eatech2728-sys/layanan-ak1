// ==============================================================
// Popup menu, panduan, cek status
// Kunci scroll, popup menu awal, modal alur, modal cek status/syarat
// ==============================================================

  /** Satu sumber kebenaran untuk kunci-scroll halaman: overflow hanya dikunci
    jika day-gate, entry-popup, ATAU survei SKM benar-benar sedang tampil di layar. */
  function updateScrollLock() {
    const gate = document.getElementById('dayGate');
    const entry = document.getElementById('entryOverlay');
    const skm = document.getElementById('skmModal');
    const adaOverlayTampil =
      (gate && gate.classList.contains('show')) ||
      (entry && entry.classList.contains('show')) ||
      (skm && skm.classList.contains('show'));
    document.documentElement.style.overflow = adaOverlayTampil ? 'hidden' : '';
  }

  function showEntryPopup() {
    const overlay = document.getElementById('entryOverlay');
    if (!overlay) return;
    perbaruiLabelModeDiPopup();
    overlay.classList.add('show');
    updateScrollLock();
  }

  function hideEntryPopup() {
    const overlay = document.getElementById('entryOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    updateScrollLock();
  }

  function perbaruiLabelModeDiPopup() {
    const wrap = document.getElementById('entryCurrentMode');
    const text = document.getElementById('entryCurrentModeText');
    if (!wrap || !text) return;
    if (sudahPernahPilihMode) {
      text.textContent = currentMode === 'perpanjangan' ? 'Perpanjang AK-1' : 'Daftar Baru AK-1';
      wrap.classList.add('show');
    } else {
      wrap.classList.remove('show');
    }
  }

  let sudahPernahPilihMode = false;

  function entryMulaiDaftar() {
    sudahPernahPilihMode = true;
    pilihModeBaru();
    hideEntryPopup();
    const target = document.getElementById('sec-reg');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function entryMulaiPerpanjang() {
    sudahPernahPilihMode = true;
    pilihModePerpanjangan();
    hideEntryPopup();
    const target = document.getElementById('sec-p-data');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function entryLihatPanduan() {
    hideEntryPopup();
    openFlowModal();
  }

  function entryCekStatus() {
    hideEntryPopup();
    openStatusSyaratModal('paneCekStatus');
  }

  function openFlowModal() {
    const modal = document.getElementById('flowModal');
    if (!modal) return;
    const targetPane = currentMode === 'perpanjangan' ? 'flowPanePerpanjangan' : 'flowPaneBaru';
    const targetBtn = modal.querySelector(`.status-syarat-tab-btn[data-pane="${targetPane}"]`);
    if (targetBtn) gantiTabFlow(targetBtn);
    modal.classList.add('show');
  }

  function closeFlowModal() {
    const modal = document.getElementById('flowModal');
    if (modal) modal.classList.remove('show');
  }

  function gantiTabFlow(btn) {
    const modal = document.getElementById('flowModal');
    modal.querySelectorAll('.status-syarat-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    modal.querySelectorAll('.status-syarat-pane').forEach(p => p.classList.toggle('active', p.id === btn.dataset.pane));
  }

  /**
   * BARU — dipanggil sekali saat halaman dibuka lewat tautan QR code
   * "Cek Status" dari dokumen cetak AK-1 (?cekStatus=<no registrasi>).
   * Langsung membuka modal "Cek Status & Syarat" pada tab yang tepat,
   * mengisi kotak pencarian dengan Nomor Registrasi dari QR, dan
   * menjalankan pencariannya secara otomatis — supaya pihak perusahaan
   * yang scan tidak perlu klik apa pun lagi untuk melihat hasilnya.
   */
  function bukaCekStatusDariQr_(nilaiDariQr) {
    openStatusSyaratModal('paneCekStatus');
    const input = document.getElementById('statusCheckInput');
    if (input) input.value = nilaiDariQr;
    jalankanCekStatus();
  }

  function openStatusSyaratModal(paneId) {
    const modal = document.getElementById('statusSyaratModal');
    if (!modal) return;
    modal.classList.add('show');
    if (paneId) {
      const btn = modal.querySelector(`.status-syarat-tab-btn[data-pane="${paneId}"]`);
      if (btn) gantiTabStatusSyarat(btn);
    } else if (!modal.querySelector('.status-syarat-tab-btn.active')) {
      const firstBtn = modal.querySelector('.status-syarat-tab-btn');
      if (firstBtn) gantiTabStatusSyarat(firstBtn);
    }
  }
  function closeStatusSyaratModal() {
    const modal = document.getElementById('statusSyaratModal');
    if (modal) modal.classList.remove('show');
  }
  function gantiTabStatusSyarat(btn) {
    const modal = document.getElementById('statusSyaratModal');
    modal.querySelectorAll('.status-syarat-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    modal.querySelectorAll('.status-syarat-pane').forEach(p => p.classList.toggle('active', p.id === btn.dataset.pane));
  }
