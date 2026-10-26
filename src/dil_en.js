/* İngilizce sözlük (BarkodDil için). s: arayüzdeki Türkçe metin -> İngilizce (biçim: [b]kalın[/b], [k]tuş[/k], [c]kod[/c]);
 * m: T(anahtar, ...) çağrılarının İngilizce karşılıkları ({0}, {1} yer tutucuları Türkçe metinle aynı olmalı);
 * yontem / standart / bicim: çekirdek modüllerdeki Türkçe açıklamaların karşılıkları; hata: [Türkçe ileti deseni, İngilizce şablon]. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodDilEN = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    s: {
 "PARAMETRELER": "PARAMETERS",
 "SATIR": "ROW",
 "BARKOD": "BARCODE",
 "SIRA NO": "SEQ. NO.",
 "DURUM": "STATUS",
 "SERİ": "SERIES",
 "DEĞER": "VALUE",
 "HATA": "ERROR",
 "TARİH": "DATE",
 "ARALIK": "RANGE",
 "ADET": "COUNT",
 "BARKOD TÜRÜ": "BARCODE TYPE",
 "UZUNLUK": "LENGTH",
 "Barkod türleri": "Barcode types",
 "GS1-128 ve GS1 Data Matrix": "GS1-128 and GS1 Data Matrix",
 "Uygulama tanımlayıcılı (AI) veriyi parantezli yazın; veri doğrulanır, okunur metin gösterilir ve etiket yazıcısı için ZPL ile TSPL çıktısı üretilir. Anahtar kelime ve şifreleme kullanılmaz.": "Type data with application identifiers (AI) in parentheses; the data is validated, the human-readable text is shown and ZPL and TSPL output is produced for label printers. No keyword or encryption is used.",
 "Çıktı türü": "Output type",
 "GS1-128": "GS1-128",
 "GS1 Data Matrix": "GS1 Data Matrix",
 "AI’lı veri": "Data with AIs",
 "Yazıcı sözdizimi gerçek yazıcıda doğrulanmadı. Çıktıyı üretimde kullanmadan önce kendi yazıcınızda deneyin.": "Printer syntax has not been verified on a real printer. Test the output on your own printer before using it in production.",
 "Bir değer yazın; okunur metin ve yazıcı çıktıları burada görünür.": "Type a value; the human-readable text and printer output appear here.",
 "Okunur metin": "Human-readable text",
 "ZPL (Zebra)": "ZPL (Zebra)",
 "ZPL dosyasını indir": "Download ZPL file",
 "TSPL (TSC)": "TSPL (TSC)",
 "TSPL dosyasını indir": "Download TSPL file",
 "Yazı tipi lisansları": "Font licenses",
 "Arayüz iki açık lisanslı yazı tipini dosyanın içinde taşır (SIL Open Font License 1.1); internetten yazı tipi indirilmez.": "The interface carries two openly licensed fonts inside the file (SIL Open Font License 1.1); no font is downloaded from the internet.",
 "Newsreader (başlıklar)": "Newsreader (headings)",
 "Space Mono (rakam ve kodlar)": "Space Mono (digits and codes)",
 "Daha fazla": "More",
 "Anahtar kelimesiz, tek tek barkod oluşturun: perakende (EAN, UPC), koli (ITF-14) ve endüstri türleri. Sıra numarasını karıştıran asıl akış Üret ve Liste sekmelerindedir.": "Create single barcodes without a keyword: retail (EAN, UPC), carton (ITF-14) and industrial types. The main flow that scrambles sequence numbers is in the Generate and List tabs.",
 "Code 128 alt türü": "Code 128 subset",
 "Otomatik (en kısa)": "Automatic (shortest)",
 "128A (büyük harf, rakam, kontrol karakteri)": "128A (capital letters, digits, control characters)",
 "128B (büyük/küçük harf, işaret)": "128B (upper/lower case letters, symbols)",
 "128C (yalnız çift sayıda rakam)": "128C (digits only, even count)",
 "Sağlama rakamı": "Check digit",
 "Yok": "None",
 "Mod 10": "Mod 10",
 "Mod 10 + Mod 10": "Mod 10 + Mod 10",
 "Mod 11": "Mod 11",
 "Başlangıç harfi": "Start letter",
 "Bitiş harfi": "Stop letter",
 "Örnek değer yaz": "Fill in an example",
 "Bir değer yazın; barkod burada görünür.": "Type a value; the barcode appears here.",
 "Barkod türleri rehberi": "Barcode types guide",
 "Her barkod türünün ne işe yaradığı ve hangi değeri kabul ettiği aşağıda yazıyor. Hepsini “Barkod türleri” sekmesinde deneyebilirsiniz.": "Below is what each barcode type is for and which values it accepts. You can try all of them in the “Barcode types” tab.",
 "İçeriğe geç": "Skip to content",
 "Yardım": "Help",
 "Tema": "Theme",
 "Sistem": "System",
 "Açık": "Light",
 "Koyu": "Dark",
 "Dil / Language": "Dil / Language",
 "Üret": "Generate",
 "Çöz": "Decode",
 "Liste": "List",
 "Kurallar": "Rules",
 "Önizleme": "Preview",
 "Anahtar kelime": "Keyword",
 "Yalnızca harf (en az 2 farklı harf); büyük/küçük harf fark etmez. Kelime hiçbir yere kaydedilmez; çözerken aynı kelime ve aynı kurallar gerekir.": "Letters only (at least 2 different letters); case does not matter. The keyword is never saved anywhere; you need the same keyword and the same rules to decode.",
 "Barkod üret": "Generate barcode",
 "Sıradaki numaranın barkodunu üretir; sıra numarasını kendisi seçer.": "Generates the barcode for the next number; it picks the sequence number itself.",
 "Sıra numarası": "Sequence number",
 "Barkod türü": "Barcode type",
 "Çubuk yüksekliği (20-300)": "Bar height (20-300)",
 "QR hata düzeltme düzeyi": "QR error correction level",
 "L (yaklaşık %7)": "L (about 7%)",
 "M (yaklaşık %15)": "M (about 15%)",
 "Q (yaklaşık %25)": "Q (about 25%)",
 "H (yaklaşık %30)": "H (about 30%)",
 "Henüz barkod üretilmedi. Anahtar kelimeyi girip “Barkod üret” düğmesine basın.": "No barcode generated yet. Enter the keyword and press “Generate barcode”.",
 "Kopyala": "Copy",
 "SVG indir": "Download SVG",
 "PNG indir": "Download PNG",
 "300 DPI": "300 DPI",
 "600 DPI": "600 DPI",
 "PNG çözünürlüğü": "PNG resolution",
 "Sıra numaralarını dosyadan işle": "Process sequence numbers from a file",
 "CSV, TXT veya XLSX dosyasının ilk sütunundaki sıra numaraları için barkod üretir (en çok 100.000 satır). Üretilen liste Liste sekmesinde kaydedilir.": "Generates barcodes for the sequence numbers in the first column of a CSV, TXT or XLSX file (up to 100,000 rows). The generated list is saved in the List tab.",
 "Dosya seç (CSV, TXT, XLSX)": "Choose file (CSV, TXT, XLSX)",
 "Liste sekmesinde kaydet": "Save in the List tab",
 "Hatalı satır raporunu indir (CSV)": "Download error report (CSV)",
 "Kurallar özeti": "Rules summary",
 "Biçim": "Format",
 "Uzunluk": "Length",
 "Yöntem": "Method",
 "Önizleme sekmesinde örnek barkodları görebilirsiniz": "You can see sample barcodes in the Preview tab",
 "Kuralları değiştir": "Change rules",
 "Barkodu çöz": "Decode barcode",
 "Barkod metnini yazın, sıra numarasını bulun; kelime ve kurallar üretimdekiyle aynı olmalı.": "Type the barcode text to find its sequence number; the keyword and rules must match those used when generating.",
 "Barkod metni": "Barcode text",
 "Çöz ve kontrol et": "Decode and check",
 "Kamerayla oku": "Scan with camera",
 "Görselden oku": "Read from image",
 "Kamerayı kapat": "Close camera",
 "Yardım: “Çöz neden geçersiz diyor?”": "Help: “Why does Decode say invalid?”",
 "Önek, uzunluk, kontrol hanesi (Luhn) ve yöntem sırayla denetlenir. Yanlış anahtar kelimeyle de bir sıra numarası çıkabilir; doğru kelimeyi kullandığınızdan emin olun.": "The prefix, length, check digit (Luhn) and method are checked in that order. A sequence number can come out even with the wrong keyword; make sure you use the right one.",
 "Dosyadan toplu çöz": "Decode from a file",
 "CSV, TXT veya XLSX dosyasının ilk sütunundaki barkodları çözer (en çok 100.000 satır).": "Decodes the barcodes in the first column of a CSV, TXT or XLSX file (up to 100,000 rows).",
 "Sonuçları indir (CSV)": "Download results (CSV)",
 "Satır": "Row",
 "Barkod": "Barcode",
 "Sıra no": "Sequence no.",
 "Durum": "Status",
 "Üretim yapmadan önce kurallarınızla birkaç örnek görün; hiçbir şey kaydedilmez.": "See a few samples with your rules before generating; nothing is saved.",
 "Bu alan, üstteki anahtar kelime alanıyla aynı değeri taşır ve hiçbir yere kaydedilmez.": "This field carries the same value as the keyword field above and is never saved anywhere.",
 "Başlangıç sıra numarası": "Starting sequence number",
 "Kaç örnek (4-12)": "How many samples (4-12)",
 "Örnekleri yenile": "Refresh samples",
 "Bu kurallarla toplu üretime geç": "Continue to bulk generation with these rules",
 "Örnek üretmek için anahtar kelime girin. Barkod biçimi şöyle olacak:": "Enter the keyword to generate samples. The barcode format will look like this:",
 "Etiket sayfası ve yazdırma": "Label sheet and printing",
 "Etiket boyutunu seçin, önizleyin; yazdırın ya da PDF olarak kaydedin.": "Choose a label size, preview it, then print or save as PDF.",
 "Etiket boyutu": "Label size",
 "Etiket içeriği": "Label content",
 "Üretilmiş liste (Liste sekmesi)": "Generated list (List tab)",
 "Kurallardaki ilk numaralar": "First numbers of the rules",
 "Etiket sayısı (1-2000)": "Number of labels (1-2000)",
 "Etiketleri önizle": "Preview labels",
 "Yazdır": "Print",
 "PDF olarak kaydet": "Save as PDF",
 "PDF için kütüphane gerekmez: “PDF olarak kaydet” yazdırma penceresini açar; hedef olarak “PDF olarak kaydet” (Chrome, Edge) ya da PDF menüsünden “PDF olarak kaydet” (Safari) seçin. Ölçek %100, kenar boşlukları “Yok” olmalıdır.": "No library is needed for PDF: “Save as PDF” opens the print dialog; choose “Save as PDF” as the destination (Chrome, Edge) or “Save as PDF” from the PDF menu (Safari). Set the scale to 100% and margins to “None”.",
 "1. Listeyi üret": "1. Generate the list",
 "Kurallardaki başlangıç–bitiş aralığındaki her numara için bir barkod üretir.": "Generates one barcode for every number between the start and end of the rules.",
 "Listeyi üret": "Generate list",
 "İptal": "Cancel",
 "2. Kaydet adımına geç": "Go to step 2: Save",
 "Henüz liste üretilmedi. “Listeyi üret” ile başlayın; sonra aşağıdaki 2. adımda biçimi seçip kaydedin.": "No list generated yet. Start with “Generate list”, then choose a format and save in step 2 below.",
 "Seri": "Series",
 "2. Kaydet": "2. Save",
 "Listeyi dosya olarak indirin ya da kopyalayın: önce kategoriyi, sonra biçimi seçin.": "Download the list as a file or copy it: choose the category first, then the format.",
 "1. Listeyi üret adımına git": "Go to step 1: Generate the list",
 "Biçim seçin": "Choose a format",
 "SQL tablo adı": "SQL table name",
 "Etiket şablonu (mm ölçüsüyle)": "Label template (with mm size)",
 "Yazıcı çözünürlüğü": "Printer resolution",
 "203 dpi": "203 dpi",
 "300 dpi": "300 dpi",
 "Özel genişlik (mm, 10-300; yalnız “Elle” seçiliyken)": "Custom width (mm, 10-300; only when “Manual” is selected)",
 "Özel yükseklik (mm, 10-300; yalnız “Elle” seçiliyken)": "Custom height (mm, 10-300; only when “Manual” is selected)",
 "Etiket genişliği (nokta, 50-3000; boş = yazıcı varsayılanı)": "Label width (dots, 50-3000; empty = printer default)",
 "Etiket yüksekliği (nokta, 50-3000; boş = yazıcı varsayılanı)": "Label height (dots, 50-3000; empty = printer default)",
 "Panoya kopyala": "Copy to clipboard",
 "Önizleme (ilk 8 satır)": "Preview (first 8 rows)",
 "Örnek barkod görüntüleri (deneme için)": "Sample barcode images (for testing)",
 "Tümünü yazdır": "Print all",
 "Doğrula": "Validate",
 "Yapıştırdığınız ya da dosyadan yüklediğiniz barkod metinlerini kurallara göre denetler: önek, biçim, Luhn, yinelenen ve aralık.": "Checks pasted or uploaded barcode texts against the rules: prefix, format, Luhn, duplicates and range.",
 "Barkod metinleri (her satıra bir tane)": "Barcode texts (one per line)",
 "Aralık denetimi için üstteki anahtar kelimenin girilmiş olması gerekir; diğer denetimler kelime olmadan yapılır.": "The keyword above must be entered for the range check; the other checks work without it.",
 "Denetle": "Validate",
 "Dosyadan yükle (CSV, TXT, XLSX)": "Load from file (CSV, TXT, XLSX)",
 "Toplam": "Total",
 "Geçerli": "Valid",
 "Önek hatalı": "Wrong prefix",
 "Biçim hatalı": "Wrong format",
 "Luhn hatalı": "Luhn errors",
 "Yinelenen": "Duplicates",
 "Aralık/kapasite dışı": "Outside range/capacity",
 "Hata raporunu indir (CSV)": "Download error report (CSV)",
 "Değer": "Value",
 "Hata": "Error",
 "Geçmiş": "History",
 "Son 50 üretimin özeti bu tarayıcıda saklanır. Anahtar kelime hiçbir zaman kaydedilmez.": "A summary of the last 50 generations is stored in this browser. The keyword is never saved.",
 "Listele": "Show list",
 "Geçmişi temizle": "Clear history",
 "JSON dışa aktar": "Export JSON",
 "JSON içe aktar": "Import JSON",
 "Henüz kayıt yok. Liste ürettikçe burada görünür.": "No entries yet. They appear here as you generate lists.",
 "Ürün profilleri": "Product profiles",
 "Sık kullandığınız kuralları (önek, aralık, barkod türü, uzunluk, yöntem, seri adı, Luhn) adla saklayın; en çok 30 profil. Anahtar kelime profile hiçbir zaman kaydedilmez.": "Store frequently used rules (prefix, range, barcode type, length, method, series name, Luhn) by name; up to 30 profiles. The keyword is never saved to a profile.",
 "Profil adı (en çok 40 karakter)": "Profile name (up to 40 characters)",
 "Kayıtlı profiller": "Saved profiles",
 "Profili kaydet": "Save profile",
 "Profili yükle": "Load profile",
 "Profili sil": "Delete profile",
 "Profilleri JSON dışa aktar": "Export profiles as JSON",
 "Profilleri JSON içe aktar": "Import profiles from JSON",
 "Profil dosyası seç": "Choose profile file",
 "Çift basım uyarısı": "Duplicate print warning",
 "Aynı seri ve aralık daha önce üretildiyse uyar (engellemez)": "Warn if the same series and range was generated before (does not block)",
 "Uyarı Geçmiş kayıtlarına bakar; üretimi durdurmaz, devam edebilirsiniz. Yalnızca bu tercih tarayıcıda saklanır.": "The warning checks the History entries; it does not stop generation, you can continue. Only this preference is stored in the browser.",
 "Etiket metni": "Label text",
 "Ürün adı (en çok 60 karakter)": "Product name (up to 60 characters)",
 "Ek satır (örn. tarih, parti; en çok 80 karakter)": "Extra line (e.g. date, batch; up to 80 characters)",
 "Yazı boyutu": "Text size",
 "Küçük": "Small",
 "Orta": "Medium",
 "Büyük": "Large",
 "Hizalama": "Alignment",
 "Sola": "Left",
 "Ortaya": "Center",
 "Sağa": "Right",
 "Logo seç (PNG, JPEG, SVG; en çok 200 KB)": "Choose logo (PNG, JPEG, SVG; up to 200 KB)",
 "Logoyu kaldır": "Remove logo",
 "Logo dosyası seç": "Choose logo file",
 "Metinler uzunsa küçülür ya da kısaltılır, etiketten taşmaz. Logo yalnızca ekran önizlemesinde ve yazdırma/PDF çıktısında yer alır, bellekte tutulur; ZPL/TSPL çıktısına girmez. ZPL/TSPL çıktısına ürün adı ve ek satır metin olarak eklenir (Türkçe harfler ASCII’ye çevrilir).": "Long texts shrink or are shortened and never overflow the label. The logo appears only in the screen preview and print/PDF output and is kept in memory only; it is not included in ZPL/TSPL output. The product name and extra line are added to ZPL/TSPL output as text (Turkish letters are converted to ASCII).",
 "Önizleme sekmesindeki etiket metni (ürün adı, ek satır) ZPL/TSPL çıktısına metin olarak eklenir; logo eklenmez.": "The label text from the Preview tab (product name, extra line) is added to ZPL/TSPL output as text; the logo is not included.",
 "Tarih": "Date",
 "Aralık": "Range",
 "Adet": "Count",
 "Varsayılanlar çoğu iş için yeterlidir; değiştirirseniz çözerken de aynısını kullanın.": "The defaults are enough for most jobs; if you change them, use the same rules when decoding.",
 "Önek": "Prefix",
 "Code 128 (önerilen)": "Code 128 (recommended)",
 "Code 39": "Code 39",
 "Code 93": "Code 93",
 "EAN-13 (GS1, yalnız rakam)": "EAN-13 (GS1, digits only)",
 "EAN-8 (GS1, küçük ürün)": "EAN-8 (GS1, small items)",
 "UPC-A (GS1, Kuzey Amerika)": "UPC-A (GS1, North America)",
 "ITF-14 (GS1, koli)": "ITF-14 (GS1, carton)",
 "QR Code (2B)": "QR Code (2D)",
 "Data Matrix (2B)": "Data Matrix (2D)",
 "Seri adı": "Series name",
 "Başlangıç sıra no": "Start sequence no.",
 "Bitiş sıra no": "End sequence no.",
 "Tahmin direnci (1 / ?)": "Guess resistance (1 / ?)",
 "Toplam rakam (önek hariç, Luhn dahil)": "Total digits (excluding prefix, including Luhn)",
 "Tahmin direnci: rastgele denenen bir sayının geçerli bir sıra numarasına denk gelme olasılığı en çok 1/değer olsun.": "Guess resistance: the chance that a randomly tried number matches a valid sequence number should be at most 1/value.",
 "Karıştırma yöntemi": "Scrambling method",
 "Dikkat: Harf karıştırma yönteminde ardışık numaraların kodları arasında çok az sayıda tekrar eden fark deseni oluşur; Doğrusal yöntemde fark tamamen sabittir. Yani komşu numara tahmin edilebilir. Feistel bunu gizler. Ayrıca Harf karıştırma yönteminde kelimenin yalnızca ilk (rakam sayısı) harfi etkilidir; uzun kelimenin fazlası kullanılmaz.": "Note: with Letter scrambling, consecutive numbers produce codes with only a few repeating difference patterns; with Linear the difference is completely constant. So a neighbouring number can be guessed. Feistel hides this. Also, with Letter scrambling only the first (digit count) letters of the keyword matter; the rest of a long keyword is unused.",
 "Kuralları saklayın": "Save your rules",
 "Kurallar tarayıcıda saklanmaz; kalıcılık için dosyaya aktarın.": "Rules are not stored in the browser; export them to a file to keep them.",
 "Kaydet": "Save",
 "Kuralları dosyaya aktar": "Export rules to a file",
 "Kuralları bir .json dosyasına kaydeder. Anahtar kelime dosyaya yazılmaz.": "Saves the rules to a .json file. The keyword is not written to the file.",
 "Yükle": "Load",
 "Kural dosyasını (.json) buraya bırakın veya seçin": "Drop the rules file (.json) here or choose it",
 "Dosya seç": "Choose file",
 "Sıfırlama": "Reset",
 "Yeni seri başlat": "Start new series",
 "Yeni seri: seri adını artırır, başlangıcı önceki bitiş + 1 yapar, çıktıyı temizler.": "New series: increments the series name, sets the start to the previous end + 1 and clears the output.",
 "Varsayılan kurallara dön": "Reset to default rules",
 "Varsayılan kurallara döner.": "Returns to the default rules.",
 "Şifreli yedek (parolalı)": "Encrypted backup (password)",
 "Kural ayarlarınızı (önek, uzunluk, barkod türü, yöntem, seri tanımları) parolayla şifreleyip dosyaya yazar. Anahtar kelime yedeğe yazılmaz.": "Encrypts your rule settings (prefix, length, barcode type, method, series definitions) with a password and writes them to a file. The keyword is not written to the backup.",
 "Parolayı unutursanız yedeği açmanın hiçbir yolu yoktur; parolayı güvenli bir yerde saklayın.": "If you forget the password there is no way to open the backup; keep the password in a safe place.",
 "Parola (en az 8 karakter)": "Password (at least 8 characters)",
 "Parolayı doğrulayın (yalnız yedek alırken)": "Confirm password (only when creating a backup)",
 "Yedek al": "Create backup",
 "Şifreli yedek al": "Create encrypted backup",
 "Yedekten yükle": "Restore from backup",
 "Yedek dosyası seç": "Choose backup file",
 "Bir yerde takılırsanız önce buraya bakın.": "If you get stuck, look here first.",
 "Başlarken": "Getting started",
 "[b]Kelimeyi yazın.[/b] Üstteki “Anahtar kelime” kutusuna bir kelime girin ve güvenli bir yere not edin.": "[b]Type the keyword.[/b] Enter a word in the “Keyword” box above and note it down in a safe place.",
 "[b]Numara üretin.[/b] “Üret” sekmesinde “Barkod üret”e basın; çok sayıda numara için “Liste” sekmesini kullanın.": "[b]Generate numbers.[/b] Press “Generate barcode” in the “Generate” tab; use the “List” tab for many numbers.",
 "[b]Gerekirse çözün.[/b] “Çöz” sekmesinde barkod metnini yazın; sıra numarası bulunur. Önek ve aralık gibi ayarlar “Kurallar” sekmesindedir, değiştirmeseniz de çalışır.": "[b]Decode if needed.[/b] Type the barcode text in the “Decode” tab to find its sequence number. Settings such as prefix and range are in the “Rules” tab; it works even if you do not change them.",
 "Sık sorulan sorular": "Frequently asked questions",
 "Anahtar kelime nedir?": "What is the keyword?",
 "Numaraları karıştıran gizli kelimedir; parola gibi düşünün. Aynı numara farklı kelimeyle farklı barkod olur. Yalnızca harf olmalı (en az 2 harf, en az 2 farklı harf); büyük/küçük harf ve boşluk fark etmez.": "It is the secret word that scrambles the numbers; think of it as a password. The same number gives a different barcode with a different keyword. It must contain letters only (at least 2 letters, at least 2 different letters); case and spaces do not matter.",
 "Kelimeyi unutursam ne olur?": "What if I forget the keyword?",
 "Barkodlar çözülemez ve aynı numaraları yeniden üretemezsiniz: kelime hiçbir yere kaydedilmez ve kurtarma yolu yoktur. Kaydettiğiniz liste dosyasındaki barkodlar ve sıra numaraları elinizde kalır.": "The barcodes cannot be decoded and you cannot regenerate the same numbers: the keyword is not saved anywhere and there is no way to recover it. The barcodes and sequence numbers in the list files you saved remain yours.",
 "Çözerken neden aynı kelime ve aynı kurallar gerekir?": "Why do I need the same keyword and rules to decode?",
 "Her sıra numarası, kelimeye ve kurallara (önek, uzunluk, yöntem, kontrol hanesi) göre tek bir koda dönüşür. Bunlardan biri değişirse aynı numaranın barkodu da değişir. Kuralları dosyaya aktarıp saklayın.": "Each sequence number becomes a single code according to the keyword and the rules (prefix, length, method, check digit). If any of them changes, the barcode of the same number changes too. Export your rules to a file and keep it.",
 "Önekten sonra neden 0 gelmez?": "Why is there never a 0 after the prefix?",
 "Önekten sonraki ilk rakam her zaman 1-9 arasındadır. Barkodlar hep aynı uzunlukta ve ilk rakamı 0 olmayan sayılardır; ilk rakamı 0 olan bir barkodu “Çöz” geçersiz sayar.": "The first digit after the prefix is always 1-9. Barcodes always have the same length and never start with 0; Decode treats a barcode whose first digit is 0 as invalid.",
 "Sıra numarası girmek zorunda mıyım?": "Do I have to enter a sequence number?",
 "Hayır. “Barkod üret” kuraldaki başlangıç numarasından başlayıp sıradaki numarayı kendisi seçer. Kendi numaranızı girmek için “Sıra numarasını kendim gireyim” kutusunu işaretleyin. Sayfayı kapatıp açınca sıra yeniden başlangıçtan başlar; kaldığınız yeri Kurallar’daki başlangıç numarasıyla belirleyin.": "No. “Generate barcode” starts from the start number in the rules and picks the next number itself. To enter your own number, tick “Enter the sequence number myself”. When you reload the page the sequence starts again from the start; set where you left off with the start number in Rules.",
 "Hangi barkod türünü seçeyim?": "Which barcode type should I choose?",
 "Code 128 (varsayılan) çoğu iş için doğrudur: rakam ağırlıklı barkodlarda en kısa çıktıyı verir ve yaygın okuyucular okur. Code 39 ve Code 93 yalnızca eski cihazlarla uyum gibi özel bir nedeniniz varsa seçilir; ikisinde de küçük harf yoktur. QR Code ve Data Matrix iki boyutlu kodlardır: QR telefon kameralarıyla kolay okunur, Data Matrix çok küçük etiketlere uyar; bunları okumak için görüntü (kamera) okuyucu gerekir.": "Code 128 (default) is right for most jobs: it gives the shortest output for mostly numeric barcodes and common readers read it. Choose Code 39 and Code 93 only if you have a special reason such as compatibility with old devices; neither has lowercase letters. QR Code and Data Matrix are two-dimensional codes: QR is easily read by phone cameras, Data Matrix suits very small labels; reading them needs an image (camera) reader.",
 "“Çöz” neden “geçersiz” diyor?": "Why does Decode say “invalid”?",
 "Mesaj nedeni söyler: barkod önekle başlamıyor, rakam sayısı farklı, ilk rakam 0 ya da kontrol hanesi tutmuyor. Önek ya da uzunluk uymuyorsa kurallar farklıdır; kontrol hanesi tutmuyorsa barkod yanlış okunmuş ya da değişmiş olabilir.": "The message gives the reason: the barcode does not start with the prefix, the digit count differs, the first digit is 0 or the check digit does not match. If the prefix or length does not match, the rules differ; if the check digit does not match, the barcode may have been misread or altered.",
 "Dikkat: kelime yanlışsa çoğu zaman “geçerli” deyip yanlış bir sıra numarası verir. Sonucu doğru kelimeyle kontrol edin.": "Note: if the keyword is wrong, it often says “valid” and gives a wrong sequence number. Check the result with the right keyword.",
 "Excel’de baştaki sıfırlar gidiyor ya da sayı 1,2E+19 oluyor": "Leading zeros disappear in Excel or the number becomes 1.2E+19",
 "Excel uzun rakamları kısaltabilir ve baştaki sıfırı silebilir. “Excel (.xlsx)” biçimini seçin; hücrelerin hepsi metin olur. Ya da “CSV (Excel Türkçe)” biçiminde “Excel için metin biçimi” kutusu işaretli kalsın.": "Excel can shorten long digit strings and drop leading zeros. Choose the “Excel (.xlsx)” format; all cells become text. Or keep the “Text format for Excel” box ticked with the “CSV (Excel Turkish)” format.",
 "Hangi dışa aktarma biçimi ne için?": "Which export format is for what?",
 "[b]Tablo[/b] (CSV, TSV, Excel): Excel ve tablo programları için. [b]Veri[/b] (JSON, JSON Lines, XML, SQL): yazılıma ya da veritabanına aktarmak için. [b]Belge[/b] (HTML tablo, Markdown, düz metin): okumak, paylaşmak ya da yapıştırmak için. [b]Etiket[/b] (ZPL, TSPL): Zebra ve TSC etiket yazıcıları için; etiket şablonunun mm ölçüleri kullanılır. Her biçimin altında kısa bir açıklama da yazar.": "[b]Table[/b] (CSV, TSV, Excel): for Excel and spreadsheet programs. [b]Data[/b] (JSON, JSON Lines, XML, SQL): to import into software or a database. [b]Document[/b] (HTML table, Markdown, plain text): to read, share or paste. [b]Label[/b] (ZPL, TSPL): for Zebra and TSC label printers; the mm size of the label template is used. A short description is also shown under each format.",
 "Kaç numara üretebilirim? “Sığmıyor” ya da “tükendi” uyarısı ne demek?": "How many numbers can I generate? What do the “does not fit” or “exhausted” warnings mean?",
 "Kapasite uzunluğa bağlıdır: örneğin 3 şifreli rakamda en büyük sıra numarası 899, 6 rakamda 899.999 olur. Uyarı çıkarsa Kurallar’da uzunluğu artırın ya da aralığı küçültün; “tükendi” derse bitiş numarasını artırın. Liste tek seferde en çok 1.000.000 satır üretir.": "Capacity depends on the length: for example with 3 encrypted digits the largest sequence number is 899, with 6 digits 899,999. If a warning appears, increase the length in Rules or reduce the range; if it says “exhausted”, increase the end number. A list generates at most 1,000,000 rows at a time.",
 "Kurallarımı nasıl saklarım?": "How do I keep my rules?",
 "Kurallar tarayıcıda saklanmaz; sayfa yenilenince varsayılana döner. Kurallar sekmesinde “Kuralları dosyaya aktar” ile kaydedin, sonra “Kuralları dosyadan yükle” ile geri getirin. Dosyaya anahtar kelime yazılmaz. İsterseniz “Şifreli yedek” ile kuralları parolayla şifreleyebilirsiniz.": "Rules are not stored in the browser; they return to the default when the page is reloaded. In the Rules tab save them with “Export rules to a file”, then bring them back with “Load”. The keyword is not written to the file. If you wish, “Encrypted backup” can encrypt the rules with a password.",
 "Verilerim nereye gidiyor?": "Where does my data go?",
 "Hiçbir yere. Uygulama çevrimdışı çalışır, internet kullanmaz; kelime ve numaralar cihazınızdan çıkmaz. Tarayıcıda yalnızca tema, dil seçiminiz ve son üretimlerin özeti (tarih, seri, aralık, barkod türü, uzunluk) saklanır; anahtar kelime ve parola hiçbir yere kaydedilmez. Geçmişi Geçmiş sekmesinden silebilirsiniz.": "Nowhere. The app works offline and does not use the internet; the keyword and numbers never leave your device. The browser stores only your theme, your language and a summary of recent generations (date, series, range, barcode type, length); the keyword and the password are never saved. You can delete the history in the List tab.",
 "Kurulum ve kaldırma (Windows)": "Installation and removal (Windows)",
 "Kurulum yönetici izni istemez; kendi kullanıcı hesabınıza kurulur. Windows “bilgisayarınızı korudu” uyarısı verirse “Ek bilgi” ve “Yine de çalıştır”ı seçin.": "Installation does not need administrator rights; it installs for your own user account. If Windows shows a “protected your PC” warning, choose “More info” and “Run anyway”.",
 "Kaldırmak için Başlat menüsündeki “TAARKOD - Kaldır” kısayolunu ya da Ayarlar > Uygulamalar’ı kullanın. “Ayarlarınız ve temizlik kayıtlarınız da silinsin mi?” sorusuna Hayır derseniz saklanır ve yeniden kurunca kaldığınız yerden devam edilir. Güncelleme sırasında bu soru çıkmaz.": "To remove it, use the “TAARKOD - Uninstall” shortcut in the Start menu or Settings > Apps. If you answer No to “Delete your settings and cleanup records too?”, they are kept and you continue where you left off after reinstalling. This question is not asked during an update.",
 "Etiketleri nasıl yazdırır ya da PDF olarak kaydederim?": "How do I print labels or save them as PDF?",
 "Önizleme sekmesinde “Etiket sayfası ve yazdırma” bölümünden etiket boyutunu (40x25, 50x30, 100x50 mm ya da A4 ızgara 3x8 ve 4x10) seçin, “Etiketleri önizle”ye basın, sonra “Yazdır”ı kullanın. “PDF olarak kaydet” aynı yazdırma penceresini açar; hedef olarak “PDF olarak kaydet” seçilir. Yazdırma ayarlarında ölçek %100 olmalıdır.": "In the Preview tab, choose a label size in “Label sheet and printing” (40x25, 50x30, 100x50 mm or A4 grid 3x8 and 4x10), press “Preview labels”, then use “Print”. “Save as PDF” opens the same print dialog; choose “Save as PDF” as the destination. The scale in the print settings must be 100%.",
 "QR Code ve Data Matrix nasıl kullanılır?": "How do I use QR Code and Data Matrix?",
 "Üret sekmesinde “Barkod türü”nden QR Code ya da Data Matrix seçin. İki boyutlu kodlarda çubuk yüksekliği yoktur; QR için hata düzeltme düzeyi seçilir. Etiketlerde ve ZPL/TSPL çıktısında da kullanılır.": "In the Generate tab, choose QR Code or Data Matrix under “Barcode type”. Two-dimensional codes have no bar height; for QR you choose the error correction level. They are also used on labels and in ZPL/TSPL output.",
 "Dosyadan toplu çözme, üretme ve doğrulama nasıl yapılır?": "How do I decode, generate and validate in bulk from a file?",
 "Çöz sekmesinde barkodları, Üret sekmesinde sıra numaralarını CSV, TXT ya da XLSX dosyasının ilk sütununa yazıp “Dosya seç” ile yükleyin (en çok 100.000 satır). Hatalı satırlar raporda ayrıca listelenir. Doğrula sekmesi yapıştırılan numaraları önek, biçim, Luhn, yinelenen ve aralık açısından denetler ve hata raporunu CSV olarak indirir. XLSX açılamazsa dosyayı CSV olarak kaydedip yükleyin.": "Put the barcodes (Decode tab) or the sequence numbers (Generate tab) in the first column of a CSV, TXT or XLSX file and load it with “Choose file” (up to 100,000 rows). Rows with errors are listed separately in a report. The “Validate” section in the List tab checks pasted numbers for prefix, format, Luhn, duplicates and range and downloads the error report as CSV. If an XLSX cannot be opened, save it as CSV and load that.",
 "Geçmiş neleri saklar?": "What does the history store?",
 "Liste üretildikçe tarih, seri adı, aralık, barkod türü ve uzunluk bu tarayıcıda saklanır (en çok 50 kayıt). Anahtar kelime ve barkodların kendisi saklanmaz. Geçmiş sekmesinden kaydı yeniden doldurabilir, geçmişi silebilir ya da JSON olarak dışa/içe aktarabilirsiniz.": "As lists are generated, the date, series name, range, barcode type and length are stored in this browser (at most 50 entries). The keyword and the barcodes themselves are not stored. In the List tab you can refill the rules from an entry, delete the history, or export/import it as JSON.",
 "Kamerayla nasıl okurum?": "How do I scan with the camera?",
 "Çöz sekmesinde “Kamerayla oku”ya basıp izin verin ve barkodu kameraya tutun; okunan değer “Barkod metni” alanına yazılır. Tarayıcınız kamerayla okumayı desteklemiyorsa “Görselden oku” ile barkod fotoğrafı seçin ya da metni elle yazın.": "In the Decode tab press “Scan with camera”, allow access and hold the barcode in front of the camera; the value read is written to the “Barcode text” field. If your browser does not support camera reading, choose a barcode photo with “Read from image” or type the text by hand.",
 "Şifreli yedek nedir?": "What is the encrypted backup?",
 "Kurallar sekmesindeki “Şifreli yedek”, kural ayarlarınızı parolayla şifreleyip dosyaya yazar (anahtar kelime yazılmaz). Parolayı unutursanız yedeği açmanın yolu yoktur. Yedekten yüklerken aynı parolayı girin; yanlış parolada hata görürsünüz.": "The “Encrypted backup” in the Rules tab encrypts your rule settings with a password and writes them to a file (the keyword is not written). If you forget the password there is no way to open the backup. Enter the same password when restoring; a wrong password gives an error.",
 "Dili nasıl değiştiririm?": "How do I change the language?",
 "Üst çubuktaki “Dil / Language” kutusundan Türkçe ya da English seçin. Seçiminiz bu tarayıcıda saklanır; ilk açılışta tarayıcı dili İngilizce ise arayüz İngilizce başlar.": "Choose Türkçe or English from the “Dil / Language” box in the top bar. Your choice is stored in this browser; on first launch the interface starts in English if the browser language is English.",
 "Barkod okunmuyor": "The barcode does not scan",
 "Barkodun iki yanında boş kenar bırakın ve çok küçültmeyin: Liste sekmesindeki “Ölçek” değerini artırın. Yazıcıyı en iyi kalite ayarında kullanın; ekrandan okutuyorsanız parlaklığı artırın. Barkod türü Code 128 değilse onu deneyin.": "Leave blank margins on both sides of the barcode and do not shrink it too much: increase the “Scale” value in the List tab. Print at the best quality setting; if scanning from a screen, increase the brightness. If the barcode type is not Code 128, try that.",
 "Bir şey ters gitti": "Something went wrong",
 "[b]Kelime aynı mı?[/b] Harfler üretimdekiyle aynı olmalı. Emin değilseniz “Kelimeyi göster”e basıp bakın.": "[b]Is the keyword the same?[/b] The letters must be the same as when generating. If unsure, press “Show keyword” and check.",
 "[b]Kurallar aynı mı?[/b] Önek, barkod türü, uzunluk, yöntem ve kontrol hanesi üretimdekiyle aynı olmalı. En güvenlisi kural dosyasını yüklemektir.": "[b]Are the rules the same?[/b] The prefix, barcode type, length, method and check digit must be the same as when generating. The safest way is to load the rules file.",
 "[b]Kontrol hanesi doğru mu?[/b] Barkod metnini önek dahil, eksiksiz ve boşluksuz yazın. Kontrol hanesi tutmuyorsa metin yanlış okunmuş ya da yazılmıştır.": "[b]Is the check digit right?[/b] Type the barcode text in full, including the prefix and without spaces. If the check digit does not match, the text was misread or mistyped.",
 "[b]Hâlâ olmuyor mu?[/b] Sayfayı yenileyip kelimeyi ve kuralları baştan girin. Üretilmiş liste kaydedilmez; yenilemeden önce indirin.": "[b]Still not working?[/b] Reload the page and enter the keyword and rules again. The generated list is not saved; download it before reloading.",
 "Klavye kısayolları": "Keyboard shortcuts",
 "[k]Ctrl[/k]+[k]Enter[/k]: açık bölümün ana işlemini çalıştırır (barkod üret, çöz, listeyi üret).": "[k]Ctrl[/k]+[k]Enter[/k]: runs the main action of the open section (generate barcode, decode, generate list).",
 "[k]Ctrl[/k]+[k]Enter[/k] (Önizleme açıkken): örnek barkodları yeniler.": "[k]Ctrl[/k]+[k]Enter[/k] (while Preview is open): refreshes the sample barcodes.",
 "[k]Ctrl[/k]+[k]S[/k]: üretilmiş listeyi seçili biçimde indirir.": "[k]Ctrl[/k]+[k]S[/k]: downloads the generated list in the selected format.",
 "Sekme çubuğunda [k]←[/k] [k]→[/k], [k]Home[/k], [k]End[/k]: sekmeler arasında gezinir.": "In the tab bar [k]←[/k] [k]→[/k], [k]Home[/k], [k]End[/k]: move between tabs.",
 "Hakkında": "About",
 "[b]TAARKOD[/b]: sıralı numaraları anahtar kelimeye göre karıştırır; önek ve Luhn kontrol hanesi ekler; barkod görüntüsünü üretir. İnternet gerekmez; hiçbir veri dışarı gönderilmez.": "[b]TAARKOD[/b]: scrambles sequential numbers using a keyword; adds a prefix and a Luhn check digit; produces the barcode image. No internet is needed; no data is sent out.",
 "Bu yöntemler kriptografik güvenlik sağlamaz; yalnızca numaraların sırasını dışarıdan tahmin edilemez hale getirir. Aynı kelime ve kurallarla her numara tek bir koda gider (birebir eşleme), iki numara asla aynı kodu almaz.": "These methods do not provide cryptographic security; they only make the order of the numbers unpredictable from outside. With the same keyword and rules each number maps to exactly one code (one-to-one); two numbers never get the same code.",
 "Sürüm ve eski sürüm temizliği": "Version and old version cleanup",
 "Yalnız seçtiğiniz klasördeki, mevcut sürümden eski [c]TAARKOD-Kurulum/Tasinabilir-X.Y.Z.exe[/c] (eski adıyla [c]Barkod-Siralama-…[/c]) dosyaları bulunur; silinenler geri dönüşüm kutusuna gider.": "Only files in the folder you choose that are older than the current version, [c]TAARKOD-Kurulum/Tasinabilir-X.Y.Z.exe[/c] (formerly [c]Barkod-Siralama-…[/c]), are found; deleted files go to the recycle bin.",
 "İndirme klasörünü seç": "Choose downloads folder",
 "Eski sürümleri tara": "Scan for old versions",
 "Eski sürümleri geri dönüşüm kutusuna gönder": "Send old versions to the recycle bin",
 "Sıra numarasını kendim gireyim": "Enter the sequence number myself",
 "Seri adını etikete yaz": "Write the series name on the label",
 "Excel için metin biçimi (uzun barkodun 1,2E+19 gibi bozulmasını önler; başka bir programa aktaracaksanız işareti kaldırın)": "Text format for Excel (prevents long barcodes from becoming 1.2E+19; untick if you will import into another program)",
 "Sona kontrol hanesi ekle (Luhn; yalnızca rakam kısmı üzerinden)": "Add a check digit at the end (Luhn; over the digits only)",
 "Otomatik (önerilen): bitiş sıra no ve tahmin direncine göre seçilir": "Automatic (recommended): chosen from the end sequence number and guess resistance",
 "Elle: toplam rakam sayısını ben seçerim": "Manual: I choose the total number of digits",
 "Güncelleme sonrası eski sürümleri otomatik sil": "Delete old versions automatically after an update",
 "Mevcut sürüm:": "Current version:",
 "Seçili klasör:": "Selected folder:",
 "Bölümler": "Sections",
 "örn. 1 (boşsa otomatik seçilir)": "e.g. 1 (chosen automatically if empty)",
 "Sıra numarası dosyası seç": "Choose sequence number file",
 "örn. TO...": "e.g. TO...",
 "Barkod görseli seç": "Choose barcode image",
 "Kamera görüntüsü": "Camera view",
 "Barkod dosyası seç": "Choose barcode file",
 "Üretim ilerlemesi": "Generation progress",
 "Biçim kategorisi": "Format category",
 "Dışa aktarma biçimi": "Export format",
 "Seçili biçimde ilk 8 satırın önizlemesi": "Preview of the first 8 rows in the selected format",
 "Doğrulanacak dosyayı seç": "Choose file to validate",
 "Geçmiş dosyası seç": "Choose history file",
 "Şifreleme yöntemi": "Encryption method",
 "Kural dosyası bırakma alanı": "Rules file drop area",
 "Kural dosyası seç": "Choose rules file",
 "Şifreli yedek dosyasını seç": "Choose encrypted backup file",
 "GÖRÜNÜM": "APPEARANCE",
 "Görünüm": "Appearance",
 "Kapat": "Close",
 "Değişiklikler anında uygulanır; Kaydet düğmesi yoktur. Yalnızca seçimleriniz bu cihazda saklanır.": "Changes apply instantly; there is no Save button. Only your choices are stored on this device.",
 "CANLI ÖNİZLEME": "LIVE PREVIEW",
 "Düğme": "Button",
 "Bağlantı": "Link",
 "ROZET": "BADGE",
 "ÇEVRİMDIŞI · HAZIR": "OFFLINE · READY",
 "Renk paleti": "Color palette",
 "Lacivert": "Navy",
 "Antrasit": "Charcoal",
 "Bordo": "Burgundy",
 "Çam": "Pine",
 "Eflatun": "Violet",
 "Taş": "Stone",
 "Klasik": "Classic",
 "Özel": "Custom",
 "Şerit rengi": "Strip color",
 "Eylem rengi": "Action color",
 "İplik rengi (özel)": "Thread color (custom)",
 "Uygulama biçimi": "How colors apply",
 "Ton": "Tint",
 "Tüm arayüz": "Whole interface",
 "Klasik görünümde renkler sabittir; bu seçim yalnız başka bir palette uygulanır.": "In the Classic look the colors are fixed; this choice applies only to another palette.",
 "Açık / koyu": "Light / dark",
 "Gelişmiş": "Advanced",
 "İplik rengi": "Thread color",
 "Palet": "Palette",
 "Kırmızı-turuncu": "Red-orange",
 "Amber": "Amber",
 "Mavi": "Blue",
 "Beyaz": "White",
 "Şerit stili": "Strip style",
 "Dolu": "Solid",
 "İnce çizgili": "Thin line",
 "Yoğunluk": "Density",
 "Rahat (44 px)": "Comfortable (44 px)",
 "Sıkı (36 px)": "Compact (36 px)",
 "Köşe": "Corners",
 "Köşeli (0 px)": "Square (0 px)",
 "Normal (4 px)": "Normal (4 px)",
 "Yuvarlak (8 px)": "Rounded (8 px)",
 "Başlık yazısı": "Heading font",
 "Serif (Newsreader)": "Serif (Newsreader)",
 "Sistem yazı tipi": "System font",
 "%90": "90%",
 "%100": "100%",
 "%115": "115%",
 "%130": "130%",
 "Kontrast": "Contrast",
 "Normal": "Normal",
 "Yüksek": "High",
 "Alt durum çubuğunu göster": "Show the bottom status bar",
 "Uyarı: Sıkı yoğunlukta dokunma hedefi 36 px olur; dokunmatik ekranda 40 px altındaki hedeflere basmak zorlaşır.": "Warning: Compact density makes touch targets 36 px; targets under 40 px are harder to press on a touch screen.",
 "Varsayılana dön": "Reset to default",
 "Klasik görünüm": "Classic look"
},
    m: {
 "ud.hazir": "OFFLINE · READY",
 "ud.calisiyor": "OFFLINE · RUNNING",
 "ust.surum": "Version {0}",
 "sb.tur": "TYPE: {0} · {1} CHARS",
 "sb.turYok": "TYPE: —",
 "sb.yontem": "METHOD: {0}",
 "sb.yontemYok": "METHOD: —",
 "sb.satir": "ROWS: {0} / {1}",
 "sb.satirIpucu": "Generated / available rows",
 "sb.ilerleme": "PROGRESS: {0} {1}%",
 "sb.ilerlemeYok": "PROGRESS: —",
 "sb.kelime": "KEYWORD: SET",
 "sb.kelimeBos": "KEYWORD: EMPTY",
 "rz.tur": "TYPE: {0}",
 "rz.satir": "AVAILABLE ROWS: {0}",
 "rz.uretilen": "GENERATED: {0}",
 "rz.onek": "PREFIX: {0}",
 "rz.kayit": "RECORDS: {0}",
 "rz.surum": "VERSION: v{0}",
 "ks.gs1": "GS1 MOD 10",
 "on.geri": "The last values of {0} were restored: prefix {1}.",
 "to.baslik": "Rules specific to {0}",
 "to.toplam": "{0} digits in total, fixed (check digit included).",
 "to.kontrol": "The last digit is the GS1 mod 10 check digit; it cannot be turned off.",
 "to.onekRakam": "The prefix can only be digits; at most {0} digits.",
 "to.ean13": "Preset prefix {0}: the GS1 prefix reserved for Türkiye.",
 "to.ean8": "Preset prefix {0}: only a starting point; EAN-8 is for small products.",
 "to.upca": "Preset prefix {0}: the first digit is the number system digit (0: regular products).",
 "to.itf14": "Preset prefix {0}: the first digit is the packaging indicator, the rest is the Türkiye prefix.",
 "to.buyuk": "Lowercase letters cannot be used in the prefix; only uppercase letters, digits, space and - . $ / + %.",
 "to.qr": "The prefix appears at the start of the text when read with a phone.",
 "to.dm": "A two-dimensional code for small labels; a short prefix keeps the code small.",
 "tb.toplam": "The GS1 standard fixes the length of this type, so the length fields are locked and the digits left for the encrypted part shrink as the prefix grows.",
 "tb.kontrol": "Readers use this digit to reject misreads. GS1’s 3-1 weighted mod 10 method is used, not Luhn.",
 "tb.onekRakam": "GS1 barcodes carry digits only. At least 2 digits must remain for the encrypted sequence number.",
 "tb.ean13": "869 is the GS1 prefix reserved for Türkiye; having it does not mean the number belongs to you. For products to be sold, get your company prefix from GS1 Türkiye.",
 "tb.ean8": "86 is only a starting point (the prefixes reserved for Türkiye are 868 and 869). The prefix is kept short because space is very limited.",
 "tb.upca": "0 is for regular products. 2, 3, 4 and 5 are reserved for special uses such as weighed products, pharmaceuticals, in-store and coupons.",
 "tb.itf14": "The first digit is the packaging indicator: 1-8 mark packaging levels such as cartons or pallets, 9 marks variable-measure products. The preset 1869 combines indicator 1 with the Türkiye prefix (869).",
 "tb.buyuk": "Code 39 and Code 93 cannot encode lowercase letters, so a prefix with lowercase letters is rejected.",
 "tb.qr": "A QR code shows the prefix as plain text when read with a phone; you can choose a meaningful prefix.",
 "tb.dm": "Data Matrix takes very little space; every prefix character makes the code a little larger.",
 "ks.onAyar": "PRESET PREFIX: {0}",
 "ks.buyuk": "UPPERCASE ONLY",
 "ip.gs1": "AI is a GS1 application identifier: (01) item number, (10) batch, (17) expiry date and so on. Data is written as (AI)value; the check digit, dates and lengths are validated.",
 "ip.gs1b": "ZPL is for Zebra printers, TSPL for TSC printers. TSPL output is deliberately not produced for GS1 Data Matrix; use ZPL.",
 "gs.giris": "Input rule: write each element as (AI)value, e.g. (01) GTIN-14, (17) YYMMDD, (10) batch. Parentheses are used only for the AI.",
 "gs.panoYok": "This browser cannot write to the clipboard; select the text in the box and copy it by hand.",
 "gs.kopyalandi": "{0} output copied to the clipboard.",
 "gs.panoHata": "Could not write to the clipboard; select the text in the box and copy it by hand.",
 "gs.indirildi": "{0} file downloaded.",
 "lis.yok": "The license text is not embedded in this build.",
 "ks.luhn": "LUHN",
 "ks.yok": "NONE",
 "ks.rakam": "DIGITS",
 "ks.ascii": "ASCII",
 "ks.metin": "TEXT",
 "ks.hane": "LENGTH: {0}",
 "ks.kume": "SET: {0}",
 "ks.kontrol": "CHECK: {0}",
 "ks.zorunlu": "CHECK REQUIRED",
 "ks.kilit": "LOCKED FIELDS: {0}",
 "tur.gPerakende": "Retail (GS1)",
 "tur.gEndustri": "Industrial and warehouse",
 "tur.ek": "An add-on code is not read on its own: it is used to the right of a main barcode (EAN-13, UPC-A or ISSN).",
 "tur.gs1.ulke": "GS1 prefix {0}: allocated to the GS1 office of {1}. The prefix shows the office that issued the number, not where the product was made.",
 "tur.gs1.ozel": "GS1 prefix {0}: reserved for in-store or restricted distribution; do not use it for products sold outside the store.",
 "tur.gs1.kupon": "GS1 prefix {0}: reserved for coupons and discount numbers; do not use it as a product barcode.",
 "tur.gs1.kitap": "GS1 prefix {0}: reserved for book numbers (ISBN, “Bookland”); use it only for a valid ISBN.",
 "tur.gs1.dergi": "GS1 prefix {0}: reserved for serial publication numbers (ISSN); use it only for a valid ISSN.",
 "tur.gs1.iade": "GS1 prefix {0}: reserved for refund receipts; do not use it as a product barcode.",
 "tur.gs1.diger": "GS1 prefix {0}: the GS1 office that owns this prefix is not shown here.",
 "tur.gs1.genel": "For products that go on sale, the number must be built on a company prefix obtained from GS1 (GS1 Türkiye for Türkiye); a number you invent yourself may clash with another product.",
 "tur.girdi": "Input rule: {0}.",
 "tur.pngYok": "The PNG could not be created; try the SVG download.",
 "tur.bilgi": "Encoded value: {0} · {1} modules, {2} symbols",
 "tur.sagla": " · Check: {0}",
 "tur.upcA": " · UPC-A equivalent: {0}",
 "y.varsayilan": "DEFAULT",
 "y.onerilen": "RECOMMENDED",
 "y.zayif": "WEAK",
 "y.zayifIpucu": "The difference between neighbouring numbers is constant and easy to guess",
 "y.puan": "Concealment {0}/5 · Guess resistance {1}/5 · Speed {2}/5 (5 is best)",
 "y.nasil": "How it works, pros and cons",
 "y.artilar": "Pros",
 "y.eksiler": "Cons",
 "sayi.tam": "{0} must be a whole number.",
 "sayi.aralik": "{0} must be between {1} and {2}.",
 "kural.sonKucuk": "The end cannot be smaller than the start.",
 "uz.oneri": "Recommended: {0} digits in total ({1} encrypted digits{2}). ",
 "uz.luhnEk": " + 1 Luhn",
 "uz.th1": "Total digits",
 "uz.th2": "Characters",
 "uz.th3": "Symbols",
 "uz.th4": "Modules",
 "uz.th5": "Width (mm)",
 "uz.th6": "Guess resistance",
 "uz.onerilenEk": " (recommended)",
 "uz.bunuSec": "Use this",
 "uz.bunuSecAria": "Choose {0} digits manually",
 "uz.not": "Characters: barcode text length including the prefix. Width: at a 0.33 mm module, excluding the quiet zone.",
 "uz.elle": "Chosen manually: {0} characters, {1} symbols, {2} modules, about {3} mm wide.",
 "g.bicim": "Format: {0} + {1} encrypted digits{2} ({3} characters)",
 "g.luhnRakami": " + 1 Luhn digit",
 "g.gs1Rakami": " + 1 GS1 check digit",
 "uz.gs1": "Length is fixed by the standard: {0} characters (prefix + {1} encrypted digits + 1 GS1 check digit), {2} modules, about {3} mm wide.",
 "oz.gs1Ok": "GS1 check digit valid ✓",
 "oz.gs1Kotu": "GS1 check digit invalid",
 "g.rakam": " digits",
 "g.karakter": "{0} characters",
 "g.kodlayamiyor": "The selected type cannot encode this text: {0}",
 "olcek.iki": "Scale (module size)",
 "olcek.bir": "Scale (module width)",
 "st.onerilen": " (recommended)",
 "st.iki": " (2D)",
 "svg.olusmadi": "The barcode image could not be created.",
 "b.svgIndir": "Download SVG",
 "o.indirAria": "Download SVG for {0}",
 "h.kodlayamiyor": "The selected type cannot encode this text: {0} Change the prefix or the type.",
 "c.ilk": "First number ({0}): {1}",
 "k.goster": "Show keyword",
 "k.gizle": "Hide keyword",
 "oz.iskelet": "Empty barcode outline",
 "oz.basTam": "The starting sequence number must be a whole number.",
 "oz.basBuyuk": "The starting sequence number is too large.",
 "oz.kuralGecersiz": "The rules are invalid for the preview: {0}",
 "oz.siraNo": "Sequence no. {0}",
 "oz.luhnOk": "Luhn valid ✓",
 "oz.luhnKotu": "Luhn invalid",
 "oz.luhnKapali": "Luhn off",
 "oz.geriOk": "decoded back ✓",
 "oz.geriKotu": "could not decode back",
 "oz.not": "{0} samples in mixed order (from sequence numbers {1} - {2}).",
 "oz.notDisi": " The range is smaller than {0}, so extra samples beyond the range were generated for testing only; samples past the end number in the rules are only for trying out.",
 "oz.olusmadi": "The preview could not be created: {0}",
 "oz.topluGit": "Bulk generation: the rules from the preview were kept.",
 "t.tukendi": "The sequence numbers in the rules are exhausted (end: {0}). Increase the end in Rules or change the start.",
 "t.ayrinti": "Sequence number used: {0}{1} · Prefix: {2} · encrypted digits: {3}{4} · {5} characters",
 "t.oto": " (chosen automatically)",
 "t.elle": " (entered by hand)",
 "t.luhnRakam": " · Luhn check digit: {0}",
 "t.uretildi": "Barcode generated: {0}",
 "t.uretilemedi": "The barcode could not be generated.",
 "t.panoYok": "This browser does not support writing to the clipboard; select and copy the number by hand.",
 "t.kopyalandi": "Copied.",
 "t.panoya": "Barcode number copied to the clipboard.",
 "t.panoIzin": "Could not copy to the clipboard (permission denied); select and copy the number by hand.",
 "cz.bos": "The barcode text is empty; no image could be generated.",
 "cz.cevrilemedi": "This text could not be turned into a barcode with the selected type: {0}",
 "cz.goruntu": "Image of the queried barcode ({0}):",
 "cz.uretilemedi": "The barcode image could not be generated: {0}",
 "cz.gecerli": "Valid barcode. Sequence no.: {0}",
 "cz.cozuldu": "Barcode decoded: sequence no. {0}",
 "cz.cozulemedi": "The barcode could not be decoded.",
 "l.maks": "At most 1,000,000 rows can be generated at a time.",
 "l.uretilemedi": "The list could not be generated.",
 "l.uretiliyor": "Generating…",
 "l.uretiliyorD": "Generating list…",
 "l.tamam": "{0} rows generated ({1}); all collision-free, Luhn-checked and verified by decoding back.",
 "l.ilk500": " The first 500 rows are shown on screen; the export includes all of them.",
 "l.uretildi": "{0} barcodes generated.",
 "l.disi": " The range is smaller than 4, so extra samples beyond the range were generated for testing only (they are not added to the list).",
 "l.iptal": "Operation cancelled.",
 "l.cakisma": "A collision was found; the operation was stopped.",
 "l.dogrulamaHata": "Verification error, operation stopped",
 "l.ilerleme": "Generating… {0} / {1} ({2}%)",
 "d.liste": "Generated list: {0} rows ({1})",
 "d.yok": "No list generated yet",
 "d.indir": "Download as {0}",
 "d.onceListe": "Generate the list first; then you can download or copy it to the clipboard.",
 "d.ikili": "This format is a binary file; it cannot be copied to the clipboard, please download it as a file.",
 "d.kopyaLimit": "Copying to the clipboard is available for at most {0} rows ({1} rows here); please download it as a file.",
 "d.preBos": "(Once a list is generated, the first {0} rows in the selected format appear here.)",
 "d.preIkili": "({0} is a binary file; no preview is shown. The file will contain {1} rows: Sira No, Seri, Barkod columns, all cells as text.)",
 "d.indirildi": "Downloaded as {0} ({1} rows).",
 "d.indirilemedi": "Could not download: {0}",
 "d.panoYok": "This browser does not support writing to the clipboard; please download it as a file.",
 "d.kopyalandi": "Copied to the clipboard ({0} rows).",
 "d.panoIzin": "Could not copy to the clipboard (permission denied). Please download it as a file.",
 "ky.varsayilan": "Returned to the default rules.",
 "ky.aktarildi": "Rules exported to a file (the keyword is not included).",
 "ky.buyuk": "The rules file is too large.",
 "ky.yuklendi": "Rules loaded.",
 "ky.uyari": " Warning: {0}",
 "ky.okunamadi": "The file could not be read.",
 "ky.dosyaYok": "There is no file in the dropped item.",
 "ky.yeniSeri": "New series started: {0} ({1} - {2}). The keyword and rules were kept.",
 "dosya.sikistirma": "This browser cannot open compressed XLSX files. Convert the file to CSV and upload that.",
 "dosya.xlsxHata": "The XLSX file could not be read: {0} Save the file as CSV and upload that.",
 "dosya.xls": "The .xls format is not supported; save the file as .xlsx or CSV and upload that.",
 "dosya.tur": "Supported file types: CSV, TXT, XLSX.",
 "dosya.buyuk": "The file is too large (25 MB at most).",
 "dosya.okunamadi": "The file could not be read.",
 "dosya.kesildi": " The file has more than {0} rows; only the first {0} rows were processed.",
 "hk.bos": "Empty value.",
 "hk.cokUzun": "The value is too long.",
 "hk.sayiDegil": "A sequence number must consist of digits only.",
 "hk.yinelenen": "Duplicate sequence number (first seen on row {0}).",
 "cd.gecerli": "Valid",
 "dosya.bos": "No rows to process were found in the file.",
 "dosya.isleniyor": "Processing… {0} / {1}",
 "cd.ozet": "{0} rows: {1} valid, {2} invalid.",
 "dosya.baslik": " The first row was treated as a header and skipped.",
 "dosya.ilk500": " The first 500 rows are shown in the table; the CSV contains all of them.",
 "cd.durum": "{0} barcodes from the file were decoded.",
 "cd.gecersiz": "Invalid",
 "cd.b1": "Row",
 "cd.b2": "Barcode",
 "cd.b3": "Status",
 "cd.b4": "Sequence no.",
 "cd.b5": "Description",
 "uf.hataSatir": "Row {0}: {1}",
 "uf.hicbiri": "No valid sequence numbers were found.",
 "uf.liste": "Barcodes were generated for {0} sequence numbers from the file ({1}).",
 "uf.ozet": "{0} barcodes generated, {1} rows had errors.",
 "uf.ornek": " Example errors: {0}",
 "uf.durum": "{0} barcodes generated (from file).",
 "ur.b1": "Row",
 "ur.b2": "Value",
 "ur.b3": "Error",
 "dg.onek": "The prefix does not match.",
 "dg.bicim": "Wrong format (digit count, a non-digit character or a first digit of 0).",
 "dg.luhn": "The Luhn check digit does not match.",
 "dg.yinelenen": "Duplicate value.",
 "dg.aralik": "The sequence number is outside the range (capacity) in the rules.",
 "dg.turOnek": "Prefix",
 "dg.turBicim": "Format",
 "dg.turLuhn": "Luhn",
 "dg.turYinelenen": "Duplicate",
 "dg.turAralik": "Range",
 "dg.yuklendi": "{0}: {1} values loaded. Press “Validate”.",
 "dg.bos": "There is nothing to validate. Paste into the text box or load a file.",
 "dg.bitti": "{0} values checked: {1} valid, {2} with errors.",
 "dg.aralikYok": " The range check was skipped because no keyword was entered or it is invalid.",
 "dg.durum": "Validation finished.",
 "dg.b1": "Row",
 "dg.b2": "Value",
 "dg.b3": "Error type",
 "dg.b4": "Description",
 "gc.doldur": "Refill",
 "gc.doldurAria": "Refill the rules from the entry {0}",
 "gc.bellek": "The browser does not allow storage; the history is kept only while this page is open.",
 "cb.uyari": "This series and range were generated before ({0}). You can still continue; the same numbers may be printed again.",
 "cb.coklu": " Number of overlapping entries: {0}.",
 "pf.yok": "(no saved profiles)",
 "pf.bellek": "The browser does not allow storage; profiles are kept only while this page is open.",
 "pf.adGecersiz": "The profile name must be 1-40 characters; use only letters, digits, spaces, _ - .",
 "pf.dolu": "At most {0} profiles can be stored; delete one first.",
 "pf.guncellendi": "Profile updated: {0}",
 "pf.kaydedildi": "Profile saved: {0}",
 "pf.sec": "Select a profile from the list first.",
 "pf.yuklendi": "Profile loaded: {0}. The keyword is not in the profile; enter it if needed.",
 "pf.silindi": "Profile deleted: {0}",
 "pf.disa": "Profiles exported to a file.",
 "pf.buyuk": "The profile file is too large.",
 "pf.ice": "{0} profiles added, {1} invalid profiles skipped.",
 "lg.secili": "Logo loaded (memory only; not included in ZPL/TSPL output).",
 "lg.tur": "The logo must be PNG, JPEG or SVG.",
 "lg.buyuk": "The logo can be at most 200 KB.",
 "lg.gecersiz": "The logo file is not a valid PNG, JPEG or SVG.",
 "gc.dolduruldu": "Rules were filled from the history entry (series, range, barcode type, length). Check the prefix and method; the keyword is not saved.",
 "gc.listelendi": "History listed.",
 "gc.onay": "Delete the history?",
 "gc.temizlendi": "History cleared.",
 "gc.disa": "History exported to a file.",
 "gc.buyuk": "The history file is too large.",
 "gc.ice": "{0} entries added, {1} invalid entries skipped.",
 "et.izgara": "A4 grid {0} x {1} ({2} labels)",
 "et.elle": "Manual / printer default",
 "et.listeYok": "Generate the list in the List tab first, or choose “First numbers of the rules” as the content.",
 "et.onizNot": "{0} labels, {1} pages. The preview shows the first {2} labels.",
 "et.pdfAcildi": "The print dialog is open: choose “Save as PDF” as the destination and set the scale to 100%.",
 "et.yazAcildi": "The print dialog is open ({0} labels).",
 "kam.destekYokTam": "This browser has no barcode reading feature (BarcodeDetector); camera and image reading are unavailable. Type the barcode text by hand.",
 "kam.destekYok": "This browser does not support camera reading. You can choose a barcode image with “Read from image” or type the text by hand.",
 "kam.izin": "Camera permission was not granted. You can allow it in the browser settings, use “Read from image” or type the text by hand.",
 "kam.yok": "No camera was found. You can choose a barcode image with “Read from image” or type the text by hand.",
 "kam.mesgul": "The camera may be in use by another application. Close that application and try again.",
 "kam.guvensiz": "The camera opens only in a secure context (https or a local file).",
 "kam.okunamadi": "No barcode was found in the image. Try a clearer, closer image.",
 "kam.genel": "The camera or image could not be read. You can type the barcode text by hand.",
 "kam.okundu": "Value read: {0}. Now press “Decode and check”.",
 "kam.okunduD": "Barcode read: {0}",
 "kam.aciliyor": "Opening the camera; hold the barcode in the viewing area…",
 "kam.kapandi": "Camera closed.",
 "ye.yanlis": "The password is wrong or the backup file has been altered; the backup could not be opened.",
 "ye.bozuk": "This file is not a valid TAARKOD encrypted backup or it is corrupt.",
 "ye.surum": "The version of the backup file is not supported.",
 "ye.yineleme": "The key derivation setting in the backup file is outside the accepted range.",
 "ye.destekYok": "Encryption (WebCrypto) is not available in this browser.",
 "ye.kisa": "The password must be at least {0} characters.",
 "ye.eslesmiyor": "The passwords do not match.",
 "ye.sifreleniyor": "Encrypting…",
 "ye.alindi": "The encrypted backup was downloaded. If you forget the password the backup cannot be opened; there is no recovery.",
 "ye.alindiD": "Encrypted backup created (the keyword is not included).",
 "ye.parolaIste": "Type the password first, then choose the backup file.",
 "ye.buyuk": "The backup file is too large.",
 "ye.aciliyor": "Opening the backup…",
 "ye.yuklendi": "The backup was opened and the rules were loaded. You need to enter the keyword again.",
 "ye.yukleniDurum": "Rules loaded from the encrypted backup.",
 "ma.secilmedi": "(not selected)",
 "dil.degisti": "Language: English",
 "ks.yok": "There is no list to download; generate a list in the bulk generation section first.",
 "ma.son": "Last cleanup: {0}, deleted: {1}.",
 "ma.dogrulamaYok": " The verification file was not found; no cleanup was done.",
 "ma.surumSatir": "{0} (version {1})",
 "ma.surumYok": "Version information could not be retrieved.",
 "ma.klasorSecildi": "Folder selected.",
 "ma.klasorSecilemedi": "The folder could not be selected.",
 "ma.sha": "The verification file was not found; no cleanup was done. (The folder needs the SHA256.txt record of the current version.)",
 "ma.dogrulamaYokD": "The verification file was not found; no cleanup was done.",
 "ma.bulundu": "{0} old version files found.",
 "ma.onceKlasor": "Choose a folder first.",
 "ma.tarama": "The scan failed.",
 "ma.onay": "Send the listed old version files to the recycle bin?",
 "ma.silindi": "{0} files were sent to the recycle bin",
 "ma.hataEk": ", {0} files had errors.",
 "ma.temizlikHata": "The cleanup failed.",
 "ma.ayarHata": "The setting could not be saved.",
 "init.hazir": "Ready.",
 "al.Başlangıç": "Start",
 "al.Bitiş": "End",
 "al.Tahmin direnci": "Guess resistance",
 "al.Toplam rakam": "Total digits",
 "al.Kaç örnek": "Number of samples",
 "al.Etiket sayısı": "Number of labels",
 "kat.Tablo": "Table",
 "kat.Veri": "Data",
 "kat.Belge": "Document",
 "kat.Etiket": "Label",
 "kat.Diğer": "Other",
 "dosya.k.xlsx-bozuk": "The file is not a valid XLSX (ZIP) file.",
 "dosya.k.xlsx-zip64": "The ZIP64 format is not supported.",
 "dosya.k.xlsx-sifreli": "Password-protected XLSX files are not supported.",
 "dosya.k.xlsx-buyuk": "The XLSX contents are too large.",
 "dosya.k.xlsx-yontem": "Unsupported ZIP compression method.",
 "dosya.k.xlsx-sayfa-yok": "No worksheet was found in the XLSX.",
 "dosya.k.dosya-buyuk": "The file is too large (25 MB at most).",
 "ip.aria": "Explanation",
 "ip.onek.ean13": "Digits only. Prefix + encrypted digits + 1 check digit = 13 digits. 869 is a GS1 prefix allocated to Türkiye (GS1 Türkiye); having a prefix in this range does not mean the number belongs to you. For products that will be sold, get your company prefix from GS1 Türkiye. The longer the prefix, the fewer digits remain for the encrypted part and the fewer sequence numbers fit.",
 "ip.onek.ean8": "Digits only. Prefix + encrypted digits + 1 check digit = 8 digits; there is very little room, so keep the prefix short. 86 is only a starting point (the GS1 prefixes allocated to Türkiye are 868 and 869). For products that will be sold, get the number from GS1 Türkiye.",
 "ip.onek.upca": "Digits only. Prefix + encrypted digits + 1 check digit = 12 digits. The first digit is the number system digit: 0 is for ordinary products (6 and 7 are also used normally); 2, 3, 4 and 5 are reserved for special uses such as weighed goods, pharmaceuticals, in-store use and coupons. For products that will be sold, get your company prefix from GS1.",
 "ip.onek.itf14": "Digits only. Prefix + encrypted digits + 1 check digit = 14 digits. The first digit is the packaging indicator (1-8 mark packaging levels such as cartons and pallets, 9 marks variable-measure items); the preset 1869 combines indicator 1 with the Türkiye prefix (869). For products that will be sold, use the company prefix issued by GS1 Türkiye.",
 "ip.onek.c39": "A fixed part added to the start of the barcode. At most 8 characters; it must start with a letter or digit. Only CAPITAL letters, digits, space and - . $ / + % are allowed: Code 39 and Code 93 cannot encode lowercase letters. The longer the prefix, the longer the barcode.",
 "ip.onek.qr": "A fixed part added to the start of the barcode. At most 8 characters; it must start with a letter or digit. When a phone reads the QR code this prefix is shown too, so you can choose a meaningful name.",
 "ip.onek.dm": "A fixed part added to the start of the barcode. At most 8 characters; it must start with a letter or digit. Data Matrix is meant for small labels; a short prefix keeps the code smaller.",
 "ip.onek.c128": "A fixed part added to the start of the barcode. At most 8 characters; it must start with a letter or digit. You can use lower and upper case letters. It looks like a product code and shows which series the barcode belongs to. The longer the prefix, the longer the barcode.",
 "ip.standart": "When you pick a type, the prefix is adjusted for it automatically (a suitable prefix you typed yourself is kept); you can change the other fields as you like.",
 "ip.standart.gs1": "For this type the total number of digits is fixed by the standard ({0}); the length and check digit fields are locked.",
 "ip.luhn.gs1": "For this type the last digit is always the GS1 check digit (GS1’s mod 10 method with 3-1 weights, not Luhn) and it cannot be turned off. Readers use this digit to reject misreads.",
 "ip.luhn": "When on, a check digit is added to the end of the barcode (Luhn method, over the encrypted digits only). It catches misread or mistyped numbers when decoding and validating. Use the same setting when decoding.",
 "ip.seri": "A name you give to the run; it is used in the history and in the double-print warning. It is not written into the barcode. At most 40 characters: letters, digits, spaces and _ - .",
 "ip.bas": "The first sequence number to generate. The sequence number is the number before encryption; the digits in the barcode are derived from it. To continue where you left off, enter one more than the end of the previous series.",
 "ip.son": "The last sequence number to generate; it cannot be smaller than the start. Automatic length is chosen from this value. The largest sequence number that fits the barcode length is limited.",
 "ip.son.gs1": "With the current prefix, this type fits sequence numbers up to {0}.",
 "ip.uzunluk": "Automatic: the total number of digits is chosen for you from the end sequence number and the guess resistance (recommended). Manual: you type the total number of digits. A longer code is harder to guess but makes the barcode wider.",
 "ip.uzunluk.gs1": "For this type the total number of digits is fixed by the standard ({0}); the automatic/manual choice and the length fields cannot be used.",
 "ip.uzunluk.cift": "Code 128 and Data Matrix pack digits in pairs; an even number of digits keeps the barcode shorter.",
 "ip.direnc": "Let the chance that a randomly tried number matches a valid sequence number be at most 1/value. The larger the value, the longer the code. Used only with automatic length.",
 "ip.toplam.gs1": "Fixed for this type: prefix + encrypted digits + 1 check digit = {0} digits; the field is locked.",
 "ip.toplam": "The total number of digits excluding the prefix; encrypted digits and the check digit (if any) are included. Used only with manual length; the end sequence number must fit this length (at least 2 encrypted digits are needed).",
 "ip.yontem": "The method that turns the sequence number into a random-looking code. Decoding needs the same method, the same rules and the same keyword. The keyword is never written to a file, the history or a profile; if you forget it the codes cannot be decoded. The cards below explain how the methods differ.",
 "ip.sakla": "Rules are not stored in the browser; export them to a file to keep them.",
 "on.gs1": "Rules adjusted for {0}: prefix {1}, {2} digits in total (check digit included).",
 "on.std": "Rules adjusted for {0}: prefix {1}.",
 "on.bos": "(empty)",
 "y.izinsiz": "This method cannot be used with {0}.",
 "ip.kar.rakam": "For this type the prefix can only be digits. GS1 barcodes carry digits only.",
 "ip.kar.buyuk": "For this type the prefix uses capital letters, digits, space and - . $ / + %. This code cannot encode lowercase letters.",
 "ip.kar.ascii": "For this type the prefix can be made of letters, digits and the allowed symbols. The encrypted part is still digits only.",
 "ip.kar.metin": "For this type the prefix can be made of letters, digits and the allowed symbols. A reader shows it as plain text.",
 "ip.tur.sabit": "Rules for this type: {0} digits in total (fixed), the check digit is GS1 and mandatory, preset prefix {1}.",
 "ip.tur.aralik": "Rules for this type: total digits between {0} and {1}, the check digit is optional, preset prefix {2}.",
 "ip.kontrol.gs1": "For this type the check digit is calculated with GS1 mod 10 and is mandatory. Readers use it to reject misreads.",
 "ip.kontrol.luhn": "For this type the check digit is optional. If you turn it on it is calculated with Luhn, and decoding needs the same setting.",
 "ip.ut.sabit": "For this type the length is fixed ({0} digits). The standard defines no other length.",
 "ip.ut.aralik": "For this type the total digits can be chosen between {0} and {1}. At least 2 encrypted digits are required.",
 "ip.yt.hepsi": "All three methods can be used with this type. All of them produce digits only.",
 "ip.yt.kisit": "Only {0} method(s) can be used with this type; the others are disabled and the card says why.",
 "gv.red": "Warning: This color combination does not meet the readability rule ({0} / {1}: {2}, required {3}); the previous look was kept.",
 "gv.duzeltme": "{0} color(s) were adjusted automatically for readability.",
 "gv.sifir": "Returned to the default look.",
 "gv.klasik": "Classic look applied (the previous version's colors and sizes).",
 "gv.ip.ton": "Tint: only the accent colors follow the palette. Buttons, links, selected items, badges and the thread (stitch) line change; the strip, page background and surfaces keep the app's own color. It is fast and text always stays readable.",
 "gv.ip.tum": "Whole interface: the strip, page background, tab bar, tables, boxes, drop-down menu and bottom status bar are also derived from the palette's tone. Text and border colors are fitted to the readability rule against the background.",
 "gv.ip.etiket": "The barcode label always stays black on white (scan safety).",
 "gv.ip.iplik": "The thread is the single secondary accent: the stitch line on the strip, the progress indicator, the selected tab's line and the focus ring in the dark theme. “Palette”: the selected palette's own thread color. “None”: hides only the stitch line (the palette color stays).",
 "gv.ip.serit": "Solid: the strip is a solid band in the palette color. Thin line: the strip stays on the page surface and the palette color shows only as a thin top line.",
 "gv.ip.yogun": "Comfortable: button and field height 44 px. Compact: 36 px, more content fits; this is below the recommended 40 px minimum on a touch screen.",
 "gv.ip.kontrast": "High: every text and border contrast threshold rises by 1.5; colors are darkened when needed and the focus ring gets thicker."
},
    yontem: {
 "harf-karistirma": {
  "ad": "Letter scrambling",
  "kisa": "Current/default method: shifts the digits according to the letter order of the keyword, moves them around and chains them together.",
  "nasil": "The letters of the keyword are ordered by their rank in the alphabet, and this ordering becomes a scrambling plan that decides where the digits go. Each digit is first shifted according to its own position, then moved to its new place. The digits are then mixed from left to right and from right to left, so changing one digit spreads through the whole code. Because every step can be reversed, the original sequence number is recovered exactly with the right keyword.",
  "artilar": [
   "Very fast.",
   "The output always has the requested number of digits.",
   "Consecutive numbers do not look alike."
  ],
  "eksiler": [
   "Because it works digit by digit, someone who sees many samples has a higher chance of working out the plan than with Feistel.",
   "There is no mathematically sound proof of security."
  ]
 },
 "dogrusal": {
  "ad": "Linear (multiply and add)",
  "kisa": "Multiplies the number by a large number and adds another large number; the simplest and fastest option, but also the weakest.",
  "nasil": "Two large numbers are derived from the keyword: a multiplier and an offset. The number is multiplied by the multiplier, the offset is added, and the result wraps around when it exceeds the digit limit, like a clock going back to 1 after 12. Because the multiplier is chosen coprime to 10, two numbers never fall on the same code and the process can be reversed. Reversing uses a classic method that finds the multiplier's \"inverse\" (the extended Euclidean algorithm).",
  "artilar": [
   "Very fast and very simple.",
   "The output always has the requested number of digits.",
   "No collisions; fully reversible."
  ],
  "eksiler": [
   "Consecutive numbers advance by the same step every time; if the difference of two codes is seen, the pattern can be noticed.",
   "Someone who knows a few number-code pairs can compute the multiplier and offset; it is weak concealment.",
   "It should not be chosen if serious protection is needed."
  ]
 },
 "feistel": {
  "ad": "Feistel network (SHA-256 rounds)",
  "kisa": "Splits the digit string into two halves and mixes them repeatedly with SHA-256; the strongest option, and it keeps the format.",
  "nasil": "The code is split into two halves. In each round one half is changed by a number derived from the digest (SHA-256) of the other half; then the roles swap. The round keys are produced by hashing the keyword thousands of times, so trying to guess the keyword is slow. The digest itself cannot be reversed but the addition can, so the whole network can be run backwards with the right keyword. When a single number changes, almost every digit of the code changes.",
  "artilar": [
   "It conceals consecutive numbers best.",
   "The output is pure digits of the requested length; it fits a barcode directly.",
   "Keyword guessing is deliberately slowed down.",
   "No collisions; fully reversible."
  ],
  "eksiler": [
   "It is slower than the others (though hundreds of thousands of numbers are still generated in a few seconds).",
   "It is harder to understand and audit.",
   "With very short lengths (2-4 digits) concealment is limited because the number of possible codes is small."
  ]
 }
},
    standart: {
 "ean8": {
  "ad": "EAN-8",
  "aciklama": "A short retail barcode used when EAN-13 does not fit on small products (a pen, chewing gum). It carries 8 digits; the last one is the check digit. If you give 7 digits the check digit is added automatically. GS1 issues these numbers one by one.",
  "girdi": "7 digits (check digit added) or 8 digits (verified)"
 },
 "upca": {
  "ad": "UPC-A",
  "aciklama": "The North American retail barcode. It carries 12 digits; the last one is the check digit. With a 0 in front it is the same as EAN-13, so readers worldwide can read it. If you give 11 digits the check digit is added automatically.",
  "girdi": "11 digits (check digit added) or 12 digits (verified)"
 },
 "upce": {
  "ad": "UPC-E",
  "aciklama": "A short form of a UPC-A number with zeros suppressed; it saves space on small packages. The number system digit can only be 0 or 1. The check digit is calculated over the expanded 12-digit UPC-A and also sets the parity pattern of the bars.",
  "girdi": "6 digits (system 0 assumed), 7 digits (system 0/1 + 6) or 8 digits with the check digit"
 },
 "ean5": {
  "ad": "EAN-5",
  "aciklama": "An add-on code placed next to the main barcode. It carries the suggested price on books and extra information on some products. It takes exactly 5 digits; there is no check digit, the verification is hidden in the parity pattern of the bars. It is used next to EAN-13 or UPC-A, not alone.",
  "girdi": "exactly 5 digits"
 },
 "ean2": {
  "ad": "EAN-2",
  "aciklama": "A two-digit add-on code placed next to the main barcode; on magazines and newspapers it shows the issue number. There is no check digit. It is used next to a main barcode such as an ISSN barcode, not alone.",
  "girdi": "exactly 2 digits"
 },
 "codabar": {
  "ad": "Codabar",
  "aciklama": "An old type used on library, blood bank and parcel labels. It carries digits, a few symbols and the letters A-D for start/stop. It has no check character; for new work Code 128 is usually better.",
  "girdi": "0-9 and - $ : / . + characters; start/stop letter A-D (the selected letters are added if you leave them out)"
 },
 "msi": {
  "ad": "MSI",
  "aciklama": "A numeric type seen on warehouse shelves and inventory labels (MSI Plessey). One or two check digits can be added for error checking; you must agree with the reading side on which one you use.",
  "girdi": "digits only; optional check (Mod 10, Mod 10+10, Mod 11)"
 },
 "pharmacode": {
  "ad": "Pharmacode",
  "aciklama": "A single-track type used on pharmaceutical packs to control the packaging line. It carries only a number from 3 to 131070; there is no text line and no check. It is designed for telling packs apart on a production line, not for identifying a product.",
  "girdi": "a whole number from 3 to 131070"
 },
 "code128": {
  "ad": "Code 128",
  "aciklama": "The most common and compact barcode type. It carries letters, digits and symbols. Because it packs consecutive digits in pairs, it gives the shortest output for mostly numeric barcodes. It has its own checksum and readers reject misreads automatically. It is the recommended choice for most labels.",
  "girdi": "letters, digits and symbols (ASCII 0-127)"
 },
 "code39": {
  "ad": "Code 39",
  "aciklama": "An old and very widespread type that almost every reader can read. It carries capital letters, digits and a few symbols; there are no lowercase letters. Each character takes a lot of space, so the barcode comes out long. It is simple and plain, so choose it when compatibility with old devices is needed.",
  "girdi": "capital letters, digits, space and - . $ / + %"
 },
 "ean13": {
  "ad": "EAN-13",
  "aciklama": "Retail product barcode. It carries 13 digits; the last one is the check digit. If you give 12 digits the check digit is added automatically; if you give 13 it is verified. Digits only.",
  "girdi": "12 digits (check digit added) or 13 digits (verified)"
 },
 "itf14": {
  "ad": "ITF-14",
  "aciklama": "Carton and bulk-pack barcode (Interleaved 2 of 5). It carries 14 digits; the last one is the check digit. If you give 13 digits the check digit is added automatically; if you give 14 it is verified. No bearer bars are added.",
  "girdi": "13 digits (check digit added) or 14 digits (verified)"
 },
 "code93": {
  "ad": "Code 93",
  "aciklama": "A denser version of Code 39: it carries the same characters in less space and adds two check characters. There are no lowercase letters. It suits tight spaces if your reader supports it, but it is less common than Code 128.",
  "girdi": "capital letters, digits, space and - . $ / + %"
 },
 "qr": {
  "ad": "QR Code",
  "aciklama": "A two-dimensional square code (model 2, byte mode, versions 1-10, error correction L/M/Q/H). It is read by phone cameras and carries UTF-8 text."
 },
 "datamatrix": {
  "ad": "Data Matrix",
  "aciklama": "A small two-dimensional square code (ECC200, ASCII encoding, 10x10 - 32x32). It is used on very small labels and packs digits in pairs."
 }
},
    bicim: {
 "csv-noktalivirgul": {
  "ad": "CSV (Excel Turkish, ;)",
  "aciklama": "Semicolon-separated CSV with a BOM, for Turkish-locale Excel."
 },
 "csv-virgul": {
  "ad": "CSV (international, ,)",
  "aciklama": "Standard comma-separated CSV."
 },
 "tsv": {
  "ad": "TSV (tab-separated)",
  "aciklama": "Tab-separated text table."
 },
 "xlsx": {
  "ad": "Excel (.xlsx)",
  "aciklama": "A real Excel workbook; all cells are text (leading zeros and long numbers are not corrupted)."
 },
 "json": {
  "ad": "JSON",
  "aciklama": "An array of objects; the sequence number is kept as text."
 },
 "jsonl": {
  "ad": "JSON Lines",
  "aciklama": "One JSON object per line."
 },
 "xml": {
  "ad": "XML",
  "aciklama": "A UTF-8 XML document."
 },
 "sql": {
  "ad": "SQL (INSERT)",
  "aciklama": "A new INSERT statement every 1000 rows."
 },
 "html-tablo": {
  "ad": "HTML table",
  "aciklama": "A self-contained, script-free HTML table."
 },
 "markdown-tablo": {
  "ad": "Markdown table",
  "aciklama": "A Markdown table with pipe (|) separators."
 },
 "txt": {
  "ad": "Plain text",
  "aciklama": "Only the barcode on each line."
 },
 "zpl": {
  "ad": "ZPL (Zebra)",
  "aciklama": "Labels for Zebra label printers (Code 128 by default; Code 39/93, QR and Data Matrix can also be chosen)."
 },
 "tspl": {
  "ad": "TSPL (TSC)",
  "aciklama": "TSPL commands for TSC label printers (label size in mm)."
 }
},
    hata: [
 [
  "^GS1: veri boş\\.$",
  "GS1: no data."
 ],
 [
  "^GS1: parantezli biçim bekleniyor, örn\\. (.+)\\.$",
  "GS1: bracketed format expected, e.g. $1."
 ],
 [
  "^GS1: \\((\\d+)\\) uygulama tanımlayıcısı desteklenmiyor\\.$",
  "GS1: the application identifier ($1) is not supported."
 ],
 [
  "^GS1 \\((\\d+)\\): değer boş olamaz\\.$",
  "GS1 ($1): the value cannot be empty."
 ],
 [
  "^GS1 \\((\\d+)\\): değerde parantez kullanılamaz\\.$",
  "GS1 ($1): parentheses cannot be used in the value."
 ],
 [
  "^GS1 \\((\\d+)\\): yalnızca rakam olabilir\\.$",
  "GS1 ($1): only digits are allowed."
 ],
 [
  "^GS1 \\((\\d+)\\): \"([\\s\\S])\" karakteri GS1 karakter kümesi \\(82\\) dışında\\.$",
  "GS1 ($1): the character \"$2\" is outside the GS1 character set (82)."
 ],
 [
  "^GS1 \\((\\d+)\\): uzunluk (\\d+) hane olmalı\\.$",
  "GS1 ($1): the length must be $2 digits."
 ],
 [
  "^GS1 \\((\\d+)\\): en çok (\\d+) karakter olabilir\\.$",
  "GS1 ($1): at most $2 characters are allowed."
 ],
 [
  "^GS1 \\((\\d+)\\): tarih geçersiz \\(YYAAGG biçiminde, ay 01-12\\)\\.$",
  "GS1 ($1): the date is invalid (YYMMDD format, month 01-12)."
 ],
 [
  "^GS1 \\((\\d+)\\): kontrol rakamı hatalı \\(beklenen (\\d)\\)\\.$",
  "GS1 ($1): the check digit is wrong (expected $2)."
 ],
 [
  "^GS1: \\((\\d+)\\) bir veride yalnız bir kez kullanılabilir\\.$",
  "GS1: ($1) can be used only once in a data string."
 ],
 [
  "^GS1: GS1-128 için en çok (\\d+) veri karakteri \\(AI'lar dahil\\) kodlanabilir\\.$",
  "GS1: at most $1 data characters (including AIs) can be encoded in GS1-128."
 ],
 [
  "^GS1: yazıcı seçeneği geçersiz: (.+)$",
  "GS1: invalid printer option: $1"
 ],
 [
  "^ZPL: GS1-128 verisinde \">\" karakteri desteklenmiyor\\.$",
  "ZPL: the \">\" character is not supported in GS1-128 data."
 ],
 [
  "^TSPL: veride çift tırnak karakteri desteklenmiyor\\.$",
  "TSPL: the double quote character is not supported in the data."
 ],
 [
  "^TSPL: GS1 DataMatrix \\(FNC1\\) desteklenmiyor; ZPL kullanın\\.$",
  "TSPL: GS1 DataMatrix (FNC1) is not supported; use ZPL."
 ],
 [
  "^Code 128(B): \"([\\s\\S])\" karakteri desteklenmiyor \\(B: .*\\)\\.$",
  "Code 128$1: the character \"$2\" is not supported (B: upper and lower case letters, digits and symbols; no control characters)."
 ],
 [
  "^(EAN-13|EAN-8|EAN-5|EAN-2|UPC-A|UPC-E|ITF-14|MSI|Pharmacode|Code 128C): yalnızca rakam kodlanabilir\\.$",
  "$1: only digits can be encoded."
 ],
 [
  "^(EAN-13|EAN-8|UPC-A|UPC-E|ITF-14): kontrol rakamı hatalı \\(beklenen (\\d)\\)\\.$",
  "$1: the check digit is wrong (expected $2)."
 ],
 [
  "^(EAN-13|EAN-8|UPC-A|ITF-14): (\\d+) rakam \\(kontrol rakamı otomatik eklenir\\) ya da kontrol rakamıyla birlikte (\\d+) rakam verilmeli\\.$",
  "$1: give $2 digits (the check digit is added automatically) or $3 digits including the check digit."
 ],
 [
  "^(EAN-5|EAN-2): tam (\\d) rakam verilmeli\\.$",
  "$1: give exactly $2 digits."
 ],
 [
  "^UPC-E: 6 rakam .*$",
  "UPC-E: give 6 digits (system 0 assumed), 7 digits (system + 6) or 8 digits with the check digit."
 ],
 [
  "^UPC-E: sistem rakamı yalnızca 0 ya da 1 olabilir\\.$",
  "UPC-E: the system digit can only be 0 or 1."
 ],
 [
  "^Pharmacode: değer 3 ile 131070 arasında olmalı\\.$",
  "Pharmacode: the value must be between 3 and 131070."
 ],
 [
  "^MSI: bilinmeyen sağlama türü: (.*)$",
  "MSI: unknown check type: $1"
 ],
 [
  "^MSI: Mod 11 .*$",
  "MSI: the Mod 11 check value comes out as 10 for this number and cannot be written as one digit; choose another check type."
 ],
 [
  "^(Codabar|Code 128[ABC]?): boş metin kodlanamaz\\.$",
  "$1: empty text cannot be encoded."
 ],
 [
  "^Codabar: \"(.)\" karakteri desteklenmiyor .*$",
  "Codabar: the character \"$1\" is not supported (0-9 - $ : / . + and A-D for start/stop)."
 ],
 [
  "^Codabar: başlangıç ve bitiş harfi A, B, C ya da D olmalı\\.$",
  "Codabar: the start and stop letters must be A, B, C or D."
 ],
 [
  "^Codabar: başlangıç ve bitiş harfleri arasında en az 1 karakter olmalı\\.$",
  "Codabar: there must be at least 1 character between the start and stop letters."
 ],
 [
  "^Code 128C: rakamlar ikişerli yazılır, çift sayıda rakam gerekir \\(şimdi (\\d+)\\)\\.$",
  "Code 128C: digits are written in pairs, so an even number of digits is needed (now $1)."
 ],
 [
  "^Code 128(A): \"([\\s\\S])\" karakteri desteklenmiyor \\(A: .*\\)\\.$",
  "Code 128$1: the character \"$2\" is not supported (A: capital letters, digits, symbols and control characters; no lowercase)."
 ],
 [
  "^Önek en fazla 8 karakter olmalı; harf ya da rakamla başlamalı, sonra yalnızca harf, rakam, boşluk ve - \\. \\$ / \\+ % içerebilir\\.$",
  "The prefix must be at most 8 characters; it must start with a letter or digit and may then contain only letters, digits, spaces and - . $ / + %."
 ],
 [
  "^Seri adı en fazla 40 karakter olmalı; yalnızca harf, rakam, boşluk, _ - \\. kullanın\\.$",
  "The series name must be at most 40 characters; use only letters, digits, spaces and _ - ."
 ],
 [
  "^Dosya geçerli bir kural dosyası değil \\(nesne bekleniyordu\\)\\.$",
  "The file is not a valid rules file (an object was expected)."
 ],
 [
  "^\"(.*)\" alanındaki değer geçersiz olduğu için varsayılan kullanıldı\\.$",
  "The value in the \"$1\" field is invalid, so the default was used."
 ],
 [
  "^Aralıkta bitiş, başlangıçtan küçük; aralık varsayılana döndürüldü\\.$",
  "In the range the end is smaller than the start; the range was reset to the default."
 ],
 [
  "^Bilinmeyen alanlar yok sayıldı: (.*)$",
  "Unknown fields were ignored: $1"
 ],
 [
  "^Kural dosyası çok büyük ya da okunamadı\\.$",
  "The rules file is too large or could not be read."
 ],
 [
  "^Dosya geçerli bir JSON değil\\.$",
  "The file is not valid JSON."
 ],
 [
  "^Yeni seri için sıra numarası aralığı kalmadı\\.$",
  "No sequence number range is left for a new series."
 ],
 [
  "^Seçilen standart bu önekle kullanılamaz: EAN-13, EAN-8, UPC-A ve ITF-14 önekinde yalnızca rakam olabilir\\.$",
  "The selected type cannot be used with this prefix: the prefix of EAN-13, EAN-8, UPC-A and ITF-14 can contain digits only."
 ],
 [
  "^Seçilen standart bu önekle kullanılamaz: (.*)$",
  "The selected type cannot be used with this prefix: $1"
 ],
 [
  "^Şifreli sıra numarası için en az 2 rakam gerekir; uzunluğu artırın\\.$",
  "At least 2 digits are needed for the encrypted sequence number; increase the length."
 ],
 [
  "^Şifreli sıra numarası en fazla 30 rakam olabilir\\.$",
  "The encrypted sequence number can have at most 30 digits."
 ],
 [
  "^En büyük sıra numarası \\((.*)\\) (.*) rakama sığmıyor \\(ilk rakam 0 olamayacağı için en çok (.*) olabilir\\)\\. Uzunluğu artırın ya da aralığı küçültün\\.$",
  "The highest sequence number ($1) does not fit in $2 digits (since the first digit cannot be 0, at most $3 is allowed). Increase the length or reduce the range."
 ],
 [
  "^Kural eksik\\.$",
  "The rule is missing."
 ],
 [
  "^Bilinmeyen barkod standardı\\.?$",
  "Unknown barcode type."
 ],
 [
  "^Bilinmeyen barkod standardı: (.*)$",
  "Unknown barcode type: $1"
 ],
 [
  "^Luhn ayarı eksik\\.$",
  "The Luhn setting is missing."
 ],
 [
  "^Toplam rakam sayısı geçersiz\\.$",
  "The total digit count is invalid."
 ],
 [
  "^Şifreli rakam sayısı 2 ile 30 arasında olmalı\\.$",
  "The encrypted digit count must be between 2 and 30."
 ],
 [
  "^Sıra numarası yalnızca rakamlardan oluşmalı\\.$",
  "A sequence number must consist of digits only."
 ],
 [
  "^Sıra numarası pozitif tam sayı olmalı\\.$",
  "The sequence number must be a positive whole number."
 ],
 [
  "^Sıra numarası (.*) rakama sığmıyor \\(en çok (.*) olabilir\\)\\.$",
  "The sequence number does not fit in $1 digits (at most $2 is allowed)."
 ],
 [
  "^Sıra numarası (.*) haneye sığmıyor\\.$",
  "The sequence number does not fit in $1 digits."
 ],
 [
  "^Şifreleme döngüsü sınırı aşıldı; yöntem ya da anahtar kelimeyi değiştirin\\.$",
  "The encryption loop limit was exceeded; change the method or the keyword."
 ],
 [
  "^Barkod metni boş\\.$",
  "The barcode text is empty."
 ],
 [
  "^Barkod \"(.*)\" önekiyle başlamıyor\\.$",
  "The barcode does not start with the prefix \"$1\"."
 ],
 [
  "^Önekten sonra yalnızca rakam olmalı\\.$",
  "Only digits are allowed after the prefix."
 ],
 [
  "^Önekten sonra (.*) rakam bekleniyordu, (.*) rakam var\\.$",
  "$1 digits were expected after the prefix, but there are $2."
 ],
 [
  "^Önekten sonraki ilk rakam 0 olamaz \\(1-9 olmalı\\)\\.$",
  "The first digit after the prefix cannot be 0 (it must be 1-9)."
 ],
 [
  "^Luhn kontrol rakamı tutmuyor: barkod yanlış okunmuş ya da değiştirilmiş\\.$",
  "The Luhn check digit does not match: the barcode was misread or altered."
 ],
 [
  "^Çözme döngüsü sınırı aşıldı; yöntem ya da anahtar kelime uyumsuz\\.$",
  "The decoding loop limit was exceeded; the method or keyword does not match."
 ],
 [
  "^Anahtar kelime en az 2 harf olmalı\\.$",
  "The keyword must have at least 2 letters."
 ],
 [
  "^Anahtar kelimede desteklenmeyen karakter: \"(.*)\"\\. Yalnızca harf kullanın\\.$",
  "Unsupported character in the keyword: \"$1\". Use letters only."
 ],
 [
  "^Anahtar kelimede en az 2 farklı harf olmalı\\.$",
  "The keyword must have at least 2 different letters."
 ],
 [
  "^Hane sayısı 2 ile 30 arasında olmalı\\.$",
  "The digit count must be between 2 and 30."
 ],
 [
  "^Kod tam olarak (.*) haneli rakamlardan oluşmalı\\.$",
  "The code must consist of exactly $1 digits."
 ],
 [
  "^Barkod tam olarak (.*) haneli rakamlardan oluşmalı\\.$",
  "The barcode must consist of exactly $1 digits."
 ],
 [
  "^Çarpan modülle aralarında asal değil\\.$",
  "The multiplier is not coprime to the modulus."
 ],
 [
  "^Bilinmeyen şifreleme yöntemi: (.*)$",
  "Unknown encryption method: $1"
 ],
 [
  "^Luhn için yalnızca rakam gerekir\\.$",
  "Luhn needs digits only."
 ],
 [
  "^Metin boş\\.$",
  "The text is empty."
 ],
 [
  "^Metin bu 2B standartta kodlanabilir\\.$",
  "The text can be encoded in this 2D type."
 ],
 [
  "^Metindeki tüm karakterler bu standartta kodlanabilir\\.$",
  "All characters in the text can be encoded in this type."
 ],
 [
  "^Code 128: boş metin kodlanamaz\\.$",
  "Code 128: empty text cannot be encoded."
 ],
 [
  "^Code 128: \"(.*)\" karakteri desteklenmiyor \\(yalnızca ASCII 0-127\\)\\.$",
  "Code 128: the character \"$1\" is not supported (ASCII 0-127 only)."
 ],
 [
  "^Code 39: boş metin kodlanamaz\\.$",
  "Code 39: empty text cannot be encoded."
 ],
 [
  "^Code 39: \"(.*)\" karakteri desteklenmiyor \\(yalnızca A-Z 0-9 - \\. \\$ / \\+ % ve boşluk; küçük harf yok\\)\\.$",
  "Code 39: the character \"$1\" is not supported (only A-Z 0-9 - . $ / + % and space; no lowercase)."
 ],
 [
  "^Code 93: boş metin kodlanamaz\\.$",
  "Code 93: empty text cannot be encoded."
 ],
 [
  "^Code 93: \"(.*)\" karakteri desteklenmiyor \\(yalnızca A-Z 0-9 - \\. \\$ / \\+ % ve boşluk\\)\\.$",
  "Code 93: the character \"$1\" is not supported (only A-Z 0-9 - . $ / + % and space)."
 ],
 [
  "^SVG ölçüleri pozitif sayı olmalı\\.$",
  "SVG dimensions must be positive numbers."
 ],
 [
  "^Toplam rakam pozitif tam sayı olmalı\\.$",
  "The total digit count must be a positive whole number."
 ],
 [
  "^En büyük sıra ve tahmin direnci tam sayı olmalı\\.$",
  "The highest sequence and the guess resistance must be whole numbers."
 ],
 [
  "^En büyük sıra numarası en az 1 olmalı\\.$",
  "The highest sequence number must be at least 1."
 ],
 [
  "^Tahmin direnci en az 1 olmalı\\.$",
  "The guess resistance must be at least 1."
 ],
 [
  "^QR: metin çok uzun \\((.*) bayt\\); en çok sürüm (.*) desteklenir\\.$",
  "QR: the text is too long ($1 bytes); at most version $2 is supported."
 ],
 [
  "^QR: hata düzeltme L, M, Q veya H olmalı\\.$",
  "QR: the error correction level must be L, M, Q or H."
 ],
 [
  "^Data Matrix: metin çok uzun \\((.*) sözcük\\); en çok 32x32 \\(62 sözcük\\) desteklenir\\.$",
  "Data Matrix: the text is too long ($1 codewords); at most 32x32 (62 codewords) is supported."
 ],
 [
  "^Satır (.*) geçersiz: ZPL için yalnızca ASCII yazdırılabilir karakterler kabul edilir; \\^, ~ ve > kullanılamaz\\.$",
  "Row $1 is invalid: ZPL accepts only printable ASCII characters; ^, ~ and > cannot be used."
 ],
 [
  "^Satır (.*) geçersiz: TSPL için yalnızca ASCII yazdırılabilir karakterler kabul edilir; \" ve \\\\ kullanılamaz\\.$",
  "Row $1 is invalid: TSPL accepts only printable ASCII characters; \" and \\ cannot be used."
 ],
 [
  "^Satır (.*) geçersiz: düz metin biçiminde barkod satır sonu içeremez\\.$",
  "Row $1 is invalid: in plain text a barcode cannot contain a line break."
 ],
 [
  "^Satır (.*) geçersiz: değerlerde denetim \\(kontrol\\) karakteri bulunamaz\\.$",
  "Row $1 is invalid: values cannot contain control characters."
 ],
 [
  "^Satır (.*) geçersiz: barkod boş olmayan bir metin olmalı\\.$",
  "Row $1 is invalid: the barcode must be non-empty text."
 ],
 [
  "^Tablo adı geçersiz: yalnızca harf, rakam ve _ kullanılabilir; en fazla 40 karakter olmalı\\.$",
  "The table name is invalid: use only letters, digits and _; at most 40 characters."
 ],
 [
  "^SQL çıktısında ters eğik çizgi \\(\\\\\\) kullanılamaz; bazı veritabanlarında kaçış olarak yorumlanır\\.$",
  "A backslash (\\) cannot be used in SQL output; some databases treat it as an escape."
 ],
 [
  "^\"(.*)\" (.*) ile (.*) arasında bir tam sayı \\(nokta\\) olmalı\\.$",
  "\"$1\" must be a whole number (dots) between $2 and $3."
 ],
 [
  "^\"standart\" şunlardan biri olmalı: (.*)\\.$",
  "\"standart\" must be one of: $1."
 ],
 [
  "^Bilinmeyen dışa aktarma biçimi: (.*)$",
  "Unknown export format: $1"
 ],
 [
  "^Satırlar bir dizi olmalı\\.$",
  "Rows must be an array."
 ],
 [
  "^Geçmiş dosyası çok büyük ya da okunamadı\\.$",
  "The history file is too large or could not be read."
 ],
 [
  "^Dosya geçerli bir geçmiş dosyası değil\\.$",
  "The file is not a valid history file."
 ],
 [
  "^Geçmiş kaydı geçersiz\\.$",
  "The history entry is invalid."
 ],
 [
  "^Yazıcı dili için yalnızca rulo etiket şablonları kullanılabilir\\.$",
  "Only roll label templates can be used for a printer language."
 ],
 [
  "^Çözünürlük 203 ya da 300 dpi olmalı\\.$",
  "The resolution must be 203 or 300 dpi."
 ],
 [
  "^Bu tarayıcıda WebCrypto yok\\.$",
  "WebCrypto is not available in this browser."
 ],
 [
  "^Desteklenmeyen dil: (.*)$",
  "Unsupported language: $1"
 ],
 [
  "^Profil dosyası çok büyük ya da okunamadı\\.$",
  "The profile file is too large or could not be read."
 ],
 [
  "^Dosya geçerli bir profil dosyası değil\\.$",
  "The file is not a valid profile file."
 ],
 [
  "^Profil geçersiz: .*$",
  "The profile is invalid: the name must be at most 40 characters (letters, digits, spaces, _ - .) and the rule fields must be valid."
 ],
 [
  "^En fazla (\\d+) profil saklanabilir; önce birini silin\\.$",
  "At most $1 profiles can be stored; delete one first."
 ],
 [
  "^Önek çok uzun: (.+) toplam (\\d+) rakamdır; şifreli sıra numarasına en az 2 rakam kalmalı\\.$",
  "Prefix too long: $1 has $2 digits in total; at least 2 digits must remain for the encrypted sequence number."
 ],
 [
  "^GS1 kuralı geçersiz: önek yalnızca rakam olmalı ve önek \\+ toplam rakam (\\d+) olmalı\\.$",
  "The GS1 rule is invalid: the prefix must be digits only and prefix + total digits must be $1."
 ],
 [
  "^(\\d+) haneli GS1 türünde önek yalnızca rakamdan oluşabilir\\.$",
  "In a $1-digit GS1 type the prefix can only consist of digits."
 ],
 [
  "^Toplam (\\d+) hane olduğu için önek en çok (\\d+) hane olabilir \\(şifreli kısma en az 2 rakam kalmalı\\)\\.$",
  "Because the total is $1 digits, the prefix can be at most $2 digits (at least 2 digits must remain for the encrypted part)."
 ],
 [
  "^Seçilen şifreleme yöntemi bu barkod türünde kullanılamaz\\.$",
  "The selected encryption method cannot be used with this barcode type."
 ]
]
  };
});
