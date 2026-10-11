// ==============================================================
// Validasi field
// Pesan error per field, validasiSemuaField
// ==============================================================

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

  function validasiSemuaField(form) {
    const required = Array.from(form.querySelectorAll('input[required], select[required]'));
    let fieldPertamaError = null;
    let jumlahError = 0;

    required.forEach(inp => {
      if (inp.offsetParent === null) return;

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

      if (!valid) {
        jumlahError++;
        let pesan = 'Wajib diisi.';
        if (inp.type === 'file') pesan = 'Berkas wajib diunggah.';
        else if (inp.id === 'nik' || inp.id === 'p_nik') pesan = 'NIK harus tepat 16 digit angka.';
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
      const sec = fieldPertamaError.closest('.form-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => fieldPertamaError.focus({ preventScroll: true }), 350);
      toast('error', 'Formulir belum lengkap', `${jumlahError} bagian perlu diperiksa kembali sebelum dikirim.`);
      return false;
    }
    return true;
  }
