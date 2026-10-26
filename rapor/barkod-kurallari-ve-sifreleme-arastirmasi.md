# Barkod Kuralları ve Şifreleme Yöntemleri Araştırması

Hazırlayan: araştırma ajanı (implementer) | Tarih: 2026-10-15 | Okuyucu: Yusuf (iş sahibi)

> **Nasıl okunur:** Her başlığın altında 2-3 cümlelik özet var. Matematiksel formül yok; arkasındaki fikir günlük dille anlatıldı. "Puan" ve "tavsiye" ifadeleri raporu hazırlayanın değerlendirmesidir, standart değildir. Doğrulanamayan iddialar ayrıca işaretlendi (bkz. Bölüm 7).

---

## 1. Kısa özet ve Yusuf'un vermesi gereken kararlar

**Özet:** Barkod "TO" + şifreli rakamlar + Luhn kontrol rakamı olarak kuruluyor ve Code 128 bu iş için en doğru seçim. Şifreleme yöntemleri arasında "sıra numarasını gizlemek" ile "gerçek güvenlik" ayrı şeyler. Mevcut yöntem ikincisini sağlamıyor (aşağıda bir deneyle gösterildi).

### Önemli bulgular
- **Code 128 uygun:** Harf (TO) yazabilir, rakamları çift çift sıkıştırır, her yerde okunur.
- **En kısa barkod için "TO" sonrası rakam sayısı (Luhn rakamı dahil) çift olmalı.** Tek sayıda rakam, barkoda fazladan işaret ekletir.
- **Luhn bir hata denetimidir, güvenlik değil.** Yazım/okuma hatasını yakalar; kimsenin barkodu taklit etmesini engellemez.
- **Mevcut "harf karıştırma" yöntemi zayıf.** Bu raporun hazırlanışında yapılan kısa deneyde, ardışık sıra numaralarının şifreli çıktıları arasındaki "fark" hep aynı çıktı (Bölüm 4a). Yani bir barkodu bilen, komşularını tahmin edebilir. Sadece meraklı gözü yanıltır.
- **Anahtar kelime kaybolursa** barkodlar geri çözülemez. Saklama ve yedekleme planı şart.

### Yusuf'un karar listesi
1. **Kullanım amacı:** Sadece meraklı gözü yanıltmak mı, rakip tahminini zorlaştırmak mı, sahtecilik önlemek mi? (Bölüm 4 rehberi buna göre yöntem seçer.)
2. **Kaç barkod üretilecek** (ilk yıl, 5 yıl)? Bu uzunluğu belirler.
3. **Toplam rakam sayısı:** Öneri 14 rakam (Luhn dahil) ya da 12. Şu anki uygulama varsayılanı 20 rakam. (Bölüm 2.3)
4. **Okuyucu ortamı:** Eski/ucuz el tarayıcıları mı var, telefon kamerası mı? (Code 128 için fark etmez; 2D kodlar için telefon avantajdır.)
5. **Etiket genişliği:** Barkoda ayrılan yatay alan kaç mm?
6. **Yöntem seçimi:** Feistel (öneri), tablo tabanlı ya da rastgele+veritabanı.
7. **Rakam mı, harf+rakam mı çıkış?** (Seçenek f)
8. **Anahtar kelime politikası:** Kim bilecek, nerede saklanacak, kaç harf, her seri için ayrı mı?
9. **Veritabanı/tablo tutulacak mı?** (Çakışma denetimi ve sahtecilik önleme için gerekir.)
10. **Kural değişikliği:** Kurallar değişirse eski barkodlar okunmaya devam etmeli mi? (Versiyonlama, Bölüm 6)

---

## 2. Barkod kuralları araştırması

**Özet:** Barkod türleri iki aileye ayrılır: çizgili (1B) ve karemsi (2B). "TO" harfli bir önek istediğimiz için sadece rakam destekleyen türler (Interleaved 2 of 5, EAN) uygun değil. Code 128 harf+rakam destekler, sıkı paketler ve tarayıcılar tarafından evrensel okunur.

### 2.1 Karşılaştırma tablosu

Aşağıdaki özellikler standartlara ve yaygın bilgiye dayanır (ISO/IEC 15417 Code 128, ISO/IEC 16388 Code 39, GS1 General Specifications). "Yoğunluk" göreli bir değerlendirmedir.

