'use strict';
// Derlenmiş HTML'i gerçek tarayıcıda açar: sayfa betiği çökmemeli, sekme geçişi çalışmalı.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

let chromium = null;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require('/opt/node-tools/node_modules/playwright').chromium; } catch (e2) {}
}
const exe = '/opt/pw-browsers/chromium';
const HTML = path.join(__dirname, '..', 'barkod-sifreleme.html');
const atla = !chromium || !fs.existsSync(HTML);

test('derlenmiş sayfa hatasız açılır ve sekme değişir', { skip: atla && 'playwright yok' }, async () => {
  const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  try {
    const p = await b.newPage();
    const hatalar = [];
    p.on('pageerror', e => hatalar.push(String(e)));
    await p.goto('file://' + HTML);
    await p.waitForTimeout(300);
    assert.deepStrictEqual(hatalar, []);
    const sekme = await p.$('#s2');
    assert.ok(sekme, '#s2 sekmesi bulunamadı');
    await sekme.click();
    assert.ok(await p.isVisible('#p2'), '#p2 paneli görünmedi');
  } finally { await b.close(); }
});
