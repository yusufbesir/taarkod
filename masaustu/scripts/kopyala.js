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
