'use strict';
const test = require('node:test');
const assert = require('node:assert');
const B = require('../src/barkod.js');
const core = require('../src/core.js');

const topla = (a) => a.reduce((x, y) => x + y, 0);

// ---- Test içi bağımsız çözücüler (çubuk genişliklerinden metne) ----
function cozC128(moduller) {
  const tablo = B.code128Tablo;
  const grup = [];
  for (let i = 0; i + 6 <= moduller.length - 7; i += 6) grup.push(moduller.slice(i, i + 6).join(''));
  assert.strictEqual(moduller.slice(-7).join(''), tablo[106], 'STOP deseni');
  const vals = grup.map((g) => { const v = tablo.indexOf(g); assert.ok(v >= 0 && v < 106, 'bilinmeyen desen ' + g); return v; });
  let alt = { 103: 'A', 104: 'B', 105: 'C' }[vals[0]];
  assert.ok(alt, 'start sembolü');
  let toplam = vals[0], metin = '';
  for (let p = 1; p < vals.length - 1; p++) {
    const v = vals[p];
    toplam += v * p;
    if (alt !== 'C' && v === 99) alt = 'C'; else if (v === 100) alt = 'B'; else if (v === 101) alt = 'A';
    else if (alt === 'C') metin += String(v).padStart(2, '0');
    else if (alt === 'B') metin += String.fromCharCode(v + 32);
    else metin += String.fromCharCode(v < 64 ? v + 32 : v - 64);
  }
  assert.strictEqual(toplam % 103, vals[vals.length - 1], 'mod-103 sağlama');
  return metin;
}

const C39 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
function cozC39(moduller, mod43) {
  // 15 modül genişlik (9 eleman, 3 geniş) + 1 boşluk
  const ters = {};
  const k = B.code39('X').moduller;
  assert.ok(k.length > 0);
  const sonuc = [];
  let i = 0;
  while (i < moduller.length) {
    const el = moduller.slice(i, i + 9);
    sonuc.push(el.map((w) => (w === 3 ? 'w' : 'n')).join(''));
    assert.strictEqual(el.filter((w) => w === 3).length, 3);
    i += 9;
    if (i < moduller.length) { assert.strictEqual(moduller[i], 1, 'karakter arası boşluk'); i++; }
  }
  // her desen için ters tablo: tüm 43+1 karakteri kodlayarak oluştur
  (C39 + '*').split('').forEach((c) => {
    if (c === '*') return;
    const m = B.code39(c).moduller.slice(10, 19).map((w) => (w === 3 ? 'w' : 'n')).join('');
    ters[m] = c;
  });
  assert.strictEqual(sonuc[0], 'nwnnwnwnn'); assert.strictEqual(sonuc[sonuc.length - 1], 'nwnnwnwnn');
  let m = sonuc.slice(1, -1).map((d) => { assert.ok(ters[d], 'bilinmeyen desen'); return ters[d]; }).join('');
  if (mod43) {
    const veri = m.slice(0, -1);
    assert.strictEqual(C39[topla(veri.split('').map((c) => C39.indexOf(c))) % 43], m.slice(-1));
    m = veri;
  }
  return m;
}

function cozC93(moduller) {
  let bit = '';
  moduller.forEach((w, i) => { bit += (i % 2 === 0 ? '1' : '0').repeat(w); });
  assert.strictEqual(bit.slice(-1), '1'); bit = bit.slice(0, -1);
  assert.strictEqual(bit.length % 9, 0);
  const yildiz = '101011110';
  assert.strictEqual(bit.slice(0, 9), yildiz); assert.strictEqual(bit.slice(-9), yildiz);
  const ters = {};
  (C39.split('')).forEach((c) => {
    const k = B.code93(c).moduller; let b = '';
    k.forEach((w, i) => { b += (i % 2 === 0 ? '1' : '0').repeat(w); });
    ters[b.slice(9, 18)] = c;
  });
  ['100100110', '111011010', '111010110', '100110010'].forEach((d, i) => { ters[d] = '#' + i; });
  const govde = [];
  for (let i = 9; i < bit.length - 9; i += 9) { const g = bit.slice(i, i + 9); assert.ok(ters[g], 'bilinmeyen desen'); govde.push(ters[g][0] === '#' ? 43 + Number(ters[g][1]) : C39.indexOf(ters[g])); }
  const v = govde.slice(0, -2), c = govde[govde.length - 2], k = govde[govde.length - 1];
  const sag = (d, tavan) => { let t = 0; d.slice().reverse().forEach((x, i) => { t += x * ((i % tavan) + 1); }); return t % 47; };
  assert.strictEqual(c, sag(v, 20)); assert.strictEqual(k, sag(v.concat([c]), 15));
  return v.map((x) => C39[x]).join('');
}

