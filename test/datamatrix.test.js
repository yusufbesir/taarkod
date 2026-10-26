'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const D = require('../src/datamatrix.js');
const B = require('../src/barkod.js');

const seri = (n) => 'TO' + '4025183770612345678901234567890'.slice(0, n);

test('ISO örneği: "123456" -> 142 164 186 + ECC 114 25 5 88 102 (GF 0x12D)', () => {
  const k = D.kodla('123456');
  assert.strictEqual(k.boyut, 10);
  assert.deepStrictEqual(k.sozcukler, [142, 164, 186, 114, 25, 5, 88, 102]);
});

test('ASCII kodlama: tek karakter +1, rakam çifti 130+, dolgu 129, üst kaydırma 235', () => {
  assert.deepStrictEqual(D.kodla('A').sozcukler.slice(0, 3), [66, 129, 70]);
  assert.deepStrictEqual(D.kodla('a1').sozcukler.slice(0, 3), [98, 50, 129]);
  assert.deepStrictEqual(D.kodla('ş').sozcukler.slice(0, 4), [235, 70, 235, 32]); // UTF-8 C5 9F -> 235,(C5-127) 235,(9F-127)
});

test('boyut seçimi: 10..32 kare, sığmazsa hata', () => {
  assert.deepStrictEqual(D.boyutlar, [10, 12, 14, 16, 18, 20, 22, 24, 26, 32]);
  const kap = { 10: 3, 12: 5, 14: 8, 16: 12, 18: 18, 20: 22, 22: 30, 24: 36, 26: 44, 32: 62 };
  Object.keys(kap).forEach((b) => {
    const k = D.kodla('a'.repeat(kap[b]));
    assert.strictEqual(k.boyut, Number(b));
    assert.strictEqual(k.matris.length, Number(b));
    assert.ok(k.matris.every((s) => s.length === Number(b) && s.every((x) => x === 0 || x === 1)));
    assert.strictEqual(k.sozcukler.length, k.veriSozcuk + k.eccSozcuk);
  });
  assert.throws(() => D.kodla('a'.repeat(63)), /çok uzun/);
  assert.strictEqual(D.kodla('1'.repeat(124)).boyut, 32);
  assert.strictEqual(D.kodla('a', { enAzBoyut: 20 }).boyut, 20);
});

test('bulucu: sol ve alt düz, üst ve sağ dönüşümlü (32x32 için her bölgede)', () => {
  [10, 18, 32].forEach((b) => {
    const k = D.kodla('a'.repeat(b === 10 ? 1 : b === 18 ? 15 : 50));
    assert.strictEqual(k.boyut, b);
    const m = k.matris, adim = b === 32 ? 16 : b;
    for (let oy = 0; oy < b; oy += adim) for (let ox = 0; ox < b; ox += adim) {
      for (let i = 0; i < adim; i++) {
        assert.strictEqual(m[oy + i][ox], 1);
        assert.strictEqual(m[oy + adim - 1][ox + i], 1);
        assert.strictEqual(m[oy][ox + i], i % 2 === 0 ? 1 : 0);
        if (i < adim - 1) assert.strictEqual(m[oy + i][ox + adim - 1], i % 2 === 1 ? 1 : 0);
      }
    }
  });
});

test('Reed-Solomon: sendromlar a^1..a^n sıfır (0x12D)', () => {
  const exp = [], log = [];
  for (let i = 0, x = 1; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x12D; }
  ['A', seri(14), 'x'.repeat(30), 'y'.repeat(62)].forEach((t) => {
    const k = D.kodla(t);
    for (let r = 1; r <= k.eccSozcuk; r++) {
      let s = 0;
      for (const c of k.sozcukler) s = (s ? exp[(log[s] + r) % 255] : 0) ^ c;
      assert.strictEqual(s, 0);
    }
  });
});

test('deterministik; svg: beyaz zemin, sessiz bölge 1, modül genişliği 4', () => {
  assert.deepStrictEqual(D.moduller2d(seri(14)), D.moduller2d(seri(14)));
  const k = D.kodla(seri(14)), x = D.svg(seri(14)), boy = (k.boyut + 2) * 4;
  assert.ok(x.includes('width="' + boy + '" height="' + boy + '"'));
  assert.ok(x.includes('fill="#ffffff"'));
  assert.ok(!/<\/script/i.test(x));
  assert.ok(x.includes('M4 8h4v4h-4z')); // sol sütun, ikinci satır... (0,0) -> (1,1)*4; (0,1) -> M4 8
  assert.ok(D.svg('a', { modulGenislik: 2, sessizBolge: 0 }).includes('width="20"'));
  assert.throws(() => D.svg('a', { modulGenislik: -1 }), /pozitif/);
});

test('barkod.js üzerinden datamatrix standardı', () => {
  assert.strictEqual(B.svg('datamatrix', seri(14)), D.svg(seri(14)));
  const k = B.kodla('datamatrix', seri(14));
  assert.strictEqual(k.matris.length, k.boyut);
  assert.strictEqual(B.uygunMu('datamatrix', 'x'.repeat(80)).uygun, false);
  assert.strictEqual(B.uygunMu('datamatrix', 'TO12').uygun, true);
  assert.throws(() => B.kodla('bilinmeyen', 'a'), /Bilinmeyen/);
});

const py = spawnSync('python3', ['-c', 'import zxingcpp, cairosvg, PIL']);
test('gerçek çözücüyle gidiş-dönüş (zxing-cpp)', { skip: py.status !== 0 && 'zxing-cpp/cairosvg kurulu değil' }, () => {
  const girdiler = [];
  for (let n = 12; n <= 20; n++) girdiler.push(seri(n));
  girdiler.push('A', '12', 'Merhaba dünya', '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', 'x'.repeat(62), '7'.repeat(124));
  const betik = 'import sys,json,io,cairosvg,zxingcpp\nfrom PIL import Image\nd=json.load(sys.stdin)\n' +
    'print(json.dumps([[r.text for r in zxingcpp.read_barcodes(Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode()))).convert("L"))] for s in d]))';
  const r = spawnSync('python3', ['-I', '-c', betik], { input: JSON.stringify(girdiler.map((g) => D.svg(g, { modulGenislik: 6 }))), encoding: 'utf8', maxBuffer: 1 << 26 });
  assert.strictEqual(r.status, 0, r.stderr);
  JSON.parse(r.stdout).forEach((c, i) => assert.deepStrictEqual(c, [girdiler[i]]));
});
