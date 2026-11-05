'use strict';
const { app, BrowserWindow, Menu, session, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const temizlik = require('./temizlik');
const { eskiAyarlariKopyala } = require('./ayarkopya');
const cerceve = require('./pencere');
const kuyruk = require('./kuyruk');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let pencere = null;

  app.on('second-instance', () => {
    if (pencere) {
      if (pencere.isMinimized()) pencere.restore();
      pencere.focus();
    }
  });

  // ---- Ayarlar (userData/ayarlar.json) ----
  const ayarYolu = () => path.join(app.getPath('userData'), 'ayarlar.json');
  function ayarOku() {
    try {
      const o = JSON.parse(fs.readFileSync(ayarYolu(), 'utf8'));
      return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }
  function ayarYaz(a) {
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      const gecici = ayarYolu() + '.tmp';
      fs.writeFileSync(gecici, JSON.stringify(a, null, 2));
      fs.renameSync(gecici, ayarYolu());
    } catch (e) { /* ayar yazılamazsa sessizce devam */ }
  }
  const otomatikAcik = (a) => a.otomatikTemizlik !== false;
  const klasorGecerli = (a) => typeof a.temizlikKlasoru === 'string' && path.isAbsolute(a.temizlikKlasoru);

  // Yalnız uygulamanın kendi yerel sayfasından gelen IPC çağrıları kabul edilir.
  function gonderenKontrol(event) {
    const f = event && event.senderFrame;
    const url = f && typeof f.url === 'string' ? f.url : '';
    if (!(url.startsWith('file://') && url.endsWith('app/index.html'))) {
      throw new Error('Yetkisiz gönderen');
    }
  }

  // Kayıtlı klasörde (renderer'dan yol alınmaz) tarar ve geri dönüşüm kutusuna gönderir.
  // Önce yeni sürümün SHA256'sı (klasörde SHA256.txt varsa) doğrulanır; hatalıysa hiçbir şey silinmez.
  // Silinen her dosyanın adı + SHA256'sı userData/temizlik-log.jsonl dosyasına eklenir. Silme = geri dönüşüm kutusu.
  function gunlukYaz(kayit) {
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      fs.appendFileSync(path.join(app.getPath('userData'), 'temizlik-log.jsonl'),
        JSON.stringify(Object.assign({ tarih: new Date().toISOString(), surum: app.getVersion() }, kayit)) + '\n');
    } catch (e) { /* günlük yazılamazsa sessizce devam */ }
  }
  async function kayitliKlasoruTemizle(a) {
    const dogrulama = temizlik.sha256Dogrula(a.temizlikKlasoru, app.getVersion(), fs);
    if (dogrulama.durum === 'hatali') {
      gunlukYaz({ durum: 'silinmedi', neden: 'sha256 uyuşmuyor, silinmedi', ad: dogrulama.ad });
      return null;
    }
    if (dogrulama.durum !== 'dogrulandi') {
      gunlukYaz({ durum: 'silinmedi', neden: 'doğrulanamadı, silinmedi (SHA256.txt yok veya mevcut sürümün kurulum dosyası listede yok)' });
      return null;
    }
    const liste = temizlik.tara(a.temizlikKlasoru, app.getVersion(), fs);
    return temizlik.temizle(liste, (p) => shell.trashItem(p), { fs: fs, klasor: a.temizlikKlasoru, kayit: gunlukYaz });
  }

  // Yarım kalmış ayar yazımı (ayarlar.json.tmp) geri dönüşüm kutusuna gönderilir; asıl ayar dosyası korunur.
  async function yarimDosyalariTemizle() {
    const gecici = ayarYolu() + '.tmp';
    if (fs.existsSync(gecici)) { try { await shell.trashItem(gecici); } catch (e) { /* yoksay */ } }
  }

  // Güncelleme sonrası (sürüm yükseldiyse) sessiz temizlik; ilk çalıştırmada yalnız sürüm yazılır.
  // Açılış kontrolü tamamlanmadan (sayfa yüklenmeden) çağrılmaz; çökerse sürüm yazılmaz, eski sürümler korunur.
  async function baslangicTemizligi() {
    await yarimDosyalariTemizle();
    const a = ayarOku();
    const simdi = app.getVersion();
    const guncellendi = typeof a.sonCalisanSurum === 'string' && temizlik.surumKarsilastir(a.sonCalisanSurum, simdi) < 0;
    // Önce yeni sürüm kaydedilir (açılış doğrulandı); temizlik ancak bundan sonra çalışır.
    a.sonCalisanSurum = simdi;
    ayarYaz(a);
    if (guncellendi && otomatikAcik(a) && klasorGecerli(a)) {
      try {
        const sonuc = await kayitliKlasoruTemizle(a);
        a.sonTemizlik = sonuc === null
          ? { tarih: new Date().toISOString(), silinen: 0, dogrulanamadi: true }
          : { tarih: new Date().toISOString(), silinen: sonuc.filter((r) => r.durum === 'silindi').length };
        ayarYaz(a);
      } catch (e) { /* sessiz */ }
    }
  }

  ipcMain.handle('surum:bilgi', (event) => {
    gonderenKontrol(event);
    const a = ayarOku();
    return {
      surum: app.getVersion(),
      otomatikTemizlik: otomatikAcik(a),
      klasor: klasorGecerli(a) ? a.temizlikKlasoru : null,
      sonTemizlik: a.sonTemizlik || null
    };
  });

  ipcMain.handle('temizlik:klasorSec', async (event) => {
    gonderenKontrol(event);
    const r = await dialog.showOpenDialog(pencere, { properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths || !r.filePaths[0]) return { iptal: true };
    const a = ayarOku();
    a.temizlikKlasoru = r.filePaths[0];
    ayarYaz(a);
    return { klasor: a.temizlikKlasoru };
  });

  ipcMain.handle('temizlik:tara', (event) => {
    gonderenKontrol(event);
    const a = ayarOku();
    if (!klasorGecerli(a)) return { klasor: null, liste: [] };
    const liste = temizlik.tara(a.temizlikKlasoru, app.getVersion(), fs).map((o) => ({ ad: o.ad, surum: o.surum }));
    const dogrulandi = temizlik.sha256Dogrula(a.temizlikKlasoru, app.getVersion(), fs).durum === 'dogrulandi';
    return { klasor: a.temizlikKlasoru, liste: liste, dogrulandi: dogrulandi };
  });

  ipcMain.handle('temizlik:uygula', async (event) => {
    gonderenKontrol(event);
    const a = ayarOku();
    if (!klasorGecerli(a)) return { silinen: 0, hata: 0, sonuc: [] };
    const sonuc = await kayitliKlasoruTemizle(a);
    if (sonuc === null) {
      a.sonTemizlik = { tarih: new Date().toISOString(), silinen: 0, dogrulanamadi: true };
      ayarYaz(a);
      return { silinen: 0, hata: 0, sonuc: [], dogrulanamadi: true };
    }
    const silinen = sonuc.filter((r) => r.durum === 'silindi').length;
    a.sonTemizlik = { tarih: new Date().toISOString(), silinen: silinen };
    ayarYaz(a);
    return { silinen: silinen, hata: sonuc.length - silinen, sonuc: sonuc.map((r) => ({ ad: r.ad, durum: r.durum })) };
  });

  ipcMain.handle('ayar:otomatik', (event, deger) => {
    gonderenKontrol(event);
    const a = ayarOku();
    a.otomatikTemizlik = deger === true;
    ayarYaz(a);
    return { otomatikTemizlik: a.otomatikTemizlik };
  });

  // ---- TAA veri alanı: etiket-kuyrugu (YALNIZ okur) ----
  // Alan + SAHIP.toml varsa arayüz "Fiyat Etiketi kuyruğuna gönder" düğmesini gösterir; yoksa gizler (hata yok).
  // Kuyruk dosyasına yazılmaz; öneri yalnız <alan>/oneriler/ altına bırakılır. Renderer'dan yol alınmaz, yalnız barkod metinleri.
  ipcMain.handle('taa:kuyruk-durum', (event) => {
    gonderenKontrol(event);
    return { var: kuyruk.durum(process.env).var === true };
  });

  ipcMain.handle('taa:kuyruk-oner', (event, barkodlar) => {
    gonderenKontrol(event);
    const r = kuyruk.oner(barkodlar, process.env);
    return r.tamam ? { tamam: true, adet: r.adet } : { tamam: false, neden: r.neden };
  });

  // Tema değişince üst şerit rengiyle sistem düğmelerinin (titleBarOverlay) rengi eşlenir.
  // Yalnız uygulamanın kendi sayfası çağırabilir; yalnız #RRGGBB biçimli iki renk kabul edilir, başka her şey yoksayılır.
  ipcMain.handle('pencere:tema', (event, renk, simge) => {
    gonderenKontrol(event);
    const o = cerceve.overlayGuncelle(renk, simge);
    if (!o || !pencere || process.platform === 'darwin' || typeof pencere.setTitleBarOverlay !== 'function') return { tamam: false };
    try { pencere.setTitleBarOverlay(o); } catch (e) { return { tamam: false }; }
    return { tamam: true };
  });

  function olustur() {
    pencere = new BrowserWindow({
      title: 'TAARKOD',
      width: 1100,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      autoHideMenuBar: true,
      // Pencere sayfa ilk kez çizilince gösterilir: sayfa yüklenirken pencereTema köprüsü çerçeve rengini kayıtlı palete çeker,
      // böylece ilk açılışta sabit 1.7.1 yeşili kısa süre görünmez. Tercih renderer localStorage'ında olduğundan ana işlem onu açılışta bilemez.
      show: false,
      ...cerceve.secenekler(process.platform, nativeTheme.shouldUseDarkColors),
      icon: path.join(__dirname, 'build', 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        devTools: false,
        allowRunningInsecureContent: false
      }
    });
    pencere.setMenuBarVisibility(false);
    // Sayfa başlığı HTML'deki <title> ile değişmesin
    pencere.on('page-title-updated', (e) => e.preventDefault());
    pencere.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    pencere.webContents.on('will-navigate', (e) => e.preventDefault());
    pencere.loadFile(path.join(__dirname, 'app', 'index.html'));
    const goster = () => { if (pencere && !pencere.isDestroyed() && !pencere.isVisible()) pencere.show(); };
    pencere.once('ready-to-show', goster);
    setTimeout(goster, 4000).unref(); // yedek: ready-to-show hiç gelmezse pencere yine de açılır
    pencere.on('closed', () => { pencere = null; });
  }

  app.whenReady().then(() => {
    // Ürün adı değişti: eski userData'daki ayarlar.json yeni klasöre KOPYALANIR (taşıma/silme yok, hata sessiz)
    eskiAyarlariKopyala(app.getPath('userData'), app.getPath('appData'));
    // macOS'ta menü çubuğu kaldırılırsa Cmd+Q / kopyala-yapıştır çalışmaz; yalnız orada asgari menü kurulur.
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(Menu.buildFromTemplate([
        { role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }
      ]));
    } else {
      Menu.setApplicationMenu(null);
    }
    const s = session.defaultSession;
    // file:// ve blob:/data: (yerel indirme/önizleme) dışındaki ağ isteklerini engelle
    s.webRequest.onBeforeRequest((d, cb) => {
      const u = d.url;
      cb({ cancel: !(u.startsWith('file://') || u.startsWith('blob:') || u.startsWith('data:')) });
    });
    s.setPermissionRequestHandler((wc, izin, cb) => cb(false));
    s.setPermissionCheckHandler(() => false);
    // will-download: varsayılan "Farklı kaydet" iletişim kutusu kullanılır (setSavePath yok)
    olustur();
    pencere.webContents.once('did-finish-load', () => { baslangicTemizligi().catch(() => {}); });
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) olustur(); });
  });

  // macOS'ta tüm pencereler kapanınca uygulama çalışmaya devam eder (Dock'tan activate ile yeniden açılır).
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
