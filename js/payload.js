// ==============================================================
// Payload berkas
// toBase64 & ambilFilePayload (dipakai saat kirim form)
// ==============================================================

  const toBase64 = file => new Promise((resolve, reject) => {
    if (!file || file.length === 0) { resolve(null); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file[0]);
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], type: file[0].type });
    reader.onerror = error => reject(error);
  });

  async function ambilFilePayload(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files || input.files.length === 0) return null;
    const cached = compressedFileStore[inputId];
    if (cached) return { base64: cached.base64, type: cached.type };
    return toBase64(input.files);
  }
