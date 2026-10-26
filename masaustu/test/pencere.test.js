// Pencere bütünleşmesi (1.5.0): çerçeve seçenekleri, renk doğrulaması, preload köprüsü, logo/simge dosyaları.
// Electron çalıştırılmaz; saf modül doğrudan, main.js/preload.js/HTML statik denetlenir.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../pencere');

const kok = path.join(__dirname, '..');
const okuMetin = (...a) => fs.readFileSync(path.join(kok, ...a), 'utf8');
const main = okuMetin('main.js');
const preload = okuMetin('preload.js');
const paket = JSON.parse(okuMetin('package.json'));
const sablon = fs.readFileSync(path.join(kok, '..', 'src', 'sablon.html'), 'utf8');

function belirteclerCikar(blok) {
  const o = {};
  for (const m of blok.matchAll(/--([A-Za-z0-9-]+):(#[0-9A-Fa-f]{6})\b/g)) o[m[1]] = m[2].toUpperCase();
  return o;
}
const acikBelirtec = belirteclerCikar(sablon.slice(sablon.indexOf(':root{'), sablon.indexOf('\n', sablon.indexOf(':root{'))));
const koyuBelirtec = belirteclerCikar(sablon.slice(sablon.indexOf(':root[data-tema=koyu]{'), sablon.indexOf('\n', sablon.indexOf(':root[data-tema=koyu]{'))));

test('renkGecerli: yalnız #RRGGBB kabul edilir', () => {
  ['#000000', '#FFFFFF', '#0f3b2e', '#0A1514'].forEach((r) => assert.strictEqual(P.renkGecerli(r), true, r));
  ['#fff', '#12345', '#1234567', '123456', 'red', 'rgb(0,0,0)', '#GGGGGG', '#123456;', ' #123456', '#123456\n', '', null, undefined, 5, {}, [], ['#123456'], 'url(x)', '#12345g'].forEach((r) => assert.strictEqual(P.renkGecerli(r), false, String(r)));
});

test('overlayGuncelle: iki geçerli renk gerekir, yükseklik sabit', () => {
  assert.deepStrictEqual(P.overlayGuncelle('#0F3B2E', '#F6F1E3'), { color: '#0F3B2E', symbolColor: '#F6F1E3', height: P.YUKSEKLIK });
  assert.strictEqual(P.overlayGuncelle('#0F3B2E', 'white'), null);
  assert.strictEqual(P.overlayGuncelle('x', '#F6F1E3'), null);
  assert.strictEqual(P.overlayGuncelle(undefined, undefined), null);
  assert.strictEqual(P.overlayGuncelle({ toString: () => '#000000' }, '#000000'), null);
});

test('secenekler: Windows/Linux titleBarOverlay, macOS trafficLightPosition, her ikisinde titleBarStyle hidden', () => {
  ['win32', 'linux'].forEach((pl) => {
    [false, true].forEach((koyu) => {
      const o = P.secenekler(pl, koyu);
      assert.strictEqual(o.titleBarStyle, 'hidden');
      const t = P.tema(koyu);
      assert.deepStrictEqual(o.titleBarOverlay, { color: t.ust, symbolColor: t.simge, height: 48 });
      assert.strictEqual(o.backgroundColor, t.zemin);
      assert.strictEqual(o.trafficLightPosition, undefined);
    });
  });
  const m = P.secenekler('darwin', false);
  assert.strictEqual(m.titleBarStyle, 'hidden');
  assert.deepStrictEqual(m.trafficLightPosition, { x: 18, y: 18 });
  assert.strictEqual(m.titleBarOverlay, undefined);
  assert.strictEqual(P.YUKSEKLIK, 48);
});

test('tema renkleri HTML belirteçleriyle birebir aynı (açık ve koyu)', () => {
  assert.strictEqual(P.TEMALAR.acik.ust.toUpperCase(), acikBelirtec.ust);
  assert.strictEqual(P.TEMALAR.acik.simge.toUpperCase(), acikBelirtec.ustSimge);
  assert.strictEqual(P.TEMALAR.acik.zemin.toUpperCase(), acikBelirtec.kagit);
  assert.strictEqual(P.TEMALAR.koyu.ust.toUpperCase(), koyuBelirtec.ust);
  assert.strictEqual(P.TEMALAR.koyu.simge.toUpperCase(), koyuBelirtec.ustSimge);
  assert.strictEqual(P.TEMALAR.koyu.zemin.toUpperCase(), koyuBelirtec.kagit);
  Object.values(P.TEMALAR).forEach((t) => Object.values(t).forEach((r) => assert.ok(P.renkGecerli(r))));
});

test('yükseklik CSS ile aynı: html[data-masaustu] --ustY 48px', () => {
  assert.match(sablon, /html\[data-masaustu\]\{--ustY:48px;/);
});

test('main.js: BrowserWindow çerçeve seçeneklerini pencere.js\'ten alır, güvenlik ayarları yerinde', () => {
  assert.match(main, /require\('\.\/pencere'\)/);
  assert.match(main, /\.\.\.cerceve\.secenekler\(process\.platform, nativeTheme\.shouldUseDarkColors\)/);
  assert.match(main, /minWidth:\s*800/);
  assert.match(main, /sandbox:\s*true/);
  assert.match(main, /contextIsolation:\s*true/);
  assert.ok(paket.build.files.includes('pencere.js'), 'pencere.js pakete girmeli');
  assert.ok(fs.existsSync(path.join(kok, 'pencere.js')));
});

test('pencere:tema işleyicisi: gönderen denetimi önce, renk doğrulaması, macOS ve hata durumunda tamam:false', () => {
  const i = main.indexOf("ipcMain.handle('pencere:tema'");
  assert.ok(i >= 0);
  const g = main.slice(i, main.indexOf('\n  });', i));
  assert.ok(g.indexOf('gonderenKontrol(event)') >= 0 && g.indexOf('gonderenKontrol(event)') < g.indexOf('overlayGuncelle'));
  assert.match(g, /cerceve\.overlayGuncelle\(renk, simge\)/);
  assert.match(g, /if \(!o \|\| !pencere/);
  assert.match(g, /process\.platform === 'darwin'/);
  assert.match(g, /setTitleBarOverlay\(o\)/);
  assert.doesNotMatch(g, /setTitleBarOverlay\((renk|simge|\{)/, 'ham değer geçirilmez, yalnız doğrulanmış nesne');
});

test('preload: pencereTema köprüsü dar; yalnız invoke, ham renk geçer, başka kanal yok', () => {
  assert.match(preload, /pencereTema:\s*\(renk,\s*simge\)\s*=>\s*ipcRenderer\.invoke\('pencere:tema',\s*renk,\s*simge\)/);
  assert.strictEqual((preload.match(/exposeInMainWorld\(/g) || []).length, 1);
  const kanallar = [...preload.matchAll(/invoke\('([^']+)'/g)].map((m) => m[1]);
  assert.deepStrictEqual(kanallar.sort(), ['ayar:otomatik', 'pencere:tema', 'surum:bilgi', 'temizlik:klasorSec', 'temizlik:tara', 'temizlik:uygula']);
});

test('sayfa köprüyü yalnız varsa çağırır (web sürümü bozulmaz) ve --ust/--ustSimge okur', () => {
  const betik = sablon.slice(sablon.lastIndexOf('<script>'));
  assert.match(betik, /function pencereTemaGonder\(\)/);
  assert.match(betik, /if\(!m\|\|typeof m\.pencereTema!=='function'\)return/);
  assert.match(betik, /getPropertyValue\('--ust'\)\.trim\(\),cs\.getPropertyValue\('--ustSimge'\)\.trim\(\)/);
  assert.match(betik, /addEventListener\('change',sistemTemaDegisti\)/);
});

test('simge dosyaları: icon.png 512x512 RGBA, logo kopyası aynı, icon.ico çok boyutlu PNG, icns geçerli', () => {
  const png = fs.readFileSync(path.join(kok, 'build', 'icon.png'));
  assert.strictEqual(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.strictEqual(png.readUInt32BE(16), 512);
  assert.strictEqual(png.readUInt32BE(20), 512);
  assert.strictEqual(png[25], 6, 'RGBA (köşeler saydam)');
  assert.ok(png.equals(fs.readFileSync(path.join(kok, '..', 'logo', 'taarkod-ikon-512.png'))));
  const ico = fs.readFileSync(path.join(kok, 'build', 'icon.ico'));
  const n = ico.readUInt16LE(4);
  const boy = [];
  for (let k = 0; k < n; k++) {
    const o = 6 + k * 16;
    boy.push(ico[o] || 256);
    const ofs = ico.readUInt32LE(o + 12);
    const w = ico.readUInt32BE(ofs + 16);
    assert.strictEqual(w, ico[o] || 256, 'ico girişi ile gömülü PNG genişliği aynı');
  }
  assert.deepStrictEqual(boy, [16, 24, 32, 48, 64, 128, 256]);
  const icns = fs.readFileSync(path.join(kok, 'build', 'icon.icns'));
  assert.strictEqual(icns.subarray(0, 4).toString('ascii'), 'icns');
  assert.strictEqual(icns.readUInt32BE(4), icns.length);
  let o = 8; const turler = [];
  while (o < icns.length) { turler.push(icns.subarray(o, o + 4).toString('ascii')); o += icns.readUInt32BE(o + 4); }
  assert.strictEqual(o, icns.length);
  assert.deepStrictEqual(turler, ['icp4', 'icp5', 'icp6', 'ic07', 'ic08', 'ic09']);
});

test('logo kaynağı ve yedekler: build/logo.svg var, 1.4 simgeleri yedek-1.4 altında, eski simge duruyor', () => {
  const svg = okuMetin('build', 'logo.svg');
  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.ok(svg.includes('#14513D') && svg.includes('#F4C430') && svg.includes('#F6F1E3'));
  ['icon.png', 'icon.ico', 'icon.icns'].forEach((f) => assert.ok(fs.existsSync(path.join(kok, 'build', 'yedek-1.4', f)), f));
  assert.ok(fs.existsSync(path.join(kok, 'build', 'icon.eski.png')));
  assert.ok(!fs.readFileSync(path.join(kok, 'build', 'yedek-1.4', 'icon.png')).equals(fs.readFileSync(path.join(kok, 'build', 'icon.png'))), 'yedek eski simgedir');
});
