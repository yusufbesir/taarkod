const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const T = require('../temizlik');

function gecici() { return fs.mkdtempSync(path.join(os.tmpdir(), 'tmz-')); }
function yaz(k, ad, ic) { fs.writeFileSync(path.join(k, ad), ic || 'x'); }
const YOK = []; // çalışan exe dışlaması yok

test('sürüm ayrıştırma ve sayısal karşılaştırma', () => {
  assert.deepStrictEqual(T.surumAyristir('1.10.0'), [1, 10, 0]);
  assert.strictEqual(T.surumAyristir('1.0'), null);
  assert.strictEqual(T.surumAyristir('1.0.0-beta'), null);
  assert.strictEqual(T.surumKarsilastir('1.9.0', '1.10.0'), -1);
  assert.strictEqual(T.surumKarsilastir('2.0.0', '1.99.99'), 1);
  assert.strictEqual(T.surumKarsilastir('1.1.0', '1.1.0'), 0);
  assert.ok(Number.isNaN(T.surumKarsilastir('x', '1.0.0')));
});

test('yalnız eski sürümler listelenir; mevcut/yeni/tanınmayan listelenmez', () => {
  const k = gecici();
  ['TAARKOD-Kurulum-1.0.0.exe', 'TAARKOD-Kurulum-1.0.0.exe.blockmap', 'taarkod-tasinabilir-1.0.5.EXE',
    'TAARKOD-Kurulum-1.1.0.exe', 'TAARKOD-Kurulum-2.0.0.exe', 'not.txt', 'ayarlar.json',
    'TAARKOD-Kurulum-1.0.0.exe.bak', 'kurulum.parca.00', 'X-TAARKOD-Kurulum-1.0.0.exe',
    'TAARKOD-Kurulum-1.0.exe', 'TAARKOD-Diger-1.0.0.exe'].forEach((a) => yaz(k, a));
  const adlar = T.tara(k, '1.1.0', fs, YOK).map((o) => o.ad).sort();
  assert.deepStrictEqual(adlar, ['TAARKOD-Kurulum-1.0.0.exe', 'TAARKOD-Kurulum-1.0.0.exe.blockmap', 'taarkod-tasinabilir-1.0.5.EXE'].sort());
});

test('1.9.0 < 1.10.0 klasör taramasında da geçerli', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-Kurulum-1.9.0.exe');
  yaz(k, 'TAARKOD-Kurulum-1.10.0.exe');
  assert.deepStrictEqual(T.tara(k, '1.10.0', fs, YOK).map((o) => o.surum), ['1.9.0']);
});

test('sembolik bağlantı ve alt klasör atlanır, özyineleme yok', () => {
  const k = gecici(); const dis = gecici();
  yaz(dis, 'hedef.bin');
  fs.symlinkSync(path.join(dis, 'hedef.bin'), path.join(k, 'TAARKOD-Kurulum-1.0.0.exe'));
  fs.mkdirSync(path.join(k, 'TAARKOD-Kurulum-1.0.1.exe'));
  fs.mkdirSync(path.join(k, 'alt'));
  yaz(path.join(k, 'alt'), 'TAARKOD-Kurulum-1.0.2.exe');
  assert.deepStrictEqual(T.tara(k, '1.1.0', fs, YOK), []);
});

test('klasörün kendisi sembolik bağlantıysa gerçek yol içinde kalınır; dosya dışarıya işaret ederse atlanır', () => {
  const k = gecici(); const dis = gecici();
  yaz(dis, 'TAARKOD-Kurulum-1.0.0.exe');
  fs.symlinkSync(path.join(dis, 'TAARKOD-Kurulum-1.0.0.exe'), path.join(k, 'TAARKOD-Tasinabilir-1.0.0.exe'));
  assert.deepStrictEqual(T.tara(k, '1.1.0', fs, YOK), []);
});

