// HTML'i dışarıdan (üst klasörden) app/index.html olarak kopyalar.
const fs = require('fs');
const path = require('path');
const kaynak = process.env.HTML_KAYNAK ||
  path.join(__dirname, '..', '..', 'barkod-sifreleme.html');
const hedef = path.join(__dirname, '..', 'app', 'index.html');
if (!fs.existsSync(kaynak)) {
  console.error('Kaynak HTML bulunamadi: ' + kaynak + ' (HTML_KAYNAK ile belirtebilirsiniz)');
  process.exit(1);
}
fs.mkdirSync(path.dirname(hedef), { recursive: true });
fs.copyFileSync(kaynak, hedef);
console.log('Kopyalandi: ' + kaynak + ' -> ' + hedef);
// TAA veri alanı kitaplığı kopyası (depo kökündeki taa/): kuyruk.js paketlenmiş uygulamada app/ altından yükler.
const veriKaynak = path.join(__dirname, '..', '..', 'taa', 'taa-veri.js');
if (fs.existsSync(veriKaynak)) {
  fs.copyFileSync(veriKaynak, path.join(path.dirname(hedef), 'taa-veri.js'));
  console.log('Kopyalandi: ' + veriKaynak);
}