| Tür | Harf (TO) yazılır mı? | Yoğunluk | Tarayıcı uyumu | Ne zaman seçilir |
|---|---|---|---|---|
| **Code 128** | Evet (büyük/küçük harf, rakam, işaretler) | Çok iyi; rakamlarda çok yüksek | Neredeyse her çizgisel tarayıcı | **Genel amaçlı, bu proje için ilk tercih** |
| Code 39 | Evet, ama yalnızca büyük harf, rakam ve birkaç işaret | Düşük (karakter başına geniş) | Çok geniş, eski sistemlerde yaygın | Eski sistem şart koşuyorsa; çok yer kaplar |
| Code 93 | Evet (büyük harf, rakam, işaretler) | Code 39'dan sıkı, Code 128'den biraz geniş | Orta; her tarayıcıda açık olmayabilir | Dar alanda Code 39 uyumu gerekirse |
| Interleaved 2 of 5 (ITF) | **Hayır, sadece rakam** | Rakam için iyi | Geniş (koli/lojistik) | Sadece rakam olacaksa; TO ön eki olamaz |
| Codabar | Kısıtlı: rakam + birkaç işaret + A-D başlangıç/bitiş harfleri; **"TO" yazılamaz** | Orta | Eski kütüphane/kan bankası/kargo | Eski sistem uyumluluğu |
| GS1-128 (EAN-128) | Evet, ama **yapısı sabit**: "uygulama tanımlayıcısı" denen sayısal kodlarla başlar; serbest "TO" ön eki GS1 kurallarına uymaz | Code 128 ile aynı | GS1 tedarik zincirinde evrensel | Ürün/koli dış tedarik zincirine girecekse; kendi içi takip için gereksiz |
| Data Matrix | Evet (ASCII) | Çok yüksek, çok küçük etiket | Kamera/görüntü tabanlı okuyucu gerekir | Çok küçük yüzey (elektronik, ilaç) |
| QR Kod | Evet | Yüksek; bu kısa içerik için bile kare bir alan | Telefon kamerası ile en kolay | Müşteri/telefon ile okunacaksa, hasarlı etikette |

**Notlar:**
- "Code 128'e uygun olmalı" şartı, diğer türlerden seçenek de isteniyor. Önerilen sıra: Code 128 (ana), QR/Data Matrix (telefon ya da küçük alan), Code 39 (eski sistem).
- GS1-128 konusunda dikkat: Code 128 ile aynı çizgi yapısını kullanır ama içerik düzeni kurallı olduğu için "TO..." ile başlayan serbest bir metin GS1 sistemlerinde yanlış yorumlanabilir. GS1 dışı, şirket içi kullanımda sade Code 128 kullanın.

### 2.2 Code 128 ve "TO + çift sayıda rakam" neden en kısa?

**Özet:** Code 128'in üç "alt dili" var. Rakamlar için olan dil iki rakamı tek işarete sığdırır; harf için olan dil her harfe bir işaret harcar. "TO" harf olduğundan harf diliyle başlanır, sonra rakam diline geçilir.

- **Alt kümeler:** A (büyük harf + kontrol karakterleri), B (büyük/küçük harf + rakam + işaret), C (yalnızca rakam çiftleri).
- **Rakam çifti sıkıştırması:** C alt kümesinde "47" gibi iki rakam **tek bir işarete** sığar. B'de ise her rakam ayrı işarettir. Yani rakamlar C'de yarı yer tutar.
- **Başlangıç:** "TO" harf olduğu için B ile başlanır (T, O = 2 işaret), sonra "C'ye geç" işareti (1 işaret), sonra rakamlar çift çift.
- **Tek sayıda rakam olursa:** Bir rakam B'de ayrı kalır, ayrı bir geçiş işareti gerekebilir; barkod bir miktar uzar.
- **Her işaret 11 birim (modül) genişliğinde**, bitiş işareti 13 modül. Başlangıç + veri işaretleri + 1 kontrol işareti + bitiş. (Bu sayılar yaygın kaynaklarda bilinen değerlerdir; ağ kısıtı nedeniyle bu oturumda çevrimiçi doğrulanamadı, ama aşağıdaki hesaplar bunlara dayanır.)

**Hesaplanmış örnekler** (genişlik = modül sayısı; sessiz bölge hariç):

