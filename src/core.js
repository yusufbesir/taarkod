/* Barkod sıra numarası karıştırma çekirdeği.
 * Kriptografik güvenlik DEĞİL; yalnızca sıralı numaraları gizlemek içindir.
 * Anahtar kelime koda gömülü değildir, her çağrıda dışarıdan verilir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodSifre = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Türkçe alfabe sırası (q, w, x de dahil).
  var ALFABE = 'abcçdefgğhıijklmnoöpqrsştuüvwxyz';

  function kucukHarf(s) {
    // Türkçe kurallı küçültme: I -> ı, İ -> i
    return String(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
  }

  function kelimeyiHazirla(kelime) {
    var k = kucukHarf(kelime).replace(/\s+/g, '');
    if (k.length < 2) throw new Error('Anahtar kelime en az 2 harf olmalı.');
    var idx = [];
    for (var i = 0; i < k.length; i++) {
      var p = ALFABE.indexOf(k[i]);
      if (p < 0) throw new Error('Anahtar kelimede desteklenmeyen karakter: "' + k[i] + '". Yalnızca harf kullanın.');
      idx.push(p);
    }
    var farkli = {};
    idx.forEach(function (v) { farkli[v] = 1; });
    if (Object.keys(farkli).length < 2) throw new Error('Anahtar kelimede en az 2 farklı harf olmalı.');
    return idx;
  }

  function haneKontrol(hane) {
    if (!(Number.isInteger(hane) && hane >= 2 && hane <= 30)) throw new Error('Hane sayısı 2 ile 30 arasında olmalı.');
  }

  // Harflerin alfabetik sırasından permütasyon: eşitlikte soldaki önce gelir.
  // sira[i] = i. konumdaki harfin sıralamadaki yeri (0..hane-1).
  function planOlustur(kelime, hane) {
    haneKontrol(hane);
    var idx = kelimeyiHazirla(kelime);
    var harf = [];
    for (var i = 0; i < hane; i++) harf.push(idx[i % idx.length]);
    var sirali = harf.map(function (h, i) { return i; }).sort(function (a, b) {
      return harf[a] - harf[b] || a - b;
    });
    var sira = new Array(hane);
    sirali.forEach(function (kaynak, yer) { sira[kaynak] = yer; });
    return { sira: sira, hane: hane };
  }

  // Sıra no: güvenli tam sayı ya da yalnızca rakamlardan oluşan metin (19 hane gibi uzun değerler için).
  function sayiyiRakamlaraCevir(n, hane) {
    var s;
    if (typeof n === 'string') {
      if (!/^\d+$/.test(n)) throw new Error('Sıra numarası pozitif tam sayı olmalı.');
      s = n.replace(/^0+(?=\d)/, '');
    } else {
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Sıra numarası pozitif tam sayı olmalı.');
      s = String(n);
    }
    if (s.length > hane) throw new Error('Sıra numarası ' + hane + ' haneye sığmıyor.');
    while (s.length < hane) s = '0' + s;
    return s.split('').map(Number);
  }

  // Zincir çarpanları: 10 ile aralarında asal (1,3,7,9) olduklarından fark sönmez.
  var CARPAN = [1, 3, 7, 9];
  function carpan(plan, j) { return CARPAN[plan.sira[j] % 4]; }

  function sifrele(n, kelime, hane) {
    hane = hane === undefined ? 6 : hane;
    var plan = planOlustur(kelime, hane);
    var r = sayiyiRakamlaraCevir(n, hane), j;
    // 1) rakam kaydırma + konum karıştırma
    var s = new Array(hane);
    for (var i = 0; i < hane; i++) s[plan.sira[i]] = (r[i] + plan.sira[i]) % 10;
    // 2) iki tur ileri+geri zincir: ardışık numaralar birbirine benzemesin
    for (var tur = 0; tur < 2; tur++) {
      for (j = 1; j < hane; j++) s[j] = (s[j] + carpan(plan, j) * s[j - 1]) % 10;
      for (j = hane - 2; j >= 0; j--) s[j] = (s[j] + carpan(plan, j) * s[j + 1]) % 10;
    }
    return s.join('');
  }

  function coz(kod, kelime, hane) {
    hane = hane === undefined ? 6 : hane;
    var plan = planOlustur(kelime, hane);
    if (typeof kod !== 'string' || !/^\d+$/.test(kod) || kod.length !== hane) throw new Error('Kod tam olarak ' + hane + ' haneli rakamlardan oluşmalı.');
    var s = kod.split('').map(Number), j;
    for (var tur = 0; tur < 2; tur++) {
      for (j = 0; j <= hane - 2; j++) s[j] = ((s[j] - carpan(plan, j) * s[j + 1]) % 10 + 10) % 10;
      for (j = hane - 1; j >= 1; j--) s[j] = ((s[j] - carpan(plan, j) * s[j - 1]) % 10 + 10) % 10;
    }
    var r = new Array(hane);
    for (var i = 0; i < hane; i++) r[i] = ((s[plan.sira[i]] - plan.sira[i]) % 10 + 10) % 10;
    var d = r.join('').replace(/^0+(?=\d)/, '');
    return Number.isSafeInteger(Number(d)) ? Number(d) : d;
  }

  // Luhn kontrol rakamı: yük (payload) metninin sağına eklenecek rakamı döndürür.
  function luhnRakami(yuk) {
    if (!/^\d+$/.test(yuk)) throw new Error('Luhn için yalnızca rakam gerekir.');
    var toplam = 0;
    for (var i = 0; i < yuk.length; i++) {
      var d = Number(yuk[yuk.length - 1 - i]);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      toplam += d;
    }
    return (10 - toplam % 10) % 10;
  }

  function luhnGecerli(tam) {
    return /^\d{2,}$/.test(tam) && luhnRakami(tam.slice(0, -1)) === Number(tam.slice(-1));
  }

  // Barkod = şifreli sıra no (toplam-1 hane) + Luhn kontrol rakamı. Varsayılan toplam uzunluk 20.
  function barkodUret(n, kelime, toplam) {
    toplam = toplam === undefined ? 20 : toplam;
    var yuk = sifrele(n, kelime, toplam - 1);
    return yuk + luhnRakami(yuk);
  }

  // Kontrol rakamı tutmazsa gecerli:false döner ve sıra no çözülmez.
  function barkodCoz(barkod, kelime, toplam) {
    toplam = toplam === undefined ? 20 : toplam;
    if (typeof barkod !== 'string' || !/^\d+$/.test(barkod) || barkod.length !== toplam) throw new Error('Barkod tam olarak ' + toplam + ' haneli rakamlardan oluşmalı.');
    if (!luhnGecerli(barkod)) return { gecerli: false, sira: null };
    return { gecerli: true, sira: coz(barkod.slice(0, -1), kelime, toplam - 1) };
  }

  return { ALFABE: ALFABE, planOlustur: planOlustur, sifrele: sifrele, coz: coz, luhnRakami: luhnRakami, luhnGecerli: luhnGecerli, barkodUret: barkodUret, barkodCoz: barkodCoz, kucukHarf: kucukHarf };
});
