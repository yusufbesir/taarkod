const test = require('node:test');
const assert = require('node:assert');
const D = require('../src/donustur.js');

const UZUN = '1234567890123456789012345'; // 25 hane
const SATIRLAR = [
  { sira: 1, seri: 'Seri-1', barkod: 'TO123' },
  { sira: UZUN, seri: 'Seri-1', barkod: 'TO456', kelime: 'GIZLI', kural: { x: 1 } }
];

test('BICIMLER: 13 biçim (12 + TSPL), alanlar tam, id benzersiz', () => {
  assert.strictEqual(D.BICIMLER.length, 13);
  const idler = new Set(D.BICIMLER.map((b) => b.id));
  assert.strictEqual(idler.size, 13);
  D.BICIMLER.forEach((b) => {
    ['id', 'ad', 'uzanti', 'mime', 'aciklama'].forEach((a) => assert.ok(b[a] && typeof b[a] === 'string'));
  });
  assert.deepStrictEqual([...idler].sort(), ['csv-noktalivirgul', 'csv-virgul', 'html-tablo', 'json', 'jsonl', 'markdown-tablo', 'sql', 'tspl', 'tsv', 'txt', 'xlsx', 'xml', 'zpl']);
  assert.ok(!D.BICIMLER.some((b) => b.id === 'excel-xml'), 'eski .xls biçimi geri gelmemeli');
  assert.deepStrictEqual(D.BICIMLER.filter((b) => b.ikili).map((b) => b.id), ['xlsx']);
});

const METIN = D.BICIMLER.filter((b) => !b.ikili);

test('her biçim fazladan alanları (anahtar kelime, kural) çıktıya sokmaz', () => {
  METIN.forEach((b) => {
    const c = D.donustur(b.id, SATIRLAR);
    assert.ok(!c.includes('GIZLI'), b.id);
    assert.ok(!c.includes('kelime'), b.id);
  });
});

test('csv-noktalivirgul: BOM, başlık, CRLF, mevcut davranış', () => {
  const c = D.donustur('csv-noktalivirgul', SATIRLAR);
  assert.strictEqual(c, '﻿Sira No;Seri;Barkod\r\n1;Seri-1;TO123\r\n' + UZUN + ';Seri-1;TO456\r\n');
});

test('csv: ayraç, tırnak ve satır sonu içeren seri tırnaklanır', () => {
  const l = [{ sira: 1, seri: 'a;b,"c"\nd', barkod: 'X1' }];
  assert.strictEqual(D.donustur('csv-noktalivirgul', l), '﻿Sira No;Seri;Barkod\r\n1;"a;b,""c""\nd";X1\r\n');
  assert.strictEqual(D.donustur('csv-virgul', l), 'Sira No,Seri,Barkod\r\n1,"a;b,""c""\nd",X1\r\n');
});

