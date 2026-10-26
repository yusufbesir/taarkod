'use strict';
const test = require('node:test');
const assert = require('node:assert');
const B = require('../src/barkod.js');

const topla = (a) => a.reduce((x, y) => x + y, 0);
const bitler = (m) => m.map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(w)).join('');

// Test içi bağımsız çözücüler
function cozEan13(moduller) {
  const b = bitler(moduller);
  assert.strictEqual(b.length, 95);
  assert.strictEqual(b.slice(0, 3), '101'); assert.strictEqual(b.slice(45, 50), '01010'); assert.strictEqual(b.slice(92), '101');
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const R = L.map((x) => x.split('').map((c) => (c === '1' ? '0' : '1')).join(''));
  const G = R.map((x) => x.split('').reverse().join('')); // G = R'nin ters hâli
  const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  let sol = '', parite = '';
  for (let i = 0; i < 6; i++) {
    const p = b.slice(3 + i * 7, 10 + i * 7);
    if (L.indexOf(p) >= 0) { sol += L.indexOf(p); parite += 'L'; } else { assert.ok(G.indexOf(p) >= 0, 'sol desen'); sol += G.indexOf(p); parite += 'G'; }
  }
  let sag = '';
  for (let i = 0; i < 6; i++) { const p = b.slice(50 + i * 7, 57 + i * 7); assert.ok(R.indexOf(p) >= 0, 'sağ desen'); sag += R.indexOf(p); }
  assert.ok(PAR.indexOf(parite) >= 0, 'parite');
  return PAR.indexOf(parite) + sol + sag;
}

function cozItf(moduller) {
  assert.deepStrictEqual(moduller.slice(0, 4), [1, 1, 1, 1]);
  assert.deepStrictEqual(moduller.slice(-3), [3, 1, 1]);
  const ic = moduller.slice(4, -3);
  const D = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn'];
  let m = '';
  for (let i = 0; i < ic.length; i += 10) {
    let a = '', c = '';
    for (let e = 0; e < 5; e++) { a += ic[i + 2 * e] === 3 ? 'w' : 'n'; c += ic[i + 2 * e + 1] === 3 ? 'w' : 'n'; }
    assert.ok(D.indexOf(a) >= 0 && D.indexOf(c) >= 0, 'ITF deseni');
    m += D.indexOf(a) + '' + D.indexOf(c);
  }
  return m;
}

test('GS1 kontrol rakamı bilinen örnekler', () => {
  assert.strictEqual(B.gs1Sagla('400638133393'), 1);
  assert.strictEqual(B.gs1Sagla('590123412345'), 7);
  assert.strictEqual(B.gs1Sagla('1001234567890'), 2);
});

test('EAN-13 gidiş-dönüş, 95 modül, kontrol rakamı', () => {
  ['4006381333931', '5901234123457', '0123456789012'.slice(0, 12), '978020137962'].forEach((m) => {
    const k = B.ean13(m);
    assert.strictEqual(k.modulSayisi, 95);
    assert.strictEqual(topla(k.moduller), 95);
    assert.strictEqual(cozEan13(k.moduller), k.govde);
    assert.strictEqual(k.govde.length, 13);
  });
  assert.strictEqual(B.ean13('400638133393').govde, '4006381333931');
  assert.strictEqual(B.ean13('4006381333931').sagLama, '1');
  assert.strictEqual(B.ean13('978020137962').govde, '9780201379624'); // ISBN-13 (kontrol 4)
});

test('EAN-13 hatalı girdiler', () => {
  assert.throws(() => B.ean13('4006381333932'), /kontrol rakamı hatalı/);
  assert.throws(() => B.ean13('12345'), /EAN-13/);
  assert.throws(() => B.ean13('40063813339A'), /yalnızca rakam/);
  assert.throws(() => B.ean13(''), /EAN-13/);
});

test('ITF-14 gidiş-dönüş ve kontrol rakamı', () => {
  ['10012345678902', '1001234567890', '00012345678905', '5901234123457'.padStart(13, '0')].forEach((m) => {
    const k = B.itf14(m);
    assert.strictEqual(topla(k.moduller), k.modulSayisi);
    assert.strictEqual(cozItf(k.moduller), k.govde);
    assert.strictEqual(k.govde.length, 14);
    assert.strictEqual(k.govde.charAt(13), String(B.gs1Sagla(k.govde.slice(0, 13))));
  });
  assert.strictEqual(B.itf14('1001234567890').govde, '10012345678902');
  assert.throws(() => B.itf14('10012345678901'), /kontrol rakamı hatalı/);
  assert.throws(() => B.itf14('123'), /ITF-14/);
});

