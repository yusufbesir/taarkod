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
