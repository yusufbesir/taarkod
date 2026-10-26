const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const T = require('../temizlik');

const kok = path.join(__dirname, '..');
const paket = JSON.parse(fs.readFileSync(path.join(kok, 'package.json'), 'utf8'));
const mainKaynak = fs.readFileSync(path.join(kok, 'main.js'), 'utf8');
const gecici = () => fs.mkdtempSync(path.join(os.tmpdir(), 'plt-'));
const yaz = (k, ad, ic) => fs.writeFileSync(path.join(k, ad), ic || 'x');

test('Linux/macOS paket adları tanınır ve sürüm ayrıştırılır', () => {
  const adlar = ['TAARKOD-1.0.0-linux-x64.AppImage', 'TAARKOD-1.0.0-linux-x64.deb', 'TAARKOD-1.0.0-mac-arm64.dmg',
    'TAARKOD-1.0.0-mac-x64.zip', 'TAARKOD-1.0.0-mac-arm64.dmg.blockmap'];
  adlar.forEach((a) => assert.strictEqual(T.adAyristir(a).surum, '1.0.0', a));
  assert.strictEqual(T.adAyristir('TAARKOD-1.0.0-linux-x64.AppImage').tur, 'linux-x64');
});

test('tanınmayan platform adları reddedilir', () => {
  ['TAARKOD-1.0.0-linux-x64.AppImage.bak', 'TAARKOD-1.0.0-linux-x64.rpm', 'TAARKOD-1.0.0-win-x64.zip',
    'TAARKOD-1.0.0-linux-ia32.deb', 'TAARKOD-1.0-linux-x64.deb', 'TAARKOD-v1.0.0-linux-x64.deb',
    'Barkod-Siralama-1.0.0-linux-x64.deb', 'X-TAARKOD-1.0.0-mac-x64.dmg', 'TAARKOD-1.0.0-mac-x64.dmg\n',
    'TAARKOD-1.0.0-mac-x64.app', 'TAARKOD.AppImage']
    .forEach((a) => assert.strictEqual(T.adAyristir(a), null, a));
});

test('tara: yalnız strictly eski sürümün Linux/mac paketleri; mevcut/yeni listelenmez', () => {
  const k = gecici();
  ['TAARKOD-1.0.0-linux-x64.AppImage', 'TAARKOD-1.0.0-linux-x64.deb', 'TAARKOD-1.1.0-mac-x64.zip',
    'TAARKOD-1.1.0-linux-x64.AppImage', 'TAARKOD-2.0.0-mac-arm64.dmg', 'TAARKOD-1.0.0-mac-arm64.dmg', 'notlar.txt'].forEach((a) => yaz(k, a));
  const adlar = T.tara(k, '1.1.0', fs, []).map((o) => o.ad).sort();
  assert.deepStrictEqual(adlar, ['TAARKOD-1.0.0-linux-x64.AppImage', 'TAARKOD-1.0.0-linux-x64.deb', 'TAARKOD-1.0.0-mac-arm64.dmg'].sort());
});

test('APPIMAGE ortam değişkenindeki çalışan dosya listeye girmez', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-1.0.0-linux-x64.AppImage');
  yaz(k, 'TAARKOD-1.0.1-linux-x64.AppImage');
  const onceki = process.env.APPIMAGE;
  process.env.APPIMAGE = path.join(k, 'TAARKOD-1.0.0-linux-x64.AppImage');
  try {
    assert.deepStrictEqual(T.tara(k, '1.1.0', fs).map((o) => o.ad), ['TAARKOD-1.0.1-linux-x64.AppImage']);
  } finally {
    if (onceki === undefined) delete process.env.APPIMAGE; else process.env.APPIMAGE = onceki;
  }
});

test('temizle: Linux paketi yalnız trashItem ile gider, SHA256 günlüğe yazılır', async () => {
  const k = gecici();
  yaz(k, 'TAARKOD-1.0.0-linux-x64.deb', 'icerik');
  const liste = T.tara(k, '1.1.0', fs, []);
  const cop = [];
  const kayit = [];
  const s = await T.temizle(liste, async (p) => { cop.push(p); }, { fs, klasor: k, kayit: (r) => kayit.push(r) });
  assert.strictEqual(s[0].durum, 'silindi');
  assert.deepStrictEqual(cop, [path.join(k, 'TAARKOD-1.0.0-linux-x64.deb')]);
  assert.strictEqual(kayit[0].sha256, crypto.createHash('sha256').update('icerik').digest('hex'));
  assert.ok(fs.existsSync(cop[0]), 'dosyayı yalnız trashItem kaldırır; modül kendisi silmez');
});

