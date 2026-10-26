// Tasarım 1.7 (Stitch dili): sürüm eşitliği, durum çubuğu bağlamaları, rozetler, iki bölme, kontrast, güvenlik kısıtları.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');
const css = sablon.slice(sablon.indexOf('<style>'), sablon.indexOf('</style>'));
const govde = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
const betik = sablon.slice(sablon.lastIndexOf('<script>'));
const paket = JSON.parse(fs.readFileSync(path.join(kok, 'masaustu', 'package.json'), 'utf8'));

function satir(onEk) { return css.split('\n').find((l) => l.startsWith(onEk)); }
function belirtec(l) { const o = {}; for (const m of l.matchAll(/--([A-Za-z0-9-]+):(#[0-9A-Fa-f]{3,6})\b/g)) o[m[1]] = m[2].length === 4 ? '#' + [...m[2].slice(1)].map((c) => c + c).join('') : m[2]; return o; }
const acik = belirtec(satir(':root{')), koyu = Object.assign({}, acik, belirtec(satir(':root[data-tema=koyu]{')));
function lum(h) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function oran(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
const surumcu = (v) => v.split('.').map(Number);
function kucukMu(a, b) { const x = surumcu(a), y = surumcu(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; }

test('sürüm rozeti: şablonda tek sabit, package.json sürümüyle birebir eşit', () => {
  const m = [...betik.matchAll(/var SURUM='(\d+\.\d+\.\d+)'/g)];
  assert.strictEqual(m.length, 1, 'tek SURUM sabiti');
  assert.strictEqual(m[0][1], paket.version, 'SURUM ' + m[0][1] + ' != package.json ' + paket.version);
  assert.match(govde, /id="surumRozet"/);
  assert.match(betik, /r\.textContent='v'\+SURUM/);
  assert.ok(!/1\.[0-9]\.[0-9]/.test(govde.replace(/<svg[\s\S]*?<\/svg>/g, '')), 'gövdede sabit sürüm metni yok');
});

test('başlık şeridi: sürüm rozeti, çevrimdışı durum, Parametreler kısayolu Kurallar sekmesine gider', () => {
  const ust = govde.slice(govde.indexOf('<header class="ust">'), govde.indexOf('</header>'));
  assert.ok(ust.indexOf('</h1>') < ust.indexOf('id="surumRozet"') && ust.indexOf('id="ustIs"') < ust.indexOf('id="ustDurum"'));
  assert.match(ust, /<button type="button" class="ustParam" data-git="4">PARAMETRELER<\/button>/);
  assert.match(betik, /T\('ud\.hazir','ÇEVRİMDIŞI · HAZIR'\)/);
  assert.match(betik, /calisiyor\?T\('ud\.calisiyor'/);
  assert.match(betik, /\[data-git\]/);
  assert.doesNotMatch(govde, /COM3|Kesim Tezgah|ECC200|Savile|Super 150|\bAES-|RSA-|YÜN|\bDROP\b/);
});

test('alt durum çubuğu: gerçek değer bağlamaları, kelime asla gösterilmez', () => {
  const alt = govde.slice(govde.indexOf('<footer class="altCubuk">'), govde.indexOf('</footer>'));
  ['durum', 'durumOzet', 'sbYontem', 'sbSatir', 'sbIlerleme', 'sbKelime'].forEach((i) => assert.ok(alt.includes('id="' + i + '"'), i));
  const sb = betik.slice(betik.indexOf('function sbYaz()'), betik.indexOf('function rozetleriYaz()'));
  assert.match(sb, /sbTur\?T\('sb\.tur'/);            // seçili tür ve uzunluk
  assert.match(sb, /T\('sb\.yontem','YÖNTEM: \{0\}',sbYontem\)/);
  assert.match(sb, /uretim\.n\.length/);               // üretilmiş satır
  assert.match(sb, /sbUygun/);                         // uygun satır
  assert.match(sb, /sbIlerle/);                        // ilerleme
  assert.match(sb, /KELİME: AYARLI/); assert.match(sb, /KELİME: BOŞ/);
  assert.ok(!/kelimeAlan\.value[^?]*,/.test(sb.replace(/kelimeAlan&&kelimeAlan\.value\?/, '')), 'kelime değeri metne girmez');
  assert.match(betik, /sbUygun=Math\.max\(0,k\.son-k\.bas\+1\)/);
  assert.match(betik, /kelimeAlan\.addEventListener\('input',durumCubuguYaz\)/);
  assert.match(betik, /sbIlerle=d;durumCubuguYaz\(\)/);
  assert.match(css, /\.altIc\{min-height:24px/);
  assert.match(css, /\.altCubuk\{background:var\(--ust\);color:var\(--ustYazi\)/);
  assert.match(css, /\.altCubuk \.altIc #durum\{[^}]*color:var\(--ustYazi\)/);
});

test('rozetler: bölüm başlıkları gerçek değerden dolar, kural şeridi tür profilinden', () => {
  const rz = [...govde.matchAll(/data-rz="(\w+)"/g)].map((m) => m[1]);
  assert.ok(rz.length >= 10);
  const fonk = betik.slice(betik.indexOf('function rozetleriYaz()'), betik.indexOf('function durumCubuguYaz()'));
  new Set(rz).forEach((r) => assert.ok(new RegExp('\\b' + r + ':T\\(').test(fonk), 'rozet kaynağı: ' + r));
  const ks = betik.slice(betik.indexOf('function kuralSeritYaz'), betik.indexOf('function ozetTemizle'));
  assert.match(ks, /K\.turProfili\(k\.standart\)/);
  assert.match(ks, /p\.kontrolZorunlu/);
  assert.match(ks, /p\.alanlar\[kk\]!=='serbest'/);
  assert.match(css, /\.rozetM\{[^}]*border-left:3px solid var\(--iplik\)/);
  assert.match(css, /\.rozetM\.zorunlu\{background:var\(--iplik\);[^}]*color:var\(--iplikUstu\)/, 'sarı üstüne koyu metin');
  assert.match(betik, /T\('y\.varsayilan','VARSAYILAN'\)/);
});

test('iki bölme: form | sonuç yapısı ve dikişli çerçeve; 1000 px altında tek sütun', () => {
  ['p1', 'p2', 'p4', 'p6', 'p7', 'p8', 'p10'].forEach((p) => {
    const a = govde.indexOf('id="' + p + '"');
    const b = govde.indexOf('<div class="panel"', a + 5);
    const t = govde.slice(a, b < 0 ? govde.length : b);
    assert.ok(t.includes('class="iki"') && t.includes('class="bSol"') && t.includes('class="bSag dikisCerceve"'), p);
  });
  assert.match(css, /@media \(min-width:1000px\)\{\.iki\{grid-template-columns:minmax\(0,1\.05fr\) minmax\(0,1fr\)/);
  assert.match(css, /\.dikisCerceve::before\{[^}]*border:1px dashed/);
});

test('başlıklar serif, tablo başlıkları mono ve büyük harf yazılmış; her sekmenin başlığı baslikSatir içinde', () => {
  assert.match(css, /h2\{font:600 var\(--t-2xl\)\/1\.2 var\(--baslikSerif\)/);
  assert.equal((govde.match(/class="baslikSatir"><h2>/g) || []).length, 11);
  assert.match(css, /th\{font:700 var\(--t-xs\)\/1\.2 var\(--mono\)/);
  [...govde.matchAll(/<th>([^<]+)<\/th>/g)].forEach((m) => assert.strictEqual(m[1], m[1].toLocaleUpperCase('tr'), m[1]));
  assert.match(sablon, /<html lang="tr">/);
});

test('sekme ikonları CSS maske (data:), dokuz sekmenin hepsi ve panel başlığı için tanımlı', () => {
  ['s1', 's2', 's3', 's8', 's9', 's10', 's4', 's6', 's5'].forEach((id) => assert.match(css, new RegExp('(^|\\n)#' + id + '[,{]'), id));
  assert.match(css, /\.baslikSatir h2::before\{[^}]*mask:var\(--ik\)/);
  const govdeSvg = govde.match(/<svg/g) || [];
  assert.strictEqual(govdeSvg.length, 1, 'gövdede yalnız üst şerit logosu');
  assert.doesNotMatch(css, /url\(\s*(?!["']?data:)/);
});

test('kontrast ve erişilebilirlik: durum çubuğu/şerit/rozet, 12 px alt sınır, hedefler', () => {
  [['açık', acik], ['koyu', koyu]].forEach(([ad, t]) => {
    assert.ok(oran(t.ustSoluk, t.ust) >= 4.5, ad + ' ustSoluk/ust ' + oran(t.ustSoluk, t.ust).toFixed(2));
    assert.ok(oran(t.ustYazi, t.ust) >= 4.5, ad + ' ustYazi/ust');
    assert.ok(oran(t.murek, t.yuzey2) >= 4.5, ad + ' rozet murek/yuzey2');
    assert.ok(oran(t.murek, t.yuzey) >= 4.5, ad + ' murek/yuzey');
    assert.ok(oran(t.soluk, t.yuzey2) >= 4.5, ad + ' soluk/yuzey2 (boş durum, özet)');
    assert.ok(oran(t.iplikUstu, t.iplik) >= 4.5, ad + ' sarı üstü koyu metin');
    assert.ok(oran(t.eylem, t.kagit) >= 3, ad + ' başlık simgesi');
  });
  assert.ok(oran('#FFFFFF', acik.iplik) < 4.5, 'beyaz sarı üstünde kullanılmaz');
  assert.doesNotMatch(css, /color:#fff[^;}]*;[^}]*background:var\(--iplik\)/);
  const kucuk = [...css.matchAll(/font(?:-size)?:[^;}]*?(?<![\d.])(\.[0-7]\d*|0\.[0-7]\d*)rem/g)].map((m) => m[0]);
  assert.deepStrictEqual(kucuk, [], '12 px altı yazı: ' + kucuk.join(' | '));
  assert.match(css, /--t-xs:\.8125rem/);
  assert.match(css, /\.ustParam\{[^}]*min-height:var\(--hedef\)/);
  assert.match(css, /button\.kucuk\{min-height:var\(--hedef\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.ust :focus-visible\{outline:3px solid var\(--iplik\)/);
});

test('güvenlik: CSP aynı, yazı tipi gömülmez, büyük harf dönüşümü yok, innerHTML/ağ yok', () => {
  assert.ok(sablon.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:">'));
  assert.doesNotMatch(css, /text-transform/);
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|\bfetch\s*\(/.test(betik));
  assert.ok(!/(src|href)\s*=\s*["']https?:/i.test(sablon));
});
