const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { eskiAyarlariKopyala, ESKI_KLASOR_ADI } = require('../ayarkopya');

function duzen() {
  const kok = fs.mkdtempSync(path.join(os.tmpdir(), 'ayk-'));
  const appData = path.join(kok, 'Roaming');
  fs.mkdirSync(appData);
  return { appData, yeni: path.join(appData, 'TAARKOD'), eski: path.join(appData, 'Barkod Sıra Şifreleme') };
}

test('eski klasör adı sabiti', () => { assert.strictEqual(ESKI_KLASOR_ADI, 'Barkod Sıra Şifreleme'); });

test('yeni klasörde ayarlar.json yok, eskide var: kopyalanır, eski dosya yerinde kalır', () => {
  const d = duzen();
  fs.mkdirSync(d.eski);
  fs.writeFileSync(path.join(d.eski, 'ayarlar.json'), '{"otomatikTemizlik":false}');
  fs.writeFileSync(path.join(d.eski, 'temizlik-log.jsonl'), 'x\n');
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, d.appData), true);
  assert.strictEqual(fs.readFileSync(path.join(d.yeni, 'ayarlar.json'), 'utf8'), '{"otomatikTemizlik":false}');
  assert.ok(fs.existsSync(path.join(d.eski, 'ayarlar.json')), 'eski silinmez/taşınmaz');
  assert.ok(!fs.existsSync(path.join(d.yeni, 'temizlik-log.jsonl')), 'yalnız ayarlar.json kopyalanır');
});

test('yeni klasörde ayarlar.json varsa ezilmez', () => {
  const d = duzen();
  fs.mkdirSync(d.eski); fs.mkdirSync(d.yeni);
  fs.writeFileSync(path.join(d.eski, 'ayarlar.json'), 'ESKI');
  fs.writeFileSync(path.join(d.yeni, 'ayarlar.json'), 'YENI');
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, d.appData), false);
  assert.strictEqual(fs.readFileSync(path.join(d.yeni, 'ayarlar.json'), 'utf8'), 'YENI');
});

test('eski klasör/dosya yoksa sessizce false; yeni klasör oluşturulmaz', () => {
  const d = duzen();
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, d.appData), false);
  fs.mkdirSync(d.eski);
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, d.appData), false);
  assert.ok(!fs.existsSync(d.yeni));
});

test('hata olursa fırlatmaz (geçersiz girdi, fs hatası, eski ayar klasör)', () => {
  const d = duzen();
  assert.strictEqual(eskiAyarlariKopyala(undefined, d.appData), false);
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, null), false);
  fs.mkdirSync(path.join(d.eski, 'ayarlar.json'), { recursive: true }); // dosya değil klasör
  assert.strictEqual(eskiAyarlariKopyala(d.yeni, d.appData), false);
  const bozuk = Object.assign({}, fs, { existsSync: () => { throw new Error('boom'); } });
  assert.doesNotThrow(() => eskiAyarlariKopyala(d.yeni, d.appData, bozuk));
});

test('main.js açılışta (pencere/ayar okunmadan önce) kopyalamayı çağırır', () => {
  const m = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(m, /require\('\.\/ayarkopya'\)/);
  assert.match(m, /eskiAyarlariKopyala\(app\.getPath\('userData'\), app\.getPath\('appData'\)\)/);
  assert.ok(m.indexOf('eskiAyarlariKopyala(app') < m.indexOf('olustur();\n    pencere.webContents.once'));
});
