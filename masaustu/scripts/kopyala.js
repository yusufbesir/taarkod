// HTML'i dışarıdan (üst klasörden) app/index.html olarak kopyalar.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
// Sürüm uyuşmazlığı önlemi: kaynak HTML ele verilmediyse önce src/'den yeniden üretilir (eski HTML paketlenemez).
if (!process.env.HTML_KAYNAK) {
  const yapi = path.join(__dirname, '..', '..', 'build.js');
  if (fs.existsSync(yapi)) {
    const r = spawnSync(process.execPath, [yapi], { cwd: path.dirname(yapi), stdio: 'inherit' });
    if (r.status !== 0) { console.error('build.js basarisiz; paketleme durduruldu.'); process.exit(1); }
  }
}
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