| "TO" sonrası rakam | Yöntem | İşaret sayısı (kontrol dahil) | Yaklaşık genişlik |
|---|---|---|---|
| 12 (çift) | B başla, C'ye geç | 11 + bitiş (toplam 12 sembol) | 134 modül |
| 13 (tek) | B başla, 1 rakam B'de, C'ye geç | 12 + bitiş (sonda gerekirse artı) | 145 modül |
| 14 (çift) | B başla, C'ye geç | 12 + bitiş | 145 modül |
| 20 (çift) | B başla, C'ye geç | 15 + bitiş | 178 modül |

**Yorum:** 12 rakam 134, 13 rakam 145 modül; yani **12 yerine 13 yazmak 11 modül daha uzun, 14 yazmak ile aynı**. Tek sayıda rakam hiç kazandırmaz; çift tercih edilmeli. Şu anki 20 rakam (+2 harf = 22 karakter) 178 modül.

Fiziksel genişlik: modül genişliği 0,25 mm ise 134 modül = 33,5 mm, 178 modül = 44,5 mm. Her iki yana en az 10 modül boşluk (sessiz bölge) eklenir (yaklaşık; pratik öneri Bölüm 6'da).

### 2.3 En uygun uzunluk nasıl bulunur?

**Özet:** Üç soru sorulur: kaç numara lazım, tahmin edilmesi ne kadar zor olsun, etikete ne kadar yer var. Cevaplar çakışınca "çift sayıda toplam rakam" seçilir.

1. **Kaç numara gerekecek?** 1 milyon numara sayı olarak 6-7 rakama sığar; asıl soru tahmin korumasıdır (aşağıdaki madde). Ancak şifrelenen alanın büyük olması tahmin direncini artırır.
2. **Tahmin edilme riski:** Kullanılan numaralar toplam alanın ne kadarını dolduruyor? 1 milyon numara 11 haneli şifreli alanda (12 rakam, sonu Luhn) ise alanın yüz binde biri dolu: rastgele deneyen biri geçerli bir numara bulma şansı yaklaşık **yüz binde bir**. 7 haneli alanda (8 rakam) yaklaşık %10. (Bu oran sadece bir **ek koruma**; şifreleme/veritabanı ile birlikte düşünülmeli.)
3. **Etiket genişliği:** Yukarıdaki tabloya bakın; 0,25-0,33 mm modülle 14 rakam yaklaşık 36-48 mm.

**Reçete:**
- Küçük iş (10 bin numaraya kadar), içeri kullanım: **10-12 rakam** (Luhn dahil, çift).
- Orta iş (1 milyon numara), rakip tahmini önemli: **12-14 rakam** (Luhn dahil, çift). Örnek: 1 milyon için 12 rakam (örn. 11 yük + 1 Luhn) iş görür, 14 daha rahat.
- Sahtecilik önleme: rakam sayısından çok **imza/veritabanı** önemli (Bölüm 4d-e).
- Mevcut 20 rakam varsayılanı fazla uzun; sadece çok büyük alan/ek veri gerekirse anlamlı.

**Doğrulama notu:** Bu bölümdeki olasılıklar basit bölmedir (kullanılan / toplam); kodla doğrulanabilir sayılardır.

---

## 3. Luhn kontrol rakamı

**Özet:** Luhn, barkodun sonuna eklenen tek bir rakamdır. Kasada yanlış okunan ya da elle yanlış yazılan rakamı yakalamak içindir. Şifreleme ya da sahtecilik koruması değildir; bilen herkes geçerli bir Luhn rakamı üretebilir.

### 3.1 Fikir (formülsüz)
Rakamlar sağdan sola dönüşümlü olarak "iki katına çıkarılır" ve hepsi toplanır; sonuç 10'un katı olacak şekilde son bir rakam eklenir. Muhasebedeki "toplam tutuyor mu" kontrolüne benzer. Kredi kartı numaraları da bu yöntemi kullanır (ISO/IEC 7812).

### 3.2 Neyi yakalar
- **Tek bir rakamın yanlış okunması / yazılması:** Hepsini yakalar (bu oturumda 2,16 milyon sınama yapıldı, hiçbiri geçmedi).
- **Yan yana iki rakamın yer değiştirmesi:** Çoğunu yakalar (aşağıdaki istisna hariç).

### 3.3 Neyi yakalamaz
- **09 ↔ 90 yer değişimi:** Bu oturumdaki sınamada, yan yana yer değiştirmeler içinde geçenlerin **tamamı 09/90 çifti** idi (198 bin sınamada yaklaşık yüzde 2,2).
- **Rastgele bozulmuş bir numara:** Yaklaşık **onda bir** (yüzde 10) ihtimalle Luhn'u geçer (bu oturumda 20 bin rastgele denemede %10,1 ölçüldü). Yani "kontrol rakamı tuttu" demek "numara doğru" demek değildir.
- **Birden fazla hatayı** garanti yakalamaz.
- **Kasıtlı üretilen sahte barkodu** hiç yakalamaz.

### 3.4 Önek harfleri neden Luhn dışında
Luhn yalnızca rakamlar için tanımlıdır. "TO" ön eki sabit olduğundan hesaba katmaya gerek yok; uygulama "TO" ile başlamayanı zaten reddeder. Luhn yalnızca **şifreli rakam bölümünün** üstüne hesaplanır.

### 3.5 Code 128'in kendi sağlaması ile ilişkisi
Code 128'in barkod içinde kendine ait bir kontrol işareti vardır; tarayıcı çizgi okumada hata yaptıysa bunu yakalar ve okumayı reddeder. Bu, **baskı/okuma** hatalarını koruyan ayrı bir katmandır. Luhn ise **veri** düzeyinde (insan elle yazarken, başka sistemden aktarırken) koruma sağlar. İkisi birbirinin yerine geçmez; ikisi birlikte "iki kat emniyet" olur.

---

## 4. Şifreleme yöntemleri seçenekleri

**Özet:** Burada "şifreleme" iki farklı amaç için kullanılıyor: (1) ardışık sıra numaralarını rastgele göstermek, (2) sahtecilik önlemek. Birincisi için hafif yöntemler yeter, ikincisi için ya güçlü kriptografi ya da veritabanı gerekir.

> **Dürüst uyarı:** Bu yöntemlerin hiçbiri Luhn gibi hata denetimi yapmaz. Hata denetimini ayrıca Luhn yapar. **Sıra gizleme** (kimse 1 numaranın hangisi olduğunu görmesin) ile **şifreleme güvenliği** (kimse anahtarı bilmeden barkod üretemesin / çözemesin) farklı hedeflerdir. Aşağıdaki puanlar bu raporu hazırlayanın değerlendirmesidir (1 = zayıf, 5 = güçlü), standart değildir.

### 4a. Harf sırası karıştırma (mevcut yöntem)

**Nasıl çalışır (düz dille):** Anahtar kelimedeki harfler Türk alfabesindeki sırasına çevrilir ("a" ilk, "z" son). Bu sıralamaya göre rakamların yeri değiştirilir, her rakam biraz kaydırılır, sonra rakamlar birbirine karıştırılır (iki tur, sağa sonra sola).

**Arkasındaki matematik (formülsüz):** Rakamlar saat kadranı gibi 0-9 arasında "döner" (9'dan sonra 0). Her adım "al, karıştır, kadranda ilerlet" biçimindedir. Bu tür adımların hepsi **doğrusal** (düz çizgi gibi öngörülebilir): bir girdiyi 1 artırınca çıktı hep aynı "adım"la değişir.

**Önemli bulgu (bu oturumda denendi):** Ardışık numaralar arasında şifreli çıktının farkı **her seferinde aynı** çıktı (örnek: 100→101, 101→102, 102→103, 200→201 hepsinde aynı fark deseni; elde olan yüklerde sınanmadı). Yani bir barkodu ve "bir sonraki" barkodu bilen biri, diğer tüm komşuları üretebilir (basamak taşması olmayan aralıkta). Bu, "sadece meraklı gözü" için yeterli ama rakip için değil.

- **Artı:** Çok hızlı, tablo gerektirmez, her yerde çalışır, çözülebilir, anahtar kelime çok basit.
- **Eksi:** Doğrusal olduğu için birkaç bilinen örnekle kırılabilir; kısa anahtar kelime zayıf; kriptografik güvenlik yok.
- **Kimler için uygun:** Sadece "1 nolu barkod 1 gibi görünmesin" diyenler; düşük riskli iç kullanım.
- **Tahmin direnci:** 1/5. **Ardışıklık gizleme:** 3/5 (göze rastgele görünür, ama desen vardır).

### 4b. Doğrusal eşleme (a*n+b benzeri)

**Nasıl çalışır:** Sıra numarası bir sayıyla çarpılır, bir sayı eklenir, sonuç belli bir büyüklüğe sığacak şekilde "döndürülür" (saat gibi). Anahtar kelime bu sayıları belirler.

**Arkasındaki matematik (formülsüz):** Her yeni numara bir öncekinden hep **aynı mesafe** uzaktadır; sadece "zıplama adımı" büyüktür. Bu, bir merdivende her basamağın aynı yükseklikte olması gibidir: basamak yüksekliğini bir kez gören, tüm merdiveni bilir. Çözmek için çarpanın "tersi" gerekir, bu yüzden çarpan alanla uyumlu seçilmelidir.

- **Artı:** En hızlı, basit, tablo yok, kolay açıklanır.
- **Eksi:** İki barkod bilen herkes iki sayıyı da bulur (çözülebilir). Çok zayıf.
- **Kimler için uygun:** Demo/deneme; çok düşük riskli, kısa ömürlü numaralama.
- **Tahmin direnci:** 1/5. **Ardışıklık gizleme:** 2/5 (adım sabit olduğundan örüntü fark edilir).

### 4c. Feistel ağı (biçim koruyan şifreleme)

**Nasıl çalışır:** Rakam dizisi iki yarıya bölünür. Birkaç tur boyunca bir yarı, anahtara bağlı bir "karıştırıcı" fonksiyondan geçirilip diğer yarıyla birleştirilir, sonra yarılar yer değiştirir. Turlar sonunda rakam dizisi, aynı uzunlukta başka bir rakam dizisine dönüşür. Uygulamada karıştırıcı olarak SHA-256 (yaygın bir "parmak izi" fonksiyonu) kullanılıyor.

**Arkasındaki matematik (formülsüz):** Hamur yoğurmaya benzer: bir yarıyı yoğurup diğerine katarsınız, sonra tersini yaparsınız; birkaç tur sonra tek bir rakamı değiştirmek **bütün çıktıyı** değiştirir. İlginç nokta: karıştırıcı fonksiyonun geri döndürülebilir olması gerekmez; yapı (iki yarı değişimi) kendiliğinden geri alınabilir bir düzen kurar. Bu yapı onlarca yıldır kriptografide kullanılan sağlam bir fikirdir (DES gibi şifrelemelerin temeli).

**NIST FF1/FF3-1 ile ilişkisi:** NIST SP 800-38G, "biçim koruyan şifreleme" için iki Feistel tabanlı yöntem (FF1 ve FF3) tanımlar; amaç da tam bunu yapmaktır: 12 rakamlık girdiyi 12 rakamlık çıktıya çevirmek. FF3-1 bu standardın FF3 yöntemindeki bir zayıflık sonrası gelen revizyonudur. **Burada uygulanan, bu standartların kendisi değildir**; aynı aileden (Feistel + anahtarlı karıştırıcı) bir benzerdir. Standartlaşmış, sınanmış çözüm istenirse FF1 uygulayan olgun bir kütüphane tercih edilmelidir. (FF3'ün zayıflık ayrıntısı bu oturumda çevrimiçi doğrulanamadı; bilgi hafızadandır.)

- **Artı:** Format korunur (rakam girer, rakam çıkar); ardışık numaralar rastgele görünür; tablo yok; geri çözülebilir; en güçlü hafif seçenek.
- **Eksi:** Kısa alanda (az rakam) tüm kombinasyonlar denenebilir; anahtar kelime kısa ya da tahmin edilebilirse hepsi boşa gider; kendi yazdığınız şifreleme riskidir (hata, yan etki); kriptografik inceleme görmemiştir.
- **Kimler için uygun:** Rakip tahminini zorlaştırmak isteyenler.
- **Tahmin direnci:** 4/5 (anahtar kelime iyiyse). **Ardışıklık gizleme:** 5/5.

### 4d. HMAC/AES tabanlı eşleme ve önceden karıştırılmış arama tablosu

**Nasıl çalışır:** Seri bir kez baştan sona üretilir. Her sıra numarası için anahtar kelimeden türetilen bir "karıştırma değeri" hesaplanır ve değerlere göre sıralanır; sonuçta "1 numara → 482913" gibi bir liste (tablo) çıkar. Tablo veritabanında/dosyada saklanır. Barkod okununca tabloda aranır.

**Arkasındaki matematik (formülsüz):** HMAC ve AES, "anahtarla çalışan öğütücü/kilit" gibidir: aynı girdi ve anahtar hep aynı çıktıyı verir, ama anahtarı bilmeden çıktıyı tahmin etmek pratikte imkânsızdır. Hepsini sıralayıp tek tek numara verince, sırayı tahmin etmek için "kapalı bir kutu" kalır. Kâğıt destesini iyice karıştırıp sırayla sayfa numarası vermeye benzer: deste kimsede yoksa sıra bilinemez.

- **Artı:** Hesaplanamaz bir deste gibi; çok güçlü. Çakışma garanti dışı kalır (her numara tektir).
- **Eksi:** Tabloyu saklamak, yedeklemek, güncellemek gerekir; tablo kaybolursa çözümleme gider (anahtar kelimeden yeniden üretilebilir). Büyük seride bellek/depolama.
- **Kimler için uygun:** Orta-büyük seriler, değişmeyen toplam sayı.
- **Tahmin direnci:** 4-5/5. **Ardışıklık gizleme:** 5/5.

### 4e. Rastgele sıra + veritabanı eşlemesi (şifresiz)

**Nasıl çalışır:** Şifreleme yok. Her barkoda rastgele bir numara verilir ve "barkod ↔ gerçek sıra" eşleşmesi veritabanında tutulur. Okuyunca veritabanına bakılır.

**Arkasındaki matematik (formülsüz):** Burada çözülecek bir bilmece yoktur, o yüzden kırılacak bir şey de yok. Kâğıt dışında hiçbir iz bırakmayan rastgele numara, ancak defteri çalarsanız çözülür. Güvenlik, defterin korunmasına bağlıdır.

- **Artı:** En güvenli (matematiksel çözüm yok); anahtar kelime kaybolsa da sorun olmaz; sahtecilik önleme için "geçerli listede var mı" sorgusu yapılabilir.
- **Eksi:** Veritabanı şart; çevrimdışı çalışmaz; veritabanı kaybı = bütün eşleşmeler kayıp; anahtar kelime fikri bu yöntemle uyuşmaz.
- **Kimler için uygun:** Sahtecilik önlemenin gerçekten önemli olduğu işler.
- **Tahmin direnci:** 5/5 (alan büyükse). **Ardışıklık gizleme:** 5/5.

### 4f. Base32 / harf karışık (alfanümerik) çıkış

**Nasıl çalışır:** Yukarıdaki yöntemlerden birinin çıktısı, sadece rakam yerine rakam + harf içeren bir yazıma çevrilir (ör. 0-9 ve A-Z'nin büyük kısmı). Anlaşılması zor harfler (0/O, 1/I) çıkarılır.

**Arkasındaki matematik (formülsüz):** Aynı bilgiyi daha az karakterle yazmak: 10 farklı işaretle "yüz" yazmak için 3 işaret gerekirken 32 işaretle 2 işaret yeter. Bilgi aynı kalır, yazım kısalır.

- **Artı:** Aynı uzunlukta çok daha geniş alan (tahmin direnci artar) ya da aynı alan için daha kısa barkod.
- **Eksi:** **Code 128'in rakam sıkıştırması kaybolur** (harf karakterleri çift olarak sıkışmaz), yani karakter başına daha fazla yer; **Luhn rakam içindir**, harf karışırsa Luhn'un harfli bir türüne (ör. mod 32) geçmek gerekir; insanın elle yazması (O/0 karışıklığı) zorlaşır.
- **Kimler için uygun:** Barkodun hem makine hem insan tarafından yazılacağı, uzunluğun kısa olması gereken işler.
- **Tahmin direnci:** Alanı büyütür (+). Ardışıklık gizlemesi seçilen yönteme bağlı.

### 4.1 Özet tablo

| Yöntem | Tahmin direnci | Ardışıklık gizleme | Tablo/veritabanı | Karmaşıklık |
|---|---|---|---|---|
| a) Harf karıştırma (mevcut) | 1/5 | 3/5 | Yok | Düşük |
| b) Doğrusal | 1/5 | 2/5 | Yok | Çok düşük |
| c) Feistel | 4/5 | 5/5 | Yok | Orta |
| d) HMAC/AES + tablo | 4-5/5 | 5/5 | Var (tablo) | Orta-yüksek |
| e) Rastgele + veritabanı | 5/5 | 5/5 | Şart | Yüksek |
| f) Alfanümerik çıkış | Alanı büyütür | Yönteme bağlı | Yok | Orta |

