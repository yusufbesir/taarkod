'use strict';
// Sahip: Yusuf. yazan: [Claude#taarkod-T2 2026-11-05]
// Fiyat Etiketi kuyruğu (etiket-kuyrugu alanı) için OKUR tarafı. TaaRkod bu alanın sahibi DEĞİLDİR:
// kuyruk dosyasına asla yazmaz, yalnız <alan>/oneriler/ altına öneri bırakır (taa-veri okur.oner).
// Electron'a bağlı değildir; main.js ve testler aynı modülü kullanır.
const path = require('path');

const ALAN = 'etiket-kuyrugu';
const PROGRAM = 'taarkod';
const AZAMI_BARKOD = 2000;     // tek öneri (256 KiB sınırının çok altında kalır)
const AZAMI_UZUNLUK = 128;

// taa-veri.js kopyası: paketlenmiş uygulamada app/ altından (scripts/kopyala.js koyar), geliştirmede depo kökündeki taa/ klasöründen.
function veriModulu() {
  const adaylar = [path.join(__dirname, 'app', 'taa-veri.js'), path.join(__dirname, '..', 'taa', 'taa-veri.js')];
  for (const a of adaylar) {
    try { return require(a); } catch (e) { if (e && e.code !== 'MODULE_NOT_FOUND') throw e; }
  }
  return null;
}

// Alan var ve SAHIP.toml okunabiliyorsa { var: true, sahip }; aksi halde { var: false }. Asla fırlatmaz.
function durum(env) {
  try {
    const v = veriModulu();
    if (!v) return { var: false };
    const okur = v.acOkur({ alan: ALAN, program: PROGRAM, env: env || process.env });
    return { var: true, sahip: String(okur.sahip().sahip || '') };
  } catch (e) { return { var: false }; }
}

// Barkod listesini doğrular; geçerli olanları { barkod, adet: 1 } olarak döndürür (tekrarlar atılır).
function ekleListesi(barkodlar) {
  if (!Array.isArray(barkodlar)) return [];
  const gor = new Set();
  const liste = [];
  for (const b of barkodlar) {
    if (typeof b !== 'string') continue;
    const m = b.trim();
    if (m === '' || m.length > AZAMI_UZUNLUK || /[\u0000-\u001f]/.test(m) || gor.has(m)) continue;
    gor.add(m);
    liste.push({ barkod: m, adet: 1 });
    if (liste.length >= AZAMI_BARKOD) break;
  }
  return liste;
}

// Alan varsa oneriler/ altına { ekle: [...] } önerisi yazar. Alan yoksa hata vermez: { tamam: false, neden: 'alan-yok' }.
function oner(barkodlar, env) {
  const ekle = ekleListesi(barkodlar);
  if (ekle.length === 0) return { tamam: false, neden: 'bos' };
  const d = durum(env);
  if (!d.var) return { tamam: false, neden: 'alan-yok' };
  try {
    const okur = veriModulu().acOkur({ alan: ALAN, program: PROGRAM, env: env || process.env });
    const id = okur.oner({ ekle });
    return { tamam: true, id, adet: ekle.length };
  } catch (e) { return { tamam: false, neden: 'yazilamadi' }; }
}

module.exports = { ALAN, PROGRAM, AZAMI_BARKOD, durum, oner, ekleListesi };
