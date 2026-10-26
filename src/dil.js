/* Çoklu dil (TR varsayılan, EN): T(anahtar, 'Türkçe metin {0}', ...) — Türkçe metin kodda/HTML'de durur, İngilizce karşılık
 * BarkodDilEN sözlüğündedir (dil_en.js). Seçim BarkodDepo ile saklanır (localStorage try/catch, yoksa bellek).
 * Tarayıcı dili "en" ise ve kayıtlı seçim yoksa başlangıç dili EN'dir. DOM yok: metin biçimi [b]kalın[/b], [k]tuş[/k], [c]kod[/c]. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./depo.js'), require('./dil_en.js'));
  else kok.BarkodDil = fabrika(kok.BarkodDepo, kok.BarkodDilEN);
})(typeof self !== 'undefined' ? self : this, function (Depo, EN) {
  'use strict';

  var ANAHTAR = 'barkod-dil', DILLER = ['tr', 'en'];

  function sahip(o, a) { return Object.prototype.hasOwnProperty.call(o, a); }

  // {0}, {1} ... yer tutucularını doldurur; eksik bağımsız değişken yer tutucuyu olduğu gibi bırakır.
  function bicimle(sablon, args) {
    return String(sablon).replace(/\{(\d+)\}/g, function (m, i) { return args && args[i] !== undefined ? String(args[i]) : m; });
  }

  // Metni parçalara ayırır: [{t:'m'|'b'|'k'|'c', s}]. Kapanmamış işaretler düz metin sayılır.
  function parcala(metin) {
    var cikti = [], re = /\[(b|k|c)\]([\s\S]*?)\[\/\1\]/g, son = 0, m;
    metin = String(metin);
    while ((m = re.exec(metin))) {
      if (m.index > son) cikti.push({ t: 'm', s: metin.slice(son, m.index) });
      cikti.push({ t: m[1], s: m[2] });
      son = re.lastIndex;
    }
    if (son < metin.length) cikti.push({ t: 'm', s: metin.slice(son) });
    return cikti;
  }

  // kayitli: depodaki değer; diller: navigator.languages. Kayıtlı geçerli seçim önceliklidir.
  function baslangicDil(kayitli, diller) {
    if (DILLER.indexOf(kayitli) >= 0) return kayitli;
    var d = (diller || []).filter(Boolean)[0];
    return typeof d === 'string' && /^en(?:[-_]|$)/i.test(d) ? 'en' : 'tr';
  }

  var HATA_KURALLARI = null;
  function kurallar() {
    if (!HATA_KURALLARI) HATA_KURALLARI = EN.hata.map(function (k) { return { re: new RegExp(k[0]), sablon: k[1] }; });
    return HATA_KURALLARI;
  }
  // Çekirdek modüllerin Türkçe hata iletilerini İngilizceye çevirir; bilinmeyen ileti aynen döner.
  function hataCevirEN(m) {
    m = String(m);
    var k = kurallar();
    for (var i = 0; i < k.length; i++) if (k[i].re.test(m)) return m.replace(k[i].re, k[i].sablon);
    return m;
  }

  function onerNedenEN(k, b) {
    var o = b.oneri, luhnH = k.luhn ? 1 : 0, N = o.toplamRakam, direnc = k.tahminDirenci;
    return 'For a highest sequence number of ' + Math.max(k.son, 1) + ' and a requested guess resistance of 1/' + direnc +
      ', a number space of at least ' + (N - luhnH) + ' digits is needed; the chance that a randomly tried number matches a valid sequence number then ' +
      (o.ustSinir ? 'may fall short of the target (the upper limit of 30 digits was reached)' : 'stays below 1/' + direnc) + '.' +
      (k.luhn ? ' The last digit is the Luhn check digit, so ' + (N - 1) + ' digits come from the sequence number.' : '') +
      (k.standart === 'code128' ? ' Code 128 packs digits in pairs, so an even total was chosen.' : '') + ' The lower limit is 8 digits.';
  }

  function olustur(depo, diller) {
    var d = Depo.olustur(depo), dil = baslangicDil(d.oku(ANAHTAR), diller);
    var o = {
      dil: function () { return dil; },
      sec: function (l) {
        if (DILLER.indexOf(l) < 0) throw new Error('Desteklenmeyen dil: ' + String(l).slice(0, 10));
        dil = l; d.yaz(ANAHTAR, l);
      },
      // İngilizce karşılık (EN seçiliyse ve anahtar varsa), yoksa null
      ceviri: function (anahtar) { return dil === 'en' && sahip(EN.m, anahtar) ? EN.m[anahtar] : null; },
      // Sözlükte Türkçe metnin karşılığı var mı (dilden bağımsız) ve EN seçiliyse İngilizce metin
      statikVar: function (tr) { return sahip(EN.s, tr); },
      statik: function (tr) { return dil === 'en' && sahip(EN.s, tr) ? EN.s[tr] : null; },
      t: function (anahtar, tr) {
        var s = tr, e = o.ceviri(anahtar);
        if (e !== null) s = e;
        return bicimle(s, Array.prototype.slice.call(arguments, 2));
      },
      hata: function (m) { return dil === 'en' ? hataCevirEN(m) : String(m); },
      yontem: function (y) {
        var e = dil === 'en' && sahip(EN.yontem, y.id) ? EN.yontem[y.id] : null;
        return e ? { ad: e.ad, kisa: e.kisa, nasil: e.nasil, artilar: e.artilar, eksiler: e.eksiler } : { ad: y.ad, kisa: y.kisa, nasil: y.nasil, artilar: y.artilar || [], eksiler: y.eksiler || [] };
      },
      standart: function (s) {
        var e = dil === 'en' && sahip(EN.standart, s.id) ? EN.standart[s.id] : null;
        return e ? { ad: e.ad, aciklama: e.aciklama, girdi: e.girdi || s.girdi || '' } : { ad: s.ad || s.id, aciklama: s.aciklama || '', girdi: s.girdi || '' };
      },
      bicim: function (b) {
        var e = dil === 'en' && sahip(EN.bicim, b.id) ? EN.bicim[b.id] : null;
        return e ? { ad: e.ad, aciklama: e.aciklama } : { ad: b.ad, aciklama: b.aciklama };
      },
      neden: function (k, b) { return dil === 'en' ? onerNedenEN(k, b) : b.oneri.neden; }
    };
    return o;
  }

  return { ANAHTAR: ANAHTAR, DILLER: DILLER, olustur: olustur, parcala: parcala, bicimle: bicimle, baslangicDil: baslangicDil, hataCevirEN: hataCevirEN };
});
