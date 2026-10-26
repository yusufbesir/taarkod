# TAARKOD - Masaüstü (Electron)

`../barkod-sifreleme.html` tek dosyalık uygulamasını Electron ile paketler. Ağ erişimi yoktur, her şey yereldir.

## Gereksinimler
- Node.js 20+ ve npm
- Windows'ta derlemek için ek bir şey gerekmez. Linux/macOS'ta Windows hedefi için normalde `wine` gerekir (aşağıya bakın).

## Çalıştırma (geliştirme)
```
npm install
npm start
```
`npm run kopyala` adımı HTML'i `app/index.html` olarak kopyalar (başka yer için `HTML_KAYNAK=/yol/dosya.html`).

## Derleme (Windows .exe)
```
npm install
npm run dist
```
Çıktı `dist/` altına gelir:
- `TAARKOD-Kurulum-1.8.0.exe` - NSIS kurulum (kullanıcı başına, yönetici izni gerekmez, kurulum klasörü seçilebilir, masaüstü + başlat menüsü kısayolu, kaldırıcı, Türkçe)
- `TAARKOD-Tasinabilir-1.8.0.exe` - kurulumsuz taşınabilir tek dosya

### Windows'ta yeniden derleme
PowerShell/CMD, proje klasöründe:
```
npm install
npm run dist
```

### Linux'ta derleme notu
`electron-builder` Linux'ta kaldırıcıyı üretmek için wine çalıştırır. Wine yoksa `node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js` içindeki `isMacOsCatalina()` koşulunun `true` yapılmasıyla yükleyiciden kaldırıcı doğrudan çıkarılabilir (bu projedeki yapı böyle üretildi). `signAndEditExecutable=false` olduğundan exe'ye simge/sürüm bilgisi işlenmez; Windows'ta derlerseniz bu ayarı kaldırabilirsiniz.

## Kurulum
`TAARKOD-Kurulum-1.8.0.exe` dosyasını çalıştırın, kurulum klasörünü seçin, bitirin. Kaldırmak için Ayarlar > Uygulamalar'dan veya başlat menüsünden kaldırıcıyı kullanın.

## Güncelleme
- Kurulumlu sürüm: yeni `TAARKOD-Kurulum-X.Y.Z.exe` aynı uygulama kimliğiyle eskisinin üstüne kurulur ve eski sürümün yerine geçer.
- Taşınabilir sürüm ve indirilmiş eski kurulum dosyaları kendiliğinden kalkmaz: Yardım sekmesindeki "Sürüm ve eski sürüm temizliği" kartından indirme klasörünü seçin; uygulama yalnız `Barkod-Siralama-(Kurulum|Tasinabilir)-X.Y.Z.exe` (ve `.blockmap`) adlı, mevcut sürümden eski dosyaları bulur.
- Silinebilecek dosyaların tek kaynağı `temizlik.js` içindeki `MANIFEST` sabitidir (önekler `TAARKOD` ve eski ad `Barkod-Siralama`, türler `Kurulum`/`Tasinabilir`, uzantılar `.exe`/`.exe.blockmap`); bunun dışındaki hiçbir dosya silinmez.
- Silme yalnız doğrulanınca yapılır: klasörde `SHA256.txt` bulunmalı ve mevcut sürümün kurulum dosyasını listelemeli, hash eşleşmeli. Aksi halde (dosya yok, kayıt yok, uyuşmazlık) hiçbir şey silinmez; arayüz "doğrulama dosyası bulunamadı, temizlik yapılmadı" der ve günlüğe "doğrulanamadı, silinmedi" yazılır. Elle onayla silme yoktur.
- Silme geri dönüşüm kutusuna taşıma olarak yapılır (geri alınabilir); kalıcı silme yoktur. Klasörün alt klasörlerine bakılmaz.
- "Güncelleme sonrası eski sürümleri otomatik sil" seçeneği (varsayılan açık): sürüm yükseldikten sonraki ilk açılışta seçili klasör sessizce temizlenir. İlk çalıştırmada silme yapılmaz. Ayarlar kullanıcı verisi klasöründeki `ayarlar.json` dosyasındadır.

