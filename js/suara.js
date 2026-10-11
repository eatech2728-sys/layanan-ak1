// ==============================================================
// Audio notifikasi (efek suara)
// Nada untuk: upload berhasil, salah isi/pilih, gagal, data tersimpan,
// survei selesai, registrasi sukses, NIK aman/duplikat, dll.
// Semua nada dibuat langsung oleh browser (tanpa file mp3).
//
// Cara kerja: file ini TIDAK mengubah kode lain. Ia "membungkus"
// fungsi yang sudah ada (toast, showFieldError, dst.) dan memantau
// perubahan tampilan, lalu membunyikan nada yang sesuai.
// Mau ubah/mematikan satu nada? Cari namanya di objek NADA di bawah
// atau di tabel PEMETAAN. Tombol speaker di pojok kanan atas menyalakan/
// mematikan semua suara (pilihan tersimpan di perangkat).
// ==============================================================
(function () {
  'use strict';

  var KUNCI = 'ak1_suara';              // 'off' = senyap (juga dipakai animasi pembuka)
  var VOLUME = 1.0;
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null, out = null, terbuka = false, log = [];
  var terakhir = {};                    // nama -> waktu terakhir bunyi (anti dobel)
  var waktuBunyiTerakhir = 0;

  function baca() { try { return localStorage.getItem(KUNCI); } catch (e) { return null; } }
  function tulis(v) { try { localStorage.setItem(KUNCI, v); } catch (e) { /* abaikan */ } }
  function aktif() { return baca() !== 'off'; }

  // ---------- mesin nada ----------
  function siapkan() {
    if (ctx || !AudioCtx) return;
    ctx = new AudioCtx();
    out = ctx.createGain(); out.gain.value = VOLUME;
    var gema = ctx.createDelay(1); gema.delayTime.value = 0.18;
    var fb = ctx.createGain(); fb.gain.value = 0.22;
    var wet = ctx.createGain(); wet.gain.value = 0.22;
    out.connect(ctx.destination);
    out.connect(gema); gema.connect(fb); fb.connect(gema); gema.connect(wet); wet.connect(ctx.destination);
  }
  function tone(f, t, dur, tipe, vol, atk, f2) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipe || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (atk || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function lonceng(f, t, dur, vol) {
    tone(f, t, dur, 'sine', vol);
    tone(f * 2, t, dur * 0.55, 'sine', vol * 0.3);
    tone(f * 3.01, t, dur * 0.3, 'sine', vol * 0.1);
  }
  function pad(fs, t, dur, vol) {
    fs.forEach(function (f) { tone(f, t, dur, 'triangle', vol, 0.25); });
  }

  var N = { G3: 196, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
            C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5 };

  // Setiap nada: fungsi(t) yang menjadwalkan bunyi mulai waktu t.
  var NADA = {
    klik:       function (t) { tone(1400, t, 0.045, 'sine', 0.10, 0.002); },
    buka:       function (t) { tone(N.E5, t, 0.12, 'sine', 0.10, 0.01); tone(N.A5, t + 0.07, 0.16, 'sine', 0.09, 0.01); },
    info:       function (t) { lonceng(N.D5, t, 0.5, 0.14); },
    ok:         function (t) { lonceng(N.G5, t, 0.55, 0.15); },
    berhasil:   function (t) { lonceng(N.C5, t, 0.5, 0.16); lonceng(N.G5, t + 0.11, 0.7, 0.16); },
    upload:     function (t) { lonceng(N.E5, t, 0.4, 0.15); lonceng(N.A5, t + 0.09, 0.45, 0.15); lonceng(N.E6, t + 0.18, 0.7, 0.10); },
    seksi:      function (t) { lonceng(N.C5, t, 0.4, 0.12); lonceng(N.E5, t + 0.08, 0.4, 0.12); lonceng(N.G5, t + 0.16, 0.7, 0.13); },
    salah:      function (t) { tone(N.E4, t, 0.13, 'triangle', 0.22, 0.01, N.D4); tone(N.C4, t + 0.15, 0.2, 'triangle', 0.22, 0.01, 233); },
    peringatan: function (t) { for (var i = 0; i < 3; i++) tone(N.A4, t + i * 0.13, 0.09, 'triangle', 0.2, 0.008); },
    gagal:      function (t) { tone(N.A4, t, 0.2, 'triangle', 0.22, 0.01, N.F4); tone(N.F4, t + 0.2, 0.2, 'triangle', 0.22, 0.01, N.D4); tone(N.D4, t + 0.4, 0.4, 'triangle', 0.22, 0.01, 196); },
    offline:    function (t) { tone(N.G4, t, 0.16, 'sine', 0.2, 0.01); tone(N.D4, t + 0.17, 0.3, 'sine', 0.2, 0.01); },
    tutup:      function (t) { tone(N.G3, t, 0.5, 'sine', 0.3, 0.02, 160); lonceng(N.D4, t + 0.02, 0.5, 0.08); },
    tersimpan:  function (t) { [N.C5, N.E5, N.G5].forEach(function (f, i) { lonceng(f, t + i * 0.09, 0.55, 0.16); }); lonceng(N.C6, t + 0.3, 0.9, 0.14); },
    survei:     function (t) { [N.G4, N.C5, N.E5, N.G5].forEach(function (f, i) { lonceng(f, t + i * 0.13, 0.8, 0.14); }); pad([N.C4, N.G4], t + 0.1, 0.9, 0.04); },
    registrasi: function (t) {
      pad([N.C4, N.E4, N.G4], t, 1.9, 0.07);
      [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { lonceng(f, t + i * 0.12, 1.1, 0.18); });
      lonceng(N.C6, t + 0.62, 1.4, 0.2); lonceng(N.E6, t + 0.66, 1.4, 0.14); lonceng(N.G5, t + 0.64, 1.4, 0.16);
    }
  };
  // nada "penting" tidak pernah dilewati; nada ringan dilewati bila ada bunyi lain barusan
  var RINGAN = { klik: 1, buka: 1, info: 1, ok: 1, seksi: 1 };

  function play(nama, opsi) {
    opsi = opsi || {};
    if (!NADA[nama]) return;
    if (!opsi.paksa) {
      if (!aktif() || !terbuka) return;
      if (document.getElementById('introAk1')) return;           // animasi pembuka punya musik sendiri
    }
    var skrg = Date.now();
    if (!opsi.paksa) {
      if (terakhir[nama] && skrg - terakhir[nama] < 700) return;  // jangan dobel
      if (RINGAN[nama] && skrg - waktuBunyiTerakhir < 700) return;
    }
    siapkan();
    if (!ctx) return;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    terakhir[nama] = skrg; waktuBunyiTerakhir = skrg;
    log.push(nama);
    try { NADA[nama](ctx.currentTime + 0.02 + (opsi.tunda || 0)); } catch (e) { console.warn('Suara gagal:', e); }
  }

  // Browser hanya mengizinkan suara setelah pengguna menyentuh layar.
  function bukaKunci() {
    if (terbuka) return;
    siapkan();
    if (ctx && ctx.resume) { ctx.resume(); }
    terbuka = true;
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
    window.addEventListener(ev, bukaKunci, { passive: true, capture: true });
  });

  // ---------- 1) Bungkus fungsi yang sudah ada ----------
  function bungkus(nama, fn) {
    var asli = window[nama];
    if (typeof asli !== 'function') return;
    window[nama] = function () {
      try { fn.apply(null, arguments); } catch (e) { /* suara tidak boleh mengganggu fungsi utama */ }
      return asli.apply(this, arguments);
    };
  }

  // PEMETAAN toast -> nada (berdasarkan judul, lalu jenis)
  bungkus('toast', function (jenis, judul) {
    judul = String(judul || '');
    if (Date.now() - (terakhir.registrasi || 0) < 500) return;   // fanfare registrasi sudah bunyi, jangan ditimpa nada toast
    if (/^Terima kasih/i.test(judul))              return play('survei');
    if (/belum lengkap|^Isi dulu/i.test(judul))    return play('salah');
    if (/sudah terdaftar/i.test(judul))            return play('peringatan');
    if (/ditutup/i.test(judul))                    return play('tutup');
    if (/Koneksi terputus/i.test(judul))           return play('offline');
    if (jenis === 'error')                         return play('gagal');
    if (jenis === 'success')                       return play('berhasil');
    return play('info');
  });
  bungkus('showFieldError', function () { play('salah'); });          // salah isi / salah pilih
  bungkus('openDupModal', function () { play('peringatan'); });       // NIK sudah terdaftar
  bungkus('mulaiAlurSetelahSukses', function () { play('tersimpan'); });   // data berhasil tersimpan di server
  bungkus('tampilkanNotifikasiSuksesFinal', function () {                   // registrasi benar-benar selesai
    play('registrasi', { tunda: Date.now() - (terakhir.survei || 0) < 1500 ? 0.9 : 0 });
  });
  bungkus('pilihModeBaru', function () { play('klik'); });
  bungkus('pilihModePerpanjangan', function () { play('klik'); });

  // alert() dipakai untuk file terlalu besar / gagal kompres -> nada gagal
  var alertAsli = window.alert;
  window.alert = function () { try { play('gagal'); } catch (e) {} return alertAsli.apply(window, arguments); };

  // ---------- 2) Pantau perubahan tampilan ----------
  function pantauKelas(selector, cb) {
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target, lama = m.oldValue || '';
        cb(el, lama.split(/\s+/), (el.className && el.className.baseVal === undefined ? el.className : '').split(/\s+/));
      });
    });
    document.querySelectorAll(selector).forEach(function (el) {
      mo.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    });
  }
  var baru = function (lama, kini, k) { return kini.indexOf(k) > -1 && lama.indexOf(k) < 0; };

  pantauKelas('.file-drop', function (el, lama, kini) {                 // berkas berhasil diunggah
    if (baru(lama, kini, 'filled')) play('upload');
  });
  pantauKelas('.tab', function (el, lama, kini) {                       // satu seksi formulir lengkap
    if (baru(lama, kini, 'done')) play('seksi');
  });
  pantauKelas('.nik-status', function (el, lama, kini) {               // hasil cek NIK
    if (baru(lama, kini, 'ok')) play('ok');
    if (baru(lama, kini, 'warn')) play('peringatan');
  });
  pantauKelas('#dayGate', function (el, lama, kini) {                   // gerbang jam layanan muncul
    if (baru(lama, kini, 'show')) play('tutup');
  });
  pantauKelas('.modal-overlay, .entry-overlay', function (el, lama, kini) {   // modal / popup terbuka
    if (baru(lama, kini, 'show')) play('buka');
  });

  // ---------- 3) Klik tombol utama ----------
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.entry-btn, .entry-pill, .stamp-btn, .mode-switch-btn, .btn-confirm-review, .fab-menu, .fab-survei')) play('klik');
  }, true);

  // ---------- 4) Tombol nyala/mati suara ----------
  var tombol = document.createElement('button');
  tombol.type = 'button'; tombol.id = 'suaraToggle'; tombol.className = 'suara-toggle';
  function gambar() {
    var on = aktif();
    tombol.setAttribute('aria-label', on ? 'Matikan efek suara' : 'Nyalakan efek suara');
    tombol.title = on ? 'Efek suara: nyala (klik untuk mematikan)' : 'Efek suara: mati (klik untuk menyalakan)';
    tombol.innerHTML = on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
  }
  tombol.addEventListener('click', function () {
    tulis(aktif() ? 'off' : 'on'); gambar();
    if (aktif()) { bukaKunci(); play('ok', { paksa: true }); }
  });
  gambar();
  document.body.appendChild(tombol);
  if (document.getElementById('introAk1')) {                // sembunyikan selama animasi pembuka
    tombol.classList.add('tersembunyi');
    var cek = setInterval(function () {
      if (!document.getElementById('introAk1')) { tombol.classList.remove('tersembunyi'); clearInterval(cek); }
    }, 400);
  }

  // ---------- 5) Alat uji / pratinjau ----------
  window.AK1Suara = {
    nada: Object.keys(NADA),
    play: function (n) { bukaKunci(); play(n, { paksa: true }); },
    aktif: aktif,
    _log: log,
    _bukaKunci: bukaKunci,
    // render nada ke buffer (tanpa speaker) untuk mengukur level suaranya
    _render: function (nama) {
      var Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      var oc = new Off(1, 44100 * 3, 44100);
      var sc = ctx, so = out;
      ctx = oc; out = oc.createGain(); out.gain.value = VOLUME; out.connect(oc.destination);
      try { NADA[nama](0.02); } finally { ctx = sc; out = so; }
      return oc.startRendering().then(function (buf) {
        var d = buf.getChannelData(0), pk = 0, akhir = 0;
        for (var i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > pk) pk = a; if (a > 0.005) akhir = i; }
        return { puncak: +pk.toFixed(3), durasi: +(akhir / 44100).toFixed(2) };
      });
    }
  };
})();
