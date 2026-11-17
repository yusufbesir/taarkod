'use strict';
// Tasarım dilleri (src/tasarim.js): Mühür (varsayılan), Mekik, İstif. Jetonlar FABLE-KARAR.md §2 ile birebir, belirteç eşlemesi,
// WCAG AA (bağımsız hesap), vurgu rengi uyarlaması, ortak tema.js'e dokunulmaması ve derleme sırası.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const kok = path.join(__dirname, '..');
const S = require('../src/tasarim.js');
const T = require('../src/tema.js');

function lum(h) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function oran(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

test('modül: UMD global BarkodTasarim, varsayılan Mühür, sıra Mühür/Mekik/İstif/Klasik, DOM ve depo kodu yok', () => {
  const src = fs.readFileSync(path.join(kok, 'src', 'tasarim.js'), 'utf8');
  assert.match(src, /kok\.BarkodTasarim = fabrika\(\)/);
  assert.strictEqual(S.VARSAYILAN, 'muhur');
  assert.deepStrictEqual(S.SIRA, ['muhur', 'mekik', 'istif', 'klasik']);
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/localStorage|document\.|window\.|innerHTML|fetch\(|eval\(/.test(kod));
  assert.deepStrictEqual(['muhur', 'mekik', 'istif'].map((a) => S.TASARIMLAR[a].ad), ['Mühür', 'Mekik', 'İstif']);
});

test('jetonlar FABLE-KARAR §2 ile birebir (örnekler) ve hepsi #RRGGBB', () => {
  const J = S.TASARIMLAR;
  assert.deepStrictEqual([J.muhur.acik.zemin, J.muhur.acik.vurgu, J.muhur.koyu.vurgu, J.muhur.koyu.vurguMetin], ['#F6F2F4', '#853652', '#E9A4BD', '#30101D']);
  assert.deepStrictEqual([J.mekik.acik.ustSerit, J.mekik.acik.vurgu, J.mekik.koyu.zemin, J.mekik.koyu.hata], ['#FFFFFF', '#285E70', '#141F24', '#FFA5A9']);
  assert.deepStrictEqual([J.istif.acik.ustSerit, J.istif.acik.ustSeritMetin, J.istif.koyu.ustSerit, J.istif.acik.vurgu], ['#252B32', '#F0F4F7', '#12161A', '#745044']);
  ['muhur', 'mekik', 'istif'].forEach((a) => ['acik', 'koyu'].forEach((m) => {
    Object.entries(J[a][m]).forEach(([k, v]) => { if (k !== 'golKart') assert.match(v, /^#[0-9A-F]{6}$/, a + ' ' + m + ' ' + k); });
  }));
  assert.deepStrictEqual(J.muhur.yazi, { baslik: 'Manrope', govde: 'Manrope', mono: 'DM Mono' });
  assert.deepStrictEqual(J.mekik.yazi, { baslik: 'Instrument Sans', govde: 'Inter', mono: 'JetBrains Mono' });
  assert.deepStrictEqual(J.istif.yazi, { baslik: 'IBM Plex Sans Condensed', govde: 'IBM Plex Sans', mono: 'IBM Plex Mono' });
});

test('belirteç eşlemesi: tema.js TUM_ANAHTAR adlarının hepsi, ustUstu #RRGGBBAA; tasarımın kendi vurgusu değişmeden geçer', () => {
  ['muhur', 'mekik', 'istif'].forEach((a) => ['acik', 'koyu'].forEach((m) => {
    const r = S.belirtec(a, m), j = S.TASARIMLAR[a][m];
    assert.deepStrictEqual(Object.keys(r.belirtec).sort(), T.TUM_ANAHTAR.slice().sort(), a + ' ' + m);
    Object.entries(r.belirtec).forEach(([k, v]) => assert.match(v, k === 'ustUstu' ? /^#[0-9A-F]{8}$/ : /^#[0-9A-F]{6}$/, a + ' ' + m + ' ' + k));
    assert.strictEqual(r.belirtec.kagit, j.zemin); assert.strictEqual(r.belirtec.murek, j.metin);
    assert.strictEqual(r.belirtec.eylem, j.vurgu); assert.strictEqual(r.belirtec.eylemYazi, j.vurguMetin);
    assert.strictEqual(r.belirtec.ust, j.ustSerit); assert.strictEqual(r.belirtec.ustYazi, j.ustSeritMetin);
    assert.strictEqual(r.belirtec.tamam, j.basari); assert.strictEqual(r.belirtec.hata, j.hata); assert.strictEqual(r.belirtec.uyari, j.uyari);
    assert.strictEqual(r.ek.golKart, j.golKart);
  }));
  // bilinmeyen ad varsayılana (Mühür) düşer
  assert.deepStrictEqual(S.belirtec('yok', 'acik').belirtec, S.belirtec('muhur', 'acik').belirtec);
});

const PALET = [null].concat(['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas'].map((p) => T.ONAYARLAR[p].eylem), ['#F5E663', '#FFFFFF', '#000000', '#3A3F44']);
test('WCAG AA: 3 tasarım x açık/koyu x normal/yüksek x 11 vurgu; metin >= 4,5, kontrol kenarı >= 3, odak >= 3, yüksek kontrastta 6', () => {
  const kotu = [];
  ['muhur', 'mekik', 'istif'].forEach((a) => ['acik', 'koyu'].forEach((m) => ['normal', 'yuksek'].forEach((k) => PALET.forEach((v) => {
    const r = S.belirtec(a, m, { vurgu: v, kontrast: k }).belirtec, e = k === 'yuksek' ? 6 : 4.5;
    [['murek', ['kagit', 'yuzey', 'yuzey2', 'eylemSoluk'], 4.5], ['soluk', ['kagit', 'yuzey', 'yuzey2'], e], ['eylem', ['kagit', 'yuzey', 'yuzey2', 'eylemSoluk'], e],
      ['eylemYazi', ['eylem', 'eylemKoyu'], e], ['ustYazi', ['ust'], 4.5], ['ustSoluk', ['ust'], 4.5], ['iplikUstu', ['iplik'], 4.5],
      ['hata', ['kagit', 'yuzey', 'yuzey2'], 4.5], ['tamam', ['kagit', 'yuzey', 'yuzey2'], 4.5], ['uyari', ['kagit', 'yuzey', 'yuzey2'], 4.5],
      ['kenar', ['yuzey'], 3], ['odak', ['kagit', 'yuzey'], 3]].forEach(([x, ys, t]) => ys.forEach((y) => {
      const o = oran(r[x], r[y]);
      if (o + 1e-9 < t) kotu.push([a, m, k, v, x + '/' + y, o.toFixed(2)].join(' '));
    }));
  }))));
  assert.deepStrictEqual(kotu, []);
});

test('logo anahtar çubuğu şeritte en az 3:1; İstif açıkta koyu şerit üstünde koyu modun vurgusu kullanılır', () => {
  ['muhur', 'mekik', 'istif'].forEach((a) => ['acik', 'koyu'].forEach((m) => PALET.forEach((v) => {
    const r = S.belirtec(a, m, { vurgu: v });
    assert.ok(oran(r.ek.logoVurgu, r.belirtec.ust) >= 3, a + ' ' + m + ' ' + v + ' ' + oran(r.ek.logoVurgu, r.belirtec.ust).toFixed(2));
  })));
  assert.strictEqual(S.belirtec('istif', 'acik').ek.logoVurgu, '#DCB2A0');
  assert.strictEqual(S.belirtec('istif', 'acik').belirtec.ustSoluk, '#F0F4F7', 'koyu şeritte ikincil metin de ustSeritMetin');
});

test('vurgu rengi (palet) uyarlanır: açık modda koyulaşır, koyu modda açılır; basari/hata/uyari vurgudan bağımsız', () => {
  const lac = T.ONAYARLAR.lacivert.eylem;
  const a = S.belirtec('muhur', 'acik', { vurgu: lac }).belirtec, k = S.belirtec('muhur', 'koyu', { vurgu: lac }).belirtec;
  assert.strictEqual(a.eylem, lac.toUpperCase(), 'açık zeminde zaten yeterli: değişmez');
  assert.ok(lum(k.eylem) > lum(lac), 'koyu zeminde açıldı');
  assert.ok(oran(k.eylem, k.kagit) >= 4.5);
  const d = S.belirtec('mekik', 'acik').belirtec, s = S.belirtec('mekik', 'acik', { vurgu: '#F5E663' }).belirtec;
  ['hata', 'tamam', 'uyari'].forEach((x) => assert.strictEqual(s[x], d[x]));
  assert.deepStrictEqual(S.ornek('istif', 'koyu'), ['#1B2025', '#262D34', '#DCB2A0', '#F0F4F7']);
});

test('ortak tema.js değişmedi ve derlemede tasarim.js tema_uygulama.js ile dil_en.js arasında', () => {
  const t = fs.readFileSync(path.join(kok, 'src', 'tema.js'), 'utf8');
  assert.match(t.split('\n')[0], /^\/\* tema\.js 1\.1 /);
  assert.ok(!/tasarim|Mühür|muhur/i.test(t), 'tema.js tasarım dillerini bilmez');
  const b = fs.readFileSync(path.join(kok, 'build.js'), 'utf8');
  assert.match(b, /'tema\.js', 'tema_uygulama\.js', 'tasarim\.js', 'dil_en\.js'/);
  const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  assert.ok(cikti.includes('kok.BarkodTasarim = fabrika()'));
});

/* ---------- tarayıcı testleri ---------- */
let chromium = null;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require('/opt/node-tools/node_modules/playwright').chromium; } catch (e2) {}
}
const exe = '/opt/pw-browsers/chromium';
const HTML = process.env.TAARKOD_HTML || path.join(kok, 'barkod-sifreleme.html');
const atla = !chromium || !fs.existsSync(HTML);
const exeSecenek = () => (fs.existsSync(exe) ? { executablePath: exe } : {});
async function ac(b, o) {
  o = o || {};
  const ctx = await b.newContext({ viewport: { width: o.w || 1280, height: o.h || 800 }, locale: 'tr-TR', colorScheme: o.mod === 'koyu' ? 'dark' : 'light', reducedMotion: o.azHareket ? 'reduce' : 'no-preference' });
  await ctx.addInitScript((a) => {
    if (!a.acilis) try { sessionStorage.setItem('taarkod-acilis', '1'); } catch (e) {}
    if (a.gorunum && !localStorage.getItem('barkod-gorunum')) localStorage.setItem('barkod-gorunum', JSON.stringify(a.gorunum));
  }, { acilis: !!o.acilis, gorunum: o.gorunum || null });
  const p = await ctx.newPage(); p.__hatalar = [];
  p.on('pageerror', (e) => p.__hatalar.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') p.__hatalar.push(m.text()); });
  await p.goto('file://' + HTML); await p.waitForTimeout(o.bekle == null ? 250 : o.bekle);
  return p;
}
const kokDeger = (p, k) => p.evaluate((a) => getComputedStyle(document.documentElement).getPropertyValue('--' + a).trim(), k);

test('tarayıcı: yeni kullanıcı Mühür ile açılır; her tasarım x açık/koyu belirteçleri modülle aynı, data-tasarim yazılır, konsol hatası yok', { skip: atla && 'playwright yok', timeout: 120000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    let p = await ac(b);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'muhur');
    assert.strictEqual(await kokDeger(p, 'kagit'), '#F6F2F4');
    await p.context().close();
    for (const a of ['muhur', 'mekik', 'istif']) for (const m of ['acik', 'koyu']) {
      p = await ac(b, { mod: m, gorunum: { tasarim: a } });
      const beklenen = S.belirtec(a, m).belirtec;
      for (const k of ['kagit', 'yuzey', 'eylem', 'eylemYazi', 'ust', 'murek', 'soluk']) assert.strictEqual(await kokDeger(p, k), beklenen[k], a + ' ' + m + ' ' + k);
      assert.strictEqual(await p.evaluate(() => document.documentElement.hasAttribute('data-yeni')), true);
      assert.deepStrictEqual(p.__hatalar, [], a + ' ' + m);
      await p.context().close();
    }
  } finally { await b.close(); }
});

test('tarayıcı: tasarım seçici klavyeyle (ok tuşları) çalışır, seçim kalıcı, Varsayılana dön Mühür’e döner; vurgu rengi paletten gelir', { skip: atla && 'playwright yok', timeout: 90000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    const p = await ac(b);
    await p.click('#gorunumDugme'); await p.waitForTimeout(80);
    assert.strictEqual(await p.isChecked('input[name=gTasarim][value=muhur]'), true);
    assert.strictEqual(await p.evaluate(() => document.getElementById('gTasarimGrup').tagName), 'FIELDSET');
    await p.focus('input[name=gTasarim][value=muhur]');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
    assert.strictEqual(await p.isChecked('input[name=gTasarim][value=mekik]'), true);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'mekik');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'istif');
    // Klasik'e özgü ayarlar yeni dillerde gizli, not görünür; Klasik paleti seçilemez
    assert.strictEqual(await p.isVisible('#gTasarimNot'), true);
    assert.strictEqual(await p.isHidden('#gBicimGrup'), true);
    assert.strictEqual(await p.isHidden('input[name=gPalet][value=klasik]'), true);
    await p.check('input[name=gPalet][value=lacivert]');
    const v = await kokDeger(p, 'eylem');
    assert.strictEqual(v, S.belirtec('istif', 'acik', { vurgu: T.ONAYARLAR.lacivert.eylem }).belirtec.eylem);
    const depo = await p.evaluate(() => JSON.parse(localStorage.getItem('barkod-gorunum')));
    assert.strictEqual(depo.tasarim, 'istif'); assert.strictEqual(depo.vurgu, 'lacivert');
    await p.reload(); await p.waitForTimeout(250);
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'istif');
    assert.strictEqual(await kokDeger(p, 'eylem'), v);
    // Klasik kartı: önceki görünüm ve paletleri
    await p.click('#gorunumDugme');
    await p.check('input[name=gTasarim][value=klasik]');
    assert.strictEqual(await p.evaluate(() => [document.documentElement.getAttribute('data-tasarim'), document.documentElement.hasAttribute('data-yeni')].join()), 'klasik,false');
    assert.strictEqual(await p.isVisible('#gBicimGrup'), true);
    assert.strictEqual(await p.isHidden('input[name=gPalet][value=tasarim]'), true);
    await p.click('#gSifirla');
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'muhur');
    assert.strictEqual(await p.isChecked('input[name=gPalet][value=tasarim]'), true);
    assert.strictEqual(await kokDeger(p, 'eylem'), '#853652');
    assert.deepStrictEqual(p.__hatalar, []);
  } finally { await b.close(); }
});

