/* Doğrulama modu: yapıştırılan/yüklenen barkod metinlerini kurala göre denetler. Saf JS; sayımlar kodla yapılır.
 * Her değer TAM OLARAK bir sınıfa girer: gecerli | onek | bicim | luhn | yinelenen | aralik.
 *   onek: önek uymuyor; bicim: rakam/uzunluk/ilk rakam 0; luhn: kontrol hanesi tutmuyor;
 *   yinelenen: biçimi geçerli olup daha önce görülmüş; aralik: çözülen sıra no kuraldaki başlangıç-bitiş (kapasite) dışında.
 * Anahtar kelime gerekmez; yalnızca aralık denetimi için çözme işlevi (coz) verilirse yapılır. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./core.js'), require('./kural.js'));
  else kok.BarkodDogrula = fabrika(kok.BarkodSifre, kok.BarkodKural);
})(typeof self !== 'undefined' ? self : this, function (Core, Kural) {
  'use strict';

  var TURLER = ['onek', 'bicim', 'luhn', 'yinelenen', 'aralik'];
  var NEDEN = {
    bos: 'Boş değer.',
    onek: 'Önek uymuyor.',
    bicim: 'Biçim hatalı (rakam sayısı, rakam olmayan karakter ya da ilk rakam 0).',
    luhn: 'Luhn kontrol rakamı tutmuyor.',
    yinelenen: 'Yinelenen değer.',
    aralik: 'Sıra numarası kuraldaki aralığın (kapasitenin) dışında.'
  };

  // GS1 (EAN-13 / EAN-8 / UPC-A / ITF-14): sondan 3,1,3,1... ağırlıklı mod 10; son rakam kontrol rakamıdır.
  function gs1Gecerli(tam) {
    var t = 0;
    for (var i = tam.length - 2, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) t += Number(tam.charAt(i)) * w;
    return (10 - (t % 10)) % 10 === Number(tam.charAt(tam.length - 1));
  }

  // Artımlı denetçi (büyük listelerde arayüz dilimler halinde besler): ekle({satir, deger}), sonuc()
  // kural: {onek, luhn, toplamRakam}  secenek: {bas, son, coz: function(metin)->{gecerli,sira}}
  // sonuc(): { ozet: {toplam, gecerli, onek, bicim, luhn, yinelenen, aralik, hatali}, hatalar: [{satir, deger, tur, neden}] }
  function denetci(kural, secenek) {
    secenek = secenek || {};
    var ozet = { toplam: 0, gecerli: 0, onek: 0, bicim: 0, luhn: 0, yinelenen: 0, aralik: 0, hatali: 0 };
    var hatalar = [], gor = Object.create(null), onek = String(kural.onek || '');
    var bas = secenek.bas, son = secenek.son, aralikVar = typeof secenek.coz === 'function' && bas !== undefined && son !== undefined;
    function hataEkle(g, d, tur) {
      ozet[tur]++; ozet.hatali++;
      hatalar.push({ satir: g.satir, deger: d, tur: tur, neden: NEDEN[tur] });
    }
    function ekle(g) {
      var d = String(g.deger == null ? '' : g.deger).trim();
      ozet.toplam++;
      if (d.indexOf(onek) !== 0) return hataEkle(g, d, 'onek');
      var kalan = d.slice(onek.length);
      if (!/^\d+$/.test(kalan) || kalan.length !== kural.toplamRakam || kalan.charAt(0) === '0') return hataEkle(g, d, 'bicim');
      if (Kural.GS1_UZUNLUK[kural.standart]) {
        if (!gs1Gecerli(onek + kalan)) return hataEkle(g, d, 'luhn'); // GS1 kontrol rakamı (hata türü 'luhn' altında sayılır)
      } else if (kural.luhn && !Core.luhnGecerli(kalan)) return hataEkle(g, d, 'luhn');
      if (gor[d]) return hataEkle(g, d, 'yinelenen');
      gor[d] = 1;
      if (aralikVar) {
        var r = secenek.coz(d);
        if (r && r.gecerli) {
          var s = BigInt(r.sira);
          if (s < BigInt(bas) || s > BigInt(son)) return hataEkle(g, d, 'aralik');
        }
      }
      ozet.gecerli++;
    }
    return { ekle: ekle, sonuc: function () { return { ozet: ozet, hatalar: hatalar }; } };
  }

  function denetle(girdiler, kural, secenek) {
    var d = denetci(kural, secenek);
    girdiler.forEach(function (g) { d.ekle(g); });
    return d.sonuc();
  }

  // Metin kutusundan: her satır bir değer (boş satırlar atlanır). Dönüş: [{satir, deger}]
  function satirlaraBol(metin, limit) {
    var cikti = [], ham = String(metin == null ? '' : metin).split(/\r\n|\r|\n/);
    for (var i = 0; i < ham.length; i++) {
      if (ham[i].trim() === '') continue;
      if (limit && cikti.length >= limit) break;
      cikti.push({ satir: i + 1, deger: ham[i] });
    }
    return cikti;
  }

  function csvHucre(s) {
    s = String(s);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // elektronik tablo formül enjeksiyonunu önle
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // secenek: {basliklar: [satir, deger, tur, aciklama], neden: function(tur)->metin}. Excel Türkçe için ; ayraç + BOM.
  function raporCsv(hatalar, secenek) {
    secenek = secenek || {};
    var b = secenek.basliklar || ['Satir', 'Deger', 'Hata turu', 'Aciklama'], ad = secenek.neden || function (t) { return NEDEN[t]; };
    var tur = secenek.tur || function (t) { return t; };
    var s = ['﻿' + b.map(csvHucre).join(';') + '\r\n'];
    hatalar.forEach(function (h) {
      s.push([h.satir, h.deger, tur(h.tur), ad(h.tur, h)].map(csvHucre).join(';') + '\r\n');
    });
    return s.join('');
  }

  return { TURLER: TURLER, NEDEN: NEDEN, denetci: denetci, denetle: denetle, satirlaraBol: satirlaraBol, raporCsv: raporCsv, csvHucre: csvHucre };
});
