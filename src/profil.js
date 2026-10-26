/* Ürün profilleri: kural alanlarının adlandırılmış kayıtları (en çok 30). Kayıtta YALNIZCA beyaz listedeki kural alanları
 * (önek, aralık, barkod türü, uzunluk, yöntem, seri adı, Luhn) bulunur; anahtar kelime ya da başka bir alan, çağıran ne verirse versin,
 * hiçbir zaman saklanmaz ya da dışa aktarılmaz. Depolama BarkodDepo üzerindendir (localStorage hata verirse bellek yedeği). */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./depo.js'), require('./kural.js'));
  else kok.BarkodProfil = fabrika(kok.BarkodDepo, kok.BarkodKural);
})(typeof self !== 'undefined' ? self : this, function (Depo, Kural) {
  'use strict';

  var ANAHTAR = 'barkod-profil', LIMIT = 30, AD_MAKS = 40, DOSYA_TUR = 'taarkod-profil', MAKS_DOSYA = 200000;
  var AD_RE = /^[\p{L}\p{N} _.\-]{1,40}$/u;
  var ALANLAR = ['onek', 'standart', 'luhn', 'seriAdi', 'bas', 'son', 'uzunlukModu', 'uzunluk', 'tahminDirenci', 'yontem'];

  function sahip(o, a) { return Object.prototype.hasOwnProperty.call(o, a); }

  function adTemizle(a) {
    if (typeof a !== 'string') return null;
    a = a.trim();
    return a.length >= 1 && a.length <= AD_MAKS && AD_RE.test(a) ? a : null;
  }

  // Ham nesneden güvenli profil üretir: { ad, kural } ya da geçersizse null. Tüm alanlar zorunlu ve doğrulanır;
  // bilinmeyen alanlar (kelime vb.) atılır. kural.kuralTemizle yalnızca beyaz listedeki alanlarla çağrılır.
  function profilTemizle(h) {
    if (h === null || typeof h !== 'object' || Array.isArray(h)) return null;
    var ad = adTemizle(h.ad), ham = h.kural;
    if (ad === null || ham === null || typeof ham !== 'object' || Array.isArray(ham)) return null;
    var alt = {};
    for (var i = 0; i < ALANLAR.length; i++) {
      if (!sahip(ham, ALANLAR[i])) return null;
      alt[ALANLAR[i]] = ham[ALANLAR[i]];
    }
    var r;
    try { r = Kural.kuralTemizle(alt); } catch (e) { return null; }
    if (r.uyarilar.length) return null; // geçersiz değer ya da bitiş < başlangıç
    var kural = {};
    ALANLAR.forEach(function (a) { kural[a] = r.kural[a]; });
    return { ad: ad, kural: kural };
  }

  function olustur(depo) {
    var d = Depo.olustur(depo);
    function yukle() {
      var ham = d.oku(ANAHTAR), a, goruldu = {}, cikti = [];
      if (!ham) return cikti;
      try { a = JSON.parse(ham); } catch (e) { return cikti; }
      if (!Array.isArray(a)) return cikti;
      a.forEach(function (x) {
        var p = profilTemizle(x);
        if (p && !sahip(goruldu, p.ad) && cikti.length < LIMIT) { goruldu[p.ad] = 1; cikti.push(p); }
      });
      return cikti;
    }
    function kaydet(liste) { d.yaz(ANAHTAR, JSON.stringify(liste.slice(0, LIMIT))); }
    function indeks(liste, ad) { for (var i = 0; i < liste.length; i++) if (liste[i].ad === ad) return i; return -1; }
    return {
      LIMIT: LIMIT,
      kalici: d.kalici,
      listele: yukle,
      // Aynı adlı profil güncellenir; yeni ad LIMIT'i aşıyorsa hata verir.
      kaydet: function (ad, kural) {
        var p = profilTemizle({ ad: ad, kural: kural });
        if (!p) throw new Error('Profil geçersiz: ad en fazla 40 karakter olmalı (harf, rakam, boşluk, _ - .) ve kural alanları geçerli olmalı.');
        var l = yukle(), i = indeks(l, p.ad);
        if (i >= 0) l[i] = p;
        else if (l.length >= LIMIT) throw new Error('En fazla ' + LIMIT + ' profil saklanabilir; önce birini silin.');
        else l.push(p);
        kaydet(l);
        return p;
      },
      al: function (ad) { var l = yukle(), i = indeks(l, ad); return i >= 0 ? l[i] : null; },
      sil: function (ad) {
        var l = yukle(), i = indeks(l, ad);
        if (i < 0) return false;
        l.splice(i, 1); kaydet(l);
        return true;
      },
      temizle: function () { d.sil(ANAHTAR); },
      disaAktar: function () {
        return JSON.stringify({ surum: 1, tur: DOSYA_TUR, profiller: yukle() }, null, 2) + '\n';
      },
      // Mevcut listeyle birleştirir (aynı ad güncellenir); LIMIT aşılırsa kalan geçerli profiller atlanır.
      iceAktar: function (metin) {
        if (typeof metin !== 'string' || metin.length > MAKS_DOSYA) throw new Error('Profil dosyası çok büyük ya da okunamadı.');
        var o;
        try { o = JSON.parse(metin); } catch (e) { throw new Error('Dosya geçerli bir JSON değil.'); }
        var ham = Array.isArray(o) ? o : (o && o.tur === DOSYA_TUR && Array.isArray(o.profiller) ? o.profiller : null);
        if (!ham) throw new Error('Dosya geçerli bir profil dosyası değil.');
        var l = yukle(), eklenen = 0, atlanan = 0;
        ham.forEach(function (x) {
          var p = profilTemizle(x);
          if (!p) { atlanan++; return; }
          var i = indeks(l, p.ad);
          if (i >= 0) { l[i] = p; eklenen++; }
          else if (l.length >= LIMIT) atlanan++;
          else { l.push(p); eklenen++; }
        });
        kaydet(l);
        return { eklenen: eklenen, atlanan: atlanan };
      }
    };
  }

  return { olustur: olustur, profilTemizle: profilTemizle, adTemizle: adTemizle, ANAHTAR: ANAHTAR, LIMIT: LIMIT, ALANLAR: ALANLAR };
});
