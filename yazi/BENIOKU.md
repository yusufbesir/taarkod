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
