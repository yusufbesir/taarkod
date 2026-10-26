# 2026-10-15 Barkod sıra şifreleme uygulaması

## Özet
- Barkoddaki sıralı numaraları (1, 2, 3...) bir anahtar kelimenin harf sırasına göre karıştıran küçük bir uygulama yazıldı.
- Tek HTML dosyası, internet gerekmez, Windows'ta tarayıcıda açılır.
- Kriptografik güvenlik değildir; yalnızca sırayı gizler.

## Nasıl çalışır
- Kelimenin harfleri Türkçe alfabe sırasına dizilir; eşit harflerde soldaki önce gelir. Bu sıra bir yer değiştirme planı olur.
- Sıra numarası sabit haneye (varsayılan 6) tamamlanır; rakamlar bu plana göre kaydırılır ve yer değiştirir.
- Ardından iki tur zincirleme karıştırma yapılır; böylece ardışık numaralar birbirine benzemez.
- Her adım tersine çevrilebilir: aynı kelime ve hane sayısıyla kod çözülür. İki numara asla aynı kodu almaz.

## Kullanım
- Anahtar kelime uygulamada elle girilir; hiçbir yere kaydedilmez ve bu nota yazılmadı.
- Tek numara şifreleme/çözme ve aralık için toplu CSV listesi var.

## Dosyalar
- barkod-sifreleme.html (uygulama), src/core.js (algoritma), test/core.test.js (12 test), build.js (HTML'i yeniden üretir).
- Konum: proje dosyaları, barkod-sifreleme klasörü.

## Doğrulama
- 12 birim testi geçti: geri çözme, birebirlik, Türkçe harfler, tekrar eden harfler, sınır değerleri.
- Ayrı denetçi ajanla güvenlik incelemesi yapıldı: kritik bulgu yok.

## İz kaydı (sonradan eklendi)
- İz etiketi: [İP:Barkod sıra şifreleme uygulaması#ixQ4SM]

## Birlikte çalışılanlar
- verifier / claude-sonnet-5-5: güvenlik incelemesi
- Bilgi alınan diğer iş parçacıkları: yok
