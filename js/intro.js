// ==============================================================
// Animasi & audio pembuka "Layanan AK1"
// Lama animasi: ubah DURASI_MS. Dilewati otomatis bila ?cekStatus= ada di URL.
// ==============================================================

(function () {
  var DURASI_MS = 7600;                    // total lama animasi pembuka
  var intro = document.getElementById('introAk1');
  if (!intro) return;

  // Lewati animasi bila halaman dibuka lewat QR "Cek Status" (perusahaan hanya ingin mengecek).
  try {
    if (new URLSearchParams(location.search).get('cekStatus')) { intro.remove(); return; }
  } catch (e) {}

  // ---------- Teks judul: pecah per huruf agar muncul bergantian ----------
  var title = document.getElementById('iaTitle');
  var delay = 2.0;
  'Layanan AK1'.split(' ').forEach(function (kata) {
    var w = document.createElement('span'); w.className = 'ia-word'; w.setAttribute('aria-hidden', 'true');
    kata.split('').forEach(function (h) {
      var s = document.createElement('span'); s.className = 'ia-letter'; s.textContent = h;
      s.style.animationDelay = (delay += 0.09).toFixed(2) + 's';
      w.appendChild(s);
    });
    title.appendChild(w);
  });

  // ---------- Partikel gelembung ----------
  for (var i = 0; i < 22; i++) {
    var d = document.createElement('span'); d.className = 'ia-dot';
    var size = 4 + Math.random() * 8;
    d.style.cssText = 'left:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' + size + 'px;' +
      'animation-duration:' + (5 + Math.random() * 6) + 's;animation-delay:' + (Math.random() * 5) + 's;';
    intro.insertBefore(d, intro.firstChild);
  }

  // ---------- Audio pembuka (disintesis langsung, tanpa file mp3) ----------
  // Nuansa: hangat, optimis, "naik" — arpeggio lonceng + pad akor C → G → Am → F → C
  // sebagai simbol langkah awal menuju karier baru.
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, audioStarted = false, muted = false;
  try { muted = localStorage.getItem('ak1_suara') === 'off'; } catch (e) {}   // samakan dengan tombol suara utama
  var hint = document.getElementById('iaHint');

  function initAudio() {
    if (ctx || !AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain(); master.gain.value = 0.9;
    // gema lembut
    var delayNode = ctx.createDelay(1); delayNode.delayTime.value = 0.28;
    var fb = ctx.createGain(); fb.gain.value = 0.32;
    var wet = ctx.createGain(); wet.gain.value = 0.35;
    master.connect(ctx.destination);
    master.connect(delayNode); delayNode.connect(fb); fb.connect(delayNode); delayNode.connect(wet); wet.connect(ctx.destination);
  }

  function tone(freq, t, dur, type, vol, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function bell(freq, t, dur, vol) {          // nada lonceng: dasar + overtone
    tone(freq, t, dur, 'sine', vol);
    tone(freq * 2, t, dur * 0.6, 'sine', vol * 0.35);
    tone(freq * 3.01, t, dur * 0.35, 'sine', vol * 0.12);
  }
  function pad(freqs, t, dur, vol) {          // akor lembut
    freqs.forEach(function (f) {
      tone(f, t, dur, 'triangle', vol, 0.6);
      tone(f * 1.003, t, dur, 'sine', vol * 0.8, 0.6);
    });
  }

  function mainkanMusik() {
    if (audioStarted || !ctx) return;
    audioStarted = true;
    var t0 = ctx.currentTime + 0.08;
    var N = { C3:130.81, G3:196, A3:220, F3:174.61, C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392, A4:440, B4:493.88,
              C5:523.25, D5:587.33, E5:659.25, G5:783.99, C6:1046.5 };

    // pad akor
    pad([N.C3, N.E4 / 2 * 1, N.G3], t0,       2.0, 0.07);   // C
    pad([N.G3, N.B4 / 2, N.D4],     t0 + 1.9, 2.0, 0.07);   // G
    pad([N.A3, N.C4, N.E4],         t0 + 3.8, 2.0, 0.07);   // Am
    pad([N.F3, N.A3, N.C4],         t0 + 5.0, 1.8, 0.07);   // F
    pad([N.C3, N.G3, N.E4, N.C4],   t0 + 6.2, 2.6, 0.09);   // C akhir

    // melodi lonceng naik = "langkah menuju karier"
    var melodi = [
      [N.C5, 0.2], [N.E5, 0.55], [N.G5, 0.9], [N.C6, 1.35],
      [N.G5, 2.1], [N.E5, 2.45], [N.G5, 2.8], [N.D5, 3.15],
      [N.E5, 3.9], [N.G5, 4.25], [N.C6, 4.6],
      [N.A4, 5.2], [N.C5, 5.5], [N.E5, 5.8]
    ];
    melodi.forEach(function (m) { bell(m[0], t0 + m[1], 1.4, 0.16); });

    // tangga nada naik pendek menjelang judul, lalu "ting!" kemenangan di akhir
    [N.C4, N.D4, N.E4, N.G4, N.C5].forEach(function (f, i) { bell(f, t0 + 1.7 + i * 0.07, 0.9, 0.06); });
    bell(N.C5, t0 + 6.3, 2.4, 0.2); bell(N.E5, t0 + 6.35, 2.4, 0.16);
    bell(N.G5, t0 + 6.4, 2.4, 0.16); bell(N.C6, t0 + 6.45, 2.6, 0.18);

    if (hint) hint.classList.remove('show');
  }

  function cobaNyalakanAudio() {
    initAudio();
    if (!ctx) return;
    var p = ctx.resume ? ctx.resume() : null;
    var cek = function () {
      if (ctx.state === 'running') mainkanMusik();
      else if (hint && !audioStarted) hint.classList.add('show');
    };
    if (p && p.then) p.then(cek).catch(cek); else cek();
  }

  // Autoplay sering diblokir browser sampai pengguna menyentuh layar,
  // jadi: coba otomatis, dan kalau gagal, nyalakan saat sentuhan pertama.
  if (!muted) cobaNyalakanAudio();
  setTimeout(function () { if (!audioStarted && !muted && hint) hint.classList.add('show'); }, 400);
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function onFirst() {
      if (!audioStarted && !muted) cobaNyalakanAudio();
      if (audioStarted) window.removeEventListener(ev, onFirst);
    }, { passive: true });
  });

  // ---------- Tombol suara ----------
  var muteBtn = document.getElementById('iaMute');
  if (muted) {                                  // tampilan awal bila suara sudah dimatikan sebelumnya
    document.getElementById('iaMuteText').textContent = 'Senyap';
    muteBtn.setAttribute('aria-label', 'Nyalakan suara');
    document.getElementById('iaMuteIcon').style.opacity = '.5';
  }
  muteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    muted = !muted;
    try { localStorage.setItem('ak1_suara', muted ? 'off' : 'on'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.9;
    document.getElementById('iaMuteText').textContent = muted ? 'Senyap' : 'Suara';
    muteBtn.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
    document.getElementById('iaMuteIcon').style.opacity = muted ? '.5' : '1';
    if (!muted && !audioStarted) cobaNyalakanAudio();
    if (muted && hint) hint.classList.remove('show');
  });

  // ---------- Progres & penutupan ----------
  var progress = document.getElementById('iaProgress');
  var mulai = performance.now(), selesai = false;
  document.documentElement.style.overflow = 'hidden';

  function tick(now) {
    if (selesai) return;
    var p = Math.min((now - mulai) / DURASI_MS, 1);
    progress.style.width = (p * 100) + '%';
    if (p < 1) requestAnimationFrame(tick); else tutupIntro();
  }
  requestAnimationFrame(tick);

  function tutupIntro() {
    if (selesai) return;
    selesai = true;
    if (master && ctx) {                      // fade-out suara agar tidak terpotong kasar
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 900);
    }
    intro.classList.add('leaving');
    setTimeout(function () {
      intro.remove();
      document.documentElement.style.overflow = '';
      if (typeof updateScrollLock === 'function') updateScrollLock();   // hormati popup menu/survei yang aktif
    }, 950);
  }

  document.getElementById('iaSkip').addEventListener('click', function (e) { e.stopPropagation(); tutupIntro(); });
})();
