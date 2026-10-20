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
    inputEl.classList.remove('ok');
    fieldEl.classList.remove('goyang'); void fieldEl.offsetWidth; fieldEl.classList.add('goyang');   // getar singkat
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

  /** Nama kolom untuk pesan error, diambil dari label (tanpa tanda * dan keterangan dalam kurung). */
  function namaKolom_(inp) {
    const f = inp.closest('.field');
    const lb = f && f.querySelector('label');
    if (!lb) return '';
    return lb.textContent.replace(/\*/g, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  }

  /** Pesan error ramah untuk satu kolom; '' bila kolom valid. */
  function pesanKolom_(inp) {
    const kosong = inp.type === 'checkbox' ? !inp.checked
                 : inp.type === 'file' ? !(inp.files && inp.files.length)
                 : !inp.value.trim();
    if (kosong) {
      if (inp.type === 'file') return 'Berkas belum diunggah. Ketuk kartu di atas untuk memilih foto/file.';
      if (inp.type === 'checkbox') return 'Persetujuan perlu dicentang.';
      if (inp.id === 'tanggal_lahir') return 'Pilih tanggal, bulan, dan tahun lahir.';
      if (inp.tagName === 'SELECT') return 'Silakan pilih salah satu.';
      const nm = namaKolom_(inp);
      return nm ? `Mohon isi ${nm}.` : 'Kolom ini belum diisi.';
    }
    if ((inp.id === 'nik' || inp.id === 'p_nik') && inp.value.trim().length !== 16) return 'NIK harus tepat 16 digit angka.';
    if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) return 'Format email belum benar, contoh: nama@email.com.';
    if (inp.id === 'tanggal_lahir') return pesanUmurTidakValid(inp.value);
    return '';
  }

  function validasiSemuaField(form, opsi) {
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

      const pesan = pesanKolom_(inp);
      if (pesan) {
        jumlahError++;
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
      const tujuan = fieldPertamaError.closest('.field') || fieldPertamaError;
      tujuan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { try { fieldPertamaError.focus({ preventScroll: true }); } catch (e) {} }, 350);
      if (opsi && opsi.langkah) toast('error', 'Langkah ini belum lengkap', `${jumlahError} isian perlu dilengkapi sebelum lanjut.`);
      else toast('error', 'Formulir belum lengkap', `${jumlahError} isian perlu dilengkapi atau diperbaiki sebelum dikirim.`);
      return false;
    }
    return true;
  }
