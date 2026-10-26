'use strict';
// Ürün adı değişince (Barkod Sıra Şifreleme -> TAARKOD) userData klasörü de değişir.
// Yeni klasörde ayarlar.json yoksa ve eski klasörde varsa YALNIZ ayarlar.json KOPYALANIR (taşıma/silme yok).
// Saf modül (electron'a bağımlı değil); fs enjekte edilebilir. Hata olursa sessizce geçer.
const path = require('path');
const nodefs = require('fs');

const ESKI_KLASOR_ADI = 'Barkod Sıra Şifreleme';

// Döner: true = kopyalandı, false = kopyalanmadı (gerek yok, eski yok ya da hata)
function eskiAyarlariKopyala(yeniUserData, appData, fs) {
  const f = fs || nodefs;
  try {
    if (typeof yeniUserData !== 'string' || typeof appData !== 'string' || !yeniUserData || !appData) return false;
    const yeni = path.join(yeniUserData, 'ayarlar.json');
    const eskiKlasor = path.join(appData, ESKI_KLASOR_ADI);
    const eski = path.join(eskiKlasor, 'ayarlar.json');
    if (path.resolve(eskiKlasor).toLowerCase() === path.resolve(yeniUserData).toLowerCase()) return false;
    if (f.existsSync(yeni)) return false;
    const st = f.lstatSync(eski);
    if (!st.isFile() || st.isSymbolicLink()) return false;
    f.mkdirSync(yeniUserData, { recursive: true });
    f.copyFileSync(eski, yeni, nodefs.constants ? nodefs.constants.COPYFILE_EXCL : 0); // var olanı asla ezme
    return true;
  } catch (e) { return false; }
}

module.exports = { eskiAyarlariKopyala, ESKI_KLASOR_ADI };
