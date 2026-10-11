// ==============================================================
// Interaksi unggah berkas
// Drag & drop, ekstra file-drop, pratinjau berkas
// ==============================================================

  function setupFileDropExtras() {
    document.querySelectorAll('.file-drop').forEach(drop => {
      const input = drop.querySelector('input[type=file]');
      const inner = drop.querySelector('.file-drop-inner');
      if (!input || !inner || drop.dataset.extrasReady) return;
      drop.dataset.extrasReady = '1';

      const thumbImg = document.createElement('img');
      thumbImg.className = 'file-thumb';
      thumbImg.alt = '';
      const thumbPdf = document.createElement('div');
      thumbPdf.className = 'file-thumb-pdf';
      thumbPdf.textContent = 'PDF';
      inner.insertBefore(thumbPdf, inner.firstChild);
      inner.insertBefore(thumbImg, inner.firstChild);

      const nameEl = inner.querySelector('.file-name');
      if (nameEl) nameEl.parentElement.classList.add('file-drop-textwrap');

      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'btn-lihat-file';
      viewBtn.textContent = 'Lihat';
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFilePreview(input, nameEl ? nameEl.textContent : 'Berkas');
      });
      drop.appendChild(viewBtn);

      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        if (!f) { drop.classList.remove('is-pdf'); thumbImg.removeAttribute('src'); return; }
        if (f.type.startsWith('image/')) {
          drop.classList.remove('is-pdf');
          thumbImg.src = URL.createObjectURL(f);
        } else {
          drop.classList.add('is-pdf');
          thumbImg.removeAttribute('src');
        }
      });
    });
  }

  /**
   * setupFileDragAndDrop — memberi kemampuan drag & drop file yang sesungguhnya
   * pada semua kotak .file-drop, supaya sesuai dengan tampilannya (border putus-putus).
   */
  function setupFileDragAndDrop() {
    document.querySelectorAll('.file-drop').forEach(drop => {
      if (drop.dataset.dragReady) return;
      drop.dataset.dragReady = '1';
      const input = drop.querySelector('input[type=file]');
      if (!input) return;

      ['dragenter', 'dragover'].forEach(evt => {
        drop.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.add('dragover');
        });
      });
      ['dragleave', 'dragend'].forEach(evt => {
        drop.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.remove('dragover');
        });
      });
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const dt = new DataTransfer();
          dt.items.add(e.dataTransfer.files[0]);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  function openFilePreview(input, judul) {
    const f = input.files && input.files[0];
    if (!f) return;
    document.getElementById('filePreviewTitle').textContent = judul || 'Pratinjau Berkas';
    const body = document.getElementById('filePreviewBody');
    if (f.type.startsWith('image/')) {
      body.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Pratinjau berkas">`;
    } else {
      body.innerHTML = `<div class="pdf-note">📄 <strong>${f.name}</strong><br>Berkas PDF tidak dapat ditampilkan langsung di sini, namun sudah terlampir dan siap dikirim.</div>`;
    }
    document.getElementById('filePreviewModal').classList.add('show');
  }
  function closeFilePreview() {
    document.getElementById('filePreviewModal').classList.remove('show');
  }