### 4.2 Yöntem seçme rehberi

- **"Sadece meraklı gözü yanıltmak istiyorum"** → a) Harf karıştırma ya da b) doğrusal yeter. Daha rahat için c) Feistel.
- **"Rakiplerin sıra tahminini zorlaştırmak"** → **c) Feistel** (uzun anahtar kelime, 12+ rakam). Daha emin olmak için d).
- **"Sahtecilik önleme"** → **e) Rastgele + veritabanı** (ya da d). Feistel tek başına sahtecilik önlemez: anahtarı bulan herkes geçerli barkod üretir. Sahtecilikte asıl koruma "bu barkod listede var mı?" sorgusudur.

---

## 5. Anahtar kelime yönetimi

**Özet:** Bütün sistemin güvenliği tek bir kelimeye dayanır. Kısa/kolay kelime en büyük zayıflık, kaybolan kelime en büyük kayıp. Kelimeyi parola gibi ele alın.

- **Kısa kelime zayıftır:** 4-5 harfli bir kelimenin denenmesi bilgisayar için dakikalar sürer. Sözlükteki kelimeler daha da kolay tahmin edilir.
- **Uzunluk önerisi (değerlendirme):** En az 12 harf, mümkünse birden çok sözcüklü, sözlükte olmayan bir ifade. Uygulama şu an en az 2 harf kabul ediyor ve boşlukları siliyor, sadece Türk alfabesi harflerine izin veriyor; bu bir **kısıt**, önerilen uzunluk uygulamada zorunlu değil.
- **Kaybolursa:** Barkodlar çözülemez. Yöntem 4e dışında kurtarma yolu yoktur. Kelimeyi güvenli yerde yedekleyin (kasa, parola yöneticisi, iki yetkili kişi).
- **Nerede saklanmamalı:** Kodun içinde, yazılım deposunda, e-posta/sohbette, etiket ya da barkodun yanında, ortak ekranlarda, düz metin Excel'de. Uygulama anahtarı koda gömmüyor, her çağrıda dışarıdan alıyor (core.js başlığındaki not); bu doğru yaklaşım.
- **Farklı seriler için farklı kelime:** Bir kelime sızarsa yalnızca o seri etkilenir. Her seriye ayrı kelime ve numara.
- **Seri numarası / baskı tarihi:** Her seriyi kayıt altına alın: seri adı, kullanılan yöntem + sürüm, uzunluk, ilk/son numara, baskı tarihi, kelimenin hangi kasada olduğu (kelimenin kendisini değil). Böylece "bu barkod hangi kuralla üretildi" sorusu yanıtlanır.
- **Kelime Türkçe karakter notu:** Uygulama Türkçe kurallı küçültme (I→ı, İ→i) yapar; farklı klavye/yazılımlar aynı kelimeyi farklı yorumlayabilir. Kelimeyi hep aynı yazımla girin.

