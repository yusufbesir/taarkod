# TAARKOD

Anahtar kelimeyle geri döndürülebilir barkod seri şifreleme aracı (tek dosya çevrimdışı HTML + Electron masaüstü uygulaması).

- `src/` kaynak, `node build.js` ile `barkod-sifreleme.html` üretilir.
- `test/` ve `masaustu/test/` testleri; `masaustu/` Electron kabuğu.
- `kasa-notu/` uygulama notları (aynı notlar TEZDENEME deposunda da tutulur).
- exe/kurulum dosyaları ve `masaustu/cikti` depoda yoktur.
- Çalışma sırası: önce plan yazılır ve not edilir, sonra sırayla kodlanır.

## TAA tek çatı

- `program.toml` bu programın TAA sözleşmesidir (`taarkod`, sürüm `masaustu/package.json` ile aynı; `etiket-kuyrugu` alanını yalnız okur, yazmaz).
- Veri alanı: `TAA_VERI_KOK` (yoksa kullanıcının TAA veri klasörü). Alan ve `SAHIP.toml` varsa Üret ekranında "Fiyat Etiketi kuyruğuna gönder" düğmesi görünür ve barkodlar yalnız `etiket-kuyrugu/oneriler/` altına öneri olarak bırakılır; yoksa düğme gizlidir, hata çıkmaz.
- `taa/` klasörü taa-paket'ten KOPYADIR, elle düzenlenmez: `taa-veri.js`, `sozlesme_denetle.py`, `veri-sahipleri.toml` (denetleyici için ayrıca `taa/docs/veri-sahipleri.toml`).
- Denetim (yerelde): `python3 taa/sozlesme_denetle.py --program program.toml --surum-dosyasi masaustu/package.json --paket-kok taa`
- Yayınlanmamış: TAA tek çatı uyumu (program.toml, etiket-kuyrugu okuru, taa/ kopyaları); sürüm yükseltilmedi.

## Durum ve açık işler (kapanış notu, 2026-11-15, RK1)

- Sürüm 1.9.0. Kaynak testleri: 314 test, 312 geçti, 0 kalan, 2 atlandı (`node --test test/*.test.js`). Windows'ta kurulumla `denenmedi` (bu not bulutta yazıldı); Windows denemesi Yusuf'un PC'sinde.
- Bu kapanışta düzeltilen: arayüzdeki sürüm rozeti (`SURUM`) 1.8.0'da kalmıştı, 1.9.0 yapıldı; `tasarim-stitch` testi bunu yakalıyordu.
- Eski dallar `claude/project-thread-62xflc` (geçiş animasyonu, içeriği main'de var), `claude/tek-cati-t2` ve `claude/surum-1.9.0` (main'e birleşti) artık gereksizdir; silme kararı Yusuf'undur, dallara dokunulmadı.
- Yarım kalan ve sıradaki işler (TAA paket ana planı §4.3): RK2 barkod nokta ızgarası için tek ortak kural, RK3 ürün ve barkod listesini ortak havuzdan okuma (H5'e bağlı), RK4 yönetici girişi merkezi kimlikten (KM1'e bağlı), RK5 yetenek avı (3 kabul, 6 düzeltmeli), RK6 özgün tema, yükleme ekranı, tanıtım ve taa-kur paketi (A0 ve KU2'ye bağlı).
- Kapatma anahtarı: Fiyat Etiketi kuyruğu entegrasyonu `etiket-kuyrugu` alanı yoksa kendiliğinden gizlenir; ayrıca program TAA'dan bağımsız tek başına çalışır.
