const test = require('node:test');
const assert = require('node:assert');
const Y = require('../src/yontemler.js');

// Uydurma deneme kelimeleri (gerçek anahtar değildir).
const K = 'kalemtras';
const IDLER = ['harf-karistirma', 'dogrusal', 'feistel'];

test('SHA-256 test vektörleri', () => {
  assert.strictEqual(Y.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.strictEqual(Y.sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.strictEqual(Y.sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
});

test('yöntem listesi alanları', () => {
  assert.deepStrictEqual(Y.YONTEMLER.map(y => y.id), IDLER);
  for (const y of Y.YONTEMLER) {
    for (const a of ['id', 'ad', 'kisa', 'nasil']) assert.ok(typeof y[a] === 'string' && y[a].length >= 5);
    assert.ok(y.artilar.length > 0 && y.eksiler.length > 0);
    for (const a of ['gizleme', 'tahminDirenci', 'hiz']) assert.ok(y[a] >= 1 && y[a] <= 5);
    assert.strictEqual(typeof y.onerilen, 'boolean');
  }
  assert.strictEqual(Y.YONTEMLER.find(y => y.id === 'feistel').onerilen, true);
  assert.ok(/varsayılan/.test(Y.YONTEMLER.find(y => y.id === 'harf-karistirma').kisa));
});

for (const id of IDLER) {
  test(id + ': geri çözme (10000 numara, 7 hane)', () => {
    for (let n = 0; n < 10000; n++) {
      const kod = Y.sifrele(id, n, K, 7);
      assert.strictEqual(kod.length, 7);
      assert.strictEqual(Y.coz(id, kod, K, 7), n);
    }
  });

  test(id + ': 4 haneli tüm uzayda birebirlik', () => {
    const g = new Set();
    for (let n = 0; n < 10000; n++) g.add(Y.sifrele(id, n, K, 4));
    assert.strictEqual(g.size, 10000);
  });

  test(id + ': Türkçe harfler ve tekrar eden harfler', () => {
    for (const kelime of ['çığöşü', 'aaabbb', 'ĞÜŞİÖÇ']) {
      for (const n of [0, 1, 99, 4242]) assert.strictEqual(Y.coz(id, Y.sifrele(id, n, kelime, 8), kelime, 8), n);
    }
  });

  test(id + ': I/İ ve büyük-küçük harf eşdeğerliği', () => {
    assert.strictEqual(Y.sifrele(id, 77, 'IŞIK', 9), Y.sifrele(id, 77, 'ışık', 9));
    assert.strictEqual(Y.sifrele(id, 77, 'İZMİR', 9), Y.sifrele(id, 77, 'izmir', 9));
    assert.strictEqual(Y.sifrele(id, 77, 'KalemTras', 9), Y.sifrele(id, 77, 'kalemtras', 9));
  });

  test(id + ': hane sınırları 2/7/19/30', () => {
    for (const h of [2, 7, 19, 30]) {
      const en = h === 2 ? 99 : 12345;
      for (const n of [0, 1, en]) {
        const kod = Y.sifrele(id, n, K, h);
        assert.ok(new RegExp('^\\d{' + h + '}$').test(kod));
        assert.strictEqual(Y.coz(id, kod, K, h), n);
      }
    }
  });

  test(id + ': 30 haneli metin sıra no kayıpsız', () => {
    for (const s of ['999999999999999999999999999999', '123456789012345678901234567890', '000000000000000000000000000007']) {
      const kod = Y.sifrele(id, s, K, 30);
      assert.strictEqual(kod.length, 30);
      assert.strictEqual(String(Y.coz(id, kod, K, 30)), s.replace(/^0+(?=\d)/, ''));
    }
    const buyuk = '9007199254740993'; // güvenli tam sayı sınırının üstü: metin olarak döner
    assert.strictEqual(Y.coz(id, Y.sifrele(id, buyuk, K, 19), K, 19), buyuk);
  });

  test(id + ': hatalı girdi Türkçe hata verir', () => {
    assert.throws(() => Y.sifrele(id, -1, K, 6), /pozitif/);
    assert.throws(() => Y.sifrele(id, 1.5, K, 6), /pozitif/);
    assert.throws(() => Y.sifrele(id, 'abc', K, 6), /pozitif/);
    assert.throws(() => Y.sifrele(id, 1000000, K, 6), /sığmıyor/);
    assert.throws(() => Y.sifrele(id, 1, K, 1), /Hane/);
    assert.throws(() => Y.sifrele(id, 1, K, 31), /Hane/);
    assert.throws(() => Y.sifrele(id, 1, K, 6.5), /Hane/);
    assert.throws(() => Y.sifrele(id, 1, 'a', 6), /en az 2 harf/);
    assert.throws(() => Y.sifrele(id, 1, 'aaaa', 6), /2 farklı/);
    assert.throws(() => Y.sifrele(id, 1, 'ab1c', 6), /desteklenmeyen/);
    assert.throws(() => Y.coz(id, '12345', K, 6), /haneli/);
    assert.throws(() => Y.coz(id, 'abcdef', K, 6), /haneli/);
    assert.throws(() => Y.coz(id, 123456, K, 6), /haneli/);
  });

  test(id + ': farklı kelime farklı çıktı', () => {
    const a = Y.sifrele(id, 12345, 'kalemtras', 12), b = Y.sifrele(id, 12345, 'kalemtrak', 12), c = Y.sifrele(id, 12345, 'mavi', 12);
    assert.ok(a !== b && a !== c && b !== c);
  });
}

test('bilinmeyen yöntem', () => {
  assert.throws(() => Y.sifrele('yok', 1, K, 6), /Bilinmeyen/);
  assert.throws(() => Y.coz('toString', '123456', K, 6), /Bilinmeyen/);
});

test('yöntemler birbirinden farklı çıktı üretir', () => {
  const s = new Set(IDLER.map(id => Y.sifrele(id, 31337, K, 12)));
  assert.strictEqual(s.size, 3);
});

test('doğrusal: sabit adım (bilinen zayıflık) ve a, 10 ile aralarında asal', () => {
  const h = 12, M = 10n ** 12n;
  const c = n => BigInt(Y.sifrele('dogrusal', n, K, h));
  const adim = ((c(1) - c(0)) % M + M) % M;
  assert.strictEqual(((c(2) - c(1)) % M + M) % M, adim);
  assert.ok(adim >= 10n ** 11n && adim % 2n === 1n && adim % 5n !== 0n);
});

test('feistel: ardışık numaralarda ortalama değişen hane oranı >= %70', () => {
  for (const h of [12, 19]) {
    let degisen = 0, top = 0;
    for (let n = 0; n < 2000; n++) {
      const a = Y.sifrele('feistel', n, K, h), b = Y.sifrele('feistel', n + 1, K, h);
      for (let i = 0; i < h; i++) { top++; if (a[i] !== b[i]) degisen++; }
    }
    assert.ok(degisen / top >= 0.7, 'oran: ' + degisen / top);
  }
});

test('performans: feistel 100.000 numara birkaç saniyede', () => {
  const t0 = Date.now();
  const g = new Set();
  for (let n = 0; n < 100000; n++) g.add(Y.sifrele('feistel', n, K, 19));
  const sure = Date.now() - t0;
  assert.strictEqual(g.size, 100000);
  console.log('feistel 100000 numara: ' + sure + ' ms');
  assert.ok(sure < 15000, 'çok yavaş: ' + sure + ' ms');
});
