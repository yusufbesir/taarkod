# TAARKOD tanıtım notu
Bu dosya: TAARKOD'un nasıl anlatılacağı ve logonun nasıl kullanılacağı. Kaynak: Microsoft uygulama simgesi yönergeleri (sade, tek fikirli, küçük boyutta okunur simge) ve genel ücretsiz tanıtım kontrol listeleri. Web araması sınırlı sonuç verdi; aşağıdakiler bu yüzden pratik ve temkinli öneridir, kanıtlanmış sonuç değildir.

## Tek cümle
"TAARKOD: anahtar kelimenle sıra numaralarından tahmin edilemeyen, geri çözülebilen barkod numaraları üretir. İnternet gerekmez."

## Kime
Depo, stok, etiket basan küçük işletmeler; seri numarasının sırasını dışarıdan okunmasın isteyenler.

## Ne söylenmeli, ne söylenmemeli
- Söyle: çevrimdışı, veri hiçbir yere gitmez, Code 128/39/93, Excel/CSV/ZPL çıktı, aynı kelimeyle geri çözülür.
- Söyleme: "kırılamaz" veya "askeri şifreleme". Bu bir karıştırma aracıdır; kelime bilinirse çözülür (Rehber'de de böyle yazıyor).

## Düşük maliyetli yollar
1. Tek sayfalık tanıtım sayfası: logo, 3 ekran görüntüsü, indirme düğmesi, SHA-256 değeri.
2. İndirme güveni: imzasız exe uyarı verir; SHA-256 ve "Windows SmartScreen'de Daha fazla bilgi > Yine de çalıştır" adımını sayfada göster.
3. Kısa ekran videosu (30 sn): kelime yaz, barkod üret, Excel'e aktar.
4. Hedef topluluklar: depo/stok forumları, e-ticaret satıcı grupları, Excel kullanıcı grupları.

## Logo kuralları
- Simge (1.5.0): koyu çam yeşili kare, krem barkod çubukları, ortada sarı anahtar deliği (şifreleme), altta sarı dikiş izi (dokuma etiket). Dosyalar: taarkod-ikon.svg, taarkod-ikon-512.png, taarkod-logo-yatay.svg.
- Renkler: koyu çam #14513D (simge zemini), çam #1E6B52, etiket sarısı #F4C430, mürekkep #17262B. Arayüzle aynı, tek marka dili.
- Etrafında simge yüksekliğinin %10'u boşluk bırak; döndürme, gerdirme, renk değiştirme yok.
- Küçük boyutta (16-32 px) sarı şerit ve kalın çubuklar okunur; Windows için 256 px kaynaktan simge üretilir.

## Henüz yapılmadı (Yusuf'un kararı gerekir)
- Alan adı, tanıtım sayfası, kod imzalama sertifikası (SmartScreen uyarısını azaltır, ücretlidir), marka/ticari marka sorgusu: TAARKOD adının başkasınca kayıtlı olup olmadığı kontrol edilmedi.