function ornekMetinler() {
  const l = [];
  for (let n = 8; n <= 30; n++) l.push('TO' + '0123456789'.repeat(4).slice(0, n - 1) + '7');
  for (let n = 0; n <= 9; n++) l.push('TO' + String(n).repeat(11) + n, 'TO' + String(n).repeat(10) + n);
  l.push('TO123456789012', 'TO12345678901', 'TO1', 'TO12', 'TO123', 'TO1234');
  return l;
}

test('Code 128 desen tablosu: 107 giriş, 6 eleman/11 modül, stop 7 eleman/13 modül', () => {
  const t = B.code128Tablo;
  assert.strictEqual(t.length, 107);
  for (let i = 0; i < 106; i++) {
    const e = t[i].split('').map(Number);
    assert.strictEqual(e.length, 6, 'eleman ' + i); assert.strictEqual(topla(e), 11, 'modül ' + i);
  }
  const s = t[106].split('').map(Number);
  assert.strictEqual(s.length, 7); assert.strictEqual(topla(s), 13);
  assert.strictEqual(new Set(t).size, 107, 'desenler benzersiz');
});

test('Code 128 referans sağlama değerleri', () => {
  // "Hello": 104 + 40*1 + 69*2 + 76*3 + 76*4 + 79*5 = 1209; 1209 mod 103 = 76
  const h = B.code128('Hello');
  assert.deepStrictEqual(h.degerler, [104, 40, 69, 76, 76, 79, 76]);
  assert.strictEqual(h.sembolSayisi, 8); assert.strictEqual(h.modulSayisi, 11 * 7 + 13);
  // "1234" Start C: 105 + 12 + 34*2 = 185; 185 mod 103 = 82
  assert.deepStrictEqual(B.code128('1234').degerler, [105, 12, 34, 82]);
  // Wikipedia örneği: Start A, "PJJ123C" -> sağlama 54
  // Wikipedia: Start A ile "PJJ123C" -> 54; biz B seçtiğimiz için başlangıç 104 (fark +1)
  assert.strictEqual(B.code128('PJJ123C').sagLama, 55);
});

test('Code 128 en kısa kodlama kuralları', () => {
  // TO + 12 rakam: Start B, T, O, Code C, 6 çift, sağlama, stop
  const a = B.code128('TO123456789012');
  assert.deepStrictEqual(a.degerler.slice(0, 4), [104, 52, 47, 99]);
  assert.strictEqual(a.sembolSayisi, 1 + 2 + 1 + 6 + 1 + 1);
  // tek sayıda rakam: ilk rakam B'de kalır
  const b = B.code128('TO12345');
  assert.deepStrictEqual(b.degerler.slice(0, 5), [104, 52, 47, 17, 99]);
  // 3 rakam C'ye geçirilmez
  assert.ok(!B.code128('TO123').degerler.includes(99));
  // sadece rakam, çift: Start C
  assert.strictEqual(B.code128('123456').degerler[0], 105);
  // karma
  assert.strictEqual(cozC128(B.code128('ab12345678cd').moduller), 'ab12345678cd');
});

