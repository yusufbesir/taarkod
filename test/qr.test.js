'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const Q = require('../src/qr.js');
const B = require('../src/barkod.js');

const seri = (n) => 'TO' + '4025183770612345678901234567890'.slice(0, n);

// Test içi bağımsız GF(256) 0x11D sendrom denetimi (tek blok sürümleri 1-5 için)
function sendromSifir(cw, eccUz) {
  const exp = [], log = [];
  for (let i = 0, x = 1; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
  for (let r = 0; r < eccUz; r++) {
    let s = 0;
    for (const c of cw) s = (s ? exp[(log[s] + r) % 255] : 0) ^ c;
    if (s !== 0) return false;
  }
  return true;
}

test('boyut = 4*sürüm+17, sürüm bayt sayısına göre otomatik büyür', () => {
  const kapM = { 1: 14, 2: 26, 3: 42, 4: 62, 5: 84, 6: 106, 7: 122, 8: 152, 9: 180, 10: 213 }; // M düzeyi bayt kapasitesi
  Object.keys(kapM).forEach((v) => {
    const k = Q.kodla('a'.repeat(kapM[v]), { hataDuzeltme: 'M' });
    assert.strictEqual(k.surum, Number(v));
    assert.strictEqual(k.boyut, 4 * v + 17);
    assert.strictEqual(k.matris.length, k.boyut);
    assert.ok(k.matris.every((s) => s.length === k.boyut && s.every((x) => x === 0 || x === 1)));
  });
  assert.throws(() => Q.kodla('a'.repeat(214), { hataDuzeltme: 'M' }), /çok uzun/);
  assert.strictEqual(Q.kodla('a', { enAzSurum: 4 }).surum, 4);
});

test('daha yüksek hata düzeltme aynı metinde sürümü büyütür veya korur', () => {
  const m = seri(20);
  const s = ['L', 'M', 'Q', 'H'].map((e) => Q.kodla(m, { hataDuzeltme: e }).surum);
  for (let i = 1; i < 4; i++) assert.ok(s[i] >= s[i - 1]);
  assert.throws(() => Q.kodla('x', { hataDuzeltme: 'Z' }), /hata düzeltme/);
});

test('bulucu desenleri, zamanlama çizgisi ve koyu modül', () => {
  [1, 7, 10].forEach((v) => {
    const k = Q.kodla('a'.repeat(v === 1 ? 5 : v === 7 ? 100 : 200), { hataDuzeltme: 'L', enAzSurum: v });
    const m = k.matris, n = k.boyut;
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([x0, y0]) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const d = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        assert.strictEqual(m[y0 + y][x0 + x], d === 2 ? 0 : 1);
      }
    });
    for (let i = 8; i < n - 8; i++) { assert.strictEqual(m[6][i], (i + 1) % 2); assert.strictEqual(m[i][6], (i + 1) % 2); }
    assert.strictEqual(m[n - 8][8], 1);
  });
});

test('biçim bilgisi BCH(15,5) geçerli ve seçenekle eşleşir; sürüm bilgisi BCH(18,6)', () => {
  const fmt = { L: 1, M: 0, Q: 3, H: 2 };
  ['L', 'M', 'Q', 'H'].forEach((e) => {
    for (let mk = 0; mk < 8; mk++) {
      const k = Q.kodla(seri(14), { hataDuzeltme: e, maske: mk }), m = k.matris, n = k.boyut;
      let bits = 0;
      for (let i = 0; i <= 5; i++) bits |= m[i][8] << i;
      bits |= m[7][8] << 6; bits |= m[8][8] << 7; bits |= m[8][7] << 8;
      for (let i = 9; i < 15; i++) bits |= m[8][14 - i] << i;
      let ikinci = 0;
      for (let i = 0; i < 8; i++) ikinci |= m[8][n - 1 - i] << i;
      for (let i = 8; i < 15; i++) ikinci |= m[n - 15 + i][8] << i;
      assert.strictEqual(bits, ikinci);
      const veri = (bits ^ 0x5412) >>> 10;
      assert.strictEqual(veri >> 3, fmt[e]);
      assert.strictEqual(veri & 7, mk);
      let rem = veri;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      assert.strictEqual(((veri << 10) | rem) ^ 0x5412, bits);
      assert.strictEqual(k.maske, mk);
    }
  });
  const k = Q.kodla('a'.repeat(150), { hataDuzeltme: 'M' }), m = k.matris, n = k.boyut; // sürüm 8
  assert.strictEqual(k.surum, 8);
  let v = 0;
  for (let i = 0; i < 18; i++) v |= m[Math.floor(i / 3)][n - 11 + (i % 3)] << i;
  assert.strictEqual(v >>> 12, 8);
  let rem = 8;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  assert.strictEqual(v, (8 << 12) | rem);
});