test('csv: formül enjeksiyonu için \' öneki (=,+,-,@,tab,CR)', () => {
  ['=cmd', '+1', '-1', '@x', '\tx', '\rx'].forEach((v) => {
    const c = D.donustur('csv-virgul', [{ sira: 1, seri: v, barkod: 'B' }]);
    const satir = c.split('\r\n')[1];
    assert.ok(/^1,"?'/.test(satir), JSON.stringify(v) + ' -> ' + JSON.stringify(satir));
  });
  const c = D.donustur('csv-noktalivirgul', [{ sira: 1, seri: '=cmd|x', barkod: '=B' }]);
  assert.ok(c.includes("1;'=cmd|x;'=B\r\n"));
});

test('csv: excelMetin barkodu ="..." yapar', () => {
  const c = D.donustur('csv-noktalivirgul', [{ sira: 1, seri: 'S', barkod: 'TO001' }], { excelMetin: true });
  assert.ok(c.endsWith('1;S;="TO001"\r\n'));
});

test('csv-virgul', () => {
  assert.strictEqual(D.donustur('csv-virgul', SATIRLAR.slice(0, 1)), 'Sira No,Seri,Barkod\r\n1,Seri-1,TO123\r\n');
});

test('json: geri ayrıştırılır, 25 haneli sıra metin kalır', () => {
  const g = JSON.parse(D.donustur('json', SATIRLAR));
  assert.deepStrictEqual(g, [
    { sira: '1', seri: 'Seri-1', barkod: 'TO123' },
    { sira: UZUN, seri: 'Seri-1', barkod: 'TO456' }
  ]);
  assert.strictEqual(typeof g[1].sira, 'string');
});

test('sql: kaçış, 1000 satırda yeni INSERT, varsayılan ve verilen tablo', () => {
  const s = D.donustur('sql', [{ sira: UZUN, seri: "O'Brien", barkod: 'B1' }], { tabloAdi: 'etiket_1' });
  assert.ok(s.startsWith('INSERT INTO etiket_1 (sira_no, seri, barkod) VALUES\n'));
  assert.ok(s.includes("('" + UZUN + "', 'O''Brien', 'B1')"));
  assert.ok(s.endsWith(';\n'));
  const cok = [];
  for (let i = 1; i <= 2500; i++) cok.push({ sira: i, seri: 'S', barkod: 'B' + i });
  const t = D.donustur('sql', cok);
  assert.strictEqual((t.match(/INSERT INTO barkodlar/g) || []).length, 3);
  assert.strictEqual((t.match(/;\n/g) || []).length, 3);
});

test('sql: geçersiz tablo adı ve ters eğik çizgi hata verir', () => {
  ['a b', 'x;DROP', '', 'a'.repeat(41), 5, 'ç'].forEach((t) => {
    assert.throws(() => D.donustur('sql', SATIRLAR, { tabloAdi: t }), /Tablo adı geçersiz/);
  });
  assert.doesNotThrow(() => D.donustur('sql', SATIRLAR, { tabloAdi: 'a'.repeat(40) }));
  assert.throws(() => D.donustur('sql', [{ sira: 1, seri: "a\\'", barkod: 'B' }]), /ters eğik çizgi/);
});

test('txt: satır başına yalnız barkod', () => {
  assert.strictEqual(D.donustur('txt', SATIRLAR), 'TO123\nTO456\n');
  assert.throws(() => D.donustur('txt', [{ sira: 1, seri: 'S', barkod: 'a\nb' }]), /satır sonu/);
});

test('zpl: etiket, boyut seçenekleri, yasak karakterler', () => {
  assert.strictEqual(D.donustur('zpl', SATIRLAR.slice(0, 1)), '^XA^FO30,30^BCN,100,Y,N,N^FDTO123^FS^XZ\n');
  const z = D.donustur('zpl', SATIRLAR.slice(0, 1), { etiketGenisligi: 600, etiketYuksekligi: 300 });
  assert.ok(z.startsWith('^XA^PW600^LL300^FO'));
  ['a^b', 'a~b', 'türkçe', 'a>b', 'a\tb'].forEach((b) => {
    assert.throws(() => D.donustur('zpl', [{ sira: 1, seri: 'S', barkod: b }]), /ZPL|denetim/);
  });
  assert.throws(() => D.donustur('zpl', SATIRLAR, { etiketGenisligi: -5 }), /etiketGenisligi/);
});

const ZOR = [
  { sira: '0001', seri: 'Şeker Çağrı', barkod: '00123456789012345678' },
  { sira: 2, seri: `A&B<C>"q"'k'`, barkod: 'a\nb' },
  { sira: 3, seri: '=cmd', barkod: '+5' },
  { sira: 4, seri: '-1', barkod: '@x' }
];

test('tsv: sekme ayraç, CRLF, baştaki sıfır, formül öneki, satır sonu tırnaklanır', () => {
  assert.strictEqual(D.donustur('tsv', ZOR),
    'Sira No\tSeri\tBarkod\r\n' +
    '0001\tŞeker Çağrı\t00123456789012345678\r\n' +
    '2\t"A&B<C>""q""\'k\'"\t"a\nb"\r\n' +
    "3\t'=cmd\t'+5\r\n" +
    "4\t'-1\t'@x\r\n");
  assert.strictEqual(D.donustur('tsv', [{ sira: 1, seri: 'a\tb', barkod: 'X' }]), 'Sira No\tSeri\tBarkod\r\n1\t"a\tb"\tX\r\n');
  assert.strictEqual(D.donustur('tsv', [{ sira: 1, seri: 'S', barkod: 'B"1' }]), 'Sira No\tSeri\tBarkod\r\n1\tS\t"B""1"\r\n');
});

test('jsonl: satır başına bir nesne, geri ayrıştırılır, sıra metin kalır', () => {
  const c = D.donustur('jsonl', ZOR);
  assert.ok(c.endsWith('\n'));
  const g = c.slice(0, -1).split('\n').map((x) => JSON.parse(x));
  assert.deepStrictEqual(g, [
    { sira: '0001', seri: 'Şeker Çağrı', barkod: '00123456789012345678' },
    { sira: '2', seri: `A&B<C>"q"'k'`, barkod: 'a\nb' },
    { sira: '3', seri: '=cmd', barkod: '+5' },
    { sira: '4', seri: '-1', barkod: '@x' }
  ]);
  assert.strictEqual(c.split('\n').length, 5); // satır sonu \n olarak kaçırılır, fazladan satır yok
});

test('xml: başlık, öznitelik ve metin kaçışları, sekme/satır sonu karakter başvurusu', () => {
  const c = D.donustur('xml', [
    { sira: '0001', seri: `A&B<C>"q"'k'`, barkod: 'a\nb\r\tc' },
    { sira: 2, seri: 'Şeker Çağrı', barkod: '=1+1' }
  ]);
  assert.strictEqual(c,
    '<?xml version="1.0" encoding="UTF-8"?>\n<barkodlar>\n' +
    '  <barkod sira="0001" seri="A&amp;B&lt;C&gt;&quot;q&quot;&apos;k&apos;">a&#10;b&#13;&#9;c</barkod>\n' +
    '  <barkod sira="2" seri="Şeker Çağrı">=1+1</barkod>\n' +
    '</barkodlar>\n');
});

test('html-tablo: betiksiz belge, HTML kaçışları, baştaki sıfır ve Türkçe korunur', () => {
  const c = D.donustur('html-tablo', [
    { sira: '0001', seri: `A&B<C>"q"'k'`, barkod: '<script>x</script>' },
    { sira: 2, seri: 'Şeker Çağrı', barkod: '=1+1\n+5' }
  ]);
  assert.ok(c.startsWith('<!DOCTYPE html>\n<html lang="tr"><head><meta charset="utf-8">'));
  assert.ok(c.endsWith('</tbody>\n</table>\n</body></html>\n'));
  assert.ok(c.includes('>0001</td>'));
  assert.ok(c.includes('>A&amp;B&lt;C&gt;&quot;q&quot;&#39;k&#39;</td>'));
  assert.ok(c.includes('&lt;script&gt;x&lt;/script&gt;</td>'));
  assert.ok(!c.includes('<script'));
  assert.ok(c.includes('>Şeker Çağrı</td>'));
  assert.ok(c.includes('font-family:monospace">=1+1\n+5</td>'));
  assert.strictEqual((c.match(/<tr>/g) || []).length, 3) // başlık + 2 veri satırı;;
  assert.ok(c.includes('<th style="border:1px solid #999;padding:4px 8px;background:#eee;text-align:left">Sira No</th>'));
});

test('markdown-tablo: başlık, kaçışlar, satır sonu <br>, baştaki sıfır korunur', () => {
  const c = D.donustur('markdown-tablo', [
    { sira: '0001', seri: 'Şeker Çağrı', barkod: '00123456789012345678' },
    { sira: 2, seri: `A&B<C>"q"'k'`, barkod: 'a|b\r\nc\nd' },
    { sira: 3, seri: '=cmd', barkod: '+5' },
    { sira: 4, seri: '*_[x]`#!~\\', barkod: '@x' }
  ]);
  assert.strictEqual(c,
    '| Sira No | Seri | Barkod |\n| --- | --- | --- |\n' +
    '| 0001 | Şeker Çağrı | 00123456789012345678 |\n' +
    `| 2 | A&amp;B&lt;C&gt;"q"'k' | a\\|b<br>c<br>d |\n` +
    '| 3 | =cmd | +5 |\n' +
    '| 4 | \\*\\_\\[x\\]\\`\\#\\!\\~\\\\ | @x |\n');
});

test('boş liste her biçimde geçerli çıktı verir', () => {
  assert.deepStrictEqual(JSON.parse(D.donustur('json', [])), []);
  assert.strictEqual(D.donustur('txt', []), '');
  assert.strictEqual(D.donustur('csv-noktalivirgul', []), '﻿Sira No;Seri;Barkod\r\n');
  METIN.forEach((b) => assert.strictEqual(typeof D.donustur(b.id, []), 'string'));
});

test('hatalar: bilinmeyen biçim, geçersiz satır, dizi değil', () => {
  assert.throws(() => D.donustur('pdf', SATIRLAR), /Bilinmeyen/);
  assert.throws(() => D.donustur('__proto__', SATIRLAR), /Bilinmeyen/);
  assert.throws(() => D.donustur('json', 'x'), /dizi/);
  assert.throws(() => D.donustur('json', [{ sira: 1, seri: 'S', barkod: '' }]), /Satır 1/);
  assert.throws(() => D.donustur('json', [{ sira: 1, seri: 'S', barkod: 5 }]), /barkod/);
  assert.throws(() => D.donustur('json', [{ sira: 1, seri: 'S' }]), /barkod/);
  assert.throws(() => D.donustur('json', [null]), /nesne/);
  assert.throws(() => D.donustur('json', [{ sira: {}, seri: 'S', barkod: 'B' }]), /sıra/);
  assert.throws(() => D.donustur('json', [{ sira: 1, seri: 'S\u0000', barkod: 'B' }]), /denetim/);
  ['excel-xml'].forEach((k) => assert.throws(() => D.donustur(k, SATIRLAR), /Bilinmeyen/));
  assert.throws(() => D.donustur('xlsx', SATIRLAR), /ikili/);
  assert.throws(() => D.donusturIkili('json', SATIRLAR), /Bilinmeyen/);
});

test('parcaUret: ~20000 satırlık parçalar, birleşimi donustur ile aynı', () => {
  const l = [];
  for (let i = 1; i <= 45000; i++) l.push({ sira: i, seri: 'S', barkod: 'B' + i });
  const p = D.parcaUret('txt', l);
  assert.strictEqual(p.length, 3);
  assert.strictEqual(p[0].split('\n').length - 1, 20000);
  assert.strictEqual(p.join(''), D.donustur('txt', l));
  assert.strictEqual(JSON.parse(D.donustur('json', l)).length, 45000);
});

test('dosyaAdi: güvenli ad, Türkçe sadeleştirme, boş ad', () => {
  assert.strictEqual(D.dosyaAdi('csv-noktalivirgul', 'Şeker Çağrı İğdır'), 'Seker-Cagri-Igdir.csv');
  assert.strictEqual(D.dosyaAdi('xlsx', 'Seri_1-a'), 'Seri_1-a.xlsx');
  assert.strictEqual(D.dosyaAdi('json', '../../etc/passwd'), 'etcpasswd.json');
  assert.strictEqual(D.dosyaAdi('zpl', ''), 'barkod-kodlari.zpl');
  assert.strictEqual(D.dosyaAdi('txt', '***'), 'barkod-kodlari.txt');
  assert.throws(() => D.dosyaAdi('md', 'x'), /Bilinmeyen/);
});

test('duman: 50000 satır 5 saniyeden kısa sürede, tüm biçimlerde', () => {
  const l = [];
  for (let i = 1; i <= 50000; i++) l.push({ sira: String(i).padStart(25, '0'), seri: 'Seri-1', barkod: 'TO' + i });
  const t0 = Date.now();
  METIN.forEach((b) => {
    const p = D.parcaUret(b.id, l);
    assert.ok(p.length >= 3, b.id);
  });
  assert.ok(D.donusturIkili('xlsx', l).length > 1000000);
  assert.ok(Date.now() - t0 < 5000, 'süre: ' + (Date.now() - t0) + ' ms');
});

// ---- xlsx ----
function zipOku(u8) { // minimal okuyucu: merkez dizinden stored girdileri çıkarır, CRC denetler
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22;
  assert.strictEqual(dv.getUint32(e, true), 0x06054B50);
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const dosyalar = {};
  for (let i = 0; i < n; i++) {
    assert.strictEqual(dv.getUint32(p, true), 0x02014B50);
    assert.strictEqual(dv.getUint16(p + 10, true), 0, 'stored olmalı');
    const crc = dv.getUint32(p + 16, true), boy = dv.getUint32(p + 24, true);
    const ad = Buffer.from(u8.subarray(p + 46, p + 46 + dv.getUint16(p + 28, true))).toString();
    const lo = dv.getUint32(p + 42, true);
    assert.strictEqual(dv.getUint32(lo, true), 0x04034B50);
    const bas = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    const veri = u8.subarray(bas, bas + boy);
    assert.strictEqual(require('node:zlib').crc32 ? require('node:zlib').crc32(veri) : crc, crc, 'CRC ' + ad);
    dosyalar[ad] = Buffer.from(veri).toString('utf8');
    p += 46 + dv.getUint16(p + 28, true) + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  return dosyalar;
}

test('xlsx: Uint8Array, ZIP parçaları, metin hücreleri, kaçış', () => {
  const x = D.donusturIkili('xlsx', [
    { sira: '0001', seri: 'A&B<C>', barkod: '00123456789012345678' },
    { sira: 2, seri: '=1+1', barkod: '+5 "q" \'k\'' }
  ]);
  assert.ok(x instanceof Uint8Array);
  assert.strictEqual(x[0], 0x50); assert.strictEqual(x[1], 0x4B);
  const d = zipOku(x);
  assert.deepStrictEqual(Object.keys(d).sort(), ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']);
  const sh = d['xl/worksheets/sheet1.xml'];
  assert.ok(sh.includes('<t>00123456789012345678</t>'));
  assert.ok(sh.includes('A&amp;B&lt;C&gt;'));
  assert.ok(sh.includes('>=1+1</t>'));
  assert.ok(!/<f>|<v>|t="n"/.test(sh), 'formül ya da sayı hücresi olmamalı');
  assert.strictEqual((sh.match(/t="inlineStr"/g) || []).length, 9);
  assert.ok(sh.includes('>Sira No</t>') && sh.includes('>Seri</t>') && sh.includes('>Barkod</t>'));
  assert.ok(d['xl/styles.xml'].includes('numFmtId="49"'));
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  assert.ok(d['_rels/.rels'].includes('Type="' + R + 'officeDocument"'));
  assert.ok(d['xl/_rels/workbook.xml.rels'].includes('Type="' + R + 'worksheet"'));
  assert.ok(d['xl/_rels/workbook.xml.rels'].includes('Type="' + R + 'styles"'));
  assert.ok(d['[Content_Types].xml'].includes('spreadsheetml.sheet.main+xml'));
});

test('xlsx: fazladan alan yok, geçersiz satır hata verir, boş liste geçerli', () => {
  const d = zipOku(D.donusturIkili('xlsx', SATIRLAR));
  assert.ok(!Object.values(d).join('').includes('GIZLI'));
  assert.throws(() => D.donusturIkili('xlsx', [{ sira: 1, seri: 'S\u0001', barkod: 'B' }]), /denetim/);
  assert.throws(() => D.donusturIkili('xlsx', 'x'), /dizi/);
  const b = zipOku(D.donusturIkili('xlsx', []));
  assert.ok(b['xl/worksheets/sheet1.xml'].endsWith('</sheetData></worksheet>'));
});

test('xlsx: baş/son boşluk xml:space=preserve ile korunur', () => {
  const sh = zipOku(D.donusturIkili('xlsx', [{ sira: 1, seri: ' a ', barkod: 'B' }]))['xl/worksheets/sheet1.xml'];
  assert.ok(sh.includes('<t xml:space="preserve"> a </t>'));
});
