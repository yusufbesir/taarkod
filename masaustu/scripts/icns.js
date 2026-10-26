// build/icon.png (512x512) -> build/icon.icns (macOS simgesi). Saf JS 'png2icons' kullanır; derlemede çalışmaz, ikon değişince elle çalıştırılır.
const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');
const girdi = path.join(__dirname, '..', 'build', 'icon.png');
const cikti = path.join(__dirname, '..', 'build', 'icon.icns');
const icns = png2icons.createICNS(fs.readFileSync(girdi), png2icons.BICUBIC, 0);
if (!icns) { console.error('icns uretilemedi'); process.exit(1); }
fs.writeFileSync(cikti, icns);
console.log('Yazildi: ' + cikti + ' (' + icns.length + ' bayt)');
