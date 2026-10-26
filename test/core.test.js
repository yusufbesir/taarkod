const test = require('node:test');
const assert = require('node:assert');
const B = require('../src/core.js');

// Uydurma deneme kelimeleri (gerçek anahtar değildir).
const K = 'kalemtras';

test('geri çözme: her sayı şifrelenip aynen geri çözülür', () => {
  for (const kelime of [K, 'mavi', 'ÇAĞRI']) {
    for (let n = 0; n <= 5000; n++) {
      assert.strictEqual(B.coz(B.sifrele(n, kelime, 6), kelime, 6), n);
    }
  }
});

test('birebirlik: 4 haneli tüm uzayda çakışma yok', () => {
  const g = new Set();
  for (let n = 0; n < 10000; n++) g.add(B.sifrele(n, K, 4));
  assert.strictEqual(g.size, 10000);
});

test('birebirlik: 6 hanede 1-100000 arası çakışma yok', () => {
  const g = new Set();
  for (let n = 0; n < 100000; n++) g.add(B.sifrele(n, K, 6));
  assert.strictEqual(g.size, 100000);
});

test('Türkçe harfler: ç ğ ı ö ş ü kabul edilir ve sıralaması doğru', () => {
  const a = B.ALFABE;
  assert.ok(a.indexOf('c') < a.indexOf('ç') && a.indexOf('ç') < a.indexOf('d'));
  assert.ok(a.indexOf('g') < a.indexOf('ğ') && a.indexOf('ğ') < a.indexOf('h'));
  assert.ok(a.indexOf('h') < a.indexOf('ı') && a.indexOf('ı') < a.indexOf('i'));
  assert.ok(a.indexOf('o') < a.indexOf('ö') && a.indexOf('ö') < a.indexOf('p'));
  assert.ok(a.indexOf('s') < a.indexOf('ş') && a.indexOf('ş') < a.indexOf('t'));
  assert.ok(a.indexOf('u') < a.indexOf('ü') && a.indexOf('ü') < a.indexOf('v'));
  const kod = B.sifrele(123, 'çığöşü', 6);
  assert.strictEqual(B.coz(kod, 'çığöşü', 6), 123);
});

test('Türkçe büyük/küçük: I->ı, İ->i; büyük-küçük aynı sonucu verir', () => {
  assert.strictEqual(B.kucukHarf('IİÇ'), 'ıiç');
  assert.strictEqual(B.sifrele(77, 'ISIK', 6), B.sifrele(77, 'ısık', 6));
  assert.deepStrictEqual(B.planOlustur('Iİ', 2).sira, [0, 1]); // ı < i
  assert.deepStrictEqual(B.planOlustur('İI', 2).sira, [1, 0]);
});

test('tekrar eden harfler: eşitlikte soldaki önce gelir, plan sabit ve geçerli permütasyon', () => {
  const p = B.planOlustur('anana', 5); // a n a n a -> a(0) a(2) a(4) n(1) n(3)
  assert.deepStrictEqual(p.sira, [0, 3, 1, 4, 2]);
  const kopya = p.sira.slice().sort((x, y) => x - y);
  assert.deepStrictEqual(kopya, [0, 1, 2, 3, 4]);
  assert.strictEqual(B.coz(B.sifrele(4321, 'anana', 5), 'anana', 5), 4321);
});

test('kısa kelime hane sayısına döngüyle uzatılır, uzun kelimede fazlası yok sayılır', () => {
  const p = B.planOlustur('ba', 6);
  assert.strictEqual(p.sira.length, 6);
  assert.strictEqual(B.coz(B.sifrele(99, 'ba', 6), 'ba', 6), 99);
  assert.strictEqual(B.sifrele(5, 'kalemtras', 4), B.sifrele(5, 'kalemxyz', 4));
});

test('farklı kelime farklı kod üretir, 1 nolu 000001 olarak kalmaz', () => {
  assert.notStrictEqual(B.sifrele(1, K, 6), '000001');
  assert.notStrictEqual(B.sifrele(1, K, 6), B.sifrele(1, 'zeytin', 6));
});