test('en çok 50 dosya', () => {
  const k = gecici();
  for (let i = 0; i < 80; i++) yaz(k, 'TAARKOD-Kurulum-0.0.' + i + '.exe');
  assert.strictEqual(T.tara(k, '1.0.0', fs, YOK).length, 50);
});

test('çalışan exe listeye girmez (haric ve PORTABLE_EXECUTABLE_FILE)', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-Tasinabilir-1.0.0.exe');
  yaz(k, 'TAARKOD-Kurulum-1.0.0.exe');
  const calisan = path.join(k, 'TAARKOD-Tasinabilir-1.0.0.exe');
  assert.deepStrictEqual(T.tara(k, '1.1.0', fs, [calisan]).map((o) => o.ad), ['TAARKOD-Kurulum-1.0.0.exe']);
  const onceki = process.env.PORTABLE_EXECUTABLE_FILE;
  process.env.PORTABLE_EXECUTABLE_FILE = calisan.toUpperCase().replace(/^\/TMP/, '/tmp');
  try {
    assert.ok(!T.tara(k, '1.1.0', fs).some((o) => o.ad === 'TAARKOD-Tasinabilir-1.0.0.exe') || process.platform !== 'win32');
  } finally { if (onceki === undefined) delete process.env.PORTABLE_EXECUTABLE_FILE; else process.env.PORTABLE_EXECUTABLE_FILE = onceki; }
  process.env.PORTABLE_EXECUTABLE_FILE = calisan;
  try { assert.ok(!T.tara(k, '1.1.0', fs).some((o) => o.ad === 'TAARKOD-Tasinabilir-1.0.0.exe')); }
  finally { if (onceki === undefined) delete process.env.PORTABLE_EXECUTABLE_FILE; else process.env.PORTABLE_EXECUTABLE_FILE = onceki; }
});

test('göreli/geçersiz klasör ve geçersiz sürüm boş döner', () => {
  assert.deepStrictEqual(T.tara('goreli/yol', '1.1.0', fs, YOK), []);
  assert.deepStrictEqual(T.tara(gecici(), 'abc', fs, YOK), []);
  assert.deepStrictEqual(T.tara('/yok/boyle/klasor', '1.1.0', fs, YOK), []);
});

test('temizle yalnız trashItem çağırır; hata diğerlerini durdurmaz', async () => {
  const k = gecici();
  ['TAARKOD-Kurulum-1.0.0.exe', 'TAARKOD-Kurulum-1.0.1.exe', 'TAARKOD-Kurulum-1.0.2.exe'].forEach((a) => yaz(k, a));
  const liste = T.tara(k, '1.1.0', fs, YOK);
  const cagrilar = [];
  const sonuc = await T.temizle(liste, async (p) => {
    cagrilar.push(p);
    if (p.endsWith('1.0.1.exe')) throw new Error('kilitli');
  });
  assert.strictEqual(cagrilar.length, 3);
  assert.deepStrictEqual(sonuc.map((r) => r.durum), ['silindi', 'hata', 'silindi']);
  assert.match(sonuc[1].hata, /kilitli/);
  // trashItem sahte olduğundan dosyalar yerinde kalır: temizle başka silme yöntemi kullanmaz
  assert.strictEqual(fs.readdirSync(k).length, 3);
});

test('temizle tara() dışı/tanınmayan öğeyi reddeder, trashItem çağrılmaz', async () => {
  let n = 0;
  const sonuc = await T.temizle([
    { ad: 'not.txt', yol: '/tmp/not.txt' },
    { ad: 'TAARKOD-Kurulum-1.0.0.exe', yol: '/tmp/baska.exe' },
    { ad: 'TAARKOD-Kurulum-1.0.0.exe', yol: '/tmp/../etc/TAARKOD-Kurulum-1.0.0.exe/x' },
    null
  ], async () => { n++; });
  assert.strictEqual(n, 0);
  assert.ok(sonuc.every((r) => r.durum === 'hata'));
});

