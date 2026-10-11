// ==============================================================
// Inisialisasi halaman
// Bootstrap saat DOMContentLoaded: tahun footer, input NIK, cek hari/jam, popup awal, draf, listener
// ==============================================================

  window.addEventListener("DOMContentLoaded", async function() {
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const nikInput = document.getElementById('nik');
    if (nikInput) {
      nikInput.setAttribute('inputmode', 'numeric');
      nikInput.setAttribute('maxlength', '16');
      nikInput.addEventListener('input', () => {
        nikInput.value = nikInput.value.replace(/[^0-9]/g, '').slice(0, 16);
        sembunyikanStatusNik();
        if (nikInput.value.length === 16) {
          cekNikRealtime(nikInput.value, 'baru');
        }
        cekSilangNikTanggalLahir();
      });
      nikInput.addEventListener('blur', () => cekNikRealtime(nikInput.value, 'baru'));
    }
    const pNikInput = document.getElementById('p_nik');
    if (pNikInput) {
      pNikInput.setAttribute('inputmode', 'numeric');
      pNikInput.setAttribute('maxlength', '16');
      pNikInput.addEventListener('input', () => {
        pNikInput.value = pNikInput.value.replace(/[^0-9]/g, '').slice(0, 16);
        sembunyikanStatusNikPerpanjangan();
        if (pNikInput.value.length === 16) {
          cekNikRealtime(pNikInput.value, 'perpanjangan');
        }
      });
      pNikInput.addEventListener('blur', () => cekNikRealtime(pNikInput.value, 'perpanjangan'));
    }
    const tglLahirInput = document.getElementById('tanggal_lahir');
    if (tglLahirInput) tglLahirInput.addEventListener('change', cekSilangNikTanggalLahir);
    const jkInput = document.getElementById('jenis_kelamin');
    if (jkInput) jkInput.addEventListener('change', cekSilangNikTanggalLahir);

    ['kontak', 'p_kontak'].forEach(id => {
      const kontakInput = document.getElementById(id);
      if (kontakInput) {
        kontakInput.addEventListener('input', () => {
          kontakInput.value = kontakInput.value.replace(/[^0-9+\-\s]/g, '');
        });
      }
    });

    const paramUrlHalaman = new URLSearchParams(window.location.search);
    const noRegDariQr = paramUrlHalaman.get('cekStatus');
    if (noRegDariQr) aksesHanyaCekStatus = true;

    await checkWorkday();
    const adaSurveiTertunda = pulihkanSurveiTertunda();
    if (adaSurveiTertunda) {
      // Survei tertunda diprioritaskan — jangan tampilkan popup menu lain dulu.
    } else if (noRegDariQr) {
      bukaCekStatusDariQr_(noRegDariQr);
    } else if (!layananTerkunci) {
      showEntryPopup();
    }
    setInterval(checkWorkday, 30000);
    setupFileDropExtras();
    setupFileDragAndDrop();
    restoreDraft();
    restoreDraftPerpanjangan();
    setupAutosaveListeners();
    setupAutosaveListenersPerpanjangan();
    setupOfflineListener();
    setupModalA11y();
  });
