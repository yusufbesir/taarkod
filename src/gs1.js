/* GS1 Uygulama Tanımlayıcı (AI) ayrıştırma/üretme ve yazıcı dili (ZPL, TSPL) çıktısı. Saf JS; DOM yok.
 * Kontrol hanesi için barkod.js içindeki gs1Sagla yeniden kullanılır (kopyalanmaz).
 *
 * Kaynak ve DÜRÜSTLÜK NOTU: AI tablosu, "GS1 General Specifications" (AI listesi, 82 karakterlik küme "CSET 82",
 * mod-10 kontrol hanesi, ön tanımlı sabit uzunluklu AI'larda FNC1 ayırıcı gerekmemesi kuralı) bilgisine dayanır.
 * ZPL/TSPL komutları Zebra ZPL II Programming Guide (^BC mod D, >; >8 çağırma kodları, ^BX ~1) ve TSC TSPL/TSPL2 kılavuzu
 * bilgisine dayanır; gerçek yazıcıda DENENMEDİ. Belirsiz noktalar ilgili işlevlerin başındaki yorumlarda "DOĞRULANMADI" diye işaretlidir.
 *
 * Hata iletileri Türkçe sabit kalıplardır; İngilizce karşılıkları src/dil_en.js içindeki hata listesindedir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./barkod.js'));
  else kok.BarkodGs1 = fabrika(kok.BarkodCiz);
})(typeof self !== 'undefined' ? self : this, function (Barkod) {
  'use strict';

  /* ---------- AI tablosu ---------- */
  // tur: 'n' rakam, 'x' GS1 AI 82 karakter kümesi. sabit: true ise uzunluk = en (FNC1 gerekmez); değilse en çok `en` karakter, FNC1 ile biter.
  // kontrol: mod-10 kontrol haneli; tarih: YYMMDD.
  function s(ai, ad, adEn, tur, en, sabit, ek) {
    var o = { ai: ai, ad: ad, adEn: adEn, tur: tur, en: en, sabit: !!sabit, kontrol: false, tarih: false };
    if (ek) for (var k in ek) o[k] = ek[k];
    return o;
  }
  var AI_TABLO = [
    s('00', 'SSCC (sevkiyat birimi)', 'SSCC (shipping unit)', 'n', 18, true, { kontrol: true }),
    s('01', 'GTIN (ürün)', 'GTIN (trade item)', 'n', 14, true, { kontrol: true }),
    s('02', 'Kolideki ürünün GTIN\'i', 'GTIN of contained items', 'n', 14, true, { kontrol: true }),
    s('10', 'Parti/lot numarası', 'Batch/lot number', 'x', 20),
    s('11', 'Üretim tarihi (YYAAGG)', 'Production date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('12', 'Ödeme son günü (YYAAGG)', 'Due date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('13', 'Paketleme tarihi (YYAAGG)', 'Packaging date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('15', 'En iyi tüketim tarihi (YYAAGG)', 'Best before date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('16', 'Satış son tarihi (YYAAGG)', 'Sell by date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('17', 'Son kullanma tarihi (YYAAGG)', 'Expiration date (YYMMDD)', 'n', 6, true, { tarih: true }),
    s('20', 'Ürün çeşidi', 'Internal product variant', 'n', 2, true),
    s('21', 'Seri numarası', 'Serial number', 'x', 20),
    s('22', 'Tüketici ürün çeşidi', 'Consumer product variant', 'x', 20),
    s('30', 'Adet (değişken sayım)', 'Variable count', 'n', 8),
    s('37', 'Koli içi adet', 'Count of trade items', 'n', 8),
    s('240', 'Ek ürün tanımı', 'Additional item identification', 'x', 30),
    s('241', 'Müşteri parça numarası', 'Customer part number', 'x', 30),
    s('242', 'Sipariş değişkeni', 'Made-to-order variation number', 'n', 6),
    s('250', 'İkincil seri numarası', 'Secondary serial number', 'x', 30),
    s('251', 'Kaynak ürün referansı', 'Reference to source entity', 'x', 30),
    s('400', 'Müşteri sipariş numarası', 'Customer purchase order number', 'x', 30),
    s('401', 'Sevkiyat numarası (GINC)', 'Consignment number (GINC)', 'x', 30),
    s('402', 'Sevkiyat kimliği (GSIN)', 'Shipment identification (GSIN)', 'n', 17, true, { kontrol: true }),
    s('410', 'Teslim GLN', 'Ship to / deliver to GLN', 'n', 13, true, { kontrol: true }),
    s('411', 'Fatura GLN', 'Bill to / invoice to GLN', 'n', 13, true, { kontrol: true }),
    s('412', 'Satın alınan yer GLN', 'Purchased from GLN', 'n', 13, true, { kontrol: true }),
    s('413', 'Adına sevk GLN', 'Ship for / deliver for GLN', 'n', 13, true, { kontrol: true }),
    s('414', 'Fiziksel konum GLN', 'Identification of a physical location GLN', 'n', 13, true, { kontrol: true }),
    s('415', 'Faturayı ödeyen GLN', 'GLN of the invoicing party', 'n', 13, true, { kontrol: true }),
    s('416', 'Üretim/hizmet yeri GLN', 'GLN of production or service location', 'n', 13, true, { kontrol: true }),
    s('417', 'Taraf GLN', 'Party GLN', 'n', 13, true, { kontrol: true }),
    s('420', 'Teslim posta kodu', 'Ship to postal code', 'x', 20),
    s('7003', 'Son kullanma tarihi ve saati (YYAAGGSSdd)', 'Expiration date and time (YYMMDDHHmm)', 'n', 10, true),
    s('8003', 'GRAI (döngüsel varlık)', 'GRAI', 'x', 30),
    s('8004', 'GIAI (bireysel varlık)', 'GIAI', 'x', 30),
    s('8200', 'Genişletilmiş paket URL\'si', 'Extended packaging URL', 'x', 70),
    s('90', 'Şirket içi bilgi', 'Information mutually agreed between trading partners', 'x', 30)
  ];
  // 91..99 şirket içi
  for (var q = 91; q <= 99; q++) AI_TABLO.push(s(String(q), 'Şirket içi bilgi', 'Company internal information', 'x', 90));
  // 310n..369n: ölçü/ağırlık, 6 rakam, sabit (n son hane: ondalık basamak sayısı). Kategori adları genel tutuldu.
  var OLCU = { '31': ['Net ağırlık (kg) / ölçü', 'Net weight (kg) / measure'], '32': ['Net ağırlık (lb) / ölçü', 'Net weight (lb) / measure'],
    '33': ['Brüt ağırlık (kg) / ölçü', 'Gross weight (kg) / measure'], '34': ['Brüt ağırlık (lb) / ölçü', 'Gross weight (lb) / measure'],
    '35': ['Alan / hacim ölçüsü', 'Area / volume measure'], '36': ['Hacim ölçüsü', 'Volume measure'] };
  Object.keys(OLCU).forEach(function (p) {
    for (var d = 0; d <= 9; d++) AI_TABLO.push(s(p + '0' + d, OLCU[p][0], OLCU[p][1], 'n', 6, true, { olcu: true }));
  });
  // Not: 31..36 ailesinde ikinci hane ölçü türünü belirler (310 net kg, 311 uzunluk, 312 genişlik... gibi); burada yalnız x0n (x0..x9) kuruldu,
  // diğer ailelerde (311-316, 321-329...) ilk iki hane + üçüncü hane ayrıştırılır, bkz. aiBul genel kuralı.
  var AI_HARITA = {};
  AI_TABLO.forEach(function (t) { AI_HARITA[t.ai] = t; });

  // AI'ın hangi tabloya düştüğünü bul. 31xx-36xx (6 rakam sabit) ailesi 4 haneli genel kural; diğerleri tam eşleşme.
  function aiBul(ai) {
    ai = String(ai);
    if (AI_HARITA[ai]) return AI_HARITA[ai];
    if (/^3[1-6][0-9]{2}$/.test(ai)) return s(ai, 'Ölçü / ağırlık (' + ai + ')', 'Measure / weight (' + ai + ')', 'n', 6, true, { olcu: true });
    return null;
  }

  /* ---------- Karakter kümesi ve kontrol hanesi ---------- */
  // GS1 AI 82 karakterlik küme (CSET 82): ! " % & ' ( ) * + , - . / 0-9 : ; < = > ? A-Z _ a-z (ve boşluk)
  // Sabit uzunluklu olduğu halde GS1 ön tanımlı sabit uzunluk listesinde OLMAYAN AI'lar: arkasından başka AI gelirse FNC1 gerekir.
  var FNC1_GEREKLI = { '402': true, '7003': true };
  var KUME82 = /^[!"%&'()*+,\-.\/0-9:;<=>?A-Z_a-z]*$/;
  function kontrolHanesi(rakamlar) { return Barkod.gs1Sagla(String(rakamlar)); }

  function gunSayisi(yy, aa) {
    if (aa === 2) return yy % 4 === 0 ? 29 : 28; // 2000-2099 aralığında 2 haneli yıl için artık yıl kuralı yeterli
    return [4, 6, 9, 11].indexOf(aa) >= 0 ? 30 : 31;
  }
  function tarihGecerli(v) {
    if (!/^[0-9]{6}$/.test(v)) return false;
    var yy = Number(v.slice(0, 2)), aa = Number(v.slice(2, 4)), gg = Number(v.slice(4, 6));
    if (aa < 1 || aa > 12) return false;
    return gg >= 0 && gg <= gunSayisi(yy, aa); // gün 00: "ayın günü belirtilmemiş" (GS1 izin verir)
  }

  /* ---------- Doğrulama ---------- */
  var VERI_AZAMI_128 = 48; // GS1-128 sembolünde AI'lar dahil en çok 48 veri karakteri (FNC1 hariç)

  // Tek eleman: {ai, veri}. Hata fırlatır (Türkçe sabit kalıplı ileti). Dönüş: düzeltilmiş (gerekirse kontrol hanesi eklenmiş) veri.
  function elemanDogrula(ai, veri, kontrolEkle) {
    var t = aiBul(ai);
    if (!t) throw new Error('GS1: (' + ai + ') uygulama tanımlayıcısı desteklenmiyor.');
    veri = String(veri);
    if (veri === '') throw new Error('GS1 (' + ai + '): değer boş olamaz.');
    if (/[()]/.test(veri)) throw new Error('GS1 (' + ai + '): değerde parantez kullanılamaz.');
    if (t.tur === 'n') {
      if (!/^[0-9]+$/.test(veri)) throw new Error('GS1 (' + ai + '): yalnızca rakam olabilir.');
    } else {
      var kotu = veri.split('').filter(function (c) { return !KUME82.test(c); })[0];
      if (kotu !== undefined) throw new Error('GS1 (' + ai + '): "' + kotu + '" karakteri GS1 karakter kümesi (82) dışında.');
    }
    if (t.kontrol && kontrolEkle && veri.length === t.en - 1) veri += kontrolHanesi(veri);
    if (t.sabit && veri.length !== t.en) throw new Error('GS1 (' + ai + '): uzunluk ' + t.en + ' hane olmalı.');
    if (!t.sabit && veri.length > t.en) throw new Error('GS1 (' + ai + '): en çok ' + t.en + ' karakter olabilir.');
    if (t.tarih && !tarihGecerli(veri)) throw new Error('GS1 (' + ai + '): tarih geçersiz (YYAAGG biçiminde, ay 01-12).');
    if (t.kontrol) {
      var bek = kontrolHanesi(veri.slice(0, -1));
      if (Number(veri.charAt(veri.length - 1)) !== bek) throw new Error('GS1 (' + ai + '): kontrol rakamı hatalı (beklenen ' + bek + ').');
    }
    return veri;
  }

  // elemanlar: [{ai, veri}]. Dönüş: yeni doğrulanmış dizi. secenek.kontrolEkle: kontrol hanesi eksik (bir hane kısa) ise hesapla ekle.
  function dogrula(elemanlar, secenek) {
    secenek = secenek || {};
    if (!Array.isArray(elemanlar) || !elemanlar.length) throw new Error('GS1: veri boş.');
    var gordu = {}, cikti = [];
    elemanlar.forEach(function (e) {
      var ai = String(e.ai);
      if (gordu[ai]) throw new Error('GS1: (' + ai + ') bir veride yalnız bir kez kullanılabilir.');
      gordu[ai] = true;
      cikti.push({ ai: ai, veri: elemanDogrula(ai, e.veri, secenek.kontrolEkle) });
    });
    return cikti;
  }

  /* ---------- Ayrıştır / üret ---------- */
  // "(01)09506000134352(17)261231(10)LOT1" -> [{ai:'01',veri:'09506000134352'},...]
  // Değerlerde parantez bulunamaz (belirsizlik olmasın diye). secenek.kontrolEkle: bkz. dogrula.
  function ayristir(metin, secenek) {
    metin = String(metin === undefined || metin === null ? '' : metin).trim();
    if (!metin) throw new Error('GS1: veri boş.');
    var re = /\(([0-9]{2,4})\)/g, bul, parcalar = [], son = 0;
    if (metin.charAt(0) !== '(') throw new Error('GS1: parantezli biçim bekleniyor, örn. (01)09506000134352(10)LOT1.');
    var konumlar = [];
    while ((bul = re.exec(metin))) konumlar.push({ ai: bul[1], bas: bul.index, son: bul.index + bul[0].length });
    if (!konumlar.length) throw new Error('GS1: parantezli biçim bekleniyor, örn. (01)09506000134352(10)LOT1.');
    konumlar.forEach(function (k, i) {
      var bitis = i + 1 < konumlar.length ? konumlar[i + 1].bas : metin.length;
      parcalar.push({ ai: k.ai, veri: metin.slice(k.son, bitis) });
    });
    return dogrula(parcalar, secenek);
  }

  function parantezli(elemanlar) {
    return elemanlar.map(function (e) { return '(' + e.ai + ')' + e.veri; }).join('');
  }

  // Eleman dizisinden AI+veri birleşimi; değişken uzunluklu elemandan sonra, ardından başka eleman varsa `ayirici` konur (sonda konmaz).
  function birlestir(elemanlar, ayirici) {
    var ay = ayirici === undefined ? '\x1d' : ayirici, o = '';
    elemanlar.forEach(function (e, i) {
      o += e.ai + e.veri;
      if ((!aiBul(e.ai).sabit || FNC1_GEREKLI[e.ai]) && i < elemanlar.length - 1) o += ay;
    });
    return o;
  }

  // Girdi: parantezli metin ya da eleman dizisi. Dönüş: {elemanlar, parantezli, ham (AI'lar bitişik, FNC1 yerine GS \x1d), veriUzunlugu (FNC1 hariç)}
  function coz(girdi, secenek) {
    var el = typeof girdi === 'string' ? ayristir(girdi, secenek) : dogrula(girdi, secenek);
    var duz = el.map(function (e) { return e.ai + e.veri; }).join('');
    return { elemanlar: el, parantezli: parantezli(el), ham: birlestir(el, '\x1d'), veriUzunlugu: duz.length };
  }

  /* ---------- Yazıcı seçenekleri ---------- */
  function sayiSecenek(v, vars, min, max, ad) {
    if (v === undefined || v === null || v === '') return vars;
    v = Number(v);
    if (!isFinite(v) || v < min || v > max) throw new Error('GS1: yazıcı seçeneği geçersiz: ' + ad + ' (' + min + '-' + max + ').');
    return Math.round(v);
  }
  function mmNokta(mm, dpi) { return Math.round(mm * dpi / 25.4); }
  function yazdirOpt(o) {
    o = o || {};
    var okunur = o.okunur === undefined ? 'ayri' : o.okunur;
    if (['ayri', 'yerlesik', 'yok'].indexOf(okunur) < 0) throw new Error('GS1: yazıcı seçeneği geçersiz: okunur (ayri, yerlesik, yok).');
    var dpi = sayiSecenek(o.dpi, 203, 100, 1200, 'dpi');
    return {
      dpi: dpi, okunur: okunur,
      genisMm: sayiSecenek(o.genisMm, 100, 10, 300, 'genisMm'), yukMm: sayiSecenek(o.yukMm, 50, 10, 500, 'yukMm'),
      x: sayiSecenek(o.x, 20, 0, 5000, 'x'), y: sayiSecenek(o.y, 20, 0, 5000, 'y'),
      modul: sayiSecenek(o.modul, 2, 1, 10, 'modul'), yukseklik: sayiSecenek(o.yukseklik, 100, 10, 1000, 'yukseklik'),
      dmBoyut: sayiSecenek(o.dmBoyut, 6, 1, 20, 'dmBoyut'), yaziYuk: sayiSecenek(o.yaziYuk, 24, 8, 100, 'yaziYuk')
    };
  }
  // ^FD / TSPL tırnak içine girecek parantezli okunur yazı: küme 82'de ^ ~ " yok ama " olabilir; ZPL için ^ ~ atılır, " kalır.
  function guvenliZpl(m) { return m.replace(/[\^~]/g, ''); }

  /* ---------- ZPL (Zebra) ---------- */
  // GS1-128: ^BCN,yükseklik,okunur,N,N,D  ->  ^FD>;>8 + veri
  //   Kaynak: Zebra ZPL II Programming Guide, ^BC: mod D = "UCC/EAN modu"; ">;" Code 128 alt küme C başlangıç (start C) çağırması,
  //   ">8" = FNC1. Başlangıç sonrası ilk FNC1, GS1-128'in tanımı gereği (sembolün GS1 olduğunu belirtir); AI'lar arasındaki ayırıcı FNC1 de ">8" ile yazılır.
  //   DOĞRULANMADI (gerçek yazıcıda denenmedi): (1) mod D'de yazıcının C->B alt küme geçişini kendisinin yapıp yapmadığı sürüme göre değişebilir;
  //   (2) ZPL'de değişmez ">" karakteri çağırma karakteri olduğu için GS1-128 verisinde ">" desteklenmez ve hata verilir (uydurma kaçış eklenmedi);
  //   (3) yerleşik okunur yazı (Y) FNC1/AI parantezlerini yazıcının kendi biçiminde basar; parantezli okunur yazı için varsayılan ayrı ^FD alanıdır.
  function zplGs1_128(girdi, opt) {
    var c = coz(girdi), p = yazdirOpt(opt);
    if (c.veriUzunlugu > VERI_AZAMI_128) throw new Error('GS1: GS1-128 için en çok ' + VERI_AZAMI_128 + ' veri karakteri (AI\'lar dahil) kodlanabilir.');
    if (c.ham.indexOf('>') >= 0) throw new Error('ZPL: GS1-128 verisinde ">" karakteri desteklenmiyor.');
    var veri = '>;>8' + c.ham.replace(/\x1d/g, '>8');
    var o = '^XA^PW' + mmNokta(p.genisMm, p.dpi) + '^LL' + mmNokta(p.yukMm, p.dpi) + '^BY' + p.modul + '\r\n';
    o += '^FO' + p.x + ',' + p.y + '^BCN,' + p.yukseklik + ',' + (p.okunur === 'yerlesik' ? 'Y' : 'N') + ',N,N,D^FD' + veri + '^FS\r\n';
    if (p.okunur === 'ayri') o += '^FO' + p.x + ',' + (p.y + p.yukseklik + 8) + '^A0N,' + p.yaziYuk + ',' + p.yaziYuk + '^FD' + guvenliZpl(c.parantezli) + '^FS\r\n';
    return o + '^XZ\r\n';
  }

  // GS1 DataMatrix: ^BXN,modül yüksekliği,200 (ECC 200); ^FD içinde "~1" = FNC1 (Zebra ^BX alan verisi, yalnız ECC 200).
  //   GS1 DataMatrix kuralı: veri FNC1 ile BAŞLAR (GS1 olduğunu belirtir), değişken uzunluklu AI sonrası FNC1 ayırıcı konur (GS yerine).
  //   Kaynak: Zebra ZPL II Programming Guide ^BX ("~1" ECC 200'de FNC1; kaçış karakteri g varsayılan "~").
  //   DOĞRULANMADI: ~1 işleme ilk-konum FNC1'i yazıcı yazılım sürümüne göre değişebilir; alternatif ^FH + _1D (GS) yazımı bu modülde YOK.
  //   Küme 82 içinde "~" ve "^" bulunmadığı için veri ayrıca kaçışlanmaz.
  function zplGs1DataMatrix(girdi, opt) {
    var c = coz(girdi), p = yazdirOpt(opt);
    var veri = '~1' + c.ham.replace(/\x1d/g, '~1');
    var o = '^XA^PW' + mmNokta(p.genisMm, p.dpi) + '^LL' + mmNokta(p.yukMm, p.dpi) + '\r\n';
    o += '^FO' + p.x + ',' + p.y + '^BXN,' + p.dmBoyut + ',200^FD' + veri + '^FS\r\n';
    if (p.okunur !== 'yok') o += '^FO' + p.x + ',' + (p.y + 12 * p.dmBoyut + 8) + '^A0N,' + p.yaziYuk + ',' + p.yaziYuk + '^FD' + guvenliZpl(c.parantezli) + '^FS\r\n';
    return o + '^XZ\r\n';
  }

  /* ---------- TSPL / TSPL2 (TSC) ---------- */
  // GS1-128: BARCODE x,y,"EAN128",yükseklik,okunur,döndürme,dar,geniş,"veri"
  //   Kaynak: TSC TSPL/TSPL2 Programming Manual, BARCODE komutu, kod türü "EAN128".
  //   DOĞRULANMADI (en belirsiz nokta): TSC'nin EAN128 türünde AI'ların parantezli yazımı ("(01)...(10)...") ve FNC1'in yazıcı tarafından
  //   otomatik eklenmesi bilgisine dayanılarak veri parantezli gönderilir; bazı üretici yazılımlarında "!100" gibi elle FNC1 yazımı gerekebilir.
  //   Bu modül elle FNC1 yazımı UYDURMAZ. Çıktı gerçek yazıcıda denenmeden üretime alınmamalıdır.
  //   TSPL dizesinde çift tırnak karakteri ayrılmış olduğundan veride '"' desteklenmez (hata).
  function tsplGs1_128(girdi, opt) {
    var c = coz(girdi), p = yazdirOpt(opt);
    if (c.veriUzunlugu > VERI_AZAMI_128) throw new Error('GS1: GS1-128 için en çok ' + VERI_AZAMI_128 + ' veri karakteri (AI\'lar dahil) kodlanabilir.');
    if (c.ham.indexOf('"') >= 0) throw new Error('TSPL: veride çift tırnak karakteri desteklenmiyor.');
    var o = 'SIZE ' + p.genisMm + ' mm,' + p.yukMm + ' mm\r\nGAP 2 mm,0 mm\r\nDIRECTION 1\r\nCLS\r\n';
    o += 'BARCODE ' + p.x + ',' + p.y + ',"EAN128",' + p.yukseklik + ',' + (p.okunur === 'yerlesik' ? 1 : 0) + ',0,' + p.modul + ',' + p.modul + ',"' + c.parantezli + '"\r\n';
    if (p.okunur === 'ayri') o += 'TEXT ' + p.x + ',' + (p.y + p.yukseklik + 8) + ',"2",0,1,1,"' + c.parantezli + '"\r\n';
    return o + 'PRINT 1,1\r\n';
  }

  // GS1 DataMatrix TSPL2: DMATRIX komutu vardır, ancak belgelerinde FNC1 (GS1) başlatma/ayırıcı desteği bilinmiyor/doğrulanamadı.
  // Uydurma çıktı üretmemek için BİLEREK desteklenmez.
  function tsplGs1DataMatrix() {
    throw new Error('TSPL: GS1 DataMatrix (FNC1) desteklenmiyor; ZPL kullanın.');
  }

  function zpl(girdi, tur, opt) {
    if (tur === 'gs1-128') return zplGs1_128(girdi, opt);
    if (tur === 'datamatrix') return zplGs1DataMatrix(girdi, opt);
    throw new Error('GS1: yazıcı seçeneği geçersiz: tur (gs1-128, datamatrix).');
  }
  function tspl(girdi, tur, opt) {
    if (tur === 'gs1-128') return tsplGs1_128(girdi, opt);
    if (tur === 'datamatrix') return tsplGs1DataMatrix(girdi, opt);
    throw new Error('GS1: yazıcı seçeneği geçersiz: tur (gs1-128, datamatrix).');
  }

  return {
    AI_TABLO: AI_TABLO, aiBul: aiBul, KUME82: KUME82, VERI_AZAMI_128: VERI_AZAMI_128,
    kontrolHanesi: kontrolHanesi, tarihGecerli: tarihGecerli, elemanDogrula: elemanDogrula, dogrula: dogrula,
    ayristir: ayristir, parantezli: parantezli, birlestir: birlestir, coz: coz,
    zplGs1_128: zplGs1_128, zplGs1DataMatrix: zplGs1DataMatrix, tsplGs1_128: tsplGs1_128, tsplGs1DataMatrix: tsplGs1DataMatrix,
    zpl: zpl, tspl: tspl
  };
});