test('Reed-Solomon: tek bloklu sürümlerde sendromlar sıfır', () => {
  const l = Q.kodla('TO123456789012', { hataDuzeltme: 'L' });
  assert.strictEqual(l.surum, 1);
  assert.ok(sendromSifir(l.sozcukler, 7));
  const m = Q.kodla('TO123456789012', { hataDuzeltme: 'M' });
  assert.strictEqual(m.surum, 1);
  assert.ok(sendromSifir(m.sozcukler, 10));
  const h = Q.kodla('A', { hataDuzeltme: 'H', enAzSurum: 2 });
  assert.ok(sendromSifir(h.sozcukler, 28));
});

test('maske otomatik seçilir, belirlenen maske uygulanır; deterministik', () => {
  const a = Q.moduller2d(seri(16)), b = Q.moduller2d(seri(16));
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(Q.moduller2d(seri(16), { maske: 0 }), Q.moduller2d(seri(16), { maske: 1 }));
  assert.throws(() => Q.moduller2d('x', { maske: 8 }), /maske/);
});

test('UTF-8 bayt sayılır', () => {
  assert.strictEqual(Q.kodla('ş€😀').bayt, 2 + 3 + 4);
});

test('svg: beyaz zemin, sessiz bölge 4, modül genişliği 4 varsayılan', () => {
  const k = Q.kodla('TO123456789012');
  const x = Q.svg('TO123456789012');
  const boy = (k.boyut + 8) * 4;
  assert.ok(x.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(x.includes('width="' + boy + '" height="' + boy + '"'));
  assert.ok(x.includes('fill="#ffffff"'));
  assert.ok(!/<\/script/i.test(x));
  // ilk bulucu köşesi (0,0) modülü (4,4) piksel konumunda
  assert.ok(x.includes('M16 16h4v4h-4z'));
  assert.ok(Q.svg('a', { modulGenislik: 2, sessizBolge: 0 }).includes('width="42"'));
  assert.throws(() => Q.svg('a', { modulGenislik: 0 }), /pozitif/);
});

test('barkod.js üzerinden qr standardı: svg, kodla, uygunMu; mevcut liste bozulmaz', () => {
  assert.deepStrictEqual(B.standartlar.map((s) => s.id), ['code128', 'code39', 'code93']);
  assert.deepStrictEqual(B.standartlar2d.map((s) => s.id), ['qr', 'datamatrix']);
  assert.strictEqual(B.svg('qr', 'TO123456789012'), Q.svg('TO123456789012'));
  const k = B.kodla('qr', 'TO123456789012');
  assert.strictEqual(k.matris.length, k.boyut);
  assert.deepStrictEqual(k.moduller, []);
  assert.strictEqual(B.uygunMu('qr', 'TO123').uygun, true);
  assert.strictEqual(B.uygunMu('qr', '').uygun, false);
});

// Gerçek çözücü (zxing-cpp) varsa gidiş-dönüş; yoksa atlanır.
const py = spawnSync('python3', ['-c', 'import zxingcpp, cairosvg, PIL']);
test('gerçek çözücüyle gidiş-dönüş (zxing-cpp)', { skip: py.status !== 0 && 'zxing-cpp/cairosvg kurulu değil' }, () => {
  const girdiler = [];
  for (let n = 12; n <= 20; n++) girdiler.push(seri(n));
  girdiler.push('Merhaba dünya şğı', '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', 'x'.repeat(150));
  const betik = 'import sys,json,io,cairosvg,zxingcpp\nfrom PIL import Image\nd=json.load(sys.stdin)\n' +
    'print(json.dumps([[r.text for r in zxingcpp.read_barcodes(Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode()))).convert("L"))] for s in d]))';
  const svgler = [];
  girdiler.forEach((g) => ['L', 'M', 'Q', 'H'].forEach((e) => { try { svgler.push([g, Q.svg(g, { hataDuzeltme: e, modulGenislik: 6 })]); } catch (x) { /* sığmadı */ } }));
  const r = spawnSync('python3', ['-I', '-c', betik], { input: JSON.stringify(svgler.map((x) => x[1])), encoding: 'utf8', maxBuffer: 1 << 26 });
  assert.strictEqual(r.status, 0, r.stderr);
  JSON.parse(r.stdout).forEach((c, i) => assert.deepStrictEqual(c, [svgler[i][0]]));
});
