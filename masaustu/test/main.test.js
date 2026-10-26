// main.js güvenlik ayarları için statik denetim (Electron çalıştırmadan, node --test test/main.test.js).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const kaynak = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const adaylar = [path.join(__dirname, '..', 'app', 'index.html'), path.join(__dirname, '..', '..', 'barkod-sifreleme.html')];
const html = fs.readFileSync(adaylar.find((p) => fs.existsSync(p)), 'utf8');

test('webPreferences: izolasyon ve kum havuzu açık, node kapalı', () => {
  assert.match(kaynak, /nodeIntegration:\s*false/);
  assert.match(kaynak, /contextIsolation:\s*true/);
  assert.match(kaynak, /sandbox:\s*true/);
  assert.match(kaynak, /webSecurity:\s*true/);
  assert.match(kaynak, /devTools:\s*false/);
  assert.match(kaynak, /allowRunningInsecureContent:\s*false/);
  assert.doesNotMatch(kaynak, /nodeIntegration:\s*true|contextIsolation:\s*false|sandbox:\s*false|webSecurity:\s*false/);
});

test('yeni pencere ve gezinme engelli', () => {
  assert.match(kaynak, /setWindowOpenHandler\(\(\)\s*=>\s*\(\{\s*action:\s*'deny'\s*\}\)\)/);
  assert.match(kaynak, /will-navigate',\s*\(e\)\s*=>\s*e\.preventDefault\(\)/);
});

test('ağ engeli: yalnızca file, blob ve data izinli', () => {
  assert.match(kaynak, /onBeforeRequest/);
  assert.match(kaynak, /startsWith\('file:\/\/'\)/);
  assert.match(kaynak, /startsWith\('blob:'\)/);
  assert.match(kaynak, /startsWith\('data:'\)/);
  assert.match(kaynak, /cancel:\s*!\(/);
  assert.doesNotMatch(kaynak, /startsWith\('https?:/);
});

test('izinler reddedilir', () => {
  assert.match(kaynak, /setPermissionRequestHandler\(\(wc,\s*izin,\s*cb\)\s*=>\s*cb\(false\)\)/);
  assert.match(kaynak, /setPermissionCheckHandler\(\(\)\s*=>\s*false\)/);
});

test('menü yok, tek örnek kilidi var, yalnızca yerel dosya yüklenir', () => {
  assert.match(kaynak, /Menu\.setApplicationMenu\(null\)/);
  assert.match(kaynak, /requestSingleInstanceLock/);
  assert.match(kaynak, /loadFile\(/);
  assert.doesNotMatch(kaynak, /loadURL\(|require\('electron'\)\.remote|enableRemoteModule/);
});

test('uygulama sayfası dış kaynak yüklemez (CSP ve betik)', () => {
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /\bfetch\(|XMLHttpRequest|eval\(/);
});

// ---- Eski sürüm temizliği: statik güvenlik denetimleri ----
const temizlikKaynak = fs.readFileSync(path.join(__dirname, '..', 'temizlik.js'), 'utf8');
const preloadKaynak = fs.readFileSync(path.join(__dirname, '..', 'preload.js'), 'utf8');
const paket = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('preload ayarlı, sandbox hâlâ true', () => {
  assert.match(kaynak, /preload:\s*path\.join\(__dirname,\s*'preload\.js'\)/);
  assert.match(kaynak, /sandbox:\s*true/);
  assert.match(kaynak, /contextIsolation:\s*true/);
});

test('preload yalnız barkodMasaustu sunar ve yalnız electron require eder', () => {
  assert.strictEqual((preloadKaynak.match(/exposeInMainWorld\(/g) || []).length, 1);
  assert.match(preloadKaynak, /exposeInMainWorld\('barkodMasaustu'/);
  const gerekenler = preloadKaynak.match(/require\([^)]*\)/g) || [];
  assert.deepStrictEqual(gerekenler, ["require('electron')"]);
  assert.doesNotMatch(preloadKaynak, /ipcRenderer\.(send|on)\b|window\.|process\.|shell|\bfs\b/);
  ['surumBilgi', 'klasorSec', 'tara', 'uygula', 'otomatikAyarla', 'pencereTema'].forEach((a) => assert.ok(preloadKaynak.includes(a + ':'), a));
});

test('IPC işleyicileri gönderen doğrular ve renderer\'dan yol almaz', () => {
  const kanallar = ['surum:bilgi', 'temizlik:klasorSec', 'temizlik:tara', 'temizlik:uygula', 'ayar:otomatik', 'pencere:tema'];
  kanallar.forEach((k) => {
    const i = kaynak.indexOf("ipcMain.handle('" + k + "'");
    assert.ok(i >= 0, k);
    const gövde = kaynak.slice(i, kaynak.indexOf('\n  });', i));
    assert.match(gövde, /gonderenKontrol\(event\)/, k + ' gönderen doğrulaması');
    const imza = gövde.match(/ipcMain\.handle\('[^']+',\s*(async\s*)?\(([^)]*)\)/)[2].trim();
    if (k === 'ayar:otomatik') {
      assert.strictEqual(imza, 'event, deger');
      assert.match(gövde, /deger === true/);
    } else if (k === 'pencere:tema') {
      assert.strictEqual(imza, 'event, renk, simge');
      assert.match(gövde, /overlayGuncelle\(renk, simge\)/);
    } else {
      assert.strictEqual(imza, 'event', k + ' yalnız event almalı');
    }
  });
  assert.match(kaynak, /senderFrame/);
  assert.match(kaynak, /startsWith\('file:\/\/'\)\s*&&\s*url\.endsWith\('app\/index\.html'\)/);
});

test('kalıcı silme / süreç başlatma yok; silme trashItem ile', () => {
  [kaynak, temizlikKaynak, preloadKaynak].forEach((k) => {
    assert.doesNotMatch(k, /child_process|\bexec(?!Path)|\bspawn|unlinkSync|\bunlink\b|rmSync|\brmdir|\brm\(|fs\.promises|\.rm\b/);
  });
  assert.match(kaynak, /shell\.trashItem\(/);
  assert.doesNotMatch(temizlikKaynak, /require\('electron'\)/);
});

test('yol koda sabit yazılmaz', () => {
  [kaynak, temizlikKaynak].forEach((k) => assert.doesNotMatch(k, /YusufII|[A-Z]:\\\\/));
});

test('temizlik geri dönüşüm kutusu, açılış kontrolü ve günlük akışı', () => {
  assert.match(kaynak, /did-finish-load/);
  assert.match(kaynak, /sha256Dogrula/);
  assert.match(kaynak, /temizlik-log\.jsonl/);
  assert.match(kaynak, /sonCalisanSurum = simdi/);
});

test('package.json: sürüm 1.8.0, dosya listesinde temizlik.js ve preload.js, TAARKOD adı, appId aynı', () => {
  assert.strictEqual(paket.version, '1.8.0');
  assert.strictEqual(paket.productName, 'TAARKOD');
  assert.strictEqual(paket.build.productName, 'TAARKOD');
  assert.strictEqual(paket.description, 'TAARKOD masaüstü uygulaması');
  assert.strictEqual(paket.author, 'TAARKOD');
  assert.strictEqual(paket.build.appId, 'com.barkodsiralama.app', 'appId aynı kalmalı: güncelleme eski kurulumun yerine geçer');
  assert.ok(paket.build.files.includes('ayarkopya.js'));
  assert.match(kaynak, /title: 'TAARKOD'/);
  assert.doesNotMatch(JSON.stringify(paket), /Barkod Sıra|Barkod-Siralama/);
  assert.ok(fs.readFileSync(path.join(__dirname, '..', 'build', 'icon.png')).equals(fs.readFileSync(path.join(__dirname, '..', '..', 'logo', 'taarkod-ikon-512.png'))));
  ['temizlik.js', 'preload.js', 'main.js'].forEach((f) => assert.ok(paket.build.files.includes(f), f));
  assert.strictEqual(paket.build.nsis.artifactName, 'TAARKOD-Kurulum-${version}.exe');
  assert.strictEqual(paket.build.portable.artifactName, 'TAARKOD-Tasinabilir-${version}.exe');
});

test('doğrulanmadan silinmez: sha256 dogrulandi değilse null döner, uygula/otomatik silme yapmaz', () => {
  const i = kaynak.indexOf('async function kayitliKlasoruTemizle');
  const gövde = kaynak.slice(i, kaynak.indexOf('\n  }\n', i));
  assert.match(gövde, /durum === 'hatali'[\s\S]*return null/);
  assert.match(gövde, /durum !== 'dogrulandi'[\s\S]*doğrulanamadı, silinmedi[\s\S]*return null/);
  assert.ok(gövde.indexOf("!== 'dogrulandi'") < gövde.indexOf('temizlik.temizle('), 'doğrulama silmeden önce');
  assert.doesNotMatch(gövde, /dogrulandi'\)\s*\{[^}]*temizle/);
  assert.match(kaynak, /dogrulanamadi: true/);
});

test('sürüm yükseltme sonrası temizlik: önce sonCalisanSurum yazılır, sayfa yüklenince çalışır', () => {
  const i = kaynak.indexOf('async function baslangicTemizligi');
  const gövde = kaynak.slice(i, kaynak.indexOf('\n  }\n', i));
  const yaz = gövde.indexOf('a.sonCalisanSurum = simdi');
  const ilkYaz = gövde.indexOf('ayarYaz(a)');
  const temiz = gövde.indexOf('kayitliKlasoruTemizle(');
  assert.ok(yaz >= 0 && ilkYaz > yaz && temiz > ilkYaz, 'sıra: sürüm yaz -> kaydet -> temizle');
  assert.match(kaynak, /once\('did-finish-load',\s*\(\)\s*=>\s*\{\s*baslangicTemizligi\(\)/);
  assert.doesNotMatch(kaynak.replace(/once\('did-finish-load'[^\n]*/, ''), /baslangicTemizligi\(\)\.catch/);
});

test('kurulum yalnız kullanıcı başına: allowElevation kapalı, installer.nsh zorunlu mevcut kullanıcı kurulumu', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const p = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.strictEqual(p.build.nsis.perMachine, false);
  assert.strictEqual(p.build.nsis.allowElevation, false);
  const nsh = fs.readFileSync(path.join(__dirname, '..', 'build', 'installer.nsh'), 'utf8');
  assert.match(nsh, /!macro customInstallMode[\s\S]*StrCpy \$isForceCurrentInstall "1"[\s\S]*!macroend/);
});

test('kaldırıcı: başlat menüsü Kaldır kısayolu, güncellemede soru yok, ayar silme varsayılan Hayır', () => {
  const nsh = fs.readFileSync(path.join(__dirname, '..', 'build', 'installer.nsh'), 'utf8');
  assert.match(nsh, /!macro customInstall[\s\S]*CreateShortCut[\s\S]*\$\{UNINSTALL_FILENAME\}[\s\S]*!macroend/);
  assert.match(nsh, /!macro customUnInstall[\s\S]*Delete "\$SMPROGRAMS[\s\S]*ifNot\} \$\{isUpdated\}[\s\S]*MB_DEFBUTTON2[\s\S]*\/SD IDNO[\s\S]*!macroend/);
  assert.doesNotMatch(nsh, /RMDir \/r/);
  assert.match(nsh, /CreateShortCut "\$SMPROGRAMS\\TAARKOD - Kaldır\.lnk"/);
  assert.match(nsh, /Delete "\$SMPROGRAMS\\TAARKOD - Kaldır\.lnk"/);
  assert.match(nsh, /RMDir "\$APPDATA\\\$\{PRODUCT_NAME\}"/);
  assert.match(nsh, /RMDir "\$APPDATA\\Barkod Sıra Şifreleme"/);
  const sor = nsh.indexOf('MessageBox'); const bit = nsh.indexOf('barkod_ayar_kalsin:');
  assert.ok(sor > 0 && nsh.indexOf('RMDir "$APPDATA\\Barkod Sıra Şifreleme"') > sor && nsh.indexOf('RMDir "$APPDATA\\Barkod Sıra Şifreleme"') < bit, 'eski klasör de yalnız soru sonrası ele alınır');
  assert.doesNotMatch(nsh, /Barkod Sıra Şifreleme - Kaldır/);
});

test('ilk pencere ready-to-show ile gösterilir (show:false), yedek zamanlayıcı vardır; çerçeve rengi sayfa yüklenince pencereTema ile gelir', () => {
  assert.match(kaynak, /show:\s*false/);
  assert.match(kaynak, /once\('ready-to-show',\s*goster\)/);
  assert.match(kaynak, /setTimeout\(goster,\s*4000\)/);
  assert.match(kaynak, /ipcMain\.handle\('pencere:tema'/);
});
