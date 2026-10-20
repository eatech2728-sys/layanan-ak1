// ==============================================================
// Kolom isian modern
// - Pilihan sedikit (jenis kelamin, status, agama) tampil sebagai chip
// - Tanggal lahir: tiga pilihan Tanggal / Bulan / Tahun (format Indonesia)
// - Pesan error ramah: muncul saat kolom ditinggalkan, bukan sebelum disentuh
// Kolom asli (select / input date) tetap ada & dipakai untuk nilai, validasi, draf.
// ==============================================================

  const NAMA_BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const KOLOM_CHIP = ['jenis_kelamin', 'status_hubungan', 'agama'];

  function kirimEvent_(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ---------- Chip ----------
  function buatChip_(sel) {
    if (!sel || sel.dataset.chipSiap) return;
    sel.dataset.chipSiap = '1';
    const grup = document.createElement('div');
    grup.className = 'chip-group';
    grup.setAttribute('role', 'radiogroup');
    const lb = sel.closest('.field') && sel.closest('.field').querySelector('label');
    if (lb) grup.setAttribute('aria-label', lb.textContent.replace('*', '').trim());
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.dataset.nilai = opt.value;
      b.textContent = opt.textContent;
      b.addEventListener('click', () => {
        sel.value = opt.value;
        sinkronChip_();
        kirimEvent_(sel);
      });
      grup.appendChild(b);
    });
    sel.classList.add('kolom-asli');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    sel.after(grup);
  }

  // ---------- Tanggal lahir 3 pilihan ----------
  let tglHari, tglBulan, tglTahun;

  function buatTanggalTiga_() {
    const asli = document.getElementById('tanggal_lahir');
    if (!asli || asli.dataset.tigaSiap) return;
    asli.dataset.tigaSiap = '1';
    const maks = asli.max ? parseInt(asli.max.slice(0, 4), 10) : new Date().getFullYear() - 15;
    const minTh = 1940;

    const kotak = document.createElement('div');
    kotak.className = 'tgl-tiga';
    kotak.setAttribute('role', 'group');
    kotak.setAttribute('aria-label', 'Tanggal lahir');
    const mk = (judul, aria) => {
      const s = document.createElement('select');
      s.setAttribute('aria-label', aria);
      s.innerHTML = `<option value="">${judul}</option>`;
      return s;
    };
    tglHari = mk('Tanggal', 'Tanggal lahir (hari)');
    tglBulan = mk('Bulan', 'Bulan lahir');
    tglTahun = mk('Tahun', 'Tahun lahir');
    for (let d = 1; d <= 31; d++) tglHari.add(new Option(d, d));
    NAMA_BULAN_ID.forEach((n, i) => tglBulan.add(new Option(n, i + 1)));
    for (let y = maks; y >= minTh; y--) tglTahun.add(new Option(y, y));
    [tglHari, tglBulan, tglTahun].forEach(s => { s.className = 'tgl-bagian'; s.addEventListener('change', gabungTanggal_); kotak.appendChild(s); });

    asli.classList.add('kolom-asli');
    asli.tabIndex = -1;
    asli.setAttribute('aria-hidden', 'true');
    asli.after(kotak);
  }

  function gabungTanggal_() {
    const asli = document.getElementById('tanggal_lahir');
    const d = parseInt(tglHari.value, 10), m = parseInt(tglBulan.value, 10), y = parseInt(tglTahun.value, 10);
    let nilai = '';
    if (d && m && y) {
      const maksHari = new Date(y, m, 0).getDate();
      const dd = Math.min(d, maksHari);
      if (dd !== d) tglHari.value = String(dd);
      nilai = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    if (asli.value !== nilai) {
      asli.value = nilai;
      // ditunda agar pesan usia tidak terhapus oleh event change dari pilihan ini yang masih menggelembung
      setTimeout(() => kirimEvent_(asli), 0);
    }
  }

  // ---------- Sinkron (setelah draf dipulihkan / form di-reset) ----------
  function sinkronChip_() {
    KOLOM_CHIP.forEach(id => {
      const sel = document.getElementById(id);
      const grup = sel && sel.nextElementSibling;
      if (!grup || !grup.classList.contains('chip-group')) return;
      grup.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', c.dataset.nilai === sel.value ? 'true' : 'false'));
    });
    const asli = document.getElementById('tanggal_lahir');
    if (asli && tglHari) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(asli.value || '');
      const h = m ? String(+m[3]) : '', b = m ? String(+m[2]) : '', t = m ? m[1] : '';
      if (tglHari.value !== h) tglHari.value = h;
      if (tglBulan.value !== b) tglBulan.value = b;
      if (tglTahun.value !== t) tglTahun.value = t;
    }
  }

  KOLOM_CHIP.forEach(id => buatChip_(document.getElementById(id)));
  buatTanggalTiga_();

  // updateProgress dipanggil setelah restore draf, reset form, dsb. — kaitkan sinkron ke sana.
  (function () {
    const asli = updateProgress;
    updateProgress = function () { asli.apply(this, arguments); sinkronChip_(); };
  })();
  sinkronChip_();

  // ---------- Pesan error ramah saat kolom ditinggalkan ----------
  // Hanya untuk kolom yang pernah diisi (salah format / dikosongkan lagi). Kolom yang
  // belum pernah disentuh baru diperiksa saat menekan "Lanjut" / "Periksa & Kirim".
  let kolomPernahIsi_ = new WeakSet();
  function aturPemeriksaanRamah_(form) {
    if (!form) return;
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.matches && el.matches('input, select') && el.value) kolomPernahIsi_.add(el);
    });
    form.addEventListener('reset', () => { kolomPernahIsi_ = new WeakSet(); form.querySelectorAll('.ok').forEach(x => x.classList.remove('ok')); });
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el.offsetParent === null) return;   // kolom ikut tersembunyi (ganti langkah/reset): jangan beri error
      if (!el.matches || !el.matches('input[required], select[required]') || el.type === 'file' || el.type === 'checkbox') return;
      if (!kolomPernahIsi_.has(el)) return;
      const pesan = pesanKolom_(el);
      if (pesan) showFieldError(el, pesan);
    });
    // Tanda centang hijau pada kolom teks yang sudah terisi benar
    form.addEventListener('input', (e) => { if (e.target.classList) e.target.classList.remove('ok'); });
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (!el.matches || !el.matches('input[type="text"][required], input[type="email"][required], input[type="tel"][required]')) return;
      if (el.offsetParent === null || el.classList.contains('kolom-asli') || !el.value.trim()) return;
      el.classList.toggle('ok', !pesanKolom_(el));
    });
  }
  aturPemeriksaanRamah_(document.getElementById('registrationForm'));
  aturPemeriksaanRamah_(document.getElementById('perpanjanganForm'));

  // Pemeriksaan usia langsung saat tanggal lahir lengkap dipilih sudah ada di validasi.js (event change).
