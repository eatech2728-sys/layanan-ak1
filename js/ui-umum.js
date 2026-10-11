// ==============================================================
// Listener offline & FAQ
// Banner offline dan buka/tutup FAQ
// ==============================================================

  function setupOfflineListener() {
    const banner = document.getElementById('offlineBanner');
    const update = () => {
      if (!navigator.onLine) {
        banner.classList.add('show');
        toast('error', 'Koneksi terputus', 'Periksa jaringan internet Anda. Isian tetap tersimpan otomatis.', 5000);
      } else {
        banner.classList.remove('show');
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    const sedangTerbuka = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(el => { if (el !== item) el.classList.remove('open'); });
    item.classList.toggle('open', !sedangTerbuka);
  }
