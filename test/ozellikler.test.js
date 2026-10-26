'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const kok = path.join(__dirname, '..');
const K = require('../src/kural.js');
const D = require('../src/donustur.js');
const B = require('../src/barkod.js');
const Depo = require('../src/depo.js');
const Gecmis = require('../src/gecmis.js');
const Toplu = require('../src/toplu.js');
const Dogrula = require('../src/dogrula.js');
const Etiket = require('../src/etiket.js');
const Tara = require('../src/tara.js');
const Yedek = require('../src/yedek.js');
const Dil = require('../src/dil.js');
const EN = require('../src/dil_en.js');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');
const betik = sablon.slice(sablon.lastIndexOf('<script>'));
const calisma = (ek) => K.calismaKurali(Object.assign(K.varsayilan(), ek || {}), 'deneme').calisma;
const bellekDepo = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; };

// ---- 1) QR / Data Matrix ----
test('2B: kural QR/Data Matrix kabul eder, uzunluk önerisi çalışır, SVG üretilir', () => {
  ['qr', 'datamatrix'].forEach((st) => {
    const k = Object.assign(K.varsayilan(), { standart: st });
    assert.strictEqual(K.kuralTemizle(k).kural.standart, st);
    const c = calisma({ standart: st });
    assert.ok(K.standartUygunMu(c).uygun);
    assert.match(B.svg(st, K.barkodMetni(5, c), { modulGenislik: 3 }), /^<svg /);
    assert.strictEqual(K.iceAktar(K.disaAktar(k)).kural.standart, st);
  });
  assert.match(sablon, /<option value="qr">/);
  assert.match(sablon, /<option value="datamatrix">/);
  assert.match(betik, /\$\('opCubukYuk'\)\.hidden=iki/);
});

// ---- 2) Etiket şablonları, TSPL, ZPL ----
test('etiket: şablonlar, sayfa düzeni, @page ve nokta hesabı', () => {
  ['40x25', '50x30', '100x50', 'a4-3x8', 'a4-4x10'].forEach((id) => assert.ok(Etiket.sablonBul(id), id));
  assert.deepStrictEqual(Etiket.sayfaDuzeni(Etiket.sablonBul('a4-3x8'), 50), { sayfaBasina: 24, sayfaSayisi: 3, sutun: 3, satir: 8 });
  assert.strictEqual(Etiket.sayfaDuzeni(Etiket.sablonBul('a4-4x10'), 40).sayfaSayisi, 1);
  assert.strictEqual(Etiket.sayfaCss(Etiket.sablonBul('40x25')), '@page{size:40mm 25mm;margin:0}');
  assert.strictEqual(Etiket.sayfaCss(Etiket.sablonBul('a4-3x8')), '@page{size:210mm 297mm;margin:0}');
  assert.strictEqual(Etiket.mmNokta(25.4, 203), 203);
  const o = Etiket.yaziciSecenek(Etiket.sablonBul('50x30'), 203, 'qr', 21);
  assert.strictEqual(o.etiketGenisligi, 400); assert.strictEqual(o.etiketGenisMm, 50);
  assert.throws(() => Etiket.yaziciSecenek(Etiket.sablonBul('a4-3x8'), 203, 'code128', 90), /rulo/);
  assert.match(sablon, /id="sayfaStili"|getElementById\('sayfaStili'\)/);
  assert.match(sablon, /body\.etYaz/);
  assert.match(sablon, /id="etPdf"/);
  assert.match(sablon, /PDF için kütüphane gerekmez/);
});

test('tspl: biçim kayıtlı, çıktı, standartlar, yasak karakter', () => {
  assert.ok(D.BICIMLER.some((b) => b.id === 'tspl'));
  const r = [{ sira: 1, seri: 'S', barkod: 'TO123' }];
  assert.strictEqual(D.donustur('tspl', r), 'SIZE 50 mm,30 mm\r\nGAP 2 mm,0 mm\r\nDIRECTION 1\r\nCLS\r\nBARCODE 30,30,"128",100,1,0,2,2,"TO123"\r\nPRINT 1,1\r\n');
  assert.match(D.donustur('tspl', r, { etiketGenisMm: 40, etiketYuksekMm: 25 }), /^SIZE 40 mm,25 mm/);
  assert.match(D.donustur('tspl', r, { standart: 'qr' }), /QRCODE 30,30,M,4,A,0,"TO123"/);
  assert.match(D.donustur('tspl', r, { standart: 'datamatrix', sembolNokta: 150 }), /DMATRIX 30,30,150,150,"TO123"/);
  assert.match(D.donustur('tspl', r, { standart: 'code39' }), /"39"/);
  ['a"b', 'a\\b', 'türkçe'].forEach((b) => assert.throws(() => D.donustur('tspl', [{ sira: 1, seri: 'S', barkod: b }]), /TSPL/));
  assert.throws(() => D.donustur('tspl', r, { standart: 'xx' }), /standart/);
  assert.throws(() => D.donustur('tspl', r, { etiketGenisMm: 5 }), /etiketGenisMm/);
  assert.strictEqual(D.dosyaAdi('tspl', 'Seri 1'), 'Seri-1.tspl');
  assert.ok(!D.donustur('tspl', r).includes('GIZLI'));
});

