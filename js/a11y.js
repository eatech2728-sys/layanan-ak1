// ==============================================================
// Aksesibilitas modal
// Fokus keyboard & Escape pada modal
// ==============================================================

  /**
   * setupModalA11y — menambahkan dukungan aksesibilitas dasar untuk
   * semua .modal-overlay: tutup dengan tombol Escape (kecuali modal
   * yang memang wajib diisi seperti SKM, dan day-gate yang memang
   * gerbang wajib), dan focus-trap sederhana (Tab tidak keluar dari
   * modal yang sedang aktif).
   */
  function setupModalA11y() {
    const ESC_EXCLUDED_IDS = ['skmModal', 'dayGate'];

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' && e.key !== 'Tab') return;

      const modalTerbuka = Array.from(document.querySelectorAll('.modal-overlay.show, .entry-overlay.show'))
        .find(m => m.offsetParent !== null);
      if (!modalTerbuka) return;

      if (e.key === 'Escape') {
        if (ESC_EXCLUDED_IDS.includes(modalTerbuka.id)) return;
        const closeBtn = modalTerbuka.querySelector('.modal-close, [onclick*="hideEntryPopup"]');
        if (closeBtn) closeBtn.click();
        else modalTerbuka.classList.remove('show');
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalTerbuka.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
