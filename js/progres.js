// ==============================================================
// Progres & navigasi seksi
// Progress pengisian, klik tab, penanda seksi aktif, tutup notifikasi
// ==============================================================

  const sections = ['reg', 'diri', 'pendidikan', 'kontak'];
  function sectionComplete(name) {
    const el = document.querySelector(`[data-section="${name}"]`);
    const required = el.querySelectorAll('input[required], select[required]');
    for (const inp of required) {
      if (inp.offsetParent === null) continue;
      if (inp.type === 'checkbox' && !inp.checked) return false;
      if (inp.type === 'file' && (!inp.files || inp.files.length === 0)) return false;
      if (inp.type !== 'checkbox' && inp.type !== 'file' && !inp.value.trim()) return false;
    }
    return true;
  }

  function updateProgress() {
    let doneCount = 0;
    sections.forEach(name => {
      const complete = sectionComplete(name);
      if (complete) doneCount++;
      document.querySelectorAll(`.tab[data-target="sec-${name}"], .m-tab[data-target="sec-${name}"]`).forEach(t => {
        t.classList.toggle('done', complete);
      });
    });
    const pct = Math.round((doneCount / sections.length) * 100);
    const fill = document.getElementById('progressFill');
    const pctText = document.getElementById('progressPct');
    if (fill) fill.style.width = pct + '%';
    if (pctText) pctText.textContent = `${pct}% lengkap · ${doneCount} dari ${sections.length} bagian`;
  }

  const sectionsPerpanjangan = ['data', 'berkas', 'kontak'];
  function sectionCompletePerpanjangan(name) {
    const el = document.querySelector(`[data-section-p="${name}"]`);
    if (!el) return false;
    const required = el.querySelectorAll('input[required], select[required]');
    for (const inp of required) {
      if (inp.offsetParent === null) continue;
      if (inp.type === 'checkbox' && !inp.checked) return false;
      if (inp.type === 'file' && (!inp.files || inp.files.length === 0)) return false;
      if (inp.type !== 'checkbox' && inp.type !== 'file' && !inp.value.trim()) return false;
    }
    return true;
  }

  function updateProgressPerpanjangan() {
    let doneCount = 0;
    sectionsPerpanjangan.forEach(name => {
      const complete = sectionCompletePerpanjangan(name);
      if (complete) doneCount++;
      document.querySelectorAll(`.tab[data-target="sec-p-${name}"]`).forEach(t => {
        t.classList.toggle('done', complete);
      });
    });
    const pct = Math.round((doneCount / sectionsPerpanjangan.length) * 100);
    const fill = document.getElementById('progressFillPerpanjangan');
    const pctText = document.getElementById('progressPctPerpanjangan');
    if (fill) fill.style.width = pct + '%';
    if (pctText) pctText.textContent = `${pct}% lengkap · ${doneCount} dari ${sectionsPerpanjangan.length} bagian`;
  }

  document.getElementById('registrationForm').addEventListener('input', updateProgress);
  document.getElementById('registrationForm').addEventListener('change', updateProgress);
  document.getElementById('perpanjanganForm').addEventListener('input', updateProgressPerpanjangan);
  document.getElementById('perpanjanganForm').addEventListener('change', updateProgressPerpanjangan);

  document.querySelectorAll('.tab, .m-tab').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(el.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      document.querySelectorAll(`.tab[data-target="${id}"]`).forEach(t => {
        t.classList.toggle('active', entry.isIntersecting);
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px' });
  document.querySelectorAll('.form-section').forEach(sec => observer.observe(sec));

  function tutupNotifikasi() {
    document.getElementById('permanentNotification').classList.remove('show');
  }
