'use strict';
// Türe özel kural seti, ön ayar, GS1 arayüz bağlaması ve yazı tipi gömme (derlenmiş sayfa üzerinde sıkı denetim).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../src/kural.js');
const EN = require('../src/dil_en.js');

const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src/sablon.html'), 'utf8');
const betik = sablon.slice(sablon.lastIndexOf('<script>'));
const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
const TURLER = ['code128', 'code39', 'code93', 'qr', 'datamatrix', 'ean13', 'ean8', 'upca', 'itf14'];

test('ön ayar: Code 128 varsayilan() ile birebir aynı; her tür geçerli, uyarısız ve çalışır', () => {
  assert.deepStrictEqual(K.turKuralOnAyari('code128'), K.varsayilan());
  TURLER.forEach((t) => {
    const k = K.turKuralOnAyari(t);
    assert.strictEqual(k.standart, t);
    assert.deepStrictEqual(K.kuralTemizle(k).uyarilar, [], t);
    assert.ok(K.uzunlukBelirle(k).toplamRakam > 0, t);
    const c = K.calismaKurali(k, 'deneme').calisma;
    assert.ok(K.coz(K.barkodMetni(5, c), c).gecerli, t);
  });
  assert.throws(() => K.turKuralOnAyari('bilinmeyen'), /Bilinmeyen/);
});

test('ön ayar: GS1 türlerinde gerçek değerler (önek, sabit uzunluk, kilitli Luhn); diğerlerinde TO', () => {
  const b = { ean13: ['869', 10], ean8: ['86', 6], upca: ['0', 11], itf14: ['1869', 10] };
  Object.keys(b).forEach((t) => {
    const k = K.turKuralOnAyari(t);
    assert.strictEqual(k.onek, b[t][0]); assert.strictEqual(k.uzunluk, b[t][1]);
    assert.strictEqual(k.uzunluk + k.onek.length, K.GS1_UZUNLUK[t]);
    assert.strictEqual(k.luhn, true); assert.strictEqual(k.uzunlukModu, 'elle');
  });
  ['code128', 'code39', 'code93', 'qr', 'datamatrix'].forEach((t) => assert.strictEqual(K.turKuralOnAyari(t).onek, 'TO'));
  const k = K.turKuralOnAyari('ean13'); k.onek = 'X';
  assert.strictEqual(K.turKuralOnAyari('ean13').onek, '869', 'kopya döner');
});

test('türe özel kurallar: yalnız o türde; Code 128 kural seti değişmedi (boş)', () => {
  assert.deepStrictEqual(K.turOzelKurallar('code128'), []);
  const kodlar = {};
  TURLER.forEach((t) => { kodlar[t] = K.turOzelKurallar(t).map((o) => o.kod); });
  assert.ok(kodlar.ean13.includes('ean13.onek') && kodlar.ean13.includes('toplam'));
  assert.deepStrictEqual(kodlar.ean13.slice(0, 3), ['toplam', 'kontrol', 'onekRakam']);
  ['ean8.onek'].forEach((c) => assert.deepStrictEqual(TURLER.filter((t) => kodlar[t].includes(c)), ['ean8']));
  assert.deepStrictEqual(TURLER.filter((t) => kodlar[t].includes('upca.sayi')), ['upca']);
  assert.deepStrictEqual(TURLER.filter((t) => kodlar[t].includes('itf14.ambalaj')), ['itf14']);
  assert.deepStrictEqual(TURLER.filter((t) => kodlar[t].includes('buyuk')).sort(), ['code39', 'code93']);
  assert.deepStrictEqual(K.turOzelKurallar('ean13').find((o) => o.kod === 'toplam').p, [13]);
  assert.deepStrictEqual(K.turOzelKurallar('ean8').find((o) => o.kod === 'onekRakam').p, [5]);
});