test('Code 128 gidiş-dönüş: TO + rakamlar, uzunluk 8..30', () => {
  ornekMetinler().forEach((m) => assert.strictEqual(cozC128(B.code128(m).moduller), m, m));
  for (let n = 0; n <= 9; n++) {
    const m = 'TO' + String(n).repeat(9) + '5';
    assert.strictEqual(cozC128(B.code128(m).moduller), m);
  }
  // kontrol karakteri (Alt küme A)
  assert.strictEqual(cozC128(B.code128('A\tB').moduller), 'A\tB');
  // Luhn'lu gerçek barkod
  const yuk = '48271950362'; const tam = core.barkodUret ? 'TO' + yuk + core.luhnRakami(yuk) : 'TO' + yuk;
  assert.strictEqual(cozC128(B.code128(tam).moduller), tam);
});

test('Code 128 geçersiz karakter ve boş metin', () => {
  assert.throws(() => B.code128('TOğ1'), /Code 128/);
  assert.throws(() => B.code128(''), /boş/);
});

test('Code 39 gidiş-dönüş ve mod-43', () => {
  ornekMetinler().forEach((m) => {
    assert.strictEqual(cozC39(B.code39(m).moduller, false), m);
    assert.strictEqual(cozC39(B.code39(m, { mod43: true }).moduller, true), m);
  });
  assert.strictEqual(cozC39(B.code39('A-Z $/+%.').moduller, false), 'A-Z $/+%.');
  // bilinen örnek: CODE39 -> sağlama W
  assert.strictEqual(B.code39('CODE39', { mod43: true }).sagLama, 'W');
  const k = B.code39('TO123');
  assert.strictEqual(k.sembolSayisi, 7); assert.strictEqual(k.modulSayisi, 7 * 15 + 6);
  assert.throws(() => B.code39('to1'), /Code 39/);
});

test('Code 93 gidiş-dönüş ve sağlama', () => {
  ornekMetinler().forEach((m) => assert.strictEqual(cozC93(B.code93(m).moduller), m));
  assert.strictEqual(cozC93(B.code93('A-Z $/+%.').moduller), 'A-Z $/+%.');
  const k = B.code93('TEST93');
  assert.strictEqual(k.sagLama, '+6'); // bilinen örnek (Wikipedia): C=+, K=6
  assert.strictEqual(k.sembolSayisi, 6 + 4); assert.strictEqual(k.modulSayisi, 9 * 10 + 1);
  assert.throws(() => B.code93('a'), /Code 93/);
});

test('uzunlukOner: örnekler ve çift sayı kuralı', () => {
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 1000000 }).toplamRakam, 14); // 1e11 > 9e10 (ilk rakam 0 olamaz)
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 1000000 }).yukRakam, 13);
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 1 }).toplamRakam, 8);
  for (const s of [1, 99, 1000, 123456, 1e6, 1e8, 1e11]) {
    const o = B.uzunlukOner({ enBuyukSira: s });
    assert.strictEqual(o.toplamRakam % 2, 0);
    assert.ok(9n * 10n ** BigInt(o.toplamRakam - 2) >= BigInt(s) * 100000n);
    if (o.toplamRakam > 8) assert.ok(9n * 10n ** BigInt(o.toplamRakam - 4) < BigInt(s) * 100000n);
  }
  // Code 39'da çift zorunluluğu yok: 1e5*1e5=1e10 > 9e9 -> 11 yük -> 12 toplam; 1e4*1e5=1e9 <= 9e9 -> 10 yük -> 11
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 100000, standart: 'code39' }).toplamRakam, 12);
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 10000, standart: 'code39' }).toplamRakam, 11);
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 100000 }).toplamRakam, 12);
  // Luhn yok
  assert.strictEqual(B.uzunlukOner({ enBuyukSira: 1000000, luhn: false }).yukRakam, 12);
  // üst sınır
  const u = B.uzunlukOner({ enBuyukSira: '1' + '0'.repeat(40) });
  assert.strictEqual(u.toplamRakam, 30); assert.ok(u.ustSinir);
  const o = B.uzunlukOner({ enBuyukSira: 1000000 });
  assert.ok(o.neden.length > 20 && o.secenekler.some((x) => x.toplamRakam === 14));
  o.secenekler.forEach((x) => assert.strictEqual(x.toplamRakam % 2, 0));
  assert.throws(() => B.uzunlukOner({ enBuyukSira: 0 }), /en az 1/);
});