test('kodla / uygunMu / svg GS1 ile çalışır', () => {
  assert.strictEqual(B.kodla('ean13', '400638133393').modulSayisi, 95);
  assert.strictEqual(B.uygunMu('ean13', '400638133393').uygun, true);
  assert.strictEqual(B.uygunMu('ean13', 'TO123').uygun, false);
  assert.strictEqual(B.uygunMu('itf14', '1001234567890').uygun, true);
  const s = B.svg('ean13', '400638133393');
  assert.match(s, /^<svg /); assert.match(s, /<rect /);
  assert.ok(B.svg('itf14', '1001234567890').length > 100);
  assert.deepStrictEqual(B.standartlarGs1.map((x) => x.id), ['ean13', 'ean8', 'upca', 'itf14']);
  assert.deepStrictEqual(B.standartlar.map((x) => x.id), ['code128', 'code39', 'code93']); // arayüz listesi değişmedi
});

// ---- Kural katmanı: GS1 modu ----
const K = require('../src/kural.js');
const Dogrula = require('../src/dogrula.js');

function gs1Kural(std, onek, yontem) {
  return K.calismaKurali({ onek, standart: std, luhn: false, yontem: yontem || 'harf-karistirma', bas: 1, son: 1000, seriAdi: 'S' }, 'anahtarkelime').calisma;
}

test('GS1 kural: uzunluk sabit, luhn kapalı istense de kontrol rakamı eklenir', () => {
  const c = gs1Kural('ean13', '869');
  assert.strictEqual(c.toplamRakam, 10); // 13 - 3
  assert.strictEqual(c.luhn, true);
  const b = K.uzunlukBelirle({ onek: '869', standart: 'ean13', bas: 1, son: 1000 });
  assert.strictEqual(b.yukRakam, 9);
  assert.strictEqual(b.oneri, null);
  const c2 = gs1Kural('itf14', '1');
  assert.strictEqual(c2.toplamRakam, 13);
});

test('GS1 kural: barkod metni uzunluğu, GS1 kontrol rakamı ve gidiş-dönüş', () => {
  [['ean13', '869', 13], ['ean13', '', 13], ['itf14', '1', 14], ['itf14', '', 14]].forEach(([std, onek, uzun]) => {
    const c = gs1Kural(std, onek);
    for (let n = 1; n <= 200; n += 7) {
      const m = K.barkodMetni(n, c);
      assert.strictEqual(m.length, uzun);
      assert.ok(m.startsWith(onek) && /^\d+$/.test(m));
      assert.strictEqual(String(B.gs1Sagla(m.slice(0, -1))), m.slice(-1));
      assert.doesNotThrow(() => B[std](m)); // kodlayıcı da kabul eder
      const r = K.coz(m, c);
      assert.strictEqual(r.gecerli, true, r.neden);
      assert.strictEqual(r.sira, n);
    }
  });
});

test('GS1 kural: bozuk kontrol rakamı reddedilir, doğrulama modu yakalar', () => {
  const c = gs1Kural('ean13', '869');
  const m = K.barkodMetni(5, c), kotu = m.slice(0, -1) + ((Number(m.slice(-1)) + 1) % 10);
  assert.strictEqual(K.coz(kotu, c).gecerli, false);
  assert.match(K.coz(kotu, c).neden, /GS1/);
  const d = Dogrula.denetle([{ satir: 1, deger: m }, { satir: 2, deger: kotu }], c, {});
  assert.strictEqual(d.ozet.gecerli, 1);
  assert.strictEqual(d.ozet.luhn, 1);
});

test('GS1 kural: harfli önek ve çok uzun önek hata verir', () => {
  assert.throws(() => K.uzunlukBelirle({ onek: 'TO', standart: 'ean13', bas: 1, son: 10 }), /yalnızca rakam/);
  assert.strictEqual(K.uzunlukBelirle({ onek: '12345678', standart: 'ean13', bas: 1, son: 10 }).yukRakam, 4); // en uzun önek (8) hâlâ geçerli
  assert.throws(() => K.uzunlukBelirle({ onek: '1', standart: 'ean13', bas: 1, son: 1e11 }), /sığmıyor/);
  assert.ok(K.STANDARTLAR.includes('ean13') && K.STANDARTLAR.includes('itf14'));
  assert.strictEqual(K.standartUygunMu(gs1Kural('ean13', '869')).uygun, true);
});

test('Mevcut standartlarda davranış değişmedi (Luhn)', () => {
  const c = K.calismaKurali({ onek: 'TO', standart: 'code128', luhn: true, yontem: 'harf-karistirma', bas: 1, son: 1000, seriAdi: 'S' }, 'anahtarkelime').calisma;
  const m = K.barkodMetni(3, c);
  assert.strictEqual(K.coz(m, c).sira, 3);
});