test('tarayıcı: eski kayıt geçişi: tasarım seçimi olmayan her eski kayıt Mühür’e geçer', { skip: atla && 'playwright yok', timeout: 60000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    let p = await ac(b, { gorunum: { palet: 'bordo', bicim: 'ton', kose: 8 } });
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'muhur');
    await p.context().close();
    p = await ac(b, { gorunum: { palet: 'cam', bicim: 'ton', yazi: 115 } });
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-tasarim')), 'muhur');
    assert.strictEqual(await p.evaluate(() => document.documentElement.getAttribute('data-yazi')), '115');
    await p.context().close();
  } finally { await b.close(); }
});

test('tarayıcı: açılış tanıtımı: tıklama/tuşla geçilir, sekmede bir kez, JS olmadan da CSS ile kapanır, azaltılmış harekette durağan', { skip: atla && 'playwright yok', timeout: 90000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    let p = await ac(b, { acilis: true, bekle: 100 });
    assert.strictEqual(await p.isVisible('#acilis'), true);
    await p.keyboard.press('Shift'); await p.waitForTimeout(300);
    assert.strictEqual(await p.$('#acilis'), null, 'tuşla geçildi ve kaldırıldı');
    await p.reload(); await p.waitForTimeout(100);
    assert.strictEqual(await p.$('#acilis'), null, 'aynı sekmede tekrar gösterilmez');
    await p.context().close();
    p = await ac(b, { acilis: true, bekle: 100 });
    await p.mouse.click(640, 400); await p.waitForTimeout(300);
    assert.strictEqual(await p.$('#acilis'), null, 'tıklamayla geçildi');
    await p.context().close();
    // en çok ~1,2 sn sonra kendiliğinden kapanır
    p = await ac(b, { acilis: true, bekle: 1500 });
    assert.strictEqual(await p.$('#acilis'), null);
    await p.context().close();
    // JS kapalı: yalnız CSS animasyonuyla görünmez olur (fail-open)
    const ctx = await b.newContext({ javaScriptEnabled: false, locale: 'tr-TR' });
    const q = await ctx.newPage(); await q.goto('file://' + HTML); await q.waitForTimeout(1500);
    assert.strictEqual(await q.evaluate(() => getComputedStyle(document.getElementById('acilis')).visibility), 'hidden');
    await ctx.close();
    // azaltılmış hareket: çubuklar durağan (animasyon yok), logo hemen tam
    p = await ac(b, { acilis: true, azHareket: true, bekle: 50 });
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.acIsaret i')).animationName), 'none');
    assert.strictEqual(await p.evaluate(() => getComputedStyle(document.querySelector('.acYazi')).opacity), '1');
    await p.context().close();
  } finally { await b.close(); }
});

