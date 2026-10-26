/* Üretim geçmişi: son 50 üretimin özeti. Kayıtta YALNIZCA beyaz listedeki alanlar (tarih, seri adı, aralık, standart, uzunluk, adet)
 * bulunur; anahtar kelime ya da başka bir alan, çağıran ne verirse versin, hiçbir zaman saklanmaz ya da dışa aktarılmaz. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./depo.js'));
  else kok.BarkodGecmis = fabrika(kok.BarkodDepo);
})(typeof self !== 'undefined' ? self : this, function (Depo) {
  'use strict';

  var ANAHTAR = 'barkod-gecmis', LIMIT = 50, DOSYA_TUR = 'taarkod-gecmis', MAKS_DOSYA = 200000;
  var STANDARTLAR = ['code128', 'code39', 'code93', 'qr', 'datamatrix', 'ean13', 'itf14', 'ean8', 'upca'];

  function tamSayi(v, min, max) { return typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max; }
  function seriTemiz(s) { return typeof s === 'string' && /^[\p{L}\p{N} _.\-]{0,40}$/u.test(s) ? s : null; }
  function tarihTemiz(t) {
    if (typeof t !== 'string' || t.length > 40) return null;
    var d = new Date(t);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Ham nesneden güvenli kayıt üretir; geçersizse null. Bilinmeyen alanlar (kelime vb.) atılır.
  function kayitTemizle(h) {
    if (h === null || typeof h !== 'object' || Array.isArray(h)) return null;
    var tarih = tarihTemiz(h.tarih), seri = seriTemiz(h.seriAdi);
    if (!tarih || seri === null) return null;
    if (!tamSayi(h.bas, 0, Number.MAX_SAFE_INTEGER) || !tamSayi(h.son, 0, Number.MAX_SAFE_INTEGER) || h.son < h.bas) return null;
    if (STANDARTLAR.indexOf(h.standart) < 0 || !tamSayi(h.uzunluk, 1, 60)) return null;
    var adet = tamSayi(h.adet, 0, Number.MAX_SAFE_INTEGER) ? h.adet : h.son - h.bas + 1;
    return { tarih: tarih, seriAdi: seri, bas: h.bas, son: h.son, standart: h.standart, uzunluk: h.uzunluk, adet: adet };
  }

  // Saf çakışma hesabı: aynı seri adı ve [bas, son] aralığı kesişen kayıtları (en yeni başta, girdi sırası korunur) döndürür.
  // Her öğe: { kayit, kesisimBas, kesisimSon, kesisimAdet }. Sayılar kodla hesaplanır; geçersiz girdi boş liste verir.
  function cakisma(kayitlar, seriAdi, bas, son) {
    if (!Array.isArray(kayitlar) || typeof seriAdi !== 'string') return [];
    if (!tamSayi(bas, 0, Number.MAX_SAFE_INTEGER) || !tamSayi(son, 0, Number.MAX_SAFE_INTEGER) || son < bas) return [];
    var sonuc = [];
    kayitlar.forEach(function (k) {
      if (!k || k.seriAdi !== seriAdi || !tamSayi(k.bas, 0, Number.MAX_SAFE_INTEGER) || !tamSayi(k.son, 0, Number.MAX_SAFE_INTEGER)) return;
      var b = Math.max(bas, k.bas), s = Math.min(son, k.son);
      if (b <= s) sonuc.push({ kayit: k, kesisimBas: b, kesisimSon: s, kesisimAdet: s - b + 1 });
    });
    return sonuc;
  }

  function olustur(depo) {
    var d = Depo.olustur(depo);
    function yukle() {
      var ham = d.oku(ANAHTAR), a;
      if (!ham) return [];
      try { a = JSON.parse(ham); } catch (e) { return []; }
      if (!Array.isArray(a)) return [];
      return a.map(kayitTemizle).filter(Boolean).slice(0, LIMIT);
    }
    function kaydet(liste) { d.yaz(ANAHTAR, JSON.stringify(liste.slice(0, LIMIT))); }
    return {
      LIMIT: LIMIT,
      kalici: d.kalici,
      listele: yukle, // en yeni başta
      cakisma: function (seriAdi, bas, son) { return cakisma(yukle(), seriAdi, bas, son); },
      ekle: function (kayit) {
        var k = kayitTemizle(Object.assign({ tarih: new Date().toISOString() }, kayit));
        if (!k) throw new Error('Geçmiş kaydı geçersiz.');
        var l = yukle(); l.unshift(k); kaydet(l);
        return k;
      },
      temizle: function () { d.sil(ANAHTAR); },
      disaAktar: function () {
        return JSON.stringify({ surum: 1, tur: DOSYA_TUR, kayitlar: yukle() }, null, 2) + '\n';
      },
      // Mevcut listeyle birleştirir (aynı tarih+seri+aralık tekrar eklenmez); en yeni LIMIT kayıt kalır.
      iceAktar: function (metin) {
        if (typeof metin !== 'string' || metin.length > MAKS_DOSYA) throw new Error('Geçmiş dosyası çok büyük ya da okunamadı.');
        var o;
        try { o = JSON.parse(metin); } catch (e) { throw new Error('Dosya geçerli bir JSON değil.'); }
        var ham = Array.isArray(o) ? o : (o && o.tur === DOSYA_TUR && Array.isArray(o.kayitlar) ? o.kayitlar : null);
        if (!ham) throw new Error('Dosya geçerli bir geçmiş dosyası değil.');
        var gecerli = ham.map(kayitTemizle).filter(Boolean), atlanan = ham.length - gecerli.length;
        var mevcut = yukle(), anahtar = function (k) { return [k.tarih, k.seriAdi, k.bas, k.son, k.standart].join('|'); };
        var var_ = {}; mevcut.forEach(function (k) { var_[anahtar(k)] = 1; });
        var eklenen = 0;
        gecerli.forEach(function (k) { if (!var_[anahtar(k)]) { var_[anahtar(k)] = 1; mevcut.push(k); eklenen++; } });
        mevcut.sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0; });
        kaydet(mevcut);
        return { eklenen: eklenen, atlanan: atlanan };
      }
    };
  }

  return { olustur: olustur, kayitTemizle: kayitTemizle, cakisma: cakisma, ANAHTAR: ANAHTAR, LIMIT: LIMIT };
});