test('sha256Dogrula: Linux paketi için doğrulandi / hatali', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-1.1.0-linux-x64.AppImage', 'yeni');
  const h = crypto.createHash('sha256').update('yeni').digest('hex');
  fs.writeFileSync(path.join(k, 'SHA256.txt'), h + '  TAARKOD-1.1.0-linux-x64.AppImage\n');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'dogrulandi');
  fs.writeFileSync(path.join(k, 'SHA256.txt'), '0'.repeat(64) + '  TAARKOD-1.1.0-linux-x64.AppImage\n');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'hatali');
});

test('Windows adları değişmedi (NSIS + portable + eski ad)', () => {
  assert.strictEqual(T.adAyristir('TAARKOD-Kurulum-1.0.0.exe').tur, 'kurulum');
  assert.strictEqual(T.adAyristir('Barkod-Siralama-Tasinabilir-1.0.0.exe').tur, 'tasinabilir');
  assert.ok(T.adAyristir('TAARKOD-Kurulum-1.0.0.exe.blockmap'));
});

test('main.js: macOS pencereler kapanınca çıkmaz, activate yeniden açar; Windows/Linux çıkar', () => {
  assert.match(mainKaynak, /window-all-closed',\s*\(\)\s*=>\s*\{\s*if \(process\.platform !== 'darwin'\) app\.quit\(\);/);
  assert.match(mainKaynak, /app\.on\('activate'/);
  assert.match(mainKaynak, /Menu\.setApplicationMenu\(null\)/, 'Windows/Linux: menü yok');
  assert.match(mainKaynak, /shell\.trashItem\(/);
});

test('package.json: linux hedefleri', () => {
  const l = paket.build.linux;
  assert.deepStrictEqual(l.target.map((t) => t.target), ['AppImage', 'deb']);
  l.target.forEach((t) => assert.deepStrictEqual(t.arch, ['x64']));
  assert.strictEqual(l.category, 'Utility');
  assert.strictEqual(l.icon, 'build/icon.png');
  assert.strictEqual(l.artifactName, 'TAARKOD-${version}-linux-x64.${ext}');
});

test('package.json: mac hedefleri imzasız, icns var', () => {
  const m = paket.build.mac;
  assert.deepStrictEqual(m.target.map((t) => t.target), ['zip', 'dmg']);
  m.target.forEach((t) => assert.deepStrictEqual(t.arch, ['x64', 'arm64']));
  assert.strictEqual(m.category, 'public.app-category.productivity');
  assert.strictEqual(m.identity, null);
  assert.strictEqual(m.icon, 'build/icon.icns');
  const icns = fs.readFileSync(path.join(kok, 'build', 'icon.icns'));
  assert.strictEqual(icns.subarray(0, 4).toString('latin1'), 'icns');
  assert.strictEqual(icns.readUInt32BE(4), icns.length);
});

test('mac/linux artifactName desenleri temizlik MANIFEST ile uyumlu', () => {
  const sablon = (s, ekle) => s.replace('${version}', '3.2.1').replace('${ext}', ekle.ext).replace('${arch}', ekle.arch || 'x64');
  [['AppImage', 'x64'], ['deb', 'x64']].forEach(([ext, arch]) => assert.ok(T.adAyristir(sablon(paket.build.linux.artifactName, { ext, arch })), ext));
  ['zip', 'dmg'].forEach((ext) => ['x64', 'arm64'].forEach((arch) => assert.ok(T.adAyristir(sablon(paket.build.mac.artifactName, { ext, arch })), ext + arch)));
});

test('package.json: npm scriptleri ve Windows ayarları korunur', () => {
  ['dist:win', 'dist:linux', 'dist:mac'].forEach((s) => assert.ok(paket.scripts[s], s));
  assert.match(paket.scripts['dist:win'], /--win --x64/);
  assert.match(paket.scripts['dist:linux'], /--linux AppImage deb --x64/);
  assert.match(paket.scripts['dist:mac'], /--mac zip dmg/);
  assert.strictEqual(paket.build.nsis.artifactName, 'TAARKOD-Kurulum-${version}.exe');
  assert.strictEqual(paket.build.win.icon, 'build/icon.ico');
});