test('arayüz: tür başına ayrı değer deposu, ön ayar K kaynağından, balon ve EN metinleri', () => {
  assert.match(betik, /var turDeger=\{\}/);
  assert.match(betik, /turDeger\[eski\]=turAlanOku\(\)/);
  assert.match(betik, /K\.turKuralOnAyari\(yeni\)/);
  assert.match(betik, /K\.turOzelKurallar\(st\)/);
  assert.match(betik, /ipucuYaz\('turozel'/);
  assert.match(sablon, /data-ipucu="turozel"/);
  assert.doesNotMatch(betik.slice(betik.indexOf('function turOzelYaz'), betik.indexOf('function sabitUzunlukEsle')), /innerHTML/);
  ['to.baslik', 'to.toplam', 'to.ean13', 'tb.ean13', 'tb.itf14', 'ks.onAyar', 'ks.buyuk', 'on.geri', 'ip.gs1'].forEach((k) => {
    assert.ok(EN.m[k], k); assert.ok(betik.includes("T('" + k + "'"), k);
  });
});

test('GS1 arayüzü: doğrulama, ZPL/TSPL, kopyala/indir, açık uyarı notu TR+EN, güvenli yazım', () => {
  ['gsTur', 'gsGirdi', 'gsOkunur', 'gsZpl', 'gsTspl', 'gsZplKopya', 'gsTsplKopya', 'gsZplIndir', 'gsTsplIndir', 'hataGs'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
  assert.match(betik, /Gs\.coz\(v\)/); assert.match(betik, /Gs\.zpl\(v,tur\)/); assert.match(betik, /Gs\.tspl\(v,tur\)/);
  assert.match(betik, /indirBlob\(\[metin\],'text\/plain/);
  assert.match(betik, /\$\('hataGs'\)\.textContent=H\(e\)/);
  assert.ok(sablon.includes('Yazıcı sözdizimi gerçek yazıcıda doğrulanmadı.'));
  assert.ok(EN.s['Yazıcı sözdizimi gerçek yazıcıda doğrulanmadı. Çıktıyı üretimde kullanmadan önce kendi yazıcınızda deneyin.'].startsWith('Printer syntax has not been verified on a real printer.'));
  assert.ok(!/innerHTML|eval\(|fetch\(/.test(betik.slice(betik.indexOf('function gsGuncelle'), betik.indexOf('function lisansYaz'))));
});

test('yazı tipi gömme (derlenmiş sayfa): yalnız data: URI, uzak url yok, font-src yalnız data:, CSP geri kalanı aynı', () => {
  const css = cikti.slice(cikti.indexOf('<style>'), cikti.indexOf('</style>'));
  const bloklar = css.match(/@font-face\{[^}]*\}/g) || [];
  assert.strictEqual(bloklar.length, 3);
  const dosyalar = ['newsreader-600', 'spacemono-400', 'spacemono-700'];
  bloklar.forEach((b, i) => {
    const urls = b.match(/url\(([^)]*)\)/g);
    assert.strictEqual(urls.length, 1);
    const m = /^url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)$/.exec(urls[0]);
    assert.ok(m, 'yalnız data: woff2 URI');
    assert.ok(Buffer.from(m[1], 'base64').equals(fs.readFileSync(path.join(kok, 'yazi', dosyalar[i] + '.woff2'))), dosyalar[i]);
    assert.match(b, /font-display:swap/);
    assert.match(b, /unicode-range:U\+0000-00FF,U\+0100-017F,U\+0131,/);
    assert.ok(!/U\+20BA/.test(b), '₺ bildirilmez: yedek yığından gelir');
  });
  assert.deepStrictEqual(bloklar.map((b) => /font-family:"([^"]+)"/.exec(b)[1]), ['Newsreader', 'Space Mono', 'Space Mono']);
  assert.ok(!/url\(\s*(?!data:|["']?data:)/.test(css), 'css içinde data: dışı url yok');
  assert.ok(!/@import|url\(\s*["']?https?:/i.test(css));
  assert.ok(!/text-transform:\s*uppercase/.test(css));
  const csp = /http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(cikti)[1];
  assert.strictEqual(csp, "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:");
  assert.strictEqual((csp.match(/font-src/g) || []).length, 1);
  assert.match(css, /--baslikSerif:"Newsreader",Cambria/);
  assert.match(css, /--mono:"Space Mono",ui-monospace,"Cascadia Mono","SF Mono",Consolas/);
  assert.match(css, /--yazi:"Segoe UI Variable Text"/);
  assert.ok(!sablon.includes('@font-face') && sablon.includes('/*FONTLAR*/'), 'kaynak şablon şişmez');
});

test('yazı tipi lisansları: build gömer, textContent ile yazılır, </script oluşmaz', () => {
  const son = cikti.slice(cikti.lastIndexOf('<script>'));
  assert.ok(!/<\/script/i.test(son.slice(0, son.lastIndexOf('</script>'))));
  ['Newsreader-OFL.txt', 'SpaceMono-OFL.txt'].forEach((f) => {
    const ilk = fs.readFileSync(path.join(kok, 'yazi', f), 'utf8').replace(/\r\n?/g, '\n').trim().split('\n')[0];
    assert.ok(son.includes(JSON.stringify(ilk).slice(1, -1).replace(/</g, '\\u003c')), f);
  });
  assert.match(betik, /e\.textContent=YAZI_LISANS&&/);
  assert.ok(sablon.includes('id="lisNewsreader"') && sablon.includes('id="lisSpaceMono"'));
});

let chromium = null;
try { chromium = require('playwright').chromium; } catch (e) { try { chromium = require('/opt/node-tools/node_modules/playwright').chromium; } catch (e2) {} }
const exe = '/opt/pw-browsers/chromium';
const atla = !chromium || !fs.existsSync(path.join(kok, 'barkod-sifreleme.html'));

test('tarayıcı: tür başına ayrı değerler, türe özel blok, GS1 çıktıları, çevrimdışı yazı tipleri', { skip: atla && 'playwright yok' }, async () => {
  const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  try {
    const c = await b.newContext({ locale: 'tr-TR' });
    const p = await c.newPage();
    const hatalar = [], istek = [];
    p.on('pageerror', (e) => hatalar.push(String(e)));
    p.on('request', (r) => istek.push(r.url()));
    await p.goto('file://' + path.join(kok, 'barkod-sifreleme.html'));
    await p.click('#cekmeceDugme'); await p.click('#s4');
    const al = () => p.evaluate(() => ({ onek: onek.value, uz: uzunluk.value, son: document.getElementById('son').value, luhnD: luhn.disabled, ozel: !turOzel.hidden, mod: document.querySelector('input[name=uzmod]:checked').value }));
    assert.deepStrictEqual(await al(), { onek: 'TO', uz: '12', son: '100', luhnD: false, ozel: false, mod: 'otomatik' });
    await p.selectOption('#standart', 'ean13');
    assert.deepStrictEqual(await al(), { onek: '869', uz: '10', son: '100', luhnD: true, ozel: true, mod: 'elle' });
    assert.match(await p.textContent('#turOzelListe'), /869/);
    await p.fill('#onek', '12'); await p.fill('#son', '500');
    await p.selectOption('#standart', 'code39');
    assert.deepStrictEqual(await al(), { onek: 'TO', uz: '12', son: '100', luhnD: false, ozel: true, mod: 'otomatik' });
    assert.doesNotMatch(await p.textContent('#turOzelListe'), /869|GS1/);
    await p.selectOption('#standart', 'ean13');
    assert.strictEqual((await al()).onek, '12'); assert.strictEqual((await al()).son, '500');
    await p.fill('#onek', 'AB'); // türe aykırı: mevcut doğrulama yolu hata gösterir
    assert.match(await p.textContent('#hataKural'), /rakam/);
    await p.click('#varsayilan');
    assert.strictEqual((await al()).onek, 'TO');
    await p.selectOption('#standart', 'ean13');
    assert.strictEqual((await al()).onek, '869', 'varsayılana dön tüm tür belleğini sıfırlar');
    // GS1 arayüzü
    await p.click('#cekmeceDugme'); await p.click('#s10');
    await p.click('#gsOrnek');
    assert.strictEqual(await p.textContent('#gsOkunur'), '(01)09506000134352(17)261231(10)LOT1');
    assert.match(await p.inputValue('#gsZpl'), /^\^XA/); assert.match(await p.inputValue('#gsTspl'), /EAN128/);
    const [indirme] = await Promise.all([p.waitForEvent('download'), p.click('#gsZplIndir')]);
    assert.strictEqual(indirme.suggestedFilename(), 'taarkod-gs1-128.zpl');
    await p.selectOption('#gsTur', 'datamatrix');
    assert.match(await p.textContent('#gsTsplHata'), /desteklenmiyor/);
    assert.ok(await p.isDisabled('#gsTsplKopya'));
    await p.fill('#gsGirdi', '(01)09506000134353');
    assert.match(await p.textContent('#hataGs'), /kontrol/);
    assert.ok(await p.isVisible('#gsUyari'));
    // yazı tipleri dosya:// ile yüklenir, ağ isteği yok
    await p.click('#s5');
    const f = await p.evaluate(async () => { await document.fonts.load('600 16px Newsreader'); await document.fonts.load('700 16px "Space Mono"'); await document.fonts.load('16px "Space Mono"'); return [document.fonts.check('600 16px Newsreader'), document.fonts.check('700 16px "Space Mono"'), document.fonts.check('16px "Space Mono"'), document.getElementById('lisNewsreader').textContent.includes('SIL Open Font License')]; });
    assert.deepStrictEqual(f, [true, true, true, true]);
    assert.deepStrictEqual(istek.filter((u) => !/^(file|data|blob):/.test(u)), []);
    assert.deepStrictEqual(hatalar, []);
  } finally { await b.close(); }
});