test('hata durumları', () => {
  assert.throws(() => B.sifrele(1, 'a', 6));
  assert.throws(() => B.sifrele(1, 'aaaa', 6));
  assert.throws(() => B.sifrele(1, 'abc1', 6));
  assert.throws(() => B.sifrele(-1, K, 6));
  assert.throws(() => B.sifrele(1.5, K, 6));
  assert.throws(() => B.sifrele(1000000, K, 6));
  assert.throws(() => B.sifrele(1, K, 1));
  assert.throws(() => B.coz('12345', K, 6));
  assert.throws(() => B.coz('12345a', K, 6));
});

test('sıfır dolgusu: 6 hane sabit uzunluk', () => {
  assert.strictEqual(B.sifrele(1, K, 6).length, 6);
  assert.strictEqual(B.sifrele(999999, K, 6).length, 6);
});

test('yayılım: ardışık numaraların kodları birbirine benzemez', () => {
  let toplam = 0, adet = 0;
  for (let n = 1; n < 2000; n++) {
    const a = B.sifrele(n, K, 6), b = B.sifrele(n + 1, K, 6);
    for (let i = 0; i < 6; i++) if (a[i] !== b[i]) toplam++;
    adet++;
  }
  assert.ok(toplam / adet >= 3.5, 'ortalama farklı hane: ' + toplam / adet);
  assert.notStrictEqual(B.sifrele(1, K, 6), '000001');
});

test('sınır değerleri: 0, üst sınır ve 15 hane', () => {
  for (const h of [2, 6, 15, 19]) {
    if (h > 15) continue;
    const ust = Math.pow(10, h) - 1;
    for (const n of [0, 1, ust - 1, ust]) assert.strictEqual(B.coz(B.sifrele(n, K, h), K, h), n);
  }
  assert.throws(() => B.sifrele(1, K, 31));
  assert.throws(() => B.sifrele(NaN, K, 6));
});

test('Luhn: bilinen örnekler (7992739871 -> 3) ve geçerlilik', () => {
  assert.strictEqual(B.luhnRakami('7992739871'), 3);
  assert.ok(B.luhnGecerli('79927398713'));
  assert.ok(!B.luhnGecerli('79927398710'));
  assert.strictEqual(B.luhnRakami('0'), 0);
});

test('barkod: 20 hane, son rakam Luhn, geri çözme', () => {
  for (const n of [0, 1, 2, 99, 123456, Number.MAX_SAFE_INTEGER]) {
    const b = B.barkodUret(n, K);
    assert.strictEqual(b.length, 20);
    assert.ok(B.luhnGecerli(b));
    assert.strictEqual(b.slice(0, -1), B.sifrele(n, K, 19));
    const c = B.barkodCoz(b, K);
    assert.ok(c.gecerli);
    assert.strictEqual(Number(c.sira), n);
  }
});

test('barkod: 19 haneli uzun sıra no metin olarak, kayıpsız', () => {
  const n = '9999999999999999999';
  const c = B.barkodCoz(B.barkodUret(n, K), K);
  assert.strictEqual(c.sira, n);
  assert.throws(() => B.barkodUret('10000000000000000000', K));
});

test('barkod: kontrol rakamı bozulursa ya da tek hane değişirse geçersiz', () => {
  const b = B.barkodUret(42, K);
  for (let i = 0; i < 20; i++) {
    const d = (Number(b[i]) + 1) % 10;
    const bozuk = b.slice(0, i) + d + b.slice(i + 1);
    assert.strictEqual(B.barkodCoz(bozuk, K).gecerli, false);
  }
  assert.throws(() => B.barkodCoz(b.slice(1), K));
});

test('barkod: 20 hane uzayında ardışık 50000 numara çakışmaz ve hepsi çözülür', () => {
  const g = new Set();
  for (let n = 1; n <= 50000; n++) {
    const b = B.barkodUret(n, K);
    g.add(b);
    assert.strictEqual(B.barkodCoz(b, K).sira, n);
  }
  assert.strictEqual(g.size, 50000);
});
