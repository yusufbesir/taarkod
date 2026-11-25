// Sahip: Yusuf. yazan: [Claude#KM2-hesap-giris 2026-11-25]
// TaaRkod'un TAA ortak girişe bağlantısı: kanal adları, preload yüzeyi, sayfa ve paket dosyaları.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const mk = path.join(__dirname, '..');
const kok = path.join(mk, '..');
const oku = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const g = require(path.join(mk, 'taa', 'taa-giris.js'));

test('preload kanalları ortak KANAL ile aynı', () => {
  const preload = oku(mk, 'preload.js');
  for (const k of Object.values(g.KANAL)) assert.ok(preload.includes(`'${k}'`), k);
});

test('ana süreç ortak köprüyü program adı ve gönderen denetimiyle kurar', () => {
  const main = oku(mk, 'main.js');
  assert.match(main, /require\('\.\/taa\/taa-giris\.js'\)\.ipcKur\(ipcMain, \{\s*program: 'taarkod', paketli: app\.isPackaged,/);
  assert.match(main, /denetle: \(event\) => \{ gonderenKontrol\(event\); if \(!pencere \|\| event\.sender !== pencere\.webContents \|\| event\.senderFrame !== event\.sender\.mainFrame\)/);
  assert.match(oku(kok, 'program.toml'), /^ad = "taarkod"/m, 'program adı sunucudaki program_yetkisi ile aynı');
  assert.ok(JSON.parse(oku(mk, 'package.json')).build.files.includes('taa/taa-giris.js'));
});

test('giriş betikleri tek dosyalık sayfaya gömülü', () => {
  const html = oku(kok, 'barkod-sifreleme.html');
  assert.ok(html.includes('TaaGirisEkrani') && html.includes("programAdi: 'TaaRkod'"));
  assert.ok(html.indexOf('kok.TaaGirisEkrani = ') < html.indexOf("programAdi: 'TaaRkod'"), 'ekran, açılış betiğinden önce');
});

test('taa-kimlik yoksa giriş istenmez', async () => {
  assert.deepStrictEqual(await g.baslangic({ env: { TAA_KIMLIK: path.join(mk, 'yok') } }), { arac: false, oturum: null });
});
