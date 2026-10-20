// ==============================================================
// Validasi field
// Pesan error per field, validasiSemuaField
// ==============================================================

  // ---------- Batas usia minimal pendaftar ----------
  // Ubah angka di bawah ini bila aturan batas usia berubah.
  const UMUR_MINIMAL = 15;

  /** Usia penuh (tahun) pada tanggal acuan; null bila tanggal tidak valid. tglStr = 'YYYY-MM-DD'. */
  function hitungUmur(tglStr, acuan = new Date()) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tglStr || ''));
    if (!m) return null;
    const th = +m[1], bl = +m[2], tg = +m[3];
    const cek = new Date(th, bl - 1, tg);
    if (cek.getFullYear() !== th || cek.getMonth() !== bl - 1 || cek.getDate() !== tg) return null;
    let umur = acuan.getFullYear() - th;
    const belumUlangTahun = (acuan.getMonth() + 1 < bl) || (acuan.getMonth() + 1 === bl && acuan.getDate() < tg);
    if (belumUlangTahun) umur--;
    return umur;
  }

  /** Pesan error untuk tanggal lahir, atau '' bila usia memenuhi syarat. */
  function pesanUmurTidakValid(tglStr, acuan = new Date()) {
    const umur = hitungUmur(tglStr, acuan);
    if (umur === null) return 'Tanggal lahir tidak valid.';
    if (umur < 0) return 'Tanggal lahir tidak boleh melebihi hari ini.';
    if (umur < UMUR_MINIMAL) return `Usia pendaftar minimal ${UMUR_MINIMAL} tahun. Pastikan Tanggal Lahir sudah benar.`;
    return '';
  }

  /** Batasi kalender HP/browser: tanggal lahir terakhir yang boleh dipilih = tepat ${UMUR_MINIMAL} tahun lalu. */
  function aturBatasTanggalLahir() {
    const el = document.getElementById('tanggal_lahir');
    if (!el) return;
    const n = new Date();
    const batas = new Date(n.getFullYear() - UMUR_MINIMAL, n.getMonth(), n.getDate());
    // 29 Feb: bila tahun batas bukan kabisat, JS otomatis menggeser ke 1 Mar -> mundurkan 1 hari
    if (n.getMonth() === 1 && n.getDate() === 29 && batas.getMonth() !== 1) batas.setDate(0);
    const dua = v => String(v).padStart(2, '0');
    el.max = `${batas.getFullYear()}-${dua(batas.getMonth() + 1)}-${dua(batas.getDate())}`;
    el.min = '1900-01-01';
  }
  aturBatasTanggalLahir();

  function getOrBuatFieldError(fieldEl) {
    let err = fieldEl.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      err.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><span></span>`;
      fieldEl.appendChild(err);
    }
    return err;
  }

  function showFieldError(inputEl, pesan) {
    const fieldEl = inputEl.closest('.field') || inputEl.parentElement;
    if (!fieldEl) return;
    fieldEl.classList.add('has-error');
    const err = getOrBuatFieldError(fieldEl);
    err.querySelector('span').textContent = pesan;
    err.classList.add('show');
  }

  function clearFieldError(inputEl) {
    const fieldEl = inputEl.closest('.field') || inputEl.parentElement;
    if (!fieldEl) return;
    fieldEl.classList.remove('has-error');
    const err = fieldEl.querySelector('.field-error');
    if (err) err.classList.remove('show');
  }

  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select')) clearFieldError(e.target);
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('input, select')) clearFieldError(e.target);
  });

  // Cek usia langsung saat tanggal lahir diubah (tanpa menunggu tombol kirim).
  // Sengaja didaftarkan SETELAH listener clearFieldError di atas, supaya pesannya tidak terhapus.
  document.addEventListener('change', (e) => {
    if (!e.target || e.target.id !== 'tanggal_lahir' || !e.target.value) return;
    const pesan = pesanUmurTidakValid(e.target.value);
    if (pesan) showFieldError(e.target, pesan);
  });

  function validasiSemuaField(form) {
    const required = Array.from(form.querySelectorAll('input[required], select[required]'));
    let fieldPertamaError = null;
    let jumlahError = 0;

    required.forEach(inp => {
      if (!terlihat_(inp)) return;

      // Bersihkan spasi di depan/belakang secara otomatis untuk field
      // teks biasa, supaya isian yang kelihatan terisi tapi diawali/
      // diakhiri spasi (sering terjadi karena autocorrect di HP) tidak
      // salah terdeteksi sebagai kosong, dan tidak ikut terkirim ke server.
      if (inp.type !== 'checkbox' && inp.type !== 'file' && typeof inp.value === 'string') {
        const trimmed = inp.value.trim();
        if (trimmed !== inp.value) inp.value = trimmed;
      }

      let valid = true;
      if (inp.type === 'checkbox') valid = inp.checked;
      else if (inp.type === 'file') valid = !!(inp.files && inp.files.length);
      else valid = !!inp.value.trim();

      if ((inp.id === 'nik' || inp.id === 'p_nik') && valid && inp.value.trim().length !== 16) valid = false;
      if (inp.type === 'email' && valid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) valid = false;
      if (inp.id === 'tanggal_lahir' && valid && pesanUmurTidakValid(inp.value)) valid = false;   // batas usia minimal

      if (!valid) {
        jumlahError++;
        let pesan = 'Wajib diisi.';
        if (inp.type === 'file') pesan = 'Berkas wajib diunggah.';
        else if (inp.id === 'nik' || inp.id === 'p_nik') pesan = 'NIK harus tepat 16 digit angka.';
        else if (inp.id === 'tanggal_lahir' && inp.value.trim()) pesan = pesanUmurTidakValid(inp.value);
        else if (inp.type === 'email') pesan = 'Format email tidak valid.';
        else if (inp.type === 'checkbox') pesan = 'Persetujuan wajib dicentang.';
        showFieldError(inp, pesan);
        if (!fieldPertamaError) fieldPertamaError = inp;

        // Bantu diagnosis: catat di console field mana persisnya yang
        // gagal validasi, berguna kalau ada laporan error serupa lagi.
        console.warn('Validasi gagal pada field:', inp.id || inp.name || inp, '— nilai saat ini:', JSON.stringify(inp.value));
      } else {
        clearFieldError(inp);
      }
    });

    if (fieldPertamaError) {
      if (typeof wizBukaSeksiDari_ === 'function') wizBukaSeksiDari_(fieldPertamaError);
      const sec = fieldPertamaError.closest('.form-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => fieldPertamaError.focus({ preventScroll: true }), 350);
      toast('error', 'Formulir belum lengkap', `${jumlahError} bagian perlu diperiksa kembali sebelum dikirim.`);
      return false;
    }
    return true;
  }