test('temizle(fs, klasor): yeniden doğrular, hash ve günlük kaydı tutar; klasör dışı/symlink reddedilir', async () => {
  const k = gecici(); const dis = gecici();
  yaz(k, 'TAARKOD-Kurulum-1.0.0.exe', 'icerik');
  yaz(dis, 'TAARKOD-Kurulum-1.0.1.exe', 'dis');
  const liste = T.tara(k, '1.1.0', fs, YOK);
  const dista = { ad: 'TAARKOD-Kurulum-1.0.1.exe', yol: path.join(dis, 'TAARKOD-Kurulum-1.0.1.exe') };
  const kayitlar = []; const silinen = [];
  const sonuc = await T.temizle(liste.concat([dista]), async (p) => { silinen.push(p); },
    { fs, klasor: k, kayit: (r) => kayitlar.push(r) });
  assert.deepStrictEqual(sonuc.map((r) => r.durum), ['silindi', 'hata']);
  assert.deepStrictEqual(silinen, [liste[0].yol]);
  const beklenen = crypto.createHash('sha256').update('icerik').digest('hex');
  assert.strictEqual(kayitlar[0].sha256, beklenen);
  assert.strictEqual(kayitlar[0].ad, 'TAARKOD-Kurulum-1.0.0.exe');
  assert.strictEqual(kayitlar[1].durum, 'hata');
  // tara'dan sonra dosya symlink ile değiştirilirse silinmez
  fs.rmSync(liste[0].yol);
  fs.symlinkSync(path.join(dis, 'TAARKOD-Kurulum-1.0.1.exe'), liste[0].yol);
  const s2 = await T.temizle(liste, async (p) => { silinen.push(p); }, { fs, klasor: k });
  assert.strictEqual(s2[0].durum, 'hata');
  assert.strictEqual(silinen.length, 1);
});

test('sha256Dogrula: eşleşme, uyuşmazlık ve SHA256.txt yokluğu', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-Kurulum-1.1.0.exe', 'yeni');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'yok');
  const h = crypto.createHash('sha256').update('yeni').digest('hex');
  fs.writeFileSync(path.join(k, 'SHA256.txt'), h + '  TAARKOD-Kurulum-1.1.0.exe\n');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'dogrulandi');
  fs.writeFileSync(path.join(k, 'SHA256.txt'), '0'.repeat(64) + '  TAARKOD-Kurulum-1.1.0.exe\n');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'hatali');
});

test('kullanıcı dosyaları (ayarlar, çıktılar, SHA256.txt) hiçbir zaman listelenmez', () => {
  const k = gecici();
  ['ayarlar.json', 'temizlik-log.jsonl', 'SHA256.txt', 'barkodlar.csv', 'TAARKOD-Kurulum-1.0.0.exe.tmp'].forEach((a) => yaz(k, a));
  assert.deepStrictEqual(T.tara(k, '9.9.9', fs, YOK), []);
});

test('MANIFEST tek kaynak: üretilen adlar tanınır, desen dışı hiçbir ad tanınmaz', () => {
  const M = T.MANIFEST;
  assert.deepStrictEqual([...M.turler], ['Kurulum', 'Tasinabilir']);
  assert.deepStrictEqual([...M.uzantilar], ['.exe', '.exe.blockmap']);
  assert.ok(Object.isFrozen(M));
  assert.deepStrictEqual([...M.oneks], ['TAARKOD', 'Barkod-Siralama']);
  assert.strictEqual(M.onek, 'TAARKOD');
  const tanin = [];
  M.oneks.forEach((o) => M.turler.forEach((t) => M.uzantilar.forEach((u) => tanin.push(o + '-' + t + '-3.2.1' + u))));
  tanin.forEach((a) => assert.ok(T.adAyristir(a), a));
  ['a.txt', 'TAARKOD-Kurulum-1.0.0.exe.bak', 'TAARKOD-Kurulum-1.0.0.exe.blockmap2', 'TAARKOD-Kurulum-1.0.0.msi',
    'TAARKOD-Kurulum-1.0.0.exe\n', '../TAARKOD-Kurulum-1.0.0.exe', 'ayarlar.json', 'SHA256.txt', 'TAARKOD-Kurulum-v1.0.0.exe']
    .forEach((a) => assert.strictEqual(T.adAyristir(a), null, a));
});

