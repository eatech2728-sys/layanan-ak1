// ==============================================================
// Wizard — form Daftar Baru ditampilkan satu bagian per layar
// Tombol Lanjut/Kembali, validasi per langkah, navigasi tab.
// Tanpa JS ini, semua bagian tetap tampil seperti semula.
// ==============================================================

  const WIZ_LANGKAH = [
    { id: 'sec-reg',        nama: 'Registrasi' },
    { id: 'sec-diri',       nama: 'Data Diri' },
    { id: 'sec-pendidikan', nama: 'Pendidikan' },
    { id: 'sec-kontak',     nama: 'Kontak & Pas Foto' }
  ];
  const wizForm = document.getElementById('registrationForm');
  let wizIndeks = 0;
  let wizTertinggi = 0;
  const wizNav = [];

  function wizSiapkan_() {
    const akhir = WIZ_LANGKAH.length - 1;
    WIZ_LANGKAH.forEach((l, i) => {
      const sec = document.getElementById(l.id);
      if (sec) sec.dataset.wiz = i;
    });
    const faq = wizForm.querySelector('.faq-section');
    const kirim = wizForm.querySelector('.submit-wrap');
    if (faq) faq.dataset.wiz = akhir;
    if (kirim) kirim.dataset.wiz = akhir;

    WIZ_LANGKAH.forEach((l, i) => {
      const nav = document.createElement('div');
      nav.className = 'wiz-nav';
      nav.dataset.wiz = i;
      nav.innerHTML =
        '<button type="button" class="wiz-btn kembali"' + (i === 0 ? ' style="visibility:hidden" tabindex="-1" aria-hidden="true"' : '') + '>‹ Kembali</button>' +
        '<span class="wiz-info">Langkah ' + (i + 1) + ' dari ' + WIZ_LANGKAH.length + '</span>' +
        (i < akhir ? '<button type="button" class="wiz-btn lanjut">Lanjut ›</button>' : '<span class="wiz-spacer"></span>');
      const kembali = nav.querySelector('.kembali');
      const lanjut = nav.querySelector('.lanjut');
      if (kembali) kembali.addEventListener('click', () => wizKe(i - 1));
      if (lanjut) lanjut.addEventListener('click', wizLanjut);
      if (i < akhir) document.getElementById(l.id).after(nav);
      else if (kirim) kirim.before(nav);
      else wizForm.appendChild(nav);
      wizNav.push(nav);
    });
    wizForm.classList.add('wiz');
    wizKe(0, { gulir: false });
  }

  function wizKe(i, opsi) {
    opsi = opsi || {};
    if (i < 0 || i >= WIZ_LANGKAH.length) return;
    wizIndeks = i;
    wizTertinggi = Math.max(wizTertinggi, i);
    wizForm.querySelectorAll('[data-wiz]').forEach(el => {
      const tampil = Number(el.dataset.wiz) === i;
      el.classList.toggle('wiz-hidden', !tampil);
      if (tampil) {
        el.classList.remove('wiz-masuk');
        void el.offsetWidth;
        el.classList.add('wiz-masuk');
      }
    });
    document.querySelectorAll('.tab[data-target], .m-tab[data-target]').forEach(t => {
      const idx = WIZ_LANGKAH.findIndex(l => l.id === t.dataset.target);
      if (idx >= 0) t.classList.toggle('active', idx === i);
    });
    if (opsi.gulir !== false) {
      const sec = document.getElementById(WIZ_LANGKAH[i].id);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (typeof updateProgress === 'function') updateProgress();
  }

  function wizLanjut() {
    const sec = document.getElementById(WIZ_LANGKAH[wizIndeks].id);
    if (!sec || !validasiSemuaField(sec)) return;
    if (WIZ_LANGKAH[wizIndeks].id === 'sec-diri' && typeof nikSedangTerdaftar !== 'undefined' && nikSedangTerdaftar) {
      openDupModal(
        `NIK ini terdeteksi sudah terdaftar tahun ini atas nama "${nikSedangTerdaftar.nama}". Data tidak dapat dikirim ulang untuk mencegah duplikasi.`,
        nikSedangTerdaftar.noReg
      );
      return;
    }
    wizKe(wizIndeks + 1);
  }

  // Dipanggil dari klik tab; true = sudah ditangani wizard.
  function wizGoto(targetId) {
    const idx = WIZ_LANGKAH.findIndex(l => l.id === targetId);
    if (idx < 0) return false;
    if (idx <= wizTertinggi) wizKe(idx);
    else toast('info', 'Selesaikan langkah sebelumnya dulu', 'Tekan "Lanjut" setelah kolom di langkah ini terisi.', 3500);
    return true;
  }

  // Dipakai validasi: buka langkah yang memuat kolom bermasalah.
  function wizBukaSeksiDari_(el) {
    const bag = el && el.closest('[data-wiz]');
    if (!bag) return;
    const idx = Number(bag.dataset.wiz);
    if (idx !== wizIndeks) wizKe(idx, { gulir: false });
  }

  function wizReset() {
    wizTertinggi = 0;
    wizKe(0);
  }

  wizSiapkan_();
