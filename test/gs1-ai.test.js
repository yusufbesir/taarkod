'use strict';
// GS1 AI ayrıştırma + ZPL/TSPL çıktısı (src/gs1.js). Not: test/gs1.test.js EAN-13 testleridir; bu dosya ayrıdır.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../src/gs1.js');
const EN = require('../src/dil_en.js');

const GTIN = '09506000134352'; // son hane mod-10 doğru
const hata = (f, re) => assert.throws(f, re);

test('kontrol hanesi: GTIN-14, SSCC, GLN', () => {
  assert.strictEqual(G.kontrolHanesi('0950600013435'), 2);
  assert.strictEqual(G.kontrolHanesi('0952123454321'), 3);
  assert.strictEqual(G.kontrolHanesi('00012345600000001'), 2); // SSCC gövdesi (17 hane)
  assert.strictEqual(G.kontrolHanesi('950110102091'), 7); // GLN
});

test('ayristir: Genel Şartname örnekleri', () => {
  const e = G.ayristir('(01)09521234543213(10)ABC123');
  assert.deepStrictEqual(e, [{ ai: '01', veri: '09521234543213' }, { ai: '10', veri: 'ABC123' }]);
  const f = G.ayristir('(01)' + GTIN + '(17)261231(10)LOT1');
  assert.strictEqual(f.length, 3);
  assert.strictEqual(G.parantezli(f), '(01)' + GTIN + '(17)261231(10)LOT1'); // gidiş-dönüş
});

test('FNC1: değişken uzunluktan sonra, sonraki varsa; sabitten sonra yok; sonda yok', () => {
  const e = G.ayristir('(01)' + GTIN + '(10)LOT1(21)S9');
  assert.strictEqual(G.birlestir(e, '|'), '01' + GTIN + '10LOT1|21S9');
  const g = G.ayristir('(10)LOT1');
  assert.strictEqual(G.birlestir(g, '|'), '10LOT1');
  const h = G.ayristir('(01)' + GTIN + '(17)261231');
  assert.strictEqual(G.birlestir(h, '|'), '01' + GTIN + '17261231');
  assert.strictEqual(G.coz('(10)A(11)261231').ham, '10A\x1d11261231');
});

test('kontrol hanesi otomatik ekleme ve yanlış hane', () => {
  assert.strictEqual(G.ayristir('(01)0950600013435', { kontrolEkle: true })[0].veri, GTIN);
  hata(() => G.ayristir('(01)0950600013435'), /uzunluk 14 hane/);
  hata(() => G.ayristir('(01)09506000134353'), /kontrol rakamı hatalı \(beklenen 2\)/);
  hata(() => G.ayristir('(414)9501101020916'), /kontrol rakamı hatalı \(beklenen 7\)/);
  assert.strictEqual(G.ayristir('(414)9501101020917')[0].ai, '414');
  assert.strictEqual(G.ayristir('(00)000123456000000012')[0].ai, '00');
});

test('tarih: ay 01-12, gün 00 serbest, gün sınırı', () => {
  assert.ok(G.tarihGecerli('261231'));
  assert.ok(G.tarihGecerli('260200'));
  assert.ok(G.tarihGecerli('240229'));
  assert.ok(!G.tarihGecerli('250229'));
  assert.ok(!G.tarihGecerli('261301'));
  assert.ok(!G.tarihGecerli('260001'));
  hata(() => G.ayristir('(17)261331'), /tarih geçersiz/);
});

test('karakter kümesi ve diğer doğrulamalar', () => {
  assert.strictEqual(G.ayristir('(10)Ab-1_.')[0].veri, 'Ab-1_.');
  hata(() => G.ayristir('(10)AB#1'), /"#" karakteri GS1 karakter kümesi/);
  hata(() => G.ayristir('(10)ĞÜ'), /karakter kümesi/);
  hata(() => G.ayristir('(11)26A231'), /yalnızca rakam/);
  hata(() => G.ayristir('(10)' + 'A'.repeat(21)), /en çok 20 karakter/);
  hata(() => G.ayristir('(9999)X'), /desteklenmiyor/);
  hata(() => G.ayristir('(10)A(10)B'), /yalnız bir kez/);
  hata(() => G.ayristir('(10)'), /boş/);
  hata(() => G.ayristir(''), /boş/);
  hata(() => G.ayristir('0109506000134352'), /parantezli biçim/);
  assert.strictEqual(G.ayristir('(3103)000123')[0].ai, '3103');
  assert.strictEqual(G.ayristir('(3202)000123')[0].veri, '000123');
  hata(() => G.ayristir('(3103)0001'), /uzunluk 6/);
});

const SEC = { dpi: 203, genisMm: 100, yukMm: 50, x: 20, y: 20, modul: 2, yukseklik: 100 };