test('zpl: QR/Data Matrix ve şablon seçenekleri; varsayılan çıktı değişmedi', () => {
  const r = [{ sira: 1, seri: 'S', barkod: 'TO123' }];
  assert.strictEqual(D.donustur('zpl', r), '^XA^FO30,30^BCN,100,Y,N,N^FDTO123^FS^XZ\n');
  assert.match(D.donustur('zpl', r, { standart: 'qr', modul: 5 }), /\^BQN,2,5\^FDMA,TO123/);
  assert.match(D.donustur('zpl', r, { standart: 'datamatrix' }), /\^BXN,4,200\^FDTO123/);
  const o = Etiket.yaziciSecenek(Etiket.sablonBul('100x50'), 300, 'code128', 90);
  assert.match(D.donustur('zpl', r, o), /^\^XA\^PW1181\^LL591/);
  assert.match(betik, /etiketSecenegi\(b,s\)/);
});

// ---- 3) Toplu içe aktarma ----
test('toplu: CSV ilk sütun, tırnak, BOM, başlık, limit ve hatalı satırlar', () => {
  const t = Toplu.csvIlkSutun('﻿Barkod;Seri\r\nTO1;"a;b"\r\n="TO2";x\r\n\r\n"TO\n3";y');
  assert.deepStrictEqual(t.kayitlar.map((k) => k.deger), ['Barkod', 'TO1', 'TO2', 'TO\n3']);
  assert.strictEqual(Toplu.baslikAyikla(t.kayitlar).baslik, 'Barkod');
  const l = Toplu.csvIlkSutun('1\n2\n3\n4', 3);
  assert.strictEqual(l.kayitlar.length, 3); assert.strictEqual(l.kesildi, true);
  assert.strictEqual(Toplu.SATIR_LIMIT, 100000);
  const s = Toplu.sayiListesi(Toplu.csvIlkSutun('1\n2\nabc\n2\n\n00007\n5.0,x\n99999999999999999999999999999999\n').kayitlar);
  assert.deepStrictEqual(s.sayilar.map((x) => x.sira), [1, 2, 7]);
  assert.deepStrictEqual(s.hatalar.map((x) => x.kod), ['sayi-degil', 'yinelenen', 'sayi-degil', 'cok-uzun']);
  assert.strictEqual(s.hatalar[1].ilkSatir, 2);
  assert.strictEqual(Toplu.turBul('a.XLSX'), 'xlsx'); assert.strictEqual(Toplu.turBul('a.xls'), 'xls'); assert.strictEqual(Toplu.turBul('a.png'), 'bilinmiyor');
});

function zipDeflate(files) {
  const locals = [], cds = []; let off = 0;
  const crc = (b) => { let r = 0xFFFFFFFF; for (const x of b) { let c = (r ^ x) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); r = (r >>> 8) ^ c; } return (r ^ 0xFFFFFFFF) >>> 0; };
  for (const [ad, ic] of Object.entries(files)) {
    const raw = Buffer.from(ic), def = zlib.deflateRawSync(raw), nm = Buffer.from(ad), c = crc(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034B50, 0); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(c, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    locals.push(lh, nm, def);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014B50, 0); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(c, 16); ch.writeUInt32LE(def.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    cds.push(ch, nm); off += 30 + nm.length + def.length;
  }
  const cd = Buffer.concat(cds), eo = Buffer.alloc(22), n = Object.keys(files).length;
  eo.writeUInt32LE(0x06054B50, 0); eo.writeUInt16LE(n, 8); eo.writeUInt16LE(n, 10); eo.writeUInt32LE(cd.length, 12); eo.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...locals, cd, eo]));
}

