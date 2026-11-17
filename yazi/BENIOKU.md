# woff2 alt kümeli yazı tipleri (TAARKOD 1.7.0 hazırlığı)

- **Ne:** Newsreader ve Space Mono yazı tiplerinin Latin + Latin Extended-A alt kümeli WOFF2 dosyaları. Yalnız hazır dosyalardır; henüz hiçbir siteye/uygulamaya bağlanmadı.
- **Sahip:** Yusuf. Üreten: Claude (Haiku 5.5), 2026-10-26.
- **Kaynak:** `D:\Programlar\Fontlar\Newsreader\` (değişken TTF, Newsreader[opsz,wght] ve Newsreader-Italic[opsz,wght]) ve `D:\Programlar\Fontlar\SpaceMono\` (Regular, Bold).
- **Lisans:** SIL Open Font License 1.1. Lisans metinleri: `Newsreader-OFL.txt`, `SpaceMono-OFL.txt`.
- **Üretim:** Değişken Newsreader yazı tipi `fontTools.varLib.instancer` ile wght=400 / wght=600 ve opsz=16 sabit değerlerine örneklendi. Ardından `fontTools.subset` ile `--layout-features=*`, `--no-hinting`, `--flavor=woff2`.
- **Alt küme:** U+0020-007E, U+00A0-00FF, U+0100-017F (ğ Ğ ı İ ş Ş ç Ç ö Ö ü Ü dahil), U+2010-2027, U+20AC (€), U+20BA (₺), U+2190-2193, U+00D7 (×), U+2713 (✓).

## Dosyalar

| Dosya | Yazı tipi | Ağırlık | Boyut (bayt) |
|---|---|---|---|
| newsreader-400.woff2 | Newsreader Roman | 400 | 28 704 |
| newsreader-600.woff2 | Newsreader Roman | 600 | 30 724 |
| newsreader-italic-400.woff2 | Newsreader Italic | 400 | 31 444 |
| spacemono-400.woff2 | Space Mono Regular | 400 | 12 304 |
| spacemono-700.woff2 | Space Mono Bold | 700 | 12 428 |

Toplam: 115 604 bayt (yaklaşık 112.9 KB).

## Bilinen sınır

- Space Mono dosyalarında ₺ (U+20BA) glifi yok. Kaynak yazı tipinde bulunmuyor; Türkçe fiyat/tutar için ₺ gerekiyorsa yedek yazı tipi veya CSS fallback gerekir.
- Newsreader örnekleri, kaynak dosyanın iç adını (`Newsreader 16pt`) taşıyor.

## Kullanım kuralı

- Gömme kararı (CSP font-src, sunucu/CDN üzerinden servis) Yusuf'ta. Şimdilik yalnız hazır dosyalar; bu klasörden hiçbir sayfa otomatik yüklenmez.
- Bu dosyaları yalnız Yusuf'un izniyle değiştir veya yeniden üret. Silme yalnız Yusuf'un kararıdır ve yalnız Geri Dönüşüm Kutusu'na taşıyarak yapılır.

## Tasarım dilleri yazı tipleri (TaaRkod 2.0 tasarım işi, 2026-11-17)

- **Ne:** Mühür (Manrope + DM Mono), Mekik (Instrument Sans + Inter + JetBrains Mono) ve İstif (IBM Plex Sans + IBM Plex Sans Condensed + IBM Plex Mono) tasarımlarının yazı tipleri. `node build.js` bunları data: URI olarak gömer (font-src yalnız data:).
- **Kaynak:** Google Fonts (fonts.googleapis.com/css2, woff2), `latin` ve `latin-ext` alt kümeleri. Üreten: Claude, 2026-11-17.
- **Lisans:** SIL Open Font License 1.1. Lisans metinleri: `Manrope-OFL.txt`, `DMMono-OFL.txt`, `InstrumentSans-OFL.txt`, `Inter-OFL.txt`, `JetBrainsMono-OFL.txt`, `IBMPlex-OFL.txt` (Plex ailesinin üçü aynı metni taşır).
- **Üretim:** `fontTools.subset` (`layout_features=*`, hinting yok, woff2). `latin` dosyası U+0020-007E, U+00A0-00FF, U+0131 (ı), U+0152-0153 ve noktalama/simge aralığını; `latinext` dosyası yalnız Latin Extended-A'yı (U+0100-017F: ğ Ğ İ ş Ş) taşır. Değişken yazı tiplerinde `fontTools.varLib.instancer` ile wght ekseni kullanılan aralığa daraltıldı: Manrope 400-800, Instrument Sans 400-700, Inter 400-600, JetBrains Mono 400-600, IBM Plex Sans 400-700. DM Mono (400, 500), IBM Plex Sans Condensed (600) ve IBM Plex Mono (400, 600) sabit ağırlıklıdır.
- **Kullanılmayan:** Manrope 800 dosyada var (değişken eksen) ama arayüz kullanmaz.

| Dosya | Boyut (bayt) |
|---|---|
| dmmono-400-latin.woff2 | 7820 |
| dmmono-400-latinext.woff2 | 3916 |
| dmmono-500-latin.woff2 | 7920 |
| dmmono-500-latinext.woff2 | 3892 |
| ibmplexmono-400-latin.woff2 | 8740 |
| ibmplexmono-400-latinext.woff2 | 4684 |
| ibmplexmono-600-latin.woff2 | 8764 |
| ibmplexmono-600-latinext.woff2 | 4800 |
| ibmplexsans-latin.woff2 | 28416 |
| ibmplexsans-latinext.woff2 | 10852 |
| ibmplexsanscondensed-600-latin.woff2 | 13232 |
| ibmplexsanscondensed-600-latinext.woff2 | 6032 |
| instrumentsans-latin.woff2 | 28380 |
| instrumentsans-latinext.woff2 | 9024 |
| inter-latin.woff2 | 28128 |
| inter-latinext.woff2 | 10100 |
| jetbrainsmono-latin.woff2 | 28040 |
| jetbrainsmono-latinext.woff2 | 6896 |
| manrope-latin.woff2 | 23168 |
| manrope-latinext.woff2 | 10636 |

Toplam: 253440 bayt.