---

## 6. "Olması gerekenler" listesi

**Özet:** Barkod üretmek işin yarısıdır. Asıl iş; çakışma olmaması, geri çözmenin doğrulanması, baskı kalitesi ve kayıt tutmadır.

- **Seri tanımlama:** Her seriye ad, başlangıç/bitiş, uzunluk, yöntem, anahtar kimliği.
- **Çakışma denetimi:** Aynı barkodun iki kez üretilmediğini üretim sonunda kontrol edin. Birebir eşleme yapan yöntemlerde çakışma olmaz; bu sistem tarafından **otomatik doğrulanmalı**.
- **Geri çözme doğrulaması:** Üretilen her barkodu geri çözüp aslına eşit olduğunu doğrulayın (toplu üretimde de).
- **CSV / etiket yazdırma:** Barkod listesini CSV olarak, sıra no ve barkod yan yana dışarı aktarın; etiket yazıcısı için PDF/görüntü.
- **Sessiz bölge ve baskı kalitesi:**
  - Barkodun her iki yanında boşluk bırakın (Code 128 için yaygın öneri en az 10 modül; kesin değer için ISO/IEC 15417 ve yazıcı kılavuzu).
  - Modül (en ince çizgi) genişliği: genelde **0,25-0,33 mm**; çok küçük çizgi okunmaz. (Bu aralık görev tanımında verilen değerdir; yazıcı ve tarayıcıya göre test edilmeli.)
  - Yüksek kontrast (beyaz zemin, siyah çizgi), mat yüzey, bulanık baskı yok.
