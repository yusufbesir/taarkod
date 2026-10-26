'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../src/barkod.js');

const bit = (m) => m.map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(w)).join('');
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const R = L.map((x) => x.split('').map((c) => (c === '1' ? '0' : '1')).join(''));
const G = R.map((x) => x.split('').reverse().join(''));

// Bağımsız çözücü: bit dizisinden rakam okur (L/G/R tabloları test içinde türetilir, kaynaktan alınmaz)
function oku(b, bas, say, tablolar) {
  let s = '', par = '';
  for (let i = 0; i < say; i++) {
    const p = b.slice(bas + i * 7, bas + i * 7 + 7);
    let ok = false;
    for (const [ad, t] of tablolar) { const ix = t.indexOf(p); if (ix >= 0) { s += ix; par += ad; ok = true; break; } }
    assert.ok(ok, 'desen yok: ' + p);
  }
  return [s, par];
}

test('EAN-8: bilinen örnek 96385074, 67 modül, gidiş-dönüş', () => {
  assert.strictEqual(B.ean8('9638507').govde, '96385074');
  const k = B.ean8('96385074'), b = bit(k.moduller);
  assert.strictEqual(b.length, 67);
  assert.strictEqual(b.slice(0, 3), '101'); assert.strictEqual(b.slice(31, 36), '01010'); assert.strictEqual(b.slice(64), '101');
  assert.strictEqual(oku(b, 3, 4, [['L', L]])[0] + oku(b, 36, 4, [['R', R]])[0], '96385074');
  assert.throws(() => B.ean8('96385075'), /kontrol rakamı hatalı/);
  assert.throws(() => B.ean8('123'), /7 rakam/);
});

test('UPC-A: 042100005264, 95 modül; EAN-13 ile 0 önekli aynı desen', () => {
  assert.strictEqual(B.upca('04210000526').govde, '042100005264');
  const k = B.upca('042100005264'), b = bit(k.moduller);
  assert.strictEqual(b.length, 95);
  assert.strictEqual(oku(b, 3, 6, [['L', L]])[0] + oku(b, 50, 6, [['R', R]])[0], '042100005264');
  assert.strictEqual(b, bit(B.ean13('0042100005264').moduller));
  assert.throws(() => B.upca('042100005265'), /kontrol rakamı hatalı/);
});

test('UPC-E: sıfır bastırma kuralları, kontrol rakamı ve parite', () => {
  // Wikipedia örneği: UPC-A 04210000526 4 <-> UPC-E 0 425261 4
  const k = B.upce('0425261'); assert.strictEqual(k.govde, '04252614'); assert.strictEqual(k.upcA, '042100005264');
  assert.strictEqual(B.upce('425261').govde, '04252614');
  assert.strictEqual(B.upce('04252614').govde, '04252614');
  const b = bit(k.moduller);
  assert.strictEqual(b.length, 51); assert.strictEqual(b.slice(0, 3), '101'); assert.strictEqual(b.slice(45), '010101');
  const [rak, par] = oku(b, 3, 6, [['O', L], ['E', G]]);
  assert.strictEqual(rak, '425261');
  assert.strictEqual(par, 'EOEEOO'); // sistem 0, kontrol 4
  // diğer sıfır bastırma sınıfları: son rakam 3, 4 ve 5-9
  assert.strictEqual(B.upce('0123453').upcA.slice(0, 11), '01230000045');
  assert.strictEqual(B.upce('0123454').upcA.slice(0, 11), '01234000005');
  assert.strictEqual(B.upce('0123455').upcA.slice(0, 11), '01234500005');
  // sistem 1: parite, aynı kontrol rakamlı sistem 0 düzeninin tersidir (bağımsız tablo)
  const P0 = ['EEEOOO', 'EEOEOO', 'EEOOEO', 'EEOOOE', 'EOEEOO', 'EOOEEO', 'EOOOEE', 'EOEOEO', 'EOEOOE', 'EOOEOE'];
  const ters = (p) => p.split('').map((c) => (c === 'E' ? 'O' : 'E')).join('');
  const k1 = B.upce('1425261'), kc = Number(k1.govde.charAt(7));
  assert.strictEqual(k1.govde.charAt(0), '1');
  assert.strictEqual(oku(bit(k1.moduller), 3, 6, [['O', L], ['E', G]])[1], ters(P0[kc]));
  assert.strictEqual(oku(bit(B.upce('0425261').moduller), 3, 6, [['O', L], ['E', G]])[1], P0[4]);
  assert.throws(() => B.upce('2425261'), /0 ya da 1/);
  assert.throws(() => B.upce('04252615'), /kontrol rakamı hatalı/);
  assert.throws(() => B.upce('12345'), /6 rakam/);
});