test('toplu: XLSX okuyucu (stored/inlineStr, deflate+sharedStrings, bozuk dosya)', async () => {
  const x1 = D.donusturIkili('xlsx', [{ sira: '0012', seri: 'S', barkod: 'TO1' }, { sira: '7', seri: 'S', barkod: 'TO2' }]);
  const r1 = await Toplu.xlsxIlkSutun(x1);
  assert.deepStrictEqual(r1.kayitlar.map((k) => k.deger), ['Sira No', '0012', '7']);
  const sh = '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>9</v></c></row><row r="3"><c r="A3"><v>15</v></c></row><row r="4"><c r="A4" s="1"/></row></sheetData></worksheet>';
  const ss = '<sst><si><t>Barkod</t></si><si><r><t>TO&amp;9</t></r></si></sst>';
  const r2 = await Toplu.xlsxIlkSutun(zipDeflate({ 'xl/worksheets/sheet1.xml': sh, 'xl/sharedStrings.xml': ss }));
  assert.deepStrictEqual(r2.kayitlar.map((k) => k.deger), ['Barkod', 'TO&9', '15']);
  await assert.rejects(() => Toplu.xlsxIlkSutun(new Uint8Array([1, 2, 3])), (e) => e.kod === 'xlsx-bozuk');
  // DecompressionStream yoksa kodlu hata (arayüz "CSV'ye çevirip yükleyin" der)
  await assert.rejects(() => Toplu.xlsxIlkSutun(zipDeflate({ 'xl/worksheets/sheet1.xml': sh }), { inflate: async () => { const e = new Error('x'); e.kod = 'xlsx-sikistirma-yok'; throw e; } }), (e) => e.kod === 'xlsx-sikistirma-yok');
  assert.match(betik, /xlsx-sikistirma-yok/); assert.match(sablon, /CSV\\'ye çevirip yükleyin/);
  assert.match(betik, /FileReader/);
});

// ---- 4) Doğrulama ----
test('doğrula: sınıflar tam bir kez sayılır, rapor CSV formül enjeksiyonuna karşı', () => {
  const c = calisma({ son: 100 }), iyi = K.barkodMetni(5, c), iyi2 = K.barkodMetni(6, c), dis = K.barkodMetni(500, c);
  const luhn = iyi.slice(0, -1) + ((Number(iyi.slice(-1)) + 1) % 10);
  const girdi = [iyi, iyi, luhn, 'XX' + iyi.slice(2), iyi2.slice(0, -2), 'TO0' + iyi.slice(3), iyi2, dis, '=cmd'].map((d, i) => ({ satir: i + 1, deger: d }));
  const s = Dogrula.denetle(girdi, c, { bas: 1, son: 100, coz: (m) => K.coz(m, c) });
  assert.deepStrictEqual(s.ozet, { toplam: 9, gecerli: 2, onek: 2, bicim: 2, luhn: 1, yinelenen: 1, aralik: 1, hatali: 7 });
  assert.strictEqual(s.ozet.gecerli + s.ozet.hatali, s.ozet.toplam);
  assert.strictEqual(s.hatalar.length, 7);
  const csv = Dogrula.raporCsv(s.hatalar);
  assert.ok(csv.startsWith('﻿Satir;Deger;Hata turu;Aciklama\r\n'));
  assert.ok(csv.includes("'=cmd"));
  assert.deepStrictEqual(Dogrula.satirlaraBol('a\n\n b\r\nc').map((x) => x.satir), [1, 3, 4]);
  assert.strictEqual(Dogrula.denetle([{ satir: 1, deger: dis }], c, {}).ozet.gecerli, 1); // kelime/aralık yoksa aralık denetlenmez
  ['dogrulaMetin', 'dogrulaCalistir', 'dogrulaRapor', 'dgAralik'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
});

// ---- 5) Geçmiş ----
test('geçmiş: 50 kayıt sınırı, bellek yedeği, JSON dışa/içe, ANAHTAR KELİME ASLA kaydedilmez', () => {
  const dep = bellekDepo(), g = Gecmis.olustur(dep);
  const c = calisma();
  for (let i = 0; i < 60; i++) g.ekle({ seriAdi: 'S' + i, bas: i, son: i + 10, standart: 'code128', uzunluk: 12, adet: 11, kelime: 'GIZLIKELIME', anahtar: 'GIZLIKELIME', c });
  assert.strictEqual(g.listele().length, 50);
  assert.strictEqual(g.listele()[0].seriAdi, 'S59');
  const ham = JSON.stringify(dep.m) + g.disaAktar();
  assert.ok(!/GIZLIKELIME|kelime|anahtar/i.test(ham));
  assert.deepStrictEqual(Object.keys(g.listele()[0]).sort(), ['adet', 'bas', 'seriAdi', 'son', 'standart', 'tarih', 'uzunluk']);
  assert.ok(!JSON.stringify(g.listele()).includes('deneme')); // çalışma kuralındaki kelime sızmaz
  const dis = g.disaAktar(), g2 = Gecmis.olustur(bellekDepo());
  const r = g2.iceAktar(dis); assert.strictEqual(r.eklenen, 50);
  assert.throws(() => g2.iceAktar('{bozuk'), /JSON/); assert.throws(() => g2.iceAktar('[1]'.repeat(1) + 'x'), /JSON/);
  assert.strictEqual(g2.iceAktar(JSON.stringify([{ x: 1 }, { tarih: 'x' }])).atlanan, 2);
  g.temizle(); assert.strictEqual(g.listele().length, 0);
  // localStorage yok ya da hata veriyor -> bellekte çalışır
  const bozuk = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const gb = Gecmis.olustur(bozuk); gb.ekle({ seriAdi: 'A', bas: 1, son: 2, standart: 'qr', uzunluk: 9 });
  assert.strictEqual(gb.listele().length, 1);
  const gn = Gecmis.olustur(null); gn.ekle({ seriAdi: 'A', bas: 1, son: 2, standart: 'qr', uzunluk: 9 }); assert.strictEqual(gn.kalici(), false);
  // arayüz: geçmişe yalnızca beyaz liste alanları verilir, kelime geçirilmez, localStorage doğrudan kullanılmaz
  const cagri = betik.match(/gecmis\.ekle\(\{[^}]*\}\)/)[0];
  assert.ok(!/kelime/i.test(cagri));
  assert.ok(!/localStorage/.test(fs.readFileSync(path.join(kok, 'src/gecmis.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')));
  ['gecmisTemizle', 'gecmisDisa', 'gecmisIce', 'gecmisYenile', 'gecmisTablo'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
});

// ---- 6) Kamera ----
test('kamera: destek, hata kodları, değer temizleme, akış durdurma (sahte ortam)', async () => {
  assert.deepStrictEqual(Tara.destek({}), { kamera: false, detector: false, gorsel: false, guvenli: true });
  assert.strictEqual(Tara.hataKodu({ name: 'NotAllowedError' }), 'izin');
  assert.strictEqual(Tara.hataKodu({ name: 'NotFoundError' }), 'kamera-yok');
  assert.strictEqual(Tara.hataKodu({ name: 'NotReadableError' }), 'mesgul');
  assert.strictEqual(Tara.degerSec([{ rawValue: ' ' }, { rawValue: 'TO\u0001123 ' }]), 'TO123');
  let durdu = 0, srcNull = false;
  class Det { static async getSupportedFormats() { return ['qr_code']; } async detect() { return [{ rawValue: 'TO42' }]; } }
  const env = { navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() { durdu++; } }] }) } }, BarcodeDetector: Det, isSecureContext: true };
  const video = { play: async () => {}, set srcObject(v) { srcNull = v === null; }, get srcObject() { return 1; } };
  const bulunan = await new Promise((res, rej) => { Tara.kameraAc(env, video, { aralik: 5, tamam: res, hata: rej }).catch(rej); });
  assert.strictEqual(bulunan, 'TO42'); assert.strictEqual(durdu, 1); assert.ok(srcNull);
  const o = await Tara.kameraAc(Object.assign({}, env, { BarcodeDetector: class { async detect() { return []; } } }), video, { aralik: 5 });
  o.durdur(); assert.strictEqual(durdu, 2);
  const red = { navigator: { mediaDevices: { getUserMedia: async () => { const e = new Error('r'); e.name = 'NotAllowedError'; throw e; } } }, BarcodeDetector: Det };
  await assert.rejects(() => Tara.kameraAc(red, video, {}), (e) => e.kod === 'izin');
  await assert.rejects(() => Tara.kameraAc({ navigator: {} }, video, {}), (e) => e.kod === 'destek-yok');
  const dosya = await Tara.dosyadanOku({ BarcodeDetector: Det, createImageBitmap: async () => ({ close() {} }) }, {});
  assert.strictEqual(dosya, 'TO42');
  await assert.rejects(() => Tara.dosyadanOku({ BarcodeDetector: class { async detect() { return []; } }, createImageBitmap: async () => ({}) }, {}), (e) => e.kod === 'okunamadi');
  assert.match(sablon, /id="kameraAc"/); assert.match(sablon, /id="gorselSec"/);
  assert.match(betik, /kameraDurdur\(\)/);
  assert.ok(sablon.includes("default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:\""), 'CSP değişmedi: getUserMedia/srcObject media-src gerektirmez');
});