## Güvenlik
- nodeIntegration kapalı, contextIsolation ve sandbox açık, webSecurity açık, geliştirici araçları kapalı, menü yok.
- Yeni pencere ve sayfa gezintisi engelli; `file:` (ve yerel `blob:`/`data:`) dışındaki ağ istekleri engelli; izin istekleri reddedilir; tek örnek kilidi vardır.
- Renderer'a yalnız `preload.js` ile dar bir köprü (`barkodMasaustu`) açılır; temizlik IPC çağrıları gönderen sayfayı doğrular ve renderer'dan yol/dosya adı kabul etmez.
- CSV/SVG/JSON indirmelerinde "Farklı kaydet" penceresi açılır.

## SmartScreen uyarısı
Üretilen .exe dosyaları **imzasızdır**. Windows SmartScreen "Windows bilgisayarınızı korudu" uyarısı verebilir ("Ek bilgi" > "Yine de çalıştır"). Bu uyarıyı kaldırmak için kod imzalama sertifikası gerekir. Dosyaları `cikti/SHA256.txt` ile karşılaştırarak bütünlüğünü doğrulayabilirsiniz.

## Doğrulama durumu
- .exe dosyaları Linux'ta derlendi; Windows'ta kurulup çalıştırılarak denenmedi. Kurulum, kaldırma ve kısayolları ilk kez Windows'ta deneyin.
- Uygulamanın kendisi (Electron, Linux'ta) başlatılıp tek barkod, toplu üretim ve CSV indirme denendi.

## Kod imzalama (plan)

Şu an exe dosyaları imzasız; Windows SmartScreen uyarısı göstermesi normaldir. Sertifika (OV/EV kod imzalama sertifikası) alınınca `package.json` içindeki `build.win` bölümüne `certificateFile` ve `certificatePassword` (ortam değişkeninden, koda yazılmadan) eklenir, ardından aynı derleme komutu imzalı çıktı üretir. Sertifika olmadan imzalama yapılamaz; doğrulama için bugün `SHA256.txt` kullanılır.

## TAARKOD adı ve logo
- Uygulamanın yeni adı TAARKOD'dur (eski ad: Barkod Sıra Şifreleme). Sürüm 1.8.0.
- Logo dosyaları: `../logo/taarkod-ikon.svg` (kaynak), `../logo/taarkod-ikon-512.png` (`build/icon.png` bunun kopyasıdır; önceki simgeler `build/icon.eski.png` ve `build/yedek-1.4/`; yeni simgenin kaynağı `build/logo.svg`), `../logo/taarkod-logo-yatay.svg`.
- 1.5.0: pencere çerçevesi uygulamayla bütünleşti (başlık çubuğu gizli, `titleBarOverlay`; çerçeve seçenekleri `pencere.js`), yeni tasarım dili ve logo. `build/icon.icns` PNG girişli elle üretildi (`npm run ikon:icns` de kullanılabilir); macOS'ta denenmedi.
- `appId` (`com.barkodsiralama.app`) aynıdır: yeni kurulum eski kurulumun yerine geçer.
- Ayarlar kopyalanır: yeni veri klasöründe (`%APPDATA%\TAARKOD`) `ayarlar.json` yoksa ve eski klasörde (`%APPDATA%\Barkod Sıra Şifreleme`) varsa yalnız `ayarlar.json` kopyalanır; eski klasör silinmez, taşınmaz.
- Eski ad (`Barkod-Siralama-...`) ve yeni ad (`TAARKOD-...`) kurulum dosyaları aynı ürünün sürümleri sayılır; eski sürüm temizliği ikisini de tanır (silme kuralları aynı).

## Linux ve macOS

Uygulama (Electron) Linux ve macOS için de paketlenebilir. Ayrıca `../barkod-sifreleme.html` tek dosyası her işletim sisteminde doğrudan tarayıcıda çalışır; masaüstü paketi zorunlu değildir.

### Derleme
```
npm install
npm run dist:win     # Windows: NSIS + portable (.exe)
npm run dist:linux   # Linux: AppImage + deb (x64)
npm run dist:mac     # macOS: zip + dmg (x64 + arm64), imzasız
```
Çıktı `dist/` altına gelir:
- `TAARKOD-<surum>-linux-x64.AppImage`, `TAARKOD-<surum>-linux-x64.deb`
- `TAARKOD-<surum>-mac-x64.zip`, `-mac-arm64.zip`, `-mac-x64.dmg`, `-mac-arm64.dmg`

Her işletim sistemi için paket kendi işletim sisteminde derlenmelidir. Linux paketleri Linux'ta derlenir. macOS `.dmg` dosyası yalnız macOS konağında derlenebilir (`sips`/`hdiutil` gerekir); Linux'ta yalnız `--mac zip` (`--dir` ile de) üretilir. Üçünü birden üretmek için depo kökündeki `.github/workflows/build.yml` (GitHub Actions: windows/ubuntu/macos matrisi, imzasız, artifact yükler) kullanılabilir. macOS simgesi `build/icon.icns`, `build/icon.png`'den `npm run ikon:icns` ile üretilir.

### Linux kurulumu
- AppImage: `chmod +x TAARKOD-<surum>-linux-x64.AppImage && ./TAARKOD-<surum>-linux-x64.AppImage`
- deb (Debian/Ubuntu): `sudo dpkg -i TAARKOD-<surum>-linux-x64.deb` (eksik bağımlılık için `sudo apt-get install -f`)
- Eski sürüm temizliği AppImage için `APPIMAGE` ortam değişkenindeki çalışan dosyayı da dışlar.

### macOS kurulumu ve Gatekeeper
Uygulama **imzasız ve noter onaysızdır**; Gatekeeper "geliştiricisi doğrulanamadı" uyarısı verir. İlk açılışta:
- Uygulamaya **sağ tık > Aç** deyin ve onaylayın; ya da
- Terminalde karantina işaretini kaldırın: `xattr -dr com.apple.quarantine /Applications/TAARKOD.app`

Tüm pencereler kapanınca uygulama macOS'ta çalışmaya devam eder (Dock'tan yeniden açılır); Windows ve Linux'ta kapanır. Bütünlük için indirdiğiniz dosyayı `SHA256.txt` ile karşılaştırın.