test('EAN-5 ve EAN-2: başlangıç 1011, ayraç 01, parite tabloları', () => {
  const b5 = bit(B.ean5('52495').moduller);
  assert.strictEqual(b5.length, 47); assert.strictEqual(b5.slice(0, 4), '1011');
  const d5 = []; let ix = 4;
  for (let i = 0; i < 5; i++) { if (i) { assert.strictEqual(b5.slice(ix, ix + 2), '01'); ix += 2; } d5.push(b5.slice(ix, ix + 7)); ix += 7; }
  const [rak5, par5] = oku(d5.join(''), 0, 5, [['L', L], ['G', G]]);
  assert.strictEqual(rak5, '52495');
  assert.strictEqual(par5, 'GLGLL'); // (3*(5+4+5)+9*(2+9)) % 10 = 1
  const b2 = bit(B.ean2('05').moduller);
  assert.strictEqual(b2.length, 20); assert.strictEqual(b2.slice(0, 4), '1011'); assert.strictEqual(b2.slice(11, 13), '01');
  assert.strictEqual(oku(b2.slice(4, 11) + b2.slice(13), 0, 2, [['L', L], ['G', G]]).join(), '05,LG'); // 5 % 4 = 1
  const b12 = bit(B.ean2('12').moduller);
  assert.strictEqual(oku(b12.slice(4, 11) + b12.slice(13), 0, 2, [['L', L], ['G', G]])[1], 'LL'); // 12 % 4 = 0 -> LL ... kontrol aşağıda
  assert.throws(() => B.ean5('1234'), /tam 5 rakam/);
  assert.throws(() => B.ean2('123'), /tam 2 rakam/);
  assert.throws(() => B.ean2('1a'), /yalnızca rakam/);
});

test('MSI: bilinen sağlama değerleri ve ikili kodlama', () => {
  assert.strictEqual(B.msi('1234567').govde, '1234567');
  assert.strictEqual(B.msi('1234567', { sagla: 'mod10' }).govde, '12345674');
  assert.strictEqual(B.msi('1234567', { sagla: 'mod1010' }).govde, '123456741');
  assert.strictEqual(B.msi('1234567', { sagla: 'mod11' }).govde, '12345674');
  assert.throws(() => B.msi('1234567', { sagla: 'mod11x' }), /bilinmeyen sağlama/);
  const k = B.msi('12'), b = bit(k.moduller);
  assert.ok(b.startsWith('110')); assert.ok(b.endsWith('1001'));
  // 1 = 0001 -> 100 100 100 110; 2 = 0010 -> 100 100 110 100
  assert.strictEqual(b, '110' + '100100100110' + '100100110100' + '1001');
  assert.throws(() => B.msi('12a'), /yalnızca rakam/);
});

test('Pharmacode: 3 -> iki dar çubuk, 131070 -> 16 geniş, değer aralığı', () => {
  assert.deepStrictEqual(B.pharmacode('3').moduller, [1, 2, 1]);
  const k = B.pharmacode('131070'); assert.strictEqual(k.sembolSayisi, 16);
  assert.ok(k.moduller.filter((w, i) => i % 2 === 0).every((w) => w === 3));
  // bağımsız çözüm: sağdan sola dar=1, geniş=2 ağırlıklı ikili basamaklar
  const coz = (m) => { const c = m.filter((w, i) => i % 2 === 0).reverse(); return c.reduce((t, w, i) => t + (w === 1 ? 1 : 2) * 2 ** i, 0); };
  [3, 4, 5, 100, 1234, 65535, 131070].forEach((n) => assert.strictEqual(coz(B.pharmacode(String(n)).moduller), n));
  assert.throws(() => B.pharmacode('2'), /3 ile 131070/);
  assert.throws(() => B.pharmacode('131071'), /3 ile 131070/);
  assert.throws(() => B.pharmacode('abc'), /yalnızca rakam/);
});

test('Codabar: başlangıç/bitiş, varsayılan harfler ve geçersiz karakter', () => {
  assert.strictEqual(B.codabar('12345').govde, 'A12345B');
  assert.strictEqual(B.codabar('12345', { baslangici: 'C' }).govde, 'A12345B');
  assert.strictEqual(B.codabar('12345', { baslangic: 'C', bitis: 'D' }).govde, 'C12345D');
  assert.strictEqual(B.codabar('c99d').govde, 'C99D');
  assert.throws(() => B.codabar('12x45'), /desteklenmiyor/);
  assert.throws(() => B.codabar('12345', { baslangic: 'E' }), /A, B, C ya da D/);
  const k = B.codabar('0'), m = k.moduller; // A + 0 + B: 3 * 7 eleman + 2 boşluk
  assert.strictEqual(m.length, 21 + 2);
  assert.strictEqual(m.length % 2, 1); // çubukla başlar ve biter
});

test('Code 128 A/B/C alt türleri: kabul/ret kuralları ve sağlama', () => {
  const a = B.code128('HELLO', { alt: 'A' }); assert.strictEqual(a.degerler[0], 103);
  const b = B.code128('Hello', { alt: 'B' }); assert.strictEqual(b.degerler[0], 104);
  const c = B.code128('1234', { alt: 'C' }); assert.deepStrictEqual(c.degerler.slice(0, 3), [105, 12, 34]);
  [a, b, c].forEach((k) => {
    const d = k.degerler, n = d.length - 1;
    let t = d[0]; for (let i = 1; i < n; i++) t += d[i] * i;
    assert.strictEqual(d[n], t % 103);
  });
  assert.throws(() => B.code128('Hello', { alt: 'A' }), /Code 128A/);
  assert.throws(() => B.code128('\u0001', { alt: 'B' }), /Code 128B/);
  assert.throws(() => B.code128('123', { alt: 'C' }), /çift sayıda rakam/);
  assert.throws(() => B.code128('12a4', { alt: 'C' }), /yalnızca rakam/);
  assert.deepStrictEqual(B.code128('1234', { alt: 'auto' }).degerler, B.code128('1234').degerler);
  assert.ok(B.code128('A\u0001', { alt: 'A' }).degerler.includes(65)); // kontrol karakteri A'da kodlanır
});