- **Test okuma:** Gerçek tarayıcıyla, gerçek etiket üzerinde denenmiş örnekler. Uygulama zaten her grup için 4 örnek görüntü üretiyor.
- **Arşivleme:** Üretilen seri, parametreler ve örnek görüntüler tarih damgalı saklanır.
- **Kuralların versiyonlanması:** Yöntem değişirse (örn. harf karıştırma → Feistel), eski barkodlar çözülebilsin diye her barkoda ya da seriye "kural sürümü" atayın.
- **Denetim kaydı:** Kim, ne zaman, hangi seriyi, hangi kurallarla üretti, kim kural değiştirdi. (Anahtar kelime kayda yazılmaz.)
- **Geri alınabilirlik:** Yanlış seri üretilirse "iptal" durumu; iptal edilen numaralar yeniden verilmesin.
- **Anahtar kelime yedeği ve yetkilendirme** (Bölüm 5).
- **Kural değişim butonları:** Görev tanımındaki "kuralları değiştirme ve yeni seri üretme" butonları; değişim sonrası eski seriler **bozulmadan** kalmalı.

---

## 7. Doğrulama durumu ve kaynaklar

**Özet:** Bu oturumda ağ erişimi (vikipedi dahil) proxy tarafından engellendi; standart sayfaları doğrulanamadı. Luhn ile ilgili sayılar ve yöntem 4a'daki desen **kodla bu projenin kendi kaynak koduyla ölçüldü**.