### Eski sürüm temizliği (Linux/macOS)
Windows ile aynı kurallar: yalnız şu anki sürümden kesinlikle eski ve tam eşleşen adlar (`TAARKOD-<surum>-linux|mac-x64|arm64.AppImage|deb|zip|dmg` ve `.blockmap`), yalnız seçili klasörün doğrudan çocukları, yalnız Çöp Kutusu'na (`shell.trashItem`) gönderilir ve yeni sürümün `SHA256.txt` doğrulaması şarttır.

### Doğrulama durumu (Linux/macOS)
- AppImage ve deb Linux'ta derlendi; macOS zip (x64, arm64) Linux'ta derlendi. macOS'ta ve dmg ile çalıştırılarak denenmedi.
- deb `maintainer` ve `homepage` alanları yer tutucudur (`taarkod.invalid`); gerçek değerlerle değiştirin.

## Görünüm ve tema (1.8.0)
- Üst şeritteki GÖRÜNÜM düğmesi bir pencere açar: renk paleti (Lacivert, Antrasit, Bordo, Çam, Eflatun, Taş, Klasik, Özel), uygulama biçimi (Ton: yalnız vurgu; Tüm arayüz: şerit, zemin, yüzeyler, tablolar, durum çubuğu da), açık/koyu/sistem, iplik rengi, şerit stili, yoğunluk, köşe, başlık yazısı, yazı boyutu, durum çubuğu ve kontrast. Değişiklikler anında uygulanır; `localStorage` anahtarı `barkod-gorunum` yalnız seçim kimliklerini ve 3 özel rengi saklar.
- Renkleri `src/tema.js` (Tutaa ile ortak modül, sürüm 1.1) hesaplar; TAARKOD'a özgü değerler `src/tema_uygulama.js` içindedir. Varsayılan görünüm (Çam + Ton + Sistem) 1.7.1 ile aynıdır; "Klasik" 1.7.1 değerlerini birebir geri getirir.
- Pencere çerçevesi (`titleBarOverlay`) rengi, palet ya da açık/koyu değişince `pencere:tema` köprüsüyle güncellenir (şerit rengi hesaplanan `--ust` değerinden gelir).
- Eski sürüm (1.7.1) kurulum dosyaları silinmeden `eski/1.7.1/` altında tutulmalıdır (kopyala, SHA256 doğrula, Geri Dönüşüm sırası).
- İlk pencere rengi: kayıtlı palet renderer `localStorage`'ında durur, ana işlem açılışta bilemez. Pencere bu yüzden `show:false` açılır ve sayfa ilk kez çizilince (`ready-to-show`; yedek 4 sn) gösterilir; sayfa yüklenirken `pencere:tema` köprüsü çerçeve rengini kayıtlı palete çeker. `backgroundColor` açık/koyu varsayılanında (Çam kâğıdı) kalır. Sınır: sayfa çok geç yüklenirse çerçeve kısa süre Çam yeşili görünebilir.