test('tarayıcı: barkod etiketi her tasarımda saf beyaz zeminde; "Üretildi" rozeti görünür', { skip: atla && 'playwright yok', timeout: 120000 }, async () => {
  const b = await chromium.launch(exeSecenek());
  try {
    for (const a of ['muhur', 'mekik', 'istif']) for (const m of ['acik', 'koyu']) {
      const p = await ac(b, { mod: m, gorunum: { tasarim: a } });
      await p.fill('#kelime', 'deneme'); await p.click('#uret1'); await p.waitForTimeout(150);
      assert.strictEqual(await p.isVisible('#tekKap'), true, a + ' ' + m + ' barkod üretildi');
      const z = await p.evaluate(() => ['.etiket', '.etiketGovde', '#tekSvg'].map((s) => getComputedStyle(document.querySelector(s)).backgroundColor));
      z.forEach((c) => assert.ok(c === 'rgb(255, 255, 255)' || c === 'rgba(0, 0, 0, 0)', a + ' ' + m + ' ' + c));
      assert.strictEqual(z[0], 'rgb(255, 255, 255)');
      assert.strictEqual(await p.isVisible('#uretRozet'), true);
      assert.deepStrictEqual(p.__hatalar, []);
      await p.context().close();
    }
  } finally { await b.close(); }
});