### Doğrulanan (bu oturumda, kodla)
- Luhn tek rakam hatalarını yakalar: 2.160.000 denemede 0 geçen.
- Yan yana yer değiştirmelerde yakalanamayanlar yalnızca 09↔90 (198.033 yer değiştirmede 4.289 geçti, hepsi 09/90).
- Rastgele rakam dizisinin Luhn'u geçme oranı: yaklaşık %10,1 (20.000 denemede).
- Mevcut `sifrele` işlevinde ardışık numaralar arasındaki çıktı farkı sabit (6 örnekte, hane sayısı 11, örnek anahtar sözcük).
- Code 128 genişlik hesapları: bilinen yapı değerlerinden (işaret = 11 modül, bitiş = 13 modül) elle hesaplandı.

### Doğrulanamadı (ağ yok / hafızadan)
- Code 128 işaret ve bitiş genişliklerinin (11 ve 13 modül) resmi standarttan teyidi.
- Code 128'de "TO"+çift rakamın her durumda en kısa olduğu (alt küme geçiş kuralları; bazı kodlayıcılar farklı davranabilir).
- Code 39/93/Codabar/ITF/QR/Data Matrix için karşılaştırma tablosundaki yoğunluk ve uyum ifadeleri (genel bilgi, tek tek teyit edilmedi).
- GS1-128'in serbest "TO" öneki ile uyumsuzluğu (GS1 General Specifications'a dayanan genel bilgi; madde madde teyit edilmedi).
- Sessiz bölgenin "en az 10 modül" önerisi (standart değeri teyit edilmedi).
- NIST SP 800-38G içeriği ve FF3'ün zayıflık/FF3-1 revizyonu hakkındaki cümleler (hafızadan).
- 4. bölümdeki tüm "puanlar" ve "tavsiyeler" bu raporu hazırlayanın değerlendirmesidir, ölçüm değildir.
- Feistel yöntemi (c) kod olarak okunmadı: core.js içinde yalnızca harf karıştırma bulundu; Feistel ve doğrusal yöntemlerin ayrıntıları göreve verilen tarife dayanır, ayrıca "TO" önekinin eklendiği katman core.js içinde değil (barkodUret 20 hane, önek yok).

### Standartlar (adı geçen, metinleri okunmadı)
ISO/IEC 15417 (Code 128), ISO/IEC 16388 (Code 39), GS1 General Specifications, NIST SP 800-38G, ISO/IEC 7812 (Luhn).
