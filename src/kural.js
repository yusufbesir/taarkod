/* Kural katmanı: önek + şifreli rakamlar + Luhn kontrol rakamı; kural dosyası doğrulama.
 * Anahtar kelime KURAL NESNESİNİN PARÇASI DEĞİLDİR: yalnızca çalışma kuralının (calismaKurali) geçici
 * "kelime" alanında taşınır ve hiçbir dışa aktarmaya girmez. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrika(require('./core.js'), require('./yontemler.js'), require('./barkod.js'));
  } else kok.BarkodKural = fabrika(kok.BarkodSifre, kok.BarkodYontem, kok.BarkodCiz);
})(typeof self !== 'undefined' ? self : this, function (Core, Yontem, Ciz) {
  'use strict';

  var STANDARTLAR = ['code128', 'code39', 'code93', 'qr', 'datamatrix', 'ean13', 'itf14', 'ean8', 'upca'];
  // ---------- Tür profili (tek kaynak) ----------
  // Her barkod türü için kural alanlarının nasıl davranacağı burada tutulur; GS1_UZUNLUK ve ON_AYAR_ONEK bu tablodan türetilir.
  // uzunluk: sabit (deger = önek dahil toplam hane, kontrol hanesi dahil) ya da aralik (min-max: önek hariç toplam rakam; otomatik öneri var).
  // karakter: önekte kullanılabilen karakter kümesi (rakam | buyukHarfRakam | ascii | metin); şifreli kısım her zaman rakamdır.
  // kontrol: gs1 (GS1 mod 10, 3-1 ağırlık; zorunlu ve kilitli) ya da luhn (isteğe bağlı).
  // onek: tür seçilince önerilen önek (yalnız tür SEÇİMİNDE uygulanır; dosya/geçmiş/varsayılan yollarında değil).
  //   869: GS1 Türkiye'ye ayrılmış önek; ean8 için 86 yalnızca başlangıçtır; upca 0: normal ürünler için sayı sistemi rakamı; itf14 1: ambalaj göstergesi + 869.
  // alanlar: luhn / uzunlukModu / uzunluk / direnc alanlarının bu türdeki durumu (serbest | kilitli | anlamsiz).
  // yontemler: türün izin verdiği şifreleme yöntemleri. Üç yöntemin de çıktısı salt rakamdır ve her türe uyar; kısıt konusu olmadığı için hepsi izinlidir.
  var TUM_YONTEM = ['harf-karistirma', 'dogrusal', 'feistel'];
  var GS1_ALAN = { luhn: 'kilitli', uzunlukModu: 'anlamsiz', uzunluk: 'anlamsiz', direnc: 'anlamsiz' };
  var SERBEST_ALAN = { luhn: 'serbest', uzunlukModu: 'serbest', uzunluk: 'serbest', direnc: 'serbest' };
  function gs1Profil(id, toplam, onek) {
    return { id: id, grup: 'gs1', uzunluk: { tur: 'sabit', deger: toplam }, karakter: 'rakam', kontrol: 'gs1', kontrolZorunlu: true, onek: onek, alanlar: GS1_ALAN, yontemler: TUM_YONTEM };
  }
  function serbestProfil(id, grup, karakter) {
    return { id: id, grup: grup, uzunluk: { tur: 'aralik', min: 3, max: 30, oneri: 'otomatik' }, karakter: karakter, kontrol: 'luhn', kontrolZorunlu: false, onek: 'TO', alanlar: SERBEST_ALAN, yontemler: TUM_YONTEM };
  }
  var TUR_PROFILI = {
    ean13: gs1Profil('ean13', 13, '869'),
    itf14: gs1Profil('itf14', 14, '1869'),
    ean8: gs1Profil('ean8', 8, '86'),
    upca: gs1Profil('upca', 12, '0'),
    code128: serbestProfil('code128', 'dogrusal', 'ascii'),
    code39: serbestProfil('code39', 'dogrusal', 'buyukHarfRakam'),
    code93: serbestProfil('code93', 'dogrusal', 'buyukHarfRakam'),
    qr: serbestProfil('qr', '2b', 'metin'),
    datamatrix: serbestProfil('datamatrix', '2b', 'metin')
  };
  var GS1_UZUNLUK = {}, ON_AYAR_ONEK = {};
  Object.keys(TUR_PROFILI).forEach(function (id) {
    var p = TUR_PROFILI[id];
    if (p.kontrol === 'gs1') GS1_UZUNLUK[id] = p.uzunluk.deger;
    ON_AYAR_ONEK[id] = p.onek;
  });
  var MODLAR = ['otomatik', 'elle'];
  var ONEK_RE = /^(?:[A-Za-z0-9][A-Za-z0-9 .\-$\/+%]{0,7})?$/;
  var SERI_RE = /^[\p{L}\p{N} _.\-]{0,40}$/u;
  var MAKS_SATIR = 1000000;
  var MIN_TOPLAM = 3, MAKS_TOPLAM = 30, MAKS_DIRENC = 1e12;

  function yontemIdleri() { return Yontem.YONTEMLER.map(function (y) { return y.id; }); }

  function varsayilan() {
    return {
      onek: 'TO', standart: 'code128', uzunlukModu: 'otomatik', uzunluk: 12, tahminDirenci: 100000,
      yontem: 'harf-karistirma', luhn: true, seriAdi: 'Seri-1', bas: 1, son: 100
    };
  }

  function onekDogrula(s) {
    if (typeof s !== 'string' || !ONEK_RE.test(s)) {
      throw new Error('Önek en fazla 8 karakter olmalı; harf ya da rakamla başlamalı, sonra yalnızca harf, rakam, boşluk ve - . $ / + % içerebilir.');
    }
    return s;
  }
  function seriAdiDogrula(s) {
    if (typeof s !== 'string' || !SERI_RE.test(s)) {
      throw new Error('Seri adı en fazla 40 karakter olmalı; yalnızca harf, rakam, boşluk, _ - . kullanın.');
    }
    return s;
  }

  function tamSayi(v, min, max) {
    return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  }
  function sahip(o, a) { return Object.prototype.hasOwnProperty.call(o, a); }

  // Alan başına beyaz liste denetimi. Geçersizse null döner.
  var ALANLAR = {
    onek: function (v) { try { return onekDogrula(v); } catch (e) { return null; } },
    standart: function (v) { return STANDARTLAR.indexOf(v) >= 0 ? v : null; },
    uzunlukModu: function (v) { return MODLAR.indexOf(v) >= 0 ? v : null; },
    uzunluk: function (v) { return tamSayi(v, MIN_TOPLAM, MAKS_TOPLAM) ? v : null; },
    tahminDirenci: function (v) { return tamSayi(v, 1, MAKS_DIRENC) ? v : null; },
    yontem: function (v) { return typeof v === 'string' && yontemIdleri().indexOf(v) >= 0 ? v : null; },
    luhn: function (v) { return typeof v === 'boolean' ? v : null; },
    seriAdi: function (v) { try { return seriAdiDogrula(v); } catch (e) { return null; } },
    bas: function (v) { return tamSayi(v, 0, Number.MAX_SAFE_INTEGER) ? v : null; },
    son: function (v) { return tamSayi(v, 0, Number.MAX_SAFE_INTEGER) ? v : null; }
  };

  function kisalt(s) { s = String(s); return s.length > 30 ? s.slice(0, 30) + '…' : s; }

  // Ham nesneden güvenli kural üretir: bilinmeyen alanlar yok sayılır, geçersiz değerler varsayılanda kalır.
  function kuralTemizle(ham) {
    if (ham === null || typeof ham !== 'object' || Array.isArray(ham)) {
      throw new Error('Dosya geçerli bir kural dosyası değil (nesne bekleniyordu).');
    }
    var kural = varsayilan(), uyarilar = [], bilinmeyen = [];
    Object.keys(ham).forEach(function (a) {
      if (a === 'surum') return;
      if (!sahip(ALANLAR, a)) { bilinmeyen.push(kisalt(a)); return; }
      var d = ALANLAR[a](ham[a]);
      if (d === null) uyarilar.push('"' + a + '" alanındaki değer geçersiz olduğu için varsayılan kullanıldı.');
      else kural[a] = d;
    });
    if (GS1_UZUNLUK[kural.standart]) kural.luhn = true; // son rakam her zaman kontrol rakamıdır (GS1)
    if (kural.son < kural.bas) {
      uyarilar.push('Aralıkta bitiş, başlangıçtan küçük; aralık varsayılana döndürüldü.');
      kural.bas = varsayilan().bas; kural.son = varsayilan().son;
    }
    if (bilinmeyen.length) {
      uyarilar.push('Bilinmeyen alanlar yok sayıldı: ' + bilinmeyen.slice(0, 5).join(', ') + (bilinmeyen.length > 5 ? ' …' : ''));
    }
    return { kural: kural, uyarilar: uyarilar };
  }

  function iceAktar(metin) {
    if (typeof metin !== 'string' || metin.length > 100000) throw new Error('Kural dosyası çok büyük ya da okunamadı.');
    var ham;
    try { ham = JSON.parse(metin); } catch (e) { throw new Error('Dosya geçerli bir JSON değil.'); }
    return kuralTemizle(ham);
  }

  // Dışa aktarma: yalnızca beyaz listedeki alanlar. Anahtar kelime burada yer almaz.
  function disaAktar(kural) {
    var t = kuralTemizle(kural).kural, c = { surum: 1 };
    Object.keys(ALANLAR).forEach(function (a) { c[a] = t[a]; });
    return JSON.stringify(c, null, 2) + '\n';
  }

  // Seri adındaki sondaki sayıyı artırır; yoksa "-2" ekler.
  function seriArtir(ad) {
    var m = /^(.*?)(\d+)$/.exec(ad);
    var yeni = m ? m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0') : (ad ? ad + '-2' : 'Seri-2');
    return yeni.slice(0, 40);
  }

  function yeniSeri(kural) {
    var k = kuralTemizle(kural).kural, boy = k.son - k.bas;
    var bas = k.son + 1;
    if (!Number.isSafeInteger(bas + boy)) throw new Error('Yeni seri için sıra numarası aralığı kalmadı.');
    k.seriAdi = seriArtir(k.seriAdi); k.bas = bas; k.son = bas + boy;
    return k;
  }

  // Önek bu türde kullanılabilir mi? GS1 türlerinde yalnız rakam ve şifreli kısma (kontrol hanesi hariç) en az 2 rakam kalmalı;
  // diğerlerinde kodlayıcı önek + "0" metnini kabul etmeli. Hata fırlatmaz.
  function onekTureUygunMu(standart, onek) {
    try { onekDogrula(onek); } catch (e) { return false; }
    var gs1 = GS1_UZUNLUK[standart];
    if (gs1) return /^\d*$/.test(onek) && gs1 - onek.length - 1 >= 2;
    if (STANDARTLAR.indexOf(standart) < 0) return false;
    return Ciz.uygunMu(standart, onek + '0').uygun;
  }

  // Tür seçimi ön ayarı (saf): kullanıcı eski türden yeniye geçince önek ne olmalı?
  // Elle değiştirilmiş (eski türün ön ayarından farklı) ve yeni tür için geçerli önek korunur; aksi halde yeni türün ön ayarına geçer.
  // Dönüş: { onek, degisti (önek değişti mi), korundu (elle yazılan önek korundu mu), onAyar, toplam (GS1'de sabit toplam hane, yoksa 0) }
  function turOnAyari(eskiStandart, yeniStandart, mevcutOnek) {
    if (STANDARTLAR.indexOf(yeniStandart) < 0) throw new Error('Bilinmeyen barkod standardı.');
    var onek = typeof mevcutOnek === 'string' ? mevcutOnek : ON_AYAR_ONEK[eskiStandart], onAyar = ON_AYAR_ONEK[yeniStandart];
    var elle = onek !== ON_AYAR_ONEK[eskiStandart];
    var korundu = elle && onekTureUygunMu(yeniStandart, onek), yeni = korundu ? onek : onAyar;
    return { onek: yeni, degisti: yeni !== onek, korundu: korundu, onAyar: onAyar, toplam: GS1_UZUNLUK[yeniStandart] || 0 };
  }

  // Tür profili (kopya döner; tabloyu değiştirmek mümkün değildir). Bilinmeyen tür için hata fırlatır.
  function turProfili(standart) {
    if (typeof standart !== 'string' || !sahip(TUR_PROFILI, standart)) throw new Error('Bilinmeyen barkod standardı.');
    var p = TUR_PROFILI[standart];
    return {
      id: p.id, grup: p.grup, uzunluk: Object.assign({}, p.uzunluk), karakter: p.karakter, kontrol: p.kontrol, kontrolZorunlu: p.kontrolZorunlu,
      onek: p.onek, alanlar: Object.assign({}, p.alanlar), yontemler: p.yontemler.slice()
    };
  }

  // Türe özel kural kodları (yalnız o türde görünür; Code 128'in kural seti değişmedi: boş).
  // Metinler arayüzde (T) tutulur; burada yalnız kod ve parametre vardır. GS1 türlerinde sıra: toplam, kontrol, onekRakam, türe özgü kural.
  var OZEL_TUR = { ean13: 'ean13.onek', ean8: 'ean8.onek', upca: 'upca.sayi', itf14: 'itf14.ambalaj', code39: 'buyuk', code93: 'buyuk', qr: 'qr.okuyucu', datamatrix: 'dm.kucuk' };
  function turOzelKurallar(standart) {
    var p = turProfili(standart), o = [];
    if (p.kontrol === 'gs1') {
      o.push({ kod: 'toplam', p: [p.uzunluk.deger] });
      o.push({ kod: 'kontrol', p: [] });
      o.push({ kod: 'onekRakam', p: [p.uzunluk.deger - 3] });
      o.push({ kod: OZEL_TUR[standart], p: [p.onek] });
    } else if (OZEL_TUR[standart]) o.push({ kod: OZEL_TUR[standart], p: [] });
    return o;
  }

  // Tür ön ayarı (saf): bu türün tüm kural alanlarının gerçek ilk değerleri. Code 128 için varsayilan() ile birebir aynıdır.
  // GS1 türlerinde önek profilden gelir, uzunluk sabit toplamdan önek çıkarılarak yazılır (kullanıcı değiştiremez), kontrol hanesi açık ve kilitlidir.
  function turKuralOnAyari(standart) {
    var p = turProfili(standart), k = varsayilan();
    k.standart = standart; k.onek = p.onek;
    if (p.kontrol === 'gs1') {
      k.luhn = true; k.uzunlukModu = 'elle';
      k.uzunluk = Math.max(MIN_TOPLAM, p.uzunluk.deger - p.onek.length);
    }
    return k;
  }

  // Yöntem bu türde kullanılabilir mi? (bilinmeyen tür ya da yöntem: false)
  function yontemIzinliMi(standart, yontemId) {
    return sahip(TUR_PROFILI, standart) && TUR_PROFILI[standart].yontemler.indexOf(yontemId) >= 0;
  }

  // Alan durumları (saf): kullanıcı arayüzü bunu uygular. mod: otomatik | elle. Dönüş: her alan için { devre, deger? }.
  // GS1'de luhn açık ve kilitlidir; uzunluk alanları anlamsızdır. Diğer türlerde luhn serbest; uzunluk yalnız elle, direnç yalnız otomatik modda kullanılır.
  function alanDurumu(standart, mod, luhnMevcut) {
    var p = turProfili(standart), d = p.alanlar, o = {};
    o.luhn = d.luhn === 'kilitli' ? { devre: true, deger: true } : { devre: false, deger: !!luhnMevcut };
    o.uzunlukModu = { devre: d.uzunlukModu !== 'serbest' };
    o.uzunluk = { devre: d.uzunluk !== 'serbest' || mod !== 'elle' };
    o.direnc = { devre: d.direnc !== 'serbest' || mod !== 'otomatik' };
    return o;
  }

  // Önek bu türde neden kullanılamaz? Kullanılabiliyorsa '' döner (onekTureUygunMu ile tutarlı).
  function onekNedeni(standart, onek) {
    var p = turProfili(standart);
    try { onekDogrula(onek); } catch (e) { return e.message; }
    if (p.kontrol === 'gs1') {
      if (!/^\d*$/.test(onek)) return p.uzunluk.deger + ' haneli GS1 türünde önek yalnızca rakamdan oluşabilir.';
      if (p.uzunluk.deger - onek.length - 1 < 2) return 'Toplam ' + p.uzunluk.deger + ' hane olduğu için önek en çok ' + (p.uzunluk.deger - 3) + ' hane olabilir (şifreli kısma en az 2 rakam kalmalı).';
      return '';
    }
    var u = Ciz.uygunMu(standart, onek + '0');
    return u.uygun ? '' : u.neden;
  }

  // Önekten sonraki ilk rakam 1-9 olmalı: şifreli yük uzayı [10^(yuk-1), 10^yuk), kapasite 9*10^(yuk-1).
  var DONGU_SINIRI = 100000;
  function altSinir(yuk) { return 10n ** BigInt(yuk - 1); }
  function kapasite(yuk) { return 9n * altSinir(yuk); }
  function yukCevir(v) { return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : v.toString(); }
  function yukMetni(v, yuk) { var t = v.toString(); while (t.length < yuk) t = '0' + t; return t; }

  // Uzunluk: otomatik (BarkodCiz.uzunlukOner) ya da elle. toplamRakam = şifreli rakamlar + (Luhn varsa 1); önek hariç.
  function uzunlukBelirle(kural) {
    var k = kuralTemizle(kural).kural, luhnH = k.luhn ? 1 : 0, toplam, oneri = null, gs1 = GS1_UZUNLUK[k.standart];
    if (gs1) {
      if (!/^\d*$/.test(k.onek)) throw new Error('Seçilen standart bu önekle kullanılamaz: EAN-13, EAN-8, UPC-A ve ITF-14 önekinde yalnızca rakam olabilir.');
      toplam = gs1 - k.onek.length; // şifreli rakamlar + 1 GS1 kontrol rakamı
    } else {
      var uy = Ciz.uygunMu(k.standart, k.onek + '0');
      if (!uy.uygun) throw new Error('Seçilen standart bu önekle kullanılamaz: ' + uy.neden);
    }
    if (gs1) { /* uzunluk standartça sabit */ }
    else if (k.uzunlukModu === 'otomatik') {
      oneri = Ciz.uzunlukOner({
        onek: k.onek, standart: k.standart, luhn: k.luhn,
        enBuyukSira: Math.max(k.son, 1), tahminDirenci: k.tahminDirenci
      });
      oneri.secenekler.forEach(function (s) {
        s.genisMm = Ciz.kodlanmisBilgi(k.standart, k.onek, s.toplamRakam).genisMm;
      });
      toplam = oneri.toplamRakam;
    } else toplam = k.uzunluk;
    var yuk = toplam - luhnH;
    if (yuk < 2) {
      throw new Error(gs1 ? 'Önek çok uzun: ' + Ciz.standartlarGs1.filter(function (x) { return x.id === k.standart; })[0].ad + ' toplam ' + gs1 + ' rakamdır; şifreli sıra numarasına en az 2 rakam kalmalı.'
        : 'Şifreli sıra numarası için en az 2 rakam gerekir; uzunluğu artırın.');
    }
    if (yuk > 30) throw new Error('Şifreli sıra numarası en fazla 30 rakam olabilir.');
    if (BigInt(k.son) >= kapasite(yuk)) {
      throw new Error('En büyük sıra numarası (' + k.son + ') ' + yuk + ' rakama sığmıyor (ilk rakam 0 olamayacağı için en çok ' + (kapasite(yuk) - 1n) + ' olabilir). Uzunluğu artırın ya da aralığı küçültün.');
    }
    return { toplamRakam: toplam, yukRakam: yuk, oneri: oneri, bilgi: Ciz.kodlanmisBilgi(k.standart, k.onek, gs1 ? toplam - 1 : toplam) }; // GS1'de kontrol rakamını kodlayıcı ekler
  }

  // Üretim/çözme için çalışma kuralı. kelime burada yalnızca bellekte tutulur.
  function calismaKurali(kural, kelime) {
    var k = kuralTemizle(kural).kural, b = uzunlukBelirle(k);
    if (!yontemIzinliMi(k.standart, k.yontem)) throw new Error('Seçilen şifreleme yöntemi bu barkod türünde kullanılamaz.');
    return {
      calisma: { onek: k.onek, standart: k.standart, luhn: k.luhn, yontem: k.yontem, toplamRakam: b.toplamRakam, kelime: kelime },
      belirle: b
    };
  }

  function yukHane(kural) {
    if (!kural || typeof kural !== 'object') throw new Error('Kural eksik.');
    onekDogrula(kural.onek);
    if (STANDARTLAR.indexOf(kural.standart) < 0) throw new Error('Bilinmeyen barkod standardı.');
    if (typeof kural.luhn !== 'boolean') throw new Error('Luhn ayarı eksik.');
    if (GS1_UZUNLUK[kural.standart] && (!kural.luhn || !/^\d*$/.test(kural.onek) || kural.onek.length + kural.toplamRakam !== GS1_UZUNLUK[kural.standart])) {
      throw new Error('GS1 kuralı geçersiz: önek yalnızca rakam olmalı ve önek + toplam rakam ' + GS1_UZUNLUK[kural.standart] + ' olmalı.');
    }
    if (!tamSayi(kural.toplamRakam, MIN_TOPLAM - 1, MAKS_TOPLAM)) throw new Error('Toplam rakam sayısı geçersiz.');
    var y = kural.toplamRakam - (kural.luhn ? 1 : 0);
    if (y < 2 || y > 30) throw new Error('Şifreli rakam sayısı 2 ile 30 arasında olmalı.');
    return y;
  }

  // Sıra no metnini sayıya (güvenli tam sayı) ya da rakam metnine çevirir.
  function siraNoAyikla(metin) {
    var s = String(metin == null ? '' : metin).trim();
    if (!/^\d+$/.test(s)) throw new Error('Sıra numarası yalnızca rakamlardan oluşmalı.');
    s = s.replace(/^0+(?=\d)/, '');
    return Number.isSafeInteger(Number(s)) ? Number(s) : s;
  }

  // Önek + şifreli rakamlar + (Luhn açıksa) kontrol rakamı. Luhn yalnızca rakam kısmı üzerindendir.
  function barkodMetni(n, kural) {
    var yuk = yukHane(kural);
    var sn = typeof n === 'string' ? n.trim() : n, low = altSinir(yuk), v;
    if (typeof sn === 'string' ? !/^\d+$/.test(sn) : !(Number.isSafeInteger(sn) && sn >= 0)) {
      throw new Error('Sıra numarası pozitif tam sayı olmalı.');
    }
    v = BigInt(sn);
    if (v >= kapasite(yuk)) {
      throw new Error('Sıra numarası ' + yuk + ' rakama sığmıyor (en çok ' + (kapasite(yuk) - 1n) + ' olabilir).');
    }
    // Cycle-walking: yöntem [0,10^yuk) üzerinde permütasyon; sonuç ilk rakamı 0 olmayan uzaya düşene dek yürü.
    var x = v + low, s = null;
    for (var adim = 0; adim < DONGU_SINIRI; adim++) {
      var c = Yontem.sifrele(kural.yontem, yukCevir(x), kural.kelime, yuk);
      c = String(c);
      if (BigInt(c) >= low) { s = c; break; }
      x = BigInt(c);
    }
    if (s === null) throw new Error('Şifreleme döngüsü sınırı aşıldı; yöntem ya da anahtar kelimeyi değiştirin.');
    if (GS1_UZUNLUK[kural.standart]) return kural.onek + s + Ciz.gs1Sagla(kural.onek + s);
    return kural.onek + s + (kural.luhn ? String(Core.luhnRakami(s)) : '');
  }

  // Seçilen standart önek/metni kodlayabiliyor mu? (rakamlar her standartta geçerlidir; ölçüt önektir)
  function standartUygunMu(kural) {
    var yuk = yukHane(kural);
    var rakam = yuk + (kural.luhn && !GS1_UZUNLUK[kural.standart] ? 1 : 0); // GS1'de kontrol rakamını kodlayıcı ekler
    return Ciz.uygunMu(kural.standart, kural.onek + new Array(rakam + 1).join('0'));
  }

  function coz(metin, kural) {
    function hata(neden) { return { gecerli: false, sira: null, neden: neden }; }
    var yuk;
    try { yuk = yukHane(kural); } catch (e) { return hata(e.message); }
    var m = String(metin == null ? '' : metin).trim();
    if (!m) return hata('Barkod metni boş.');
    if (m.indexOf(kural.onek) !== 0) return hata('Barkod "' + kural.onek + '" önekiyle başlamıyor.');
    var kalan = m.slice(kural.onek.length);
    if (!/^\d+$/.test(kalan)) return hata('Önekten sonra yalnızca rakam olmalı.');
    if (kalan.length !== kural.toplamRakam) {
      return hata('Önekten sonra ' + kural.toplamRakam + ' rakam bekleniyordu, ' + kalan.length + ' rakam var.');
    }
    if (kalan.charAt(0) === '0') return hata('Önekten sonraki ilk rakam 0 olamaz (1-9 olmalı).');
    var govde = kalan;
    if (GS1_UZUNLUK[kural.standart]) {
      govde = kalan.slice(0, -1);
      if (String(Ciz.gs1Sagla(kural.onek + govde)) !== kalan.slice(-1)) return hata('GS1 kontrol rakamı tutmuyor: barkod yanlış okunmuş ya da değiştirilmiş.');
    } else if (kural.luhn) {
      if (!Core.luhnGecerli(kalan)) return hata('Luhn kontrol rakamı tutmuyor: barkod yanlış okunmuş ya da değiştirilmiş.');
      govde = kalan.slice(0, -1);
    }
    try {
      var low = altSinir(yuk), metinKod = govde;
      for (var adim = 0; adim < DONGU_SINIRI; adim++) {
        var p = BigInt(Yontem.coz(kural.yontem, metinKod, kural.kelime, yuk));
        if (p >= low) return { gecerli: true, sira: yukCevir(p - low), neden: '' };
        metinKod = yukMetni(p, yuk);
      }
      return hata('Çözme döngüsü sınırı aşıldı; yöntem ya da anahtar kelime uyumsuz.');
    } catch (e) { return hata(e.message); }
  }

  return {
    STANDARTLAR: STANDARTLAR, GS1_UZUNLUK: GS1_UZUNLUK, ON_AYAR_ONEK: ON_AYAR_ONEK, TUR_PROFILI_ID: Object.keys(TUR_PROFILI), turProfili: turProfili, yontemIzinliMi: yontemIzinliMi, alanDurumu: alanDurumu, onekNedeni: onekNedeni, turOnAyari: turOnAyari, turKuralOnAyari: turKuralOnAyari, turOzelKurallar: turOzelKurallar, onekTureUygunMu: onekTureUygunMu, MAKS_SATIR: MAKS_SATIR, varsayilan: varsayilan, onekDogrula: onekDogrula,
    seriAdiDogrula: seriAdiDogrula, kuralTemizle: kuralTemizle, iceAktar: iceAktar, disaAktar: disaAktar,
    seriArtir: seriArtir, yeniSeri: yeniSeri, uzunlukBelirle: uzunlukBelirle, calismaKurali: calismaKurali,
    siraNoAyikla: siraNoAyikla, barkodMetni: barkodMetni, standartUygunMu: standartUygunMu, coz: coz
  };
});