test('ZPL GS1-128 golden', () => {
  const c = G.zpl('(01)' + GTIN + '(10)LOT1(21)S9', 'gs1-128', SEC);
  assert.strictEqual(c,
    '^XA^PW799^LL400^BY2\r\n' +
    '^FO20,20^BCN,100,N,N,N,D^FD>;>8' + '01' + GTIN + '10LOT1>821S9^FS\r\n' +
    '^FO20,128^A0N,24,24^FD(01)' + GTIN + '(10)LOT1(21)S9^FS\r\n^XZ\r\n');
  const y = G.zpl('(01)' + GTIN, 'gs1-128', Object.assign({}, SEC, { okunur: 'yerlesik' }));
  assert.ok(y.includes('^BCN,100,Y,N,N,D^FD>;>801' + GTIN + '^FS') && !y.includes('^A0N'));
});

test('ZPL GS1 DataMatrix golden', () => {
  const c = G.zpl('(01)' + GTIN + '(10)LOT1(21)S9', 'datamatrix', { dpi: 203, genisMm: 50, yukMm: 30, x: 10, y: 10, dmBoyut: 6 });
  assert.strictEqual(c,
    '^XA^PW400^LL240\r\n' +
    '^FO10,10^BXN,6,200^FD~1' + '01' + GTIN + '10LOT1~121S9^FS\r\n' +
    '^FO10,90^A0N,24,24^FD(01)' + GTIN + '(10)LOT1(21)S9^FS\r\n^XZ\r\n');
});

test('TSPL GS1-128 golden; DataMatrix desteklenmez', () => {
  const c = G.tspl('(01)' + GTIN + '(10)LOT1', 'gs1-128', SEC);
  assert.strictEqual(c,
    'SIZE 100 mm,50 mm\r\nGAP 2 mm,0 mm\r\nDIRECTION 1\r\nCLS\r\n' +
    'BARCODE 20,20,"EAN128",100,0,0,2,2,"(01)' + GTIN + '(10)LOT1"\r\n' +
    'TEXT 20,128,"2",0,1,1,"(01)' + GTIN + '(10)LOT1"\r\nPRINT 1,1\r\n');
  hata(() => G.tspl('(10)A', 'datamatrix', SEC), /DataMatrix \(FNC1\) desteklenmiyor/);
});

test('yazıcı hataları', () => {
  hata(() => G.zpl('', 'gs1-128'), /GS1: veri boş/);
  hata(() => G.zpl('(10)A', 'qr'), /yazıcı seçeneği geçersiz: tur/);
  hata(() => G.zpl('(10)A', 'gs1-128', { modul: 99 }), /modul/);
  hata(() => G.zpl('(10)A', 'gs1-128', { okunur: 'x' }), /okunur/);
  hata(() => G.zpl('(10)A>B', 'gs1-128'), /">" karakteri desteklenmiyor/);
  assert.ok(G.zpl('(10)A>B', 'datamatrix').includes('~110A>B'.slice(2)));
  hata(() => G.tspl('(10)A"B', 'gs1-128'), /çift tırnak/);
  hata(() => G.zpl('(01)' + GTIN + '(10)' + 'A'.repeat(20) + '(21)' + 'B'.repeat(20), 'gs1-128'), /en çok 48/);
});

test('TR hata iletilerinin hepsinin EN karşılığı var', () => {
  const kurallar = EN.hata.map((k) => ({ re: new RegExp(k[0]), s: k[1] }));
  const cevir = (m) => { for (const k of kurallar) if (k.re.test(m)) return m.replace(k.re, k.s); return null; };
  const denemeler = [
    () => G.ayristir(''), () => G.ayristir('x'), () => G.ayristir('(9999)X'), () => G.ayristir('(10)'), () => G.ayristir('(10)A(10)B'),
    () => G.ayristir('(10)A(B)'), () => G.ayristir('(11)26A231'), () => G.ayristir('(10)#'), () => G.ayristir('(01)1'),
    () => G.ayristir('(10)' + 'A'.repeat(21)), () => G.ayristir('(17)261331'), () => G.ayristir('(01)09506000134353'),
    () => G.zpl('(10)A', 'x'), () => G.zpl('(10)A>', 'gs1-128'), () => G.tspl('(10)A"', 'gs1-128'), () => G.tspl('(10)A', 'datamatrix'),
    () => G.zpl('(10)' + 'A'.repeat(20) + '(21)' + 'B'.repeat(20) + '(240)CC', 'gs1-128'), () => G.zpl('(10)A', 'gs1-128', { dpi: 5 })
  ];
  denemeler.forEach((f) => {
    let m = null;
    try { f(); } catch (e) { m = e.message; }
    assert.ok(m, 'hata bekleniyordu');
    const en = cevir(m);
    assert.ok(en, 'EN karşılığı yok: ' + m);
    assert.ok(!/[ğüşıöçĞÜŞİÖÇ]/.test(en.replace(/"[^"]*"/g, '')), 'EN çeviri Türkçe kaldı: ' + en);
  });
});

test('GS1: boşluk 82 kümesinde yok; 402 ve 7003 arkasından FNC1 gelir', function () {
  const G = require('../src/gs1.js');
  assert.throws(function () { G.dogrula([{ ai: '10', veri: 'A B' }]); });
  const a = G.birlestir([{ ai: '7003', veri: '2601011230' }, { ai: '10', veri: 'X1' }]);
  assert.strictEqual(a, '700326010112301 0X1'.replace(' ', '') .replace('3011230', '30112301').slice(0, 0) + '7003' + '2601011230' + '\x1d' + '10X1');
});
