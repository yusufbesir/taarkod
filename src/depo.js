/* Güvenli yerel depo: localStorage varsa kullanır (her erişim try/catch içinde), yoksa ya da hata verirse bellekte tutar.
 * Yalnızca anahtar/değer metni saklar. Gizli bilgi (anahtar kelime, parola) bu katmana HİÇBİR ZAMAN verilmemelidir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodDepo = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // depo: getItem/setItem/removeItem sunan nesne ya da null (bellek). Verilmezse tarayıcının localStorage'ı denenir.
  function olustur(depo) {
    var bellek = {}, kalici = depo === undefined ? yerel() : depo;
    function sahip(a) { return Object.prototype.hasOwnProperty.call(bellek, a); }
    return {
      kalici: function () { return !!kalici; },
      oku: function (ad) {
        if (kalici) { try { var v = kalici.getItem(ad); if (v !== null && v !== undefined) return String(v); } catch (e) { /* bellek */ } }
        return sahip(ad) ? bellek[ad] : null;
      },
      yaz: function (ad, deger) {
        deger = String(deger);
        bellek[ad] = deger;
        if (kalici) { try { kalici.setItem(ad, deger); return true; } catch (e) { return false; } }
        return false;
      },
      sil: function (ad) {
        delete bellek[ad];
        if (kalici) { try { kalici.removeItem(ad); } catch (e) { /* yok say */ } }
      }
    };
  }

  function yerel() {
    try { return typeof localStorage !== 'undefined' && localStorage ? localStorage : null; } catch (e) { return null; }
  }

  return { olustur: olustur };
});
