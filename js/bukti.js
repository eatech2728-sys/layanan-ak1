// ==============================================================
// Bukti pendaftaran
// QR bukti, unduh sebagai gambar, bagikan ke WhatsApp
// ==============================================================

  function buatQrBukti(noReg) {
    const wrap = document.getElementById('buktiQr');
    if (!wrap || typeof QRCode === 'undefined') return;
    wrap.innerHTML = '';
    new QRCode(wrap, {
      text: `AK1-REG:${noReg}`,
      width: 120,
      height: 120,
      colorDark: '#0A2E52',
      colorLight: '#ffffff'
    });
  }

  function unduhBuktiSebagaiGambar() {
    const target = document.getElementById('permanentNotification');
    if (typeof html2canvas === 'undefined' || !target) {
      toast('error', 'Tidak dapat mengunduh', 'Fitur unduh gambar sedang tidak tersedia, silakan screenshot manual.');
      return;
    }
    toast('info', 'Menyiapkan gambar…', 'Mohon tunggu sebentar.', 2000);
    html2canvas(target, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `bukti-registrasi-ak1-${document.getElementById('finalNoReg').textContent}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error(err);
      toast('error', 'Gagal membuat gambar', 'Silakan gunakan screenshot manual sebagai alternatif.');
    });
  }

  /**
   * bagikanBuktiWhatsapp — pakai Web Share API (navigator.share) kalau
   * tersedia di perangkat (umumnya HP), supaya gambar bukti registrasi
   * bisa langsung dibagikan ke WhatsApp tanpa harus unduh dulu lalu
   * upload manual. Kalau tidak didukung (misalnya di desktop), otomatis
   * jatuh kembali ke tautan wa.me yang sudah ada.
   */
  async function bagikanBuktiWhatsapp() {
    const target = document.getElementById('permanentNotification');
    const noReg = document.getElementById('finalNoReg').textContent;

    if (typeof html2canvas === 'undefined' || !target) {
      window.open(`https://wa.me/6282197462749?text=${encodeURIComponent('Halo Admin, saya ingin mengirimkan bukti registrasi AK.1 dengan No. Reg ' + noReg)}`, '_blank');
      return;
    }

    try {
      const canvas = await html2canvas(target, { backgroundColor: '#ffffff', scale: 2 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `bukti-registrasi-ak1-${noReg}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Bukti Registrasi AK-1',
          text: `Bukti registrasi AK-1, No. Registrasi: ${noReg}`
        });
      } else {
        window.open(`https://wa.me/6282197462749?text=${encodeURIComponent('Halo Admin, saya ingin mengirimkan bukti registrasi AK.1 dengan No. Reg ' + noReg)}`, '_blank');
        toast('info', 'Berbagi langsung tidak didukung', 'Silakan unduh gambar bukti lalu kirim manual via WhatsApp yang baru saja dibuka.', 6000);
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.error('Gagal membagikan bukti:', err);
      window.open(`https://wa.me/6282197462749?text=${encodeURIComponent('Halo Admin, saya ingin mengirimkan bukti registrasi AK.1 dengan No. Reg ' + noReg)}`, '_blank');
    }
  }
