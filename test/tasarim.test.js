// Tasarım dili (1.5.0): üst şerit pencere çerçevesi, belirteçler, erişilebilirlik, çevrimdışı kısıtlar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');
const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
const css = sablon.slice(sablon.indexOf('<style>'), sablon.indexOf('</style>'));
const betik = sablon.slice(sablon.lastIndexOf('<script>'));

function satir(onEk) { return css.split('\n').find((l) => l.startsWith(onEk)); }
function belirtec(l) {
  const o = {};
  for (const m of l.matchAll(/--([A-Za-z0-9-]+):(#[0-9A-Fa-f]{3,6})\b/g)) o[m[1]] = m[2].length === 4 ? '#' + [...m[2].slice(1)].map((c) => c + c).join('') : m[2];
  return o;
}
const acik = belirtec(satir(':root{'));
const koyu = belirtec(satir(':root[data-tema=koyu]{'));
const koyuSistem = belirtec(satir('@media (prefers-color-scheme:dark)'));

function lum(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function oran(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

test('yeni belirteçler açık ve koyu temada tanımlı; koyu sistem teması ile data-tema=koyu aynı değerler', () => {
  ['ust', 'ustYazi', 'ustSoluk', 'ustSimge', 'yuzey2'].forEach((a) => {
    assert.ok(acik[a], 'açık ' + a);
    assert.ok(koyu[a], 'koyu ' + a);
  });
  assert.deepStrictEqual(koyuSistem, koyu, 'iki koyu blok aynı olmalı');
  ['--ustUstu', '--iplik', '--gol', '--r1', '--r2', '--s1', '--s6', '--t-xs', '--t-2xl', '--yazi', '--baslik', '--mono'].forEach((t) => assert.ok(satir(':root{').includes(t + ':'), t));
  assert.ok(acik.iplik === '#F4C430' && acik.eylem === '#1E6B52', 'marka renkleri korunur');
});

test('kontrast WCAG AA: metin >= 4.5, düğme/alan kenarı >= 3', () => {
  [['açık', acik], ['koyu', koyu]].forEach(([ad, t]) => {
    const tam = Object.assign({}, acik, t);
    [['murek', 'kagit'], ['murek', 'yuzey'], ['soluk', 'kagit'], ['soluk', 'yuzey'], ['soluk', 'yuzey2'], ['eylem', 'kagit'], ['eylemYazi', 'eylem'], ['eylemKoyu', 'eylemSoluk'], ['hata', 'kagit'], ['tamam', 'kagit'], ['ustYazi', 'ust'], ['ustSoluk', 'ust'], ['iplik', 'ust']].forEach(([a, b]) => {
      const x = tam[a], y = tam[b];
      assert.ok(oran(x, y) >= 4.5, ad + ' ' + a + '/' + b + ' ' + oran(x, y).toFixed(2));
    });
    assert.ok(oran(tam.kenar, tam.yuzey) >= 3, ad + ' kenar/yüzey');
  });
});

test('masaüstü: html[data-masaustu] kuralları — sürükleme alanı, no-drag, sistem düğmesi boşluğu, yapışkan şerit', () => {
  assert.match(css, /html\[data-masaustu\] \.ust\{[^}]*-webkit-app-region:drag/);
  assert.match(css, /html\[data-masaustu\] \.ust :is\(select,label,button,a,input,option\)\{-webkit-app-region:no-drag\}/);
  assert.match(css, /env\(titlebar-area-x,0px\)/);
  assert.match(css, /env\(titlebar-area-width,calc\(100vw - 138px\)\)/, 'env yoksa 138 px sistem düğmesi payı');
  assert.match(css, /html\[data-masaustu\]\[data-mac\]\{--ustSag:18px\}/);
  assert.match(css, /html\[data-masaustu\]\[data-mac\] \.ustIc\{padding-left:84px\}/);
  assert.match(css, /html\[data-masaustu\] \.ust\{position:sticky;top:0/);
  assert.match(css, /html\[data-masaustu\] \.ustIc\{max-width:none;[^}]*flex-wrap:nowrap/);
  // web sürümünde sürükleme alanı olmamalı: app-region yalnız data-masaustu altında geçer
  const disarida = css.split('\n').filter((l) => /-webkit-app-region/.test(l) && !/^html\[data-masaustu\]/.test(l));
  assert.deepStrictEqual(disarida, []);
});

test('masaüstü işareti: erken betik Electron user-agent ile data-masaustu/data-mac koyar; ikinci <script> yok', () => {
  assert.match(sablon, /\/Electron\\\/\/\.test\(u\)/);
  assert.match(sablon, /setAttribute\("data-masaustu",""\)/);
  assert.match(sablon, /setAttribute\("data-mac",""\)/);
  assert.strictEqual((cikti.match(/<script>/g) || []).length, 2);
});

test('üst şerit: ad ve logo solda, seçiciler sağda; şerit rengi belirteçten, sarı dikiş izi alt kenarda', () => {
  assert.match(css, /\.ust\{position:relative;background:var\(--ust\);color:var\(--ustYazi\)\}/);
  assert.match(css, /\.ust::after\{[^}]*repeating-linear-gradient\(90deg,var\(--iplik\)/);
  assert.match(css, /\.ustIc h1\{flex:0 0 auto;margin-right:auto/);
  const ust = sablon.slice(sablon.indexOf('<header class="ust">'), sablon.indexOf('</header>'));
  assert.ok(ust.indexOf('<h1>') < ust.indexOf('id="tema"') && ust.indexOf('id="tema"') < ust.indexOf('id="dil"'));
  assert.ok(ust.includes('id="ustIs"') && ust.includes('id="dikisIl"'), 'şerit ortası ve ilerleme dikişi');
  assert.match(ust, /id="dikisIl" role="progressbar"[^>]*aria-valuenow="0"/);
});

test('başlık şeridi 1.6: iplik ilerleme göstergesi 10 adımlı, pasif pencerede dikiş solar, yalnız masaüstünde', () => {
  assert.match(css, /\.dikisIl\{[^}]*width:calc\(var\(--ilerleme,0\) \* 1%\)/);
  assert.match(css, /html\[data-pasif\] \.ust::after,html\[data-pasif\] \.dikisIl\{opacity:\.4\}/);
  assert.match(betik, /Math\.floor\(y\/10\)\*10/);
  assert.match(betik, /if\(k\.hasAttribute\('data-masaustu'\)\)\{\s*window\.addEventListener\('blur'/);
  assert.ok(/ustIlerleme\(null\)/.test(betik), 'işlem bitince gösterge gizlenir');
});

test('logo 1.6: işaret 4 kalınlıkta çubuk, sarı anahtar deliği, 6 dikiş; favicon aynı', () => {
  const ust = sablon.slice(sablon.indexOf('<header class="ust">'), sablon.indexOf('</header>'));
  assert.match(ust, /<svg width="26" height="24" viewBox="84 100 344 306"/);
  assert.equal((ust.match(/rx="6"\/>/g) || []).length >= 1, true);
  assert.equal((ust.match(/<rect x="\d+" y="382"/g) || []).length, 6);
});

test('sekme ve menü yapısı korunur: dokuz sekme aynı sırada, seçili sekme sarı gösterge', () => {
  const adlar = [...sablon.slice(sablon.indexOf('id="gezinme"'), sablon.indexOf('</nav>')).matchAll(/role="tab"[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  assert.deepStrictEqual(adlar, ['Üret', 'Çöz', 'Liste', 'Doğrula', 'Geçmiş', 'Barkod türleri', 'Kurallar', 'Önizleme', 'Yardım']);
  assert.match(css, /\.sekmeIc button\.secili\{[^}]*border-bottom-color:var\(--iplik\)/);
});

test('tipografi: sistem yazı tipi yığını (serif/mono yığın adı; gömülü dosyalar yalnız derlemede data: ile) ve BÜYÜK HARF etiket yok', () => {
  assert.match(css, /--yazi:"Segoe UI Variable Text","Segoe UI Variable","Segoe UI",ui-sans-serif,system-ui/);
  assert.match(css, /body\{[^}]*font:1rem\/1\.55 var\(--yazi\)/);
  assert.match(css, /\/\*FONTLAR\*\//); // @font-face yalnız build'de eklenir; sıkı denetim: test/yazi-gomme.test.js
  assert.doesNotMatch(css, /url\(\s*(?!["']?data:)/, 'url() yalnız data: (satır içi simge) olabilir');
  assert.doesNotMatch(css, /text-transform:\s*uppercase/);
  assert.doesNotMatch(css, /font-family:[^;}]*(Inter|Roboto Flex|Google)/);
});

test('hareket: geçiş animasyonu serbest, ama azaltılmış hareket kuralı hepsini kapatır; Görünüm penceresinde hareket yok', () => {
  // Yusuf 2026-11-03: sekme/panel geçişleri animasyonlu olsun. Koşul: hareket azaltma her şeyi kapatır, #gorunum hareketsiz kalır.
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\*\{animation:none!important;transition:none!important/);
  assert.doesNotMatch(css, /#gorunum[^{}]*\{[^}]*(animation:(?!none)|transition:)/);
});

test('dar ekran: viewport meta, 560 px kuralları, üst şerit sarar (web), yatay kaydırma kaynağı yok', () => {
  assert.match(sablon, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(css, /@media \(max-width:560px\)/);
  assert.match(css, /\.ustIc\{max-width:860px;margin:0 auto;padding:[^}]*flex-wrap:wrap/);
  assert.doesNotMatch(css, /\.ustIc\{[^}]*min-width:\s*\d{3,}px/);
});

test('CSP değişmedi; innerHTML/eval/fetch/ağ yok; harici kaynak yok', () => {
  assert.ok(sablon.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:">'));
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(betik));
  assert.ok(!/\beval\s*\(|new Function|\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(cikti.slice(cikti.lastIndexOf('<script>'))));
  assert.ok(!/(src|href)\s*=\s*["']https?:/i.test(sablon));
  assert.ok(!/@import|url\(\s*["']?https?:/i.test(sablon));
});

test('logo: üst şeritte 28 px SVG (anahtar delikli barkod), favicon aynı tasarım, eski şerit-T logosu kalmadı', () => {
  assert.match(sablon, /<h1><svg width="26" height="24" viewBox="84 100 344 306" aria-hidden="true" focusable="false">/);
  const fav = decodeURIComponent(sablon.match(/rel="icon"[^>]*href="data:image\/svg\+xml,([^"]+)"/)[1]);
  assert.ok(fav.includes('#14513D') && fav.includes('#F4C430') && fav.includes('#F6F1E3'));
  assert.ok(fav.includes("<circle cx='316' cy='190' r='19'"), 'anahtar deliği');
  assert.ok(!fav.includes('#1E6B52'), 'eski yeşil kare yok');
});

test('barkod etiketi: dikişli iç kenar ve sarı şerit; sonuç mantığı etkilenmez', () => {
  assert.match(css, /\.etiketGovde::before\{[^}]*border:1px dashed/);
  assert.match(css, /\.etiketSerit::after\{/);
  assert.match(css, /\.etiket\{[^}]*background:var\(--etiketZemin\);color:var\(--etiketYazi\)/, 'barkod her temada beyaz zeminde okunur');
  assert.match(css, /--etiketZemin:#FFFFFF;--etiketYazi:#17262B/, 'etiket renkleri temadan bağımsız sabit');
});

test('odak halkası ve düğme durumları: focus-visible, active, disabled, hover', () => {
  assert.match(css, /:focus-visible\{outline:3px solid var\(--odak\)/);
  assert.match(css, /\.ust :focus-visible\{outline:3px solid var\(--iplik\)/);
  assert.match(css, /button:active\{/);
  assert.match(css, /button:disabled\{opacity:\.5/);
  assert.match(css, /input:hover,select:hover,textarea:hover\{/);
});

test('menü 1.6.1: Yardım en sağda, benzer sekmeler Daha fazla çekmecesinde, klavye ve ARIA', () => {
  const nav = sablon.slice(sablon.indexOf('id="gezinme"'), sablon.indexOf('</nav>'));
  assert.ok(nav.indexOf('id="cekmeceDugme"') < nav.indexOf('id="s10"') && nav.indexOf('id="s6"') < nav.indexOf('id="s5"'));
  assert.match(nav, /id="cekmeceDugme"[^>]*aria-haspopup="true" aria-expanded="false" aria-controls="cekmece"/);
  assert.match(nav, /id="s5"[^>]*class="sagSekme"/);
  assert.match(css, /\.sekmeIc \.sagSekme\{margin-left:auto\}/);
  assert.match(css, /\.cekmece\[hidden\]\{display:none\}/);
  assert.match(betik, /k==='Escape'/);
});