// ---- 7) Parolalı yedek ----
test('yedek: gidiş-dönüş, yanlış parola, kelime yok, rastgele tuz/iv, yineleme >= 310000', async () => {
  const k = Object.assign(K.varsayilan(), { onek: 'ZZ', seriAdi: 'Parti', kelime: 'GIZLIKELIME' });
  const j1 = await Yedek.sifrele(k, 'parola-1234'), j2 = await Yedek.sifrele(k, 'parola-1234');
  const o = JSON.parse(j1);
  assert.strictEqual(o.surum, 1); assert.ok(o.yineleme >= 310000); assert.ok(Yedek.YINELEME_MIN >= 310000);
  assert.notStrictEqual(o.tuz, JSON.parse(j2).tuz); assert.notStrictEqual(o.iv, JSON.parse(j2).iv);
  assert.ok(!/GIZLIKELIME|kelime|ZZ|Parti/.test(j1));
  const r = await Yedek.coz(j1, 'parola-1234');
  assert.strictEqual(r.kural.onek, 'ZZ'); assert.strictEqual(r.kural.seriAdi, 'Parti'); assert.ok(!('kelime' in r.kural));
  await assert.rejects(() => Yedek.coz(j1, 'yanlis-parola'), (e) => e.kod === 'parola' && /yanlış/.test(e.message));
  const kurcala = JSON.parse(j1); kurcala.yineleme = 310001;
  await assert.rejects(() => Yedek.coz(JSON.stringify(kurcala), 'parola-1234'), (e) => e.kod === 'parola');
  const zayif = JSON.parse(j1); zayif.yineleme = 1000;
  await assert.rejects(() => Yedek.coz(JSON.stringify(zayif), 'parola-1234'), (e) => e.kod === 'yineleme');
  await assert.rejects(() => Yedek.sifrele(k, 'kisa'), (e) => e.kod === 'parola-kisa');
  await assert.rejects(() => Yedek.coz('{}', 'x'), (e) => e.kod === 'bozuk');
  await assert.rejects(() => Yedek.sifrele(k, 'parola-1234', { yineleme: 1000 }), (e) => e.kod === 'yineleme');
  assert.match(sablon, /kurtarma yolu yoktur|hiçbir yolu yoktur/);
  assert.ok(!/localStorage|setItem/.test(fs.readFileSync(path.join(kok, 'src/yedek.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')));
});

// ---- 8) Çoklu dil ----
test('dil: başlangıç dili, depo (try/catch), biçimli metin, çeviri ve hata çevirisi', () => {
  assert.strictEqual(Dil.baslangicDil(null, ['en-US']), 'en');
  assert.strictEqual(Dil.baslangicDil(null, ['tr-TR', 'en']), 'tr');
  assert.strictEqual(Dil.baslangicDil('tr', ['en-US']), 'tr');
  assert.strictEqual(Dil.baslangicDil('xx', ['de']), 'tr');
  const dep = bellekDepo(), d = Dil.olustur(dep, ['en-GB']);
  assert.strictEqual(d.dil(), 'en');
  d.sec('tr'); assert.strictEqual(dep.m['barkod-dil'], 'tr');
  assert.strictEqual(Dil.olustur(dep, ['en']).dil(), 'tr');
  assert.throws(() => d.sec('fr'));
  assert.strictEqual(Dil.olustur(null, []).dil(), 'tr');
  assert.strictEqual(d.t('t.kopyalandi', 'Kopyalandı.'), 'Kopyalandı.');
  d.sec('en');
  assert.strictEqual(d.t('t.kopyalandi', 'Kopyalandı.'), 'Copied.');
  assert.strictEqual(d.t('cz.gecerli', 'x {0}', 7), 'Valid barcode. Sequence no.: 7');
  assert.deepStrictEqual(Dil.parcala('a [b]x[/b] [k]Ctrl[/k]'), [{ t: 'm', s: 'a ' }, { t: 'b', s: 'x' }, { t: 'm', s: ' ' }, { t: 'k', s: 'Ctrl' }]);
  assert.strictEqual(d.hata('Barkod "TO" önekiyle başlamıyor.'), 'The barcode does not start with the prefix "TO".');
  assert.strictEqual(d.hata('bilinmeyen ileti'), 'bilinmeyen ileti');
  assert.strictEqual(d.yontem({ id: 'feistel', ad: 'x' }).ad, 'Feistel network (SHA-256 rounds)');
  d.sec('tr'); assert.strictEqual(d.hata('Boş'), 'Boş');
});

test('dil: kodda ve HTML\'de kullanılan her anahtar/metin İngilizce sözlükte var, yer tutucular eşleşir', () => {
  const yer = (s) => (s.match(/\{\d+\}/g) || []).sort().join();
  const gorulen = new Set();
  const re = /\bT\('([^']+)',\s*'((?:[^'\\]|\\.)*)'/g; let m;
  while ((m = re.exec(betik))) {
    const tr = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    gorulen.add(m[1]);
    assert.ok(EN.m[m[1]] !== undefined, 'EN yok: ' + m[1]);
    assert.strictEqual(yer(EN.m[m[1]]), yer(tr), 'yer tutucu farkı: ' + m[1]);
  }
  Object.keys(EN.m).forEach((k) => assert.ok(gorulen.has(k) || /^(al|kat|dosya\.k)\./.test(k), 'kullanılmayan anahtar: ' + k));
  // statik HTML: yaprak öğelerin metni sözlükte (Türkçe metin anahtar)
  const govde = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
  const yaprak = /<(p|h[1-6]|li|label|summary|legend|dt|dd|button|div|option|th)\b([^>]*)>((?:[^<]|<(?:strong|kbd|code)>[^<]*<\/(?:strong|kbd|code)>)+)<\/\1>/g;
  const atla = /id="(goster|onizGoster|indirYazi|disaListeDurum|durum|olcekEtiket|surumNo)"|value="(tr|en)"/;
  let say = 0, h;
  while ((h = yaprak.exec(govde))) {
    const t = h[3].replace(/<strong>(.*?)<\/strong>/g, '[b]$1[/b]').replace(/<kbd>(.*?)<\/kbd>/g, '[k]$1[/k]').replace(/<code>(.*?)<\/code>/g, '[c]$1[/c]').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(t.replace(/\[\/?[bkc]\]/g, '')) || atla.test(h[2]) || t.trim() === 'TAARKOD') continue;
    if (/\bTürkçe\b|^English$|^Seri-?\d*$/.test(t)) continue;
    say++;
    assert.ok(EN.s[t] !== undefined, 'statik metin çevrilmemiş: ' + t.slice(0, 60));
    assert.strictEqual(Dil.parcala(EN.s[t]).map((p) => p.s).join('').length > 0, true);
  }
  assert.ok(say > 200);
  Object.values(EN.s).forEach((v) => assert.ok(v && v.length));
  ['code128', 'code39', 'code93', 'qr', 'datamatrix'].forEach((id) => assert.ok(EN.standart[id]));
  D.BICIMLER.forEach((b) => assert.ok(EN.bicim[b.id], b.id));
  require('../src/yontemler.js').YONTEMLER.forEach((y) => assert.ok(EN.yontem[y.id], y.id));
});

test('dil: arayüz anahtarı, aria güncellemesi, depo erişimi modülde (betikte localStorage yok)', () => {
  assert.match(sablon, /<select id="dil">/);
  assert.match(sablon, /<option value="tr">Türkçe<\/option><option value="en">English<\/option>/);
  assert.match(betik, /setAttribute\(h\.ad,en!==null\?en:h\.tr\)/);
  assert.match(betik, /document\.documentElement\.lang=l/);
  assert.ok(!/localStorage/.test(betik.replace(/window\.localStorage\.(get|set)Item\((TEMA_ANAHTAR|GOR_ANAHTAR)[^)]*\)/g, '')));
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(betik));
});

test('build: yeni modüller çıktıya gömülü, ağ erişimi yok', () => {
  require('node:child_process').execFileSync(process.execPath, [path.join(kok, 'build.js')], { cwd: kok });
  const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  ['BarkodDepo', 'BarkodGecmis', 'BarkodToplu', 'BarkodDogrula', 'BarkodEtiket', 'BarkodTara', 'BarkodYedek', 'BarkodDilEN', 'BarkodDil'].forEach((a) => assert.ok(cikti.includes('kok.' + a + ' = '), a));
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|importScripts/.test(cikti.slice(cikti.lastIndexOf('<script>'))));
  assert.strictEqual((cikti.match(/<script>/g) || []).length, 2);
});
