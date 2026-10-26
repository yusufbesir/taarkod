'use strict';
// Tema seçicisi: kayıtlı tercih dil değişimi, odak dönüşü ve sayfa geri yüklemesi sonrasında seçicide ve data-tema'da korunur.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

let chromium = null;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require('/opt/node-tools/node_modules/playwright').chromium; } catch (e2) {}
}
const exe = '/opt/pw-browsers/chromium';
const HTML = process.env.TAARKOD_HTML || path.join(__dirname, '..', 'barkod-sifreleme.html');
const atla = !chromium || !fs.existsSync(HTML);

async function ac(b, masaustu) {
  const ctx = await b.newContext(masaustu ? { userAgent: 'Mozilla/5.0 Electron/30.0.0 Chrome/124' } : {});
  if (masaustu) await ctx.addInitScript(() => { window.barkodMasaustu = { pencereTema: () => Promise.resolve({ tamam: true }) }; });
  const p = await ctx.newPage();
  await p.goto('file://' + HTML);
  await p.waitForTimeout(250);
  return p;
}
const durum = (p) => p.evaluate(() => ({ sec: document.getElementById('tema').value, tema: document.documentElement.getAttribute('data-tema') }));

for (const masaustu of [false, true]) {
  test('tema: Koyu seçimi sekme, dil, kural sıfırlama, üretim, yenileme ve sistem teması değişiminde korunur (' + (masaustu ? 'masaüstü' : 'web') + ')', { skip: atla && 'playwright yok' }, async () => {
    const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
    try {
      const p = await ac(b, masaustu);
      const koyu = { sec: 'koyu', tema: 'koyu' };
      await p.selectOption('#tema', 'koyu');
      await p.click('#s2'); assert.deepStrictEqual(await durum(p), koyu);
      await p.click('#s1'); await p.click('#uret1'); await p.waitForTimeout(300);
      assert.deepStrictEqual(await durum(p), koyu);
      await p.selectOption('#dil', 'en'); await p.waitForTimeout(150); assert.deepStrictEqual(await durum(p), koyu);
      await p.selectOption('#dil', 'tr'); await p.waitForTimeout(150); assert.deepStrictEqual(await durum(p), koyu);
      await p.emulateMedia({ colorScheme: 'light' }); assert.deepStrictEqual(await durum(p), koyu);
      await p.emulateMedia({ colorScheme: 'dark' }); assert.deepStrictEqual(await durum(p), koyu);
      await p.reload(); await p.waitForTimeout(250); assert.deepStrictEqual(await durum(p), koyu);
    } finally { await b.close(); }
  });
}

test('tema: seçici kendiliğinden başka değere dönerse (form geri yükleme gibi) dil değişimi ve odak dönüşü onu kayıtlı tercihe eşitler', { skip: atla && 'playwright yok' }, async () => {
  const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  try {
    const p = await ac(b, true);
    await p.selectOption('#tema', 'koyu');
    // olaysız sıfırlama: seçici "Sistem"e döner, sayfa teması eski kalır
    await p.evaluate(() => { document.getElementById('tema').value = 'sistem'; });
    await p.selectOption('#dil', 'en'); await p.waitForTimeout(150);
    assert.deepStrictEqual(await durum(p), { sec: 'koyu', tema: 'koyu' }, 'dil değişimi sonrası');
    await p.evaluate(() => { document.getElementById('tema').value = 'sistem'; window.dispatchEvent(new Event('focus')); });
    assert.deepStrictEqual(await durum(p), { sec: 'koyu', tema: 'koyu' }, 'odak dönüşü sonrası');
    // sayfa temasının kendiliğinden kalkması da düzeltilir
    await p.evaluate(() => { document.documentElement.removeAttribute('data-tema'); window.dispatchEvent(new Event('pageshow')); });
    assert.deepStrictEqual(await durum(p), { sec: 'koyu', tema: 'koyu' }, 'pageshow sonrası');
    // kullanıcı bilerek Sistem seçerse tercih Sistem olur ve korunur
    await p.selectOption('#tema', 'sistem'); await p.selectOption('#dil', 'tr'); await p.waitForTimeout(150);
    assert.deepStrictEqual(await durum(p), { sec: 'sistem', tema: null });
  } finally { await b.close(); }
});

test('tema: localStorage yazılamıyorsa da oturum içinde seçim korunur', { skip: atla && 'playwright yok' }, async () => {
  const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  try {
    const ctx = await b.newContext();
    await ctx.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('dolu'); }; });
    const p = await ctx.newPage();
    await p.goto('file://' + HTML); await p.waitForTimeout(250);
    await p.selectOption('#tema', 'koyu');
    await p.selectOption('#dil', 'en'); await p.waitForTimeout(150);
    await p.evaluate(() => window.dispatchEvent(new Event('focus')));
    assert.deepStrictEqual(await durum(p), { sec: 'koyu', tema: 'koyu' });
  } finally { await b.close(); }
});