test('GS1 önek bilgisi: Türkiye, özel kullanım, kupon, ISBN, UPC-A', () => {
  assert.deepStrictEqual(B.gs1OnekBilgisi('8690123456789'), { onek: '869', tur: 'ulke', ulke: 'Türkiye', ulkeEn: 'Türkiye' });
  assert.strictEqual(B.gs1OnekBilgisi('2001234567890').tur, 'ozel');
  assert.strictEqual(B.gs1OnekBilgisi('9991234567890').tur, 'kupon');
  assert.strictEqual(B.gs1OnekBilgisi('9780201379624').tur, 'kitap');
  assert.strictEqual(B.gs1OnekBilgisi('9770123456789').tur, 'dergi');
  assert.strictEqual(B.gs1OnekBilgisi('042100005264').tur, 'ulke'); // UPC-A: başına 0 eklenir -> 004 (ABD ve Kanada)
  assert.strictEqual(B.gs1OnekBilgisi('0420000000000').tur, 'ozel'); // 042
  assert.strictEqual(B.gs1OnekBilgisi('abc'), null);
});

test('kodla/svg: yeni türler SVG üretir, metin satırı yaziMetni ile değişir, bilinmeyen tür hata verir', () => {
  Object.entries({ ean8: '9638507', upca: '04210000526', upce: '0425261', ean5: '52495', ean2: '05', codabar: '123', msi: '1234', pharmacode: '1234' }).forEach(([id, v]) => {
    const s = B.svg(id, v, { yaziMetni: 'X<Y' });
    assert.match(s, /^<svg /); assert.match(s, /X&lt;Y/); assert.ok(!/X<Y/.test(s));
    assert.strictEqual(B.uygunMu(id, v).uygun, true);
  });
  assert.throws(() => B.kodla('yok', '1'), /Bilinmeyen/);
  assert.strictEqual(B.standartlarYeni.length, 8);
  B.standartlarYeni.concat(B.standartlar, B.standartlarGs1).forEach((s) => assert.ok(s.girdi && s.aciklama, s.id));
});

test('arayüz: Barkod türleri sekmesi (s10/p10), kelimesiz, innerHTML yok, EN sözlüğü', () => {
  const sablon = fs.readFileSync(path.join(__dirname, '../src/sablon.html'), 'utf8');
  assert.match(sablon, /id="s10"[^>]*aria-controls="p10"/);
  assert.match(sablon, /id="p10"[^>]*aria-labelledby="s10"/);
  ['turSec', 'turVeri', 'turAlt128', 'turMsi', 'turCbBas', 'turCbBit', 'turOrnek', 'turIndir', 'turPng', 'turDpi', 'hataTur', 'turSvg', 'turBilgi', 'turGs1', 'yardimTurler'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
  assert.match(sablon, /n===9\|\|n===10/);
  const bolum = sablon.slice(sablon.indexOf('/* ---------- barkod türleri sekmesi'), sablon.indexOf('/* ---------- sekmeler'));
  assert.ok(!/innerHTML/.test(bolum));
  const EN = require('../src/dil_en.js');
  B.standartlarYeni.forEach((s) => { assert.ok(EN.standart[s.id] && EN.standart[s.id].girdi && EN.standart[s.id].aciklama, s.id); });
  ['ean13', 'itf14', 'code128', 'code39', 'code93'].forEach((id) => assert.ok(EN.standart[id].girdi, id));
});

test('EN: yeni kodlayıcıların hata iletileri çevrilir', () => {
  const Dil = require('../src/dil.js');
  const hatalar = [
    () => B.ean8('96385075'), () => B.upca('1'), () => B.upce('2425261'), () => B.ean5('1'), () => B.ean2('123'),
    () => B.codabar('1x'), () => B.codabar('1', { baslangic: 'Z' }), () => B.msi('1a'), () => B.msi('1234567', { sagla: 'x' }),
    () => B.pharmacode('2'), () => B.code128('123', { alt: 'C' }), () => B.code128('Hello', { alt: 'A' }), () => B.code128('\u0001', { alt: 'B' })
  ];
  hatalar.forEach((f) => {
    let m = null; try { f(); } catch (e) { m = e.message; }
    assert.ok(m, 'hata bekleniyordu');
    const en = Dil.hataCevirEN(m);
    assert.notStrictEqual(en, m, 'çevrilmemiş: ' + m);
    assert.ok(!/[ığşçöüİĞŞÇÖÜ]/.test(en), 'Türkçe kaldı: ' + en);
  });
});
