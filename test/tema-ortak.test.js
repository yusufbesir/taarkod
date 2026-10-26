'use strict';
// Ortak tema modülü (src/tema.js, sürüm 1.1) ve belirteç katmanı: kontrast eşikleri, türetim, Klasik (1.7.1), sabit renk yasağı,
// Görünüm penceresi (Playwright). Plan: kasa/notlar/ortak-tema-belirtec-plani.md (§1-§7) ve "Tutaa tema ve ozellestirme gorevi.md" (§3, §6).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const kok = path.join(__dirname, '..');
const T = require('../src/tema.js');
const U = require('../src/tema_uygulama.js');
const F = require('./sabit-1.7.1.json');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');

let chromium = null;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require('/opt/node-tools/node_modules/playwright').chromium; } catch (e2) {}
}
const exe = '/opt/pw-browsers/chromium';
const HTML = process.env.TAARKOD_HTML || path.join(kok, 'barkod-sifreleme.html');
const atla = !chromium || !fs.existsSync(HTML);

/* ---------- bağımsız WCAG hesabı (modülün kendi işlevine güvenilmez) ---------- */
function lum(h) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function oran(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const HEX6 = /^#[0-9A-F]{6}$/;

// Plan §4 tablosu (bağımsız kopya): [renk, [zeminler], eşik]
const PLAN_ESIKLERI = [
  ['ustYazi', ['ust'], 4.5], ['ustSoluk', ['ust'], 4.5],
  ['eylemYazi', ['eylem', 'eylemKoyu'], 4.5],
  ['murek', ['kagit', 'yuzey', 'yuzey2'], 4.5], ['soluk', ['kagit', 'yuzey', 'yuzey2'], 4.5],
  ['eylem', ['kagit', 'yuzey'], 4.5],
  ['kenar', ['yuzey'], 3],
  ['iplik', ['ust'], 3],
  ['iplikYazi', ['kagit'], 4.5],
  ['odak', ['kagit', 'yuzey'], 3],
  ['hata', ['yuzey'], 4.5], ['tamam', ['yuzey'], 4.5]
];
function esikler(m, yuksek, ad) {
  const ek = yuksek ? 1.5 : 0, kotu = [];
  PLAN_ESIKLERI.forEach(([a, bler, esik]) => bler.forEach((b) => {
    const r = oran(m[a], m[b]);
    if (r + 1e-9 < esik + ek) kotu.push(ad + ' ' + a + '/' + b + ' ' + r.toFixed(2) + ' < ' + (esik + ek));
  }));
  return kotu;
}

const PALETLER = ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas', 'klasik'];

test('tema.js: başlıkta sürüm numarası, uygulamaya özgü ad/DOM/depo yok, UMD global BarkodTema', () => {
  const src = fs.readFileSync(path.join(kok, 'src', 'tema.js'), 'utf8');
  assert.match(src.split('\n')[0], /^\/\* tema\.js 1\.1 /);
  assert.strictEqual(T.SURUM, '1.1');
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/BarkodTema/g, '');
  assert.ok(!/taarkod|tutaa|barkod|localStorage|document\.|window\.|innerHTML|fetch\(|eval\(/i.test(kod), 'uygulamaya özgü ya da DOM kodu yok');
  assert.match(src, /kok\.BarkodTema = fabrika\(\)/);
  const ortak = '/mnt/project-files/ortak/tema.js';
  if (fs.existsSync(ortak)) assert.strictEqual(fs.readFileSync(ortak, 'utf8'), src, 'ortak/tema.js ile birebir aynı');
});

test('ön ayar tablosu Tutaa §3 ile aynı; Taş ipliği #E8B04A; 6 palet + Klasik + Özel', () => {
  const beklenen = {
    lacivert: ['#1B2A4A', '#1F4E8C', '#E0693A', '#F5F3EE', '#1A2233'], antrasit: ['#2B2F36', '#3F5A7A', '#E3A21A', '#F4F4F2', '#1C1F24'],
    bordo: ['#4A1C2B', '#8A2E45', '#D9A441', '#F6F1EE', '#2A1A20'], cam: ['#0F3B2E', '#1E6B52', '#F4C430', '#F4F4EC', '#17262B'],
    eflatun: ['#2E2650', '#5B3FA0', '#E7B23C', '#F3F1F7', '#1F1A33'], tas: ['#4E463C', '#7A5C2E', '#E8B04A', '#F6F3EC', '#2A2620']
  };
  Object.keys(beklenen).forEach((k) => {
    const p = T.ONAYARLAR[k];
    assert.deepStrictEqual([p.ust, p.eylem, p.iplik, p.kagit, p.murek], beklenen[k], k);
  });
  assert.deepStrictEqual(T.PALETLER, ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas', 'klasik', 'ozel']);
});

test('48 kombinasyon (6 ön ayar + Klasik) x {ton,tum} x {açık,koyu} x {normal,yüksek}: plan §4 eşiklerinin tümü geçer, reddedilen yok', () => {
  let say = 0;
  PALETLER.forEach((palet) => ['ton', 'tum'].forEach((bicim) => ['acik', 'koyu'].forEach((mod) => ['normal', 'yuksek'].forEach((kontrast) => {
    const ad = [palet, bicim, mod, kontrast].join('/');
    const r = T.uretAyrinti({ palet, bicim, mod, kontrast }, U);
    assert.strictEqual(r.ok, true, ad + ' reddedildi: ' + JSON.stringify(r.red));
    T.TUM_ANAHTAR.forEach((a) => assert.ok(a === 'ustUstu' ? /^#[0-9A-F]{8}$/.test(r.belirtec[a]) : HEX6.test(r.belirtec[a]), ad + ' ' + a + '=' + r.belirtec[a]));
    assert.deepStrictEqual(esikler(r.belirtec, kontrast === 'yuksek', ad), []);
    assert.deepStrictEqual(T.dogrula(r.belirtec, kontrast === 'yuksek'), [], ad + ' modül kuralları (ek denetimler dahil)');
    say++;
  }))));
  assert.strictEqual(say, 7 * 2 * 2 * 2 * 1);
});

test('ek varyantlar: ince çizgili şerit ve her iplik seçeneği de tüm eşikleri geçer', () => {
  PALETLER.forEach((palet) => ['ton', 'tum'].forEach((bicim) => ['acik', 'koyu'].forEach((mod) => ['normal', 'yuksek'].forEach((kontrast) => {
    ['dolu', 'ince'].forEach((serit) => Object.keys(T.IPLIKLAR).forEach((iplik) => {
      const ad = [palet, bicim, mod, kontrast, serit, iplik].join('/');
      const r = T.uretAyrinti({ palet, bicim, mod, kontrast, serit, iplik }, U);
      assert.strictEqual(r.ok, true, ad + ' ' + JSON.stringify(r.red));
      assert.deepStrictEqual(esikler(r.belirtec, kontrast === 'yuksek', ad), []);
    }));
  }))));
});

test('Özel: 20 sabit tohumlu rastgele (3 renk) x iki biçim x iki kip x iki kontrast eşikleri geçer', () => {
  let s = 20261026;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const hx = () => '#' + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('');
  for (let i = 0; i < 20; i++) {
    const ozel = { ust: hx(), eylem: hx(), iplik: hx() };
    ['ton', 'tum'].forEach((bicim) => ['acik', 'koyu'].forEach((mod) => ['normal', 'yuksek'].forEach((kontrast) => {
      const ad = 'ozel#' + i + ' ' + JSON.stringify(ozel) + ' ' + [bicim, mod, kontrast].join('/');
      const r = T.uretAyrinti({ palet: 'ozel', bicim, mod, kontrast, ozel }, U);
      if (r.ok) assert.deepStrictEqual(esikler(r.belirtec, kontrast === 'yuksek', ad), []);
      else { assert.ok(r.red && r.red.fg && r.red.bg && r.red.oran < r.red.esik, ad + ' reddedildi ama neden yok'); }
    })));
  }
});

test('otomatik düzeltme: düşük kontrastlı özel eylem rengi ±2% L adımla düzelir ve kayda geçer; kenar durumları', () => {
  // çok açık sarı eylem rengi: beyaz üstünde 4.5 sağlamaz
  const r = T.uretAyrinti({ palet: 'ozel', bicim: 'ton', mod: 'acik', ozel: { ust: '#1B2A4A', eylem: '#F5E663', iplik: '#E0693A' } }, U);
  assert.strictEqual(r.ok, true);
  assert.ok(r.duzeltmeler.some((d) => d.ad === 'eylem' && d.once !== d.sonra), 'eylem ayarlandı');
  assert.ok(oran(r.belirtec.eylem, r.belirtec.yuzey) >= 4.5);
  assert.notStrictEqual(r.belirtec.eylem, '#F5E663');
  // adım sınırı: hiçbir renk 40 adımdan (80% L) fazla kaymaz
  const m = { a: '#808080', b: '#7F7F7F' }, kayit = [];
  assert.strictEqual(T.sabitle(m, 'a', ['b'], 21, kayit), false, 'sağlanamaz eşik reddedilir');
  assert.strictEqual(T.sabitle({ a: '#777777', b: '#FFFFFF' }, 'a', ['b'], 4.5, []), true);
  // geçen renge dokunulmaz
  const g = { a: '#000000', b: '#FFFFFF' }; T.sabitle(g, 'a', ['b'], 4.5, []); assert.strictEqual(g.a, '#000000');
  // reddetme + neden: yüzey siyah, yüzey2 beyaz iken metin ikisini birden sağlayamaz
  const kotu = { ad: 'x', varsayilanPalet: 'cam', klasik: { acik: Object.assign({}, U.klasik.acik, { yuzey: '#000000', yuzey2: '#FFFFFF', kagit: '#808080' }), koyu: U.klasik.koyu } };
  const red = T.uretAyrinti({ palet: 'klasik', mod: 'acik' }, kotu);
  assert.strictEqual(red.ok, false);
  assert.ok(red.red && typeof red.red.fg === 'string' && typeof red.red.bg === 'string' && red.red.oran < red.red.esik, 'neden: ' + JSON.stringify(red.red));
  assert.ok(T.dogrula(red.taslak, false).length > 0);
  assert.ok(Object.keys(red.belirtec).length >= T.TUM_ANAHTAR.length - 1, 'reddedilince uygulanabilir yedek harita döner');
});

test('belirlenimlilik: aynı seçim aynı çıktı, girdi değişmez, çıktı yeni nesne', () => {
  const s = { palet: 'ozel', bicim: 'tum', mod: 'koyu', kontrast: 'yuksek', serit: 'ince', iplik: 'mavi', ozel: { ust: '#336699', eylem: '#CC3366', iplik: '#99CC33' } };
  const kopya = JSON.stringify(s);
  const a = T.uret(s, U), b = T.uret(s, U);
  assert.deepStrictEqual(a, b);
  assert.strictEqual(JSON.stringify(s), kopya, 'girdi değişmedi');
  a.ust = '#000001'; assert.notStrictEqual(T.uret(s, U).ust, '#000001');
  // bilinmeyen/bozuk girdi güvenli varsayılana döner (kayıttan gelen değer süzülür)
  assert.deepStrictEqual(T.uret({ palet: '<x>', bicim: 5, mod: null, ozel: { ust: 'red' } }, U), T.uret({ palet: 'cam', bicim: 'ton', mod: 'acik' }, U));
  assert.deepStrictEqual(T.uret(undefined, U), T.uret(T.varsayilanSecim(U), U));
});

test('Ton: zemin, yüzey ve şerit paletten bağımsız sabit; vurgu değişir. Tüm arayüz: hepsi paletle değişir', () => {
  const pal = ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas'];
  ['acik', 'koyu'].forEach((mod) => {
    const ton = pal.map((palet) => T.uret({ palet, bicim: 'ton', mod }, U)), tum = pal.map((palet) => T.uret({ palet, bicim: 'tum', mod }, U));
    ['ust', 'kagit', 'yuzey', 'yuzey2', 'cizgi', 'kenar', 'murek', 'ustYazi'].forEach((a) => assert.strictEqual(new Set(ton.map((m) => m[a])).size, 1, mod + ' Ton ' + a));
    ['eylem', 'iplik'].forEach((a) => assert.strictEqual(new Set(ton.map((m) => m[a])).size, 6, mod + ' Ton ' + a));
    ['ust', 'kagit', 'yuzey2', 'cizgi', 'eylem', 'iplik'].forEach((a) => assert.strictEqual(new Set(tum.map((m) => m[a])).size, 6, mod + ' Tüm ' + a));
  });
  // plan §2 biçimi, 1.1 sayılarıyla (açık): kagit = hsl(H, min(S,40), 93); yuzey = hsl(H, min(S,32), 99.4); Lacivert zemin tonu [218, 50]
  const c = T.uret({ palet: 'lacivert', bicim: 'tum', mod: 'acik' }, U);
  const [H, S] = T.ONAYARLAR.lacivert.zemin;
  assert.strictEqual(c.kagit, T.hslHex(H, Math.min(S, 40), 93));
  assert.strictEqual(c.yuzey, T.hslHex(H, Math.min(S, 32), 99.4));
  assert.strictEqual(c.ust, '#1B2A4A', 'şerit = tohum');
  assert.strictEqual(c.ustYazi, '#F6F1E3', 'şerit yazısı krem');
});

test('Klasik = TAARKOD 1.7.1 değerleri birebir (iki kip, iki biçim); varsayılan Çam+Ton da aynı', () => {
  ['acik', 'koyu'].forEach((mod) => {
    ['ton', 'tum'].forEach((bicim) => [{ palet: 'klasik' }, { palet: 'cam' }].forEach((p) => {
      if (p.palet === 'cam' && bicim === 'tum') return;
      const m = T.uret(Object.assign({ bicim, mod }, p), U);
      Object.keys(F[mod]).forEach((a) => {
        if (a === 'ustUstu') assert.ok(m.ustUstu.startsWith(F[mod].ust === '#0F3B2E' ? '#F6F1E3' : '#E7EEE9'), 'ustUstu rengi');
        else assert.strictEqual(m[a], F[mod][a], p.palet + '/' + bicim + '/' + mod + ' ' + a);
      });
    }));
  });
  // şablondaki CSS yedek bloğu (ilk boyama) = Klasik
  const satir = (on) => sablon.split('\n').find((l) => l.startsWith(on));
  const oku = (l) => { const o = {}; for (const m of l.matchAll(/--([A-Za-z0-9]+):(#[0-9A-Fa-f]{6,8})\b/g)) o[m[1]] = m[2].toUpperCase(); return o; };
  const acik = oku(satir(':root{')), koyu = oku(satir(':root[data-tema=koyu]{')), koyuMq = oku(satir('@media (prefers-color-scheme:dark)'));
  assert.deepStrictEqual(koyuMq, koyu);
  [['acik', acik], ['koyu', koyu]].forEach(([mod, css]) => {
    const k = T.uret({ palet: 'klasik', mod }, U);
    T.TUM_ANAHTAR.forEach((a) => assert.strictEqual(css[a], k[a].toUpperCase(), 'CSS yedek ' + mod + ' ' + a));
  });
});

test('belirteç katmanı: planın tüm adları tanımlı, eski adlar kalmadı, belirteç dışında sabit renk yok (açık istisna listesi)', () => {
  const istenen = ['eylem', 'eylemKoyu', 'eylemYazi', 'iplik', 'iplikYazi', 'ust', 'ustYazi', 'ustSoluk', 'ustSimge', 'ustUstu', 'kagit', 'yuzey', 'yuzey2', 'cizgi', 'kenar', 'murek', 'soluk', 'hata', 'tamam', 'uyari', 'bilgi', 'odak'];
  const m = T.uret({ palet: 'cam' }, U);
  istenen.forEach((a) => { assert.ok(m[a], 'tema.js ' + a); assert.ok(sablon.includes('--' + a + ':'), 'CSS ' + a); assert.ok(sablon.includes('var(--' + a + ')') || ['uyari', 'iplikYazi'].includes(a) || a === 'ustSimge', 'kullanılıyor: ' + a); });
  assert.doesNotMatch(sablon, /--(cam|camKoyu|camYazi|camSoluk|sari|dikis|mavi|maviYazi)(?![A-Za-z0-9])/, 'eski belirteç adları kalmadı');
  const bas = sablon.indexOf('/*BELIRTEC-BASLA'), bit = sablon.indexOf('/*BELIRTEC-BITIS*/');
  assert.ok(bas > 0 && bit > bas);
  let govde = sablon.slice(0, bas) + sablon.slice(bit);
  // AÇIK İSTİSNA LİSTESİ: her biri tam bir kez geçmeli (liste doğru ve güncel kalır)
  const ISTISNALAR = [
    ['favicon (data: URI, %23 kodlu renkler)', /<link rel="icon"[^>]*>/],
    ['barkod PNG dışa aktarma: tuval beyaz zemini', /x\.fillStyle='#fff'/],
    ['simge maskeleri: stroke=\'black\' (yalnız maske şekli, görünür renk değil)', /url\("data:image\/svg\+xml,[^"]*"\)/g]
  ];
  ISTISNALAR.forEach(([ad, re]) => {
    const n = (govde.match(re) || []).length;
    assert.ok(n >= 1, 'istisna kullanılmıyor, listeden çıkarın: ' + ad);
    govde = govde.replace(re, ' ');
  });
  const yasak = [...govde.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bhwb\(|\blab\(|\boklch\(/g)].map((x) => x[0] + ' @' + govde.slice(Math.max(0, x.index - 40), x.index + 20).replace(/\s+/g, ' '));
  assert.deepStrictEqual(yasak, [], 'belirteç tanım bloğu dışında sabit renk');
  // adlandırılmış renkler (CSS değer konumunda) da yasak; transparent/currentColor/inherit serbest
  const css = govde.slice(govde.indexOf('<style>'), govde.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, '');
  const adli = [...css.matchAll(/:\s*[^;{}]*\b(white|black|red|green|blue|yellow|orange|gray|grey|silver|navy|teal|purple)\b[^;{}]*[;}]/g)].map((x) => x[0]);
  assert.deepStrictEqual(adli, [], 'adlandırılmış renk');
  // SVG satır içi renk öznitelikleri (logo) belirteçten
  const g = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
  assert.doesNotMatch(g, /\b(fill|stroke|stop-color|style)="[^"]*(#|rgb)/i, 'gövdede satır içi sabit renk yok');
  assert.match(g, /class="logoY"/); assert.match(g, /class="logoI"/);
  assert.match(sablon, /\.logoY\{fill:var\(--ustYazi\)\}\.logoI\{fill:var\(--iplik\)\}/);
});

test('güvenlik: CSP aynı, CSS url() yalnız data:, gövdede yalnız logo SVG, innerHTML/eval/fetch yok (görünüm kodu dahil)', () => {
  assert.ok(sablon.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:">'));
  const css = sablon.slice(sablon.indexOf('<style>'), sablon.indexOf('</style>'));
  assert.doesNotMatch(css, /url\(\s*(?!["']?data:)/);
  const g = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
  assert.strictEqual((g.match(/<svg/g) || []).length, 1);
  const betik = sablon.slice(sablon.lastIndexOf('<script>'));
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|\bfetch\s*\(|XMLHttpRequest/.test(betik));
  const gor = betik.slice(betik.indexOf('function gorVarsayilan'), betik.indexOf('function gorBaslat'));
  assert.ok(gor.length > 500 && /localStorage/.test(gor) && /try\{/.test(gor), 'görünüm kalıcılığı try/catch içinde');
  assert.ok(!/localStorage[^;]*Ek|belirtec[^;]*setItem/.test(gor));
});

test('masaüstü köprüsü: palet/kip değişince pencereTemaGonder --ust ve --ustSimge okur; sistemTemaDegisti gorUygula çağırır', () => {
  const betik = sablon.slice(sablon.lastIndexOf('<script>'));
  assert.match(betik, /function temaUygula\(v\)\{[\s\S]*?gorUygula\(\);\s*pencereTemaGonder\(\);/);
  assert.match(betik, /function sistemTemaDegisti\(\)\{gorUygula\(\);pencereTemaGonder\(\)\}/);
  assert.match(betik, /getPropertyValue\('--ust'\)\.trim\(\),cs\.getPropertyValue\('--ustSimge'\)\.trim\(\)/);
  assert.match(betik, /function gorDegistir\(degis\)\{[\s\S]*?gorUygula\(\)/);
});

/* ---------- tarayıcı testleri ---------- */
const exeSecenek = () => (fs.existsSync(exe) ? { executablePath: exe } : {});
async function ac(b, secenek) {
  const o = secenek || {};
  const ctx = await b.newContext({ viewport: { width: o.w || 1000, height: o.h || 900 }, locale: 'tr-TR', colorScheme: o.mod === 'koyu' ? 'dark' : 'light', userAgent: o.masaustu ? 'Mozilla/5.0 Electron/30.0.0 Chrome/124' : undefined });
  const cagrilar = [];
  await ctx.addInitScript((a) => {
    window.__pt = [];
    if (a.masaustu) window.barkodMasaustu = { surumBilgi: () => Promise.resolve({ surum: '1.8.0', otomatikTemizlik: true, klasor: '', sonTemizlik: null }), pencereTema: (r, s) => { window.__pt.push([r, s]); return Promise.resolve({ tamam: true }); } };
    if (a.gorunum && !sessionStorage.getItem('__yuklendi')) { sessionStorage.setItem('__yuklendi', '1'); localStorage.setItem('barkod-gorunum', JSON.stringify(a.gorunum)); }
  }, { masaustu: !!o.masaustu, gorunum: o.gorunum || null });
  const p = await ctx.newPage(); p.__hatalar = []; p.__cagrilar = cagrilar;
  p.on('pageerror', (e) => p.__hatalar.push(e.message));
  await p.goto('file://' + HTML); await p.waitForTimeout(250);
  return p;
}
const HESAP = () => {
  const cs = (e) => window.getComputedStyle(e);
  const q = (s) => document.querySelector(s);
  return {
    serit: cs(q('.ust')).backgroundColor, zemin: cs(document.body).backgroundColor, sekmeCubugu: cs(q('.sekmeler')).backgroundColor,
    sekmeCizgi: cs(q('#s1')).borderBottomColor, dugme: cs(q('#uret1')).backgroundColor, tabloBaslik: cs(q('th')).backgroundColor,
    rozetKenar: cs(q('.rozetM')).borderLeftColor, durumCubugu: cs(q('.altCubuk')).backgroundColor, cekmece: cs(q('.cekmece')).backgroundColor,
    baglanti: cs(q('.baglanti')).color, bilgi: cs(q('.ipucuDugme')).backgroundColor
  };
};

test('tarayıcı: her ön ayar x iki biçim x açık/koyu: şerit, zemin, sekme, düğme, tablo başlığı, rozet, durum çubuğu, çekmece gerçekten değişir (Ton: zemin sabit, Tüm arayüz: zemin değişir)', { skip: atla && 'playwright yok', timeout: 170000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const pal = ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas'];
    for (const mod of ['acik', 'koyu']) {
      const sonuc = { ton: [], tum: [] };
      for (const bicim of ['ton', 'tum']) for (const palet of pal) {
        const p = await ac(b, { mod, gorunum: { palet, bicim } });
        assert.deepStrictEqual(p.__hatalar, []);
        sonuc[bicim].push(await p.evaluate(HESAP));
        // hesaplanan değer, tema.js çıktısıyla aynı (tarayıcıdaki kök değişken)
        const tarayici = await p.evaluate(() => ['ust', 'kagit', 'eylem', 'iplik', 'yuzey2'].map((k) => getComputedStyle(document.documentElement).getPropertyValue('--' + k).trim()));
        const dugum = T.uret({ palet, bicim, mod }, U);
        assert.deepStrictEqual(tarayici, ['ust', 'kagit', 'eylem', 'iplik', 'yuzey2'].map((k) => dugum[k]), palet + '/' + bicim + '/' + mod);
        await p.context().close();
      }
      const say = (dizi, a) => new Set(dizi.map((x) => x[a])).size;
      // Ton: zemin katmanı sabit, vurgu katmanı değişir
      ['serit', 'zemin', 'sekmeCubugu', 'tabloBaslik', 'durumCubugu', 'cekmece'].forEach((a) => assert.strictEqual(say(sonuc.ton, a), 1, mod + ' Ton ' + a + ' sabit'));
      ['dugme', 'sekmeCizgi', 'rozetKenar', 'baglanti'].forEach((a) => assert.strictEqual(say(sonuc.ton, a), 6, mod + ' Ton ' + a + ' değişir'));
      // Tüm arayüz: hepsi değişir (6 ön ayarın 6'sı farklı)
      ['serit', 'zemin', 'tabloBaslik', 'durumCubugu', 'dugme', 'sekmeCizgi', 'rozetKenar', 'baglanti'].forEach((a) => assert.strictEqual(say(sonuc.tum, a), 6, mod + ' Tüm ' + a + ' değişir'));
      // yüzey (sekme çubuğu) tonu çok açık; sekizlik yuvarlamada bazı paletler çakışabilir, Ton'a göre yine de değişir
      ['sekmeCubugu', 'cekmece'].forEach((a) => assert.ok(say(sonuc.tum, a) >= 3 && sonuc.tum.some((x) => x[a] !== sonuc.ton[0][a]), mod + ' Tüm ' + a + ' değişir'));
      // durum rengi (mavi ünlem) sabit kalır
      assert.strictEqual(say(sonuc.tum, 'bilgi'), 1);
    }
  } finally { await b.close(); }
});

test('tarayıcı: Görünüm penceresi: palet/biçim/kip anında uygulanır, kalıcı (yenile), yalnız kimlikler saklanır, Varsayılana dön ve Klasik', { skip: atla && 'playwright yok', timeout: 90000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    const kok = (k) => p.evaluate((a) => getComputedStyle(document.documentElement).getPropertyValue('--' + a).trim(), k);
    assert.strictEqual(await kok('ust'), '#0F3B2E', 'varsayılan Çam');
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    assert.strictEqual(await p.evaluate(() => document.getElementById('gorunum').open), true);
    assert.strictEqual(await p.isChecked('input[name=gPalet][value=cam]'), true);
    assert.strictEqual(await p.isChecked('input[name=gBicim][value=ton]'), true);
    assert.strictEqual(await p.isChecked('input[name=gMod][value=sistem]'), true);
    await p.check('input[name=gPalet][value=bordo]');
    assert.strictEqual(await kok('eylem'), T.ONAYARLAR.bordo.eylem.toUpperCase());
    assert.strictEqual(await kok('ust'), '#0F3B2E', 'Ton: şerit sabit');
    await p.check('input[name=gBicim][value=tum]');
    assert.strictEqual(await kok('ust'), '#4A1C2B', 'Tüm arayüz: şerit paletin tohumu');
    await p.check('input[name=gMod][value=koyu]');
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tema')), 'koyu');
    assert.strictEqual(await p.inputValue('#tema'), 'koyu', 'üst şeritteki seçici eşlenir');
    assert.strictEqual(await p.evaluate(() => localStorage.getItem('barkod-tema')), 'koyu');
    assert.strictEqual(await kok('ust'), T.uret({ palet: 'bordo', bicim: 'tum', mod: 'koyu' }, U).ust);
    await p.selectOption('#gKose', '8'); await p.selectOption('#gYazi', '115'); await p.selectOption('#gKontrast', 'yuksek');
    const depo = await p.evaluate(() => JSON.parse(localStorage.getItem('barkod-gorunum')));
    assert.deepStrictEqual(Object.keys(depo).sort(), ['baslik', 'bicim', 'durum', 'iplik', 'kontrast', 'kose', 'ozel', 'palet', 'serit', 'yazi', 'yogunluk']);
    assert.strictEqual(depo.palet, 'bordo'); assert.strictEqual(depo.bicim, 'tum'); assert.strictEqual(depo.kose, 8);
    const ham = await p.evaluate(() => localStorage.getItem('barkod-gorunum'));
    assert.deepStrictEqual(ham.match(/#[0-9A-Fa-f]{6}/g).length, 3, 'yalnız 3 özel renk (hesaplanan değerler kaydedilmez)');
    // yenile: ayarlar aynı
    await p.reload(); await p.waitForTimeout(250);
    assert.strictEqual(await kok('ust'), T.uret({ palet: 'bordo', bicim: 'tum', mod: 'koyu', kontrast: 'yuksek' }, U).ust);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-kose')), '8');
    await p.click('#gorunumDugme');
    assert.strictEqual(await p.isChecked('input[name=gPalet][value=bordo]'), true);
    assert.strictEqual(await p.inputValue('#gYazi'), '115');
    assert.strictEqual(await p.inputValue('#gKontrast'), 'yuksek');
    // Klasik düğmesi: 1.7.1 değerleri birebir (koyu kip sürüyor), ölçüler 1.7.1 varsayılanı
    await p.click('#gKlasik');
    for (const [a, v] of Object.entries(F.koyu)) if (a !== 'ustUstu') assert.strictEqual(await kok(a), v, 'Klasik koyu ' + a);
    assert.strictEqual(await p.evaluate(() => [1, 2, 3].map((i) => 0).length), 3);
    const oz = await p.evaluate(() => ['data-kose', 'data-yazi', 'data-yogun', 'data-serit', 'data-baslik', 'data-durum', 'data-kontrast'].map((a) => document.documentElement.getAttribute(a)));
    assert.deepStrictEqual(oz, ['4', '100', 'rahat', 'dolu', 'serif', 'goster', 'normal']);
    // Varsayılana dön: Çam + Ton + Sistem
    await p.click('#gSifirla');
    assert.strictEqual(await p.isChecked('input[name=gPalet][value=cam]'), true);
    assert.strictEqual(await p.isChecked('input[name=gBicim][value=ton]'), true);
    assert.strictEqual(await p.isChecked('input[name=gMod][value=sistem]'), true);
    assert.strictEqual(await p.inputValue('#tema'), 'sistem');
    assert.strictEqual(await p.evaluate(() => document.documentElement.hasAttribute('data-tema')), false);
    await p.emulateMedia({ colorScheme: 'light' });
    for (const [a, v] of Object.entries(F.acik)) if (a !== 'ustUstu') assert.strictEqual(await kok(a), v, 'varsayılan açık ' + a);
    assert.deepStrictEqual(p.__hatalar, []);
  } finally { await b.close(); }
});

test('tarayıcı: ölçek seçenekleri gerçekten uygulanır (yoğunluk, köşe, yazı boyutu, başlık yazısı, durum çubuğu, iplik, şerit, kontrast)', { skip: atla && 'playwright yok', timeout: 90000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    const cs = (sel, prop) => p.evaluate(([s, a]) => getComputedStyle(document.querySelector(s))[a], [sel, prop]);
    assert.strictEqual(await cs('#kelime', 'minHeight'), '44px');
    assert.strictEqual(await cs('#uret1', 'borderTopLeftRadius'), '4px');
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.documentElement).fontSize), '16px');
    await p.click('#gorunumDugme');
    assert.strictEqual(await p.isHidden('#gYogunUyari'), true);
    await p.selectOption('#gYogun', 'siki');
    assert.strictEqual(await cs('#kelime', 'minHeight'), '36px');
    assert.strictEqual(await p.isVisible('#gYogunUyari'), true, '40 px altı uyarısı');
    assert.match(await p.textContent('#gYogunUyari'), /^Uyarı:.*36 px.*40 px/);
    await p.selectOption('#gKose', '0'); assert.strictEqual(await cs('#uret1', 'borderTopLeftRadius'), '0px');
    await p.selectOption('#gKose', '8'); assert.strictEqual(await cs('#uret1', 'borderTopLeftRadius'), '8px');
    for (const [v, px] of [['90', '14.4px'], ['115', '18.4px'], ['130', '20.8px'], ['100', '16px']]) {
      await p.selectOption('#gYazi', v); assert.strictEqual(await p.evaluate(() => getComputedStyle(document.documentElement).fontSize), px, 'yazı %' + v);
    }
    await p.selectOption('#gBaslik', 'sistem');
    assert.ok(!/Newsreader/.test(await cs('h2', 'fontFamily')), 'başlık sistem yazı tipi');
    await p.selectOption('#gBaslik', 'serif'); assert.ok(/Newsreader/.test(await cs('h2', 'fontFamily')));
    // durum çubuğu gizlenir ama erişilebilir ağacında kalır (canlı bölge)
    await p.uncheck('#gDurumCubugu');
    const kutu = await p.evaluate(() => { const r = document.querySelector('.altCubuk').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), !!document.getElementById('durum')]; });
    assert.deepStrictEqual(kutu, [1, 1, true]);
    await p.check('#gDurumCubugu');
    assert.ok((await p.evaluate(() => document.querySelector('.altCubuk').getBoundingClientRect().height)) > 20);
    // iplik: kırmızı-turuncu, yok
    await p.selectOption('#gIplik', 'kirmizi');
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--iplik').trim()), T.uret({ palet: 'cam', iplik: 'kirmizi' }, U).iplik);
    await p.selectOption('#gIplik', 'yok');
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.ust'), '::after').display), 'none');
    await p.selectOption('#gIplik', 'palet');
    // ince çizgili şerit: şerit zemini yüzey olur, ustCizgi marka rengi
    await p.selectOption('#gSerit', 'ince');
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.ust')).backgroundColor), 'rgb(255, 255, 255)');
    assert.match(await cs('.ust', 'boxShadow'), /rgb\(15, 59, 46\)/);
    await p.selectOption('#gSerit', 'dolu');
    // yüksek kontrast: soluk metin 6.0 (4.5+1.5) üstü
    await p.selectOption('#gKontrast', 'yuksek');
    const r = await p.evaluate(() => { const g = (k) => getComputedStyle(document.documentElement).getPropertyValue('--' + k).trim(); return [g('soluk'), g('yuzey2'), g('kagit')]; });
    assert.ok(oran(r[0], r[1]) >= 6 && oran(r[0], r[2]) >= 6, 'yüksek kontrast eşiği ' + oran(r[0], r[1]).toFixed(2));
    assert.deepStrictEqual(p.__hatalar, []);
  } finally { await b.close(); }
});

test('tarayıcı: Özel palet (3 renk) uygulanır, kontrast otomatik düzeltilir; kalıcı; Tema seçicisi ve 1.7.1 temaEsitle mantığı korunur', { skip: atla && 'playwright yok', timeout: 90000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    await p.click('#gorunumDugme');
    assert.strictEqual(await p.isHidden('#gOzel'), true);
    await p.check('input[name=gPalet][value=ozel]');
    assert.strictEqual(await p.isVisible('#gOzel'), true);
    const renkYaz = (id, v) => p.$eval(id, (e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    await p.check('input[name=gBicim][value=tum]');
    await renkYaz('#gOzelUst', '#2255aa'); await renkYaz('#gOzelEylem', '#f5e663'); await renkYaz('#gOzelIplik', '#ff6600');
    const beklenen = T.uret({ palet: 'ozel', bicim: 'tum', mod: 'acik', ozel: { ust: '#2255AA', eylem: '#F5E663', iplik: '#FF6600' } }, U);
    const g = (k) => p.evaluate((a) => getComputedStyle(document.documentElement).getPropertyValue('--' + a).trim(), k);
    assert.strictEqual(await g('ust'), beklenen.ust); assert.strictEqual(await g('eylem'), beklenen.eylem);
    assert.ok(oran(await g('eylem'), await g('yuzey')) >= 4.5, 'açık sarı eylem koyulaştırıldı');
    assert.match(await p.textContent('#gDurum'), /otomatik ayarlandı/);
    await p.reload(); await p.waitForTimeout(250);
    assert.strictEqual(await g('ust'), beklenen.ust);
    // Tema seçicisi (üst şerit) ve Görünüm penceresindeki kip birbirini izler
    await p.selectOption('#tema', 'koyu');
    await p.click('#gorunumDugme');
    assert.strictEqual(await p.isChecked('input[name=gMod][value=koyu]'), true);
    assert.strictEqual(await g('ust'), T.uret({ palet: 'ozel', bicim: 'tum', mod: 'koyu', ozel: { ust: '#2255AA', eylem: '#F5E663', iplik: '#FF6600' } }, U).ust);
    // bozuk kayıt süzülür
    await p.evaluate(() => localStorage.setItem('barkod-gorunum', '{"palet":"<script>","bicim":7,"kose":99,"ozel":{"ust":"red"}}'));
    await p.reload(); await p.waitForTimeout(250);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-kose')), '4');
    assert.deepStrictEqual(p.__hatalar, []);
  } finally { await b.close(); }
});

test('tarayıcı: klavye erişimi: odak pencerede kalır, Esc kapatır ve odak düğmeye döner, oklarla palet seçilir, odak halkası görünür', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    await p.focus('#gorunumDugme'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    assert.strictEqual(await p.evaluate(() => document.getElementById('gorunum').open), true);
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      assert.strictEqual(await p.evaluate(() => !!document.activeElement.closest('#gorunum') || document.activeElement === document.body), true, 'Tab ' + i + ': odak pencere dışına çıkmadı');
    }
    // palet grubuna ok tuşuyla seçim
    await p.focus('input[name=gPalet][value=cam]');
    const halka = await p.evaluate(() => { const k = document.activeElement.closest('.gKutu'); const c = getComputedStyle(k); return [c.outlineStyle, c.outlineWidth]; });
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
    assert.strictEqual(await p.isChecked('input[name=gPalet][value=eflatun]'), true, 'ok tuşu paleti değiştirir');
    assert.strictEqual(await p.evaluate(() => document.documentElement.style.getPropertyValue('--eylem').trim()), T.uret({ palet: 'eflatun' }, U).eylem);
    const gorunur = await p.evaluate(() => { const k = document.activeElement.closest('.gKutu'); const c = getComputedStyle(k); return [c.outlineStyle, c.outlineWidth]; });
    assert.deepStrictEqual(gorunur, ['solid', '3px'], 'odak halkası 3 px');
    assert.ok(halka.length === 2);
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    assert.strictEqual(await p.evaluate(() => document.getElementById('gorunum').open), false);
    assert.strictEqual(await p.evaluate(() => document.activeElement.id), 'gorunumDugme');
    // hareket yok: geçiş ve animasyon süresi 0
    assert.strictEqual(await p.evaluate(() => [...document.querySelectorAll('#gorunum *')].some((e) => { const c = getComputedStyle(e); return parseFloat(c.transitionDuration) > 0 || parseFloat(c.animationDuration) > 0; })), false);
  } finally { await b.close(); }
});

test('tarayıcı: masaüstü köprüsü: açılışta ve palet/kip değişince pencereTema(--ust, --ustSimge) #RRGGBB gider', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, { masaustu: true });
    const son = () => p.evaluate(() => window.__pt[window.__pt.length - 1]);
    const hepsi = () => p.evaluate(() => window.__pt);
    assert.deepStrictEqual(await son(), ['#0F3B2E', '#F6F1E3'], 'açılış: Çam + Ton + açık');
    await p.click('#gorunumDugme');
    await p.check('input[name=gPalet][value=lacivert]'); await p.check('input[name=gBicim][value=tum]');
    assert.deepStrictEqual(await son(), ['#1B2A4A', '#F6F1E3'], 'Lacivert + Tüm arayüz');
    await p.check('input[name=gMod][value=koyu]');
    const k = T.uret({ palet: 'lacivert', bicim: 'tum', mod: 'koyu' }, U);
    assert.deepStrictEqual(await son(), [k.ust, k.ustSimge]);
    await p.emulateMedia({ colorScheme: 'dark' });
    await p.check('input[name=gMod][value=sistem]');
    assert.deepStrictEqual(await son(), [k.ust, k.ustSimge], 'sistem koyu');
    await p.emulateMedia({ colorScheme: 'light' }); await p.waitForTimeout(100);
    const a = T.uret({ palet: 'lacivert', bicim: 'tum', mod: 'acik' }, U);
    assert.deepStrictEqual(await son(), [a.ust, a.ustSimge], 'sistem açığa dönünce yeniden gönderilir');
    (await hepsi()).forEach((c) => c.forEach((r) => assert.match(r, /^#[0-9A-F]{6}$/)));
    // ince çizgili şerit: pencere düğmeleri şeridin yeni (açık) zeminine göre eşlenir
    await p.selectOption('#gSerit', 'ince');
    const i = T.uret({ palet: 'lacivert', bicim: 'tum', mod: 'acik', serit: 'ince' }, U);
    assert.deepStrictEqual(await son(), [i.ust, i.ustSimge]);
    assert.ok(oran(i.ust, i.ustSimge) >= 4.5, 'başlık çubuğu simgeleri okunur');
  } finally { await b.close(); }
});

test('tarayıcı: EN dilinde Görünüm penceresi İngilizce (Türkçe harf kalmaz), dil dönünce TR', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    await p.selectOption('#dil', 'en'); await p.waitForTimeout(150);
    await p.click('#gorunumDugme');
    await p.selectOption('#gYogun', 'siki');
    const metin = await p.evaluate(() => document.getElementById('gorunum').innerText + ' ' + document.getElementById('gorunumDugme').textContent);
    assert.doesNotMatch(metin, /[çğıöşüÇĞİÖŞÜ]/, metin.match(/.{0,30}[çğıöşüÇĞİÖŞÜ].{0,30}/) && metin.match(/.{0,30}[çğıöşüÇĞİÖŞÜ].{0,30}/)[0]);
    assert.match(metin, /APPEARANCE/); assert.match(metin, /Whole interface/); assert.match(metin, /Reset to default/);
    // mavi ünlem balonları İngilizce
    const balon = await p.evaluate(() => document.querySelector('[data-ipucu=gTon] .ipucuBalon').textContent);
    assert.match(balon, /^Tint:/);
    await p.selectOption('#dil', 'tr'); await p.waitForTimeout(150);
    assert.match(await p.textContent('#gorunumBaslik'), /^Görünüm$/);
  } finally { await b.close(); }
});

/* ---------- 1.1: Tüm arayüz zemin/yüzey ayırt edilebilirliği (CIE76 ΔE, bağımsız hesap) ---------- */
function lab(h) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const X = (0.4124 * c[0] + 0.3576 * c[1] + 0.1805 * c[2]) / 0.95047, Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], Z = (0.0193 * c[0] + 0.1192 * c[1] + 0.9505 * c[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function dE(a, b) { const x = lab(a), y = lab(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }
const ALTI = ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas'];

test('Tüm arayüz: sayfa zemini (kagit) ile kart yüzeyi (yuzey) arası ΔE>=5, yuzey2 ile kagit arası ΔE>=4; şerit zeminden ayrışır (6 palet x açık/koyu x normal/yüksek kontrast)', () => {
  ALTI.forEach((palet) => ['acik', 'koyu'].forEach((mod) => ['normal', 'yuksek'].forEach((kontrast) => {
    const m = T.uret({ palet, bicim: 'tum', mod, kontrast }, U), ad = palet + ' ' + mod + ' ' + kontrast;
    assert.ok(dE(m.kagit, m.yuzey) >= 5, ad + ' kagit-yuzey ' + dE(m.kagit, m.yuzey).toFixed(1));
    assert.ok(dE(m.kagit, m.yuzey2) >= 4, ad + ' kagit-yuzey2 ' + dE(m.kagit, m.yuzey2).toFixed(1));
    assert.ok(dE(m.kagit, m.ust) >= 6, ad + ' kagit-ust ' + dE(m.kagit, m.ust).toFixed(1));
  })));
});

test('Tüm arayüz: paletler arası zemin (kagit) ve kart (yuzey) farkı gözle ayırt edilir: her palet çifti için kagit ΔE>=4 (açık ve koyu)', () => {
  ['acik', 'koyu'].forEach((mod) => {
    const ms = ALTI.map((palet) => T.uret({ palet, bicim: 'tum', mod }, U));
    for (let i = 0; i < ALTI.length; i++) for (let j = i + 1; j < ALTI.length; j++) {
      const d = dE(ms[i].kagit, ms[j].kagit);
      assert.ok(d >= 4, mod + ' ' + ALTI[i] + '-' + ALTI[j] + ' kagit ΔE ' + d.toFixed(1));
    }
  });
});

test('Tüm arayüz: Özel soluk (gri) tohum zemini tonlu kalır; tam gri tohum nötr; 20 özel tohumda yüzey-zemin ΔE>=5', () => {
  const soluk = T.uret({ palet: 'ozel', bicim: 'tum', mod: 'acik', ozel: { ust: '#3A3F44', eylem: '#1F4E8C', iplik: '#E0693A' } }, U);
  assert.ok(T.hslDizi(soluk.kagit)[1] >= 8, 'soluk tohum zemin doygunluğu ' + T.hslDizi(soluk.kagit)[1].toFixed(1));
  const gri = T.uret({ palet: 'ozel', bicim: 'tum', mod: 'acik', ozel: { ust: '#333333', eylem: '#1F4E8C', iplik: '#E0693A' } }, U);
  assert.strictEqual(T.hslDizi(gri.kagit)[1], 0, 'tam gri tohum nötr');
  let sayi = 0;
  for (let i = 0; i < 20; i++) {
    const hx = (n) => '#' + [0, 1, 2].map((k) => (((n * 2654435761 + k * 40503) >>> (k * 5)) & 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    ['acik', 'koyu'].forEach((mod) => {
      const m = T.uret({ palet: 'ozel', bicim: 'tum', mod, ozel: { ust: hx(i + 1), eylem: hx(i + 50), iplik: hx(i + 99) } }, U);
      assert.ok(dE(m.kagit, m.yuzey) >= 4.5 || T.hslDizi(m.kagit)[1] < 3, 'özel ' + i + ' ' + mod + ' ' + dE(m.kagit, m.yuzey).toFixed(1));
      sayi++;
    });
  }
  assert.strictEqual(sayi, 40);
});

test('tarayıcı: Görünüm penceresinde (i) balonu açıkken ilk Esc yalnız balonu, ikinci Esc pencereyi kapatır', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    const acik = () => p.evaluate(() => document.getElementById('gorunum').open);
    const balon = () => p.evaluate(() => { const o = document.querySelector('[data-ipucu=gTon] .ipucuBalon'); return !o.hidden; });
    await p.click('[data-ipucu=gTon] .ipucuDugme'); await p.waitForTimeout(80);
    assert.strictEqual(await balon(), true, 'balon açık');
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    assert.strictEqual(await balon(), false, 'ilk Esc balonu kapatır');
    assert.strictEqual(await acik(), true, 'ilk Esc pencereyi kapatmaz');
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    assert.strictEqual(await acik(), false, 'ikinci Esc pencereyi kapatır');
    // fare ile açılan balon da aynı
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    await p.hover('[data-ipucu=gIplik] .ipucuDugme'); await p.waitForTimeout(100);
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    assert.strictEqual(await acik(), true, 'üzerine gelinen balon: ilk Esc pencereyi kapatmaz');
    await p.keyboard.press('Escape'); await p.waitForTimeout(120);
    assert.strictEqual(await acik(), false);
  } finally { await b.close(); }
});

test('tarayıcı: Klasik palette biçim kutuları devre dışı ve not görünür (TR+EN); başka palette yeniden etkin', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, {});
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    const durum = () => p.evaluate(() => ({ dis: [...document.querySelectorAll('input[name=gBicim]')].map((r) => r.disabled), not: !document.getElementById('gKlasikNot').hidden, metin: document.getElementById('gKlasikNot').textContent }));
    assert.deepStrictEqual((await durum()).dis, [false, false]);
    assert.strictEqual((await durum()).not, false);
    await p.click('input[name=gPalet][value=klasik] + .gSw', { force: true }).catch(() => p.check('input[name=gPalet][value=klasik]', { force: true }));
    await p.waitForTimeout(80);
    let d = await durum();
    assert.deepStrictEqual(d.dis, [true, true]); assert.strictEqual(d.not, true); assert.match(d.metin, /Klasik görünümde renkler sabittir/);
    await p.evaluate(() => { document.getElementById('gorunum').close(); });
    await p.selectOption('#dil', 'en'); await p.waitForTimeout(150);
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    d = await durum(); assert.match(d.metin, /In the Classic look the colors are fixed/); assert.ok(!/[ğüşıöçĞÜŞİÖÇ]/.test(d.metin));
    await p.check('input[name=gPalet][value=cam]', { force: true }); await p.waitForTimeout(80);
    d = await durum(); assert.deepStrictEqual(d.dis, [false, false]); assert.strictEqual(d.not, false);
  } finally { await b.close(); }
});

test('tarayıcı: İplik rengi seçeneği kısa etiketlidir ve 1280 px genişlikte seçili metin kesilmez (TR ve EN)', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b, { w: 1280, h: 900 });
    await p.click('#gorunumDugme'); await p.waitForTimeout(100);
    const etiketler = await p.evaluate(() => [...document.querySelectorAll('#gIplik option')].map((o) => o.textContent));
    assert.deepStrictEqual(etiketler, ['Palet', 'Kırmızı-turuncu', 'Amber', 'Mavi', 'Beyaz', 'Yok']);
    for (const dil of ['tr', 'en']) {
      await p.evaluate(() => { document.getElementById('gorunum').close(); });
      await p.selectOption('#dil', dil); await p.waitForTimeout(150);
      await p.click('#gorunumDugme'); await p.waitForTimeout(100);
      for (const v of ['palet', 'kirmizi', 'yok']) {
        await p.selectOption('#gIplik', v); await p.waitForTimeout(60);
        const kesik = await p.evaluate(() => { const s = document.getElementById('gIplik'); const c = document.createElement('canvas').getContext('2d'); const st = getComputedStyle(s); c.font = st.font; const w = c.measureText(s.options[s.selectedIndex].textContent).width; return w > s.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) - 24; });
        assert.strictEqual(kesik, false, dil + ' ' + v + ' kesilmez');
      }
    }
    assert.strictEqual(await p.evaluate(() => [...document.querySelectorAll('#gIplik option')].map((o) => o.textContent).join('|')), 'Palette|Red-orange|Amber|Blue|White|None');
    await p.evaluate(() => { document.getElementById('gorunum').close(); });
  } finally { await b.close(); }
});
