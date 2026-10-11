// ==============================================================
// PWA / pasang aplikasi
// Service worker, banner "Pasang Aplikasi", petunjuk iOS
// ==============================================================

  const INSTALL_DISMISS_KEY = 'ak1_install_dismissed_at';
  const INSTALL_DISMISS_HARI = 14;
  let deferredInstallPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('Gagal mendaftarkan service worker (PWA tetap bisa dipakai seperti web biasa):', err);
      });
    });
  }

  function bannerBolehTampilLagi() {
    try {
      const tersimpan = localStorage.getItem(INSTALL_DISMISS_KEY);
      if (!tersimpan) return true;
      const hariBerlalu = (Date.now() - Number(tersimpan)) / 86400000;
      return hariBerlalu >= INSTALL_DISMISS_HARI;
    } catch (err) {
      return true;
    }
  }

  function sedangDalamModeStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function tampilkanInstallBanner() {
    if (sedangDalamModeStandalone()) return;
    if (!bannerBolehTampilLagi()) return;
    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.add('show');
  }

  function tutupInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.remove('show');
    try { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); } catch (err) { /* abaikan */ }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    tampilkanInstallBanner();
  });

  async function pasangAplikasi() {
    const banner = document.getElementById('installBanner');
    if (!deferredInstallPrompt) {
      if (banner) banner.classList.remove('show');
      showIosInstallHelp();
      return;
    }
    deferredInstallPrompt.prompt();
    try {
      const pilihan = await deferredInstallPrompt.userChoice;
      if (pilihan.outcome === 'accepted') {
        toast('success', 'Berhasil dipasang!', 'Buka aplikasi AK-1 langsung dari layar utama HP Anda mulai sekarang.', 6000);
      }
    } catch (err) {
      console.warn('Prompt pasang aplikasi dibatalkan/gagal:', err);
    }
    deferredInstallPrompt = null;
    if (banner) banner.classList.remove('show');
  }

  function isPerangkatIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function showIosInstallHelp() {
    toast(
      'info',
      '📲 Tambahkan ke Layar Utama',
      'Di Safari: ketuk ikon Share (kotak dengan panah ke atas) di bagian bawah layar, lalu pilih "Tambahkan ke Layar Utama".',
      9000
    );
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (isPerangkatIOS() && !sedangDalamModeStandalone() && bannerBolehTampilLagi()) {
      const sub = document.getElementById('installBannerSub');
      if (sub) sub.textContent = 'Ketuk tombol Share di Safari lalu pilih "Tambahkan ke Layar Utama".';
      const btn = document.getElementById('installBtn');
      if (btn) btn.textContent = 'Caranya';
      tampilkanInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    tutupInstallBanner();
  });
