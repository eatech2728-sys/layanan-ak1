// ==============================================================
// Foto & kompres berkas
// Kompres gambar, handleFile, pilih foto kamera/galeri, isi pilihan tahun
// ==============================================================

  const MAX_SIZE = 3 * 1024 * 1024;
  const TARGET_SIZE = 1.5 * 1024 * 1024;
  const MAX_DIMENSION = 1920;

  const compressedFileStore = {};

  function compressImage(file, targetBytes = TARGET_SIZE, maxDim = MAX_DIMENSION) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(imgUrl);

        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const cobaKompres = (quality, dim) => {
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Gagal mengompres gambar')); return; }

            if (blob.size <= targetBytes || (quality <= 0.35 && dim <= 700)) {
              const reader = new FileReader();
              reader.onload = () => resolve({
                blob,
                base64: reader.result.split(',')[1],
                type: 'image/jpeg'
              });
              reader.onerror = reject;
              reader.readAsDataURL(blob);
              return;
            }

            if (quality > 0.35) {
              cobaKompres(quality - 0.12, dim);
            } else {
              const dimBaru = Math.round(dim * 0.85);
              canvas.width = Math.round(width * (dimBaru / (width > height ? width : height)));
              canvas.height = Math.round(height * (dimBaru / (width > height ? width : height)));
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              cobaKompres(0.7, dimBaru);
            }
          }, 'image/jpeg', quality);
        };

        cobaKompres(0.85, Math.max(width, height));
      };
      img.onerror = () => { URL.revokeObjectURL(imgUrl); reject(new Error('Gagal memuat gambar')); };
      img.src = imgUrl;
    });
  }

  function formatUkuran(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function isiPilihanTahunPada(selects) {
    const tahunSekarang = new Date().getFullYear();
    const tahunTertua = 1960;
    selects.forEach(sel => {
      for (let y = tahunSekarang; y >= tahunTertua; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        sel.appendChild(opt);
      }
    });
  }
  function isiPilihanTahun() {
    isiPilihanTahunPada(document.querySelectorAll('select.year-select'));
  }
  isiPilihanTahun();

  function getOrBuatCatatanKompresi(drop) {
    let note = drop.querySelector('.file-compress-note');
    if (!note) {
      note = document.createElement('span');
      note.className = 'file-compress-note';
      (drop.querySelector('.file-teks') || drop.querySelector('.file-drop-inner')).appendChild(note);
    }
    return note;
  }

  async function handleFile(input, dropId) {
    const drop = document.getElementById(dropId);
    const nameEl = drop.querySelector('.file-name');
    const note = getOrBuatCatatanKompresi(drop);

    delete compressedFileStore[input.id];
    note.textContent = '';

    if (!(input.files && input.files[0])) {
      drop.classList.remove('filled', 'compressing');
      nameEl.textContent = nameEl.dataset.default;
      updateProgress();
      updateProgressPerpanjangan();
      return;
    }

    const f = input.files[0];
    const isGambar = f.type.startsWith('image/');

    if (!isGambar) {
      if (f.size > MAX_SIZE) {
        alert(`Maaf, ukuran file "${f.name}" terlalu besar (${formatUkuran(f.size)}). Untuk file PDF, maksimal ukuran adalah 3MB. Silakan pindai ulang dengan resolusi lebih rendah, atau upload dalam bentuk foto (JPG/PNG) agar bisa dikompres otomatis oleh sistem.`);
        input.value = "";
        drop.classList.remove('filled');
        nameEl.textContent = nameEl.dataset.default;
        updateProgress();
        updateProgressPerpanjangan();
        return;
      }
      drop.classList.add('filled');
      nameEl.textContent = f.name;
      updateProgress();
      updateProgressPerpanjangan();
      return;
    }

    if (f.size <= TARGET_SIZE) {
      drop.classList.add('filled');
      nameEl.textContent = f.name;
      updateProgress();
      updateProgressPerpanjangan();
      return;
    }

    drop.classList.add('compressing');
    nameEl.textContent = `Mengompres "${f.name}"…`;
    note.textContent = '';
    try {
      const hasil = await compressImage(f);
      drop.classList.remove('compressing');

      if (!hasil) {
        drop.classList.add('filled');
        nameEl.textContent = f.name;
        updateProgress();
        updateProgressPerpanjangan();
        return;
      }

      if (hasil.blob.size > MAX_SIZE) {
        alert(`Maaf, foto "${f.name}" masih terlalu besar setelah dikompres otomatis. Coba gunakan foto lain atau kurangi resolusi kamera pada pengaturan HP Anda.`);
        input.value = "";
        delete compressedFileStore[input.id];
        drop.classList.remove('filled');
        nameEl.textContent = nameEl.dataset.default;
        note.textContent = '';
        updateProgress();
        updateProgressPerpanjangan();
        return;
      }

      compressedFileStore[input.id] = {
        base64: hasil.base64,
        type: hasil.type,
        name: f.name.replace(/\.[^.]+$/, '') + '.jpg',
        size: hasil.blob.size
      };

      drop.classList.add('filled');
      nameEl.textContent = f.name;
      note.textContent = `Dikompres otomatis: ${formatUkuran(f.size)} → ${formatUkuran(hasil.blob.size)}`;
    } catch (err) {
      console.error('Gagal mengompres gambar:', err);
      drop.classList.remove('compressing');
      alert(`Terjadi kendala saat mengompres foto "${f.name}" secara otomatis. Silakan coba foto lain atau perkecil ukurannya terlebih dahulu.`);
      input.value = "";
      drop.classList.remove('filled');
      nameEl.textContent = nameEl.dataset.default;
    }
    updateProgress();
    updateProgressPerpanjangan();
  }

  function triggerFotoPicker(mode, targetInputId = 'file_foto', targetDropId = 'drop_foto') {
    const temp = document.createElement('input');
    temp.type = 'file';
    temp.accept = 'image/*';
    if (mode === 'camera') {
      temp.setAttribute('capture', 'user');
    }
    temp.style.display = 'none';
    document.body.appendChild(temp);

    temp.addEventListener('change', function() {
      if (temp.files && temp.files[0]) {
        const dt = new DataTransfer();
        dt.items.add(temp.files[0]);
        const fotoInput = document.getElementById(targetInputId);
        fotoInput.files = dt.files;
        handleFile(fotoInput, targetDropId);
      }
      document.body.removeChild(temp);
    });

    temp.click();
  }