test('kodlanmisBilgi', () => {
  const b = B.kodlanmisBilgi('code128', 'TO', 12);
  assert.strictEqual(b.karakter, 14); assert.strictEqual(b.sembol, 1 + 2 + 1 + 6 + 1 + 1);
  assert.strictEqual(b.modul, 11 * (b.sembol - 1) + 13);
  assert.ok(Math.abs(b.genisMm - b.modul * 0.33) < 0.06);
  assert.ok(B.kodlanmisBilgi('code39', 'TO', 12).modul > b.modul);
});

test('standartlar, uygunMu ve ornekIndeksleri', () => {
  assert.deepStrictEqual(B.standartlar.map((s) => s.id), ['code128', 'code39', 'code93']);
  B.standartlar.forEach((s) => { assert.ok(s.ad && s.aciklama && s.harfRakam === true); });
  assert.strictEqual(B.uygunMu('code128', 'TO123').uygun, true);
  assert.strictEqual(B.uygunMu('code39', 'to123').uygun, false);
  assert.ok(B.uygunMu('code39', 'to123').neden.length > 0);
  assert.strictEqual(B.uygunMu('yok', 'A').uygun, false);
  const o = B.ornekIndeksleri(1, 100);
  assert.ok(o.length >= 4 && new Set(o).size === o.length);
  assert.ok(o.includes(1) && o.includes(100) && o.includes(50));
  assert.ok(o.every((v) => v >= 1 && v <= 100));
  assert.notDeepStrictEqual(o, o.slice().sort((x, y) => x - y), 'sırasız olmalı');
  assert.deepStrictEqual(B.ornekIndeksleri(1, 100), o, 'deterministik');
  assert.notDeepStrictEqual(B.ornekIndeksleri(1, 100, 4, 2), B.ornekIndeksleri(1, 100, 4, 3), 'tohum değişince farklı');
  assert.strictEqual(B.ornekIndeksleri(1, 100, 2).length, 4, 'adet en az 4');
  assert.strictEqual(B.ornekIndeksleri(1, 1000000, 12, 9).length, 12);
  assert.deepStrictEqual(B.ornekIndeksleri(1, 3).slice().sort(), [1, 2, 3]);
  assert.notDeepStrictEqual(B.ornekIndeksleri(1, 3), [1, 2, 3]);
  assert.deepStrictEqual(B.ornekIndeksleri(5, 5), [5]);
  assert.deepStrictEqual(B.ornekIndeksleri(1, 4).slice().sort(), [1, 2, 3, 4]);
  assert.deepStrictEqual(B.ornekIndeksleri(9, 1), []);
});

test('svg: temiz, script/href yok, metin kaçışlı', () => {
  ['code128', 'code39', 'code93'].forEach((s) => {
    const x = B.svg(s, 'TO123456789012');
    assert.ok(x.startsWith('<svg') && x.endsWith('</svg>'));
    assert.ok(!/script|href|<image|<use|<foreignObject|onload|on\w+=/i.test(x));
    assert.ok(x.includes('TO123456789012'));
    assert.ok(x.includes('fill="#ffffff"'));
  });
  const k = B.code128('TO12');
  const x = B.svg('code128', 'TO12', { modulGenislik: 3, yukseklik: 50, sessizBolge: 5 });
  assert.ok(x.includes('width="' + (k.modulSayisi + 10) * 3 + '"'));
  assert.ok(!B.svg('code128', 'TO12', { yaziGoster: false }).includes('<text'));
  const e = B.svg('code128', '<script>"&\'');
  assert.ok(!e.includes('<script>') && e.includes('&lt;script&gt;') && e.includes('&amp;'));
});