test('sha256Dogrula: mevcut sürümün kurulum dosyası listede yoksa "yok" (silme yapılmaz)', () => {
  const k = gecici();
  yaz(k, 'TAARKOD-Kurulum-1.1.0.exe', 'yeni');
  fs.writeFileSync(path.join(k, 'SHA256.txt'), '1'.repeat(64) + '  baska-dosya.exe\n');
  assert.strictEqual(T.sha256Dogrula(k, '1.1.0', fs).durum, 'yok');
});

test('sabit bağlantı (hardlink) olan dosya listelenmez', () => {
  const k = gecici(); const dis = gecici();
  yaz(dis, 'hedef.bin');
  fs.linkSync(path.join(dis, 'hedef.bin'), path.join(k, 'TAARKOD-Kurulum-1.0.0.exe'));
  assert.deepStrictEqual(T.tara(k, '1.1.0', fs, YOK), []);
});

test('eski ad (Barkod-Siralama) ve yeni ad (TAARKOD) aynı ürünün sürümleri: ikisi de taranır ve silinir; karışık/benzer adlar değil', async () => {
  const k = gecici();
  ['Barkod-Siralama-Kurulum-1.0.0.exe', 'barkod-siralama-tasinabilir-1.0.5.EXE', 'Barkod-Siralama-Kurulum-1.0.0.exe.blockmap',
    'TAARKOD-Kurulum-1.1.0.exe', 'TAARKOD-Tasinabilir-1.1.0.exe',
    // güncel sürüm ve yeni, tanınmayan/benzer adlar
    'Barkod-Siralama-Kurulum-1.1.5.exe', 'TAARKOD-Kurulum-1.1.5.exe', 'TAARKOD-Kurulum-2.0.0.exe',
    'TAARKOD-Barkod-Siralama-Kurulum-1.0.0.exe', 'TAARKODX-Kurulum-1.0.0.exe', 'TAARKOD-Diger-1.0.0.exe', 'TAARKOD-Kurulum-1.0.0.exe.bak',
    'Barkod-TAARKOD-Kurulum-1.0.0.exe'].forEach((a) => yaz(k, a));
  const liste = T.tara(k, '1.1.5', fs, YOK);
  assert.deepStrictEqual(liste.map((o) => o.ad).sort(), ['Barkod-Siralama-Kurulum-1.0.0.exe', 'Barkod-Siralama-Kurulum-1.0.0.exe.blockmap',
    'TAARKOD-Kurulum-1.1.0.exe', 'TAARKOD-Tasinabilir-1.1.0.exe', 'barkod-siralama-tasinabilir-1.0.5.EXE'].sort());
  // silme davranışı değişmedi: yalnız trashItem, kalıcı silme yok
  const cop = [];
  const sonuc = await T.temizle(liste, async (p) => { cop.push(p); }, { fs: fs, klasor: k });
  assert.strictEqual(sonuc.filter((r) => r.durum === 'silindi').length, 5);
  assert.strictEqual(cop.length, 5);
  assert.ok(fs.existsSync(path.join(k, 'Barkod-Siralama-Kurulum-1.0.0.exe')), 'dosyalar yalnız trashItem ile gider; test trashItem taklidi dosyayı silmez');
  assert.ok(T.adAyristir('TAARKOD-Kurulum-1.2.3.exe') && T.adAyristir('Barkod-Siralama-Kurulum-1.2.3.exe'));
  assert.strictEqual(T.adAyristir('TAARKOD-kurulum-v1.2.3.exe'), null);
});
