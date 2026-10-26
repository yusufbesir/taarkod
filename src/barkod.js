/* Barkod standartları: Code 128, Code 39, Code 93 kodlayıcıları, SVG çıktısı ve uzunluk önerisi.
 * Dış kütüphane yok. Kodlayıcılar {karakterSayisi, sembolSayisi, modulSayisi, moduller} döndürür;
 * moduller: çubuk/boşluk genişlikleri (modül cinsinden), her zaman çubukla başlar. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodCiz = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Code 128 ---------- */
  // 0..105 veri/başlangıç desenleri (çubuk,boşluk,... genişlikleri), 106 = STOP (7 eleman)
  var C128 = ('212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 ' +
    '221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 ' +
    '221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 ' +
    '212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 ' +
    '231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 ' +
    '231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 ' +
    '314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 ' +
    '112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 ' +
    '111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 ' +
    '214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 ' +
    '114131 311141 411131 211412 211214 211232 2331112').split(' ');
  var START_A = 103, START_B = 104, START_C = 105, STOP = 106;
  var KOD_C = 99, KOD_B = 100, KOD_A = 101;

  function haneler(s) { return s.split('').map(Number); }

  function rakamKosusu(metin, i) {
    var k = 0;
    while (i + k < metin.length && metin.charCodeAt(i + k) >= 48 && metin.charCodeAt(i + k) <= 57) k++;
    return k;
  }

  // Bir karakterin A/B alt kümesindeki değeri; yoksa -1
  function degerAB(kod, alt) {
    if (alt === 'A') {
      if (kod >= 0 && kod <= 31) return kod + 64;
      if (kod >= 32 && kod <= 95) return kod - 32;
      return -1;
    }
    return kod >= 32 && kod <= 127 ? kod - 32 : -1;
  }

  function code128Degerler(metin) {
    metin = String(metin);
    var n = metin.length;
    if (!n) throw new Error('Code 128: boş metin kodlanamaz.');
    for (var j = 0; j < n; j++) {
      if (metin.charCodeAt(j) > 127) {
        throw new Error('Code 128: "' + metin.charAt(j) + '" karakteri desteklenmiyor (yalnızca ASCII 0-127).');
      }
    }
    var SONSUZ = 1e9, bellek = {};
    // enc: m alt kümesindeyken i. karakteri (C'de ikiliyi) yazmanın toplam maliyeti
    function enc(i, m) {
      if (i >= n) return 0;
      var a = 'enc' + i + m;
      if (a in bellek) return bellek[a];
      var s = SONSUZ;
      if (m === 'C') {
        if (i + 1 < n && rakamKosusu(metin, i) >= 2) s = 1 + maliyet(i + 2, 'C');
      } else if (degerAB(metin.charCodeAt(i), m) >= 0) {
        s = 1 + maliyet(i + 1, m);
      }
      bellek[a] = s;
      return s;
    }
    function maliyet(i, m) {
      if (i >= n) return 0;
      var a = 'mal' + i + m;
      if (a in bellek) return bellek[a];
      var en = enc(i, m);
      ['C', 'B', 'A'].forEach(function (m2) {
        if (m2 !== m) en = Math.min(en, 1 + enc(i, m2));
      });
      bellek[a] = en;
      return en;
    }
    function sirala(i, m, baslangic) {
      var L = rakamKosusu(metin, i);
      var sira = ['stay', 'C', 'B', 'A'];
      if (baslangic) {
        sira = ['C', 'B', 'A'];
        if (L >= 4 && L % 2 === 1) sira = ['B', 'C', 'A'];          // tek sayıda rakam: ilk rakam B'de
        else if (!(L >= 4 || (L >= 2 && L === n))) sira = ['B', 'A', 'C'];
      } else if (m !== 'C' && L >= 4 && L % 2 === 0) {
        sira = ['C', 'stay', 'B', 'A'];                              // çift boyda 4+ rakam koşusu: C'ye geç
      }
      return sira;
    }
    function maliyetAday(i, m, aday, baslangic) {
      if (baslangic) return enc(i, aday);
      if (aday === 'stay') return enc(i, m);
      return aday === m ? SONSUZ : 1 + enc(i, aday);
    }
    var degerler = [], m = null, i = 0, ilk = true;
    while (i < n) {
      var en = SONSUZ, secim = null, sira = sirala(i, m, ilk), k;
      if (ilk) {
        for (k = 0; k < 3; k++) en = Math.min(en, maliyetAday(i, null, sira[k], true));
      } else {
        en = maliyet(i, m);
      }
      for (k = 0; k < sira.length; k++) {
        if (maliyetAday(i, m, sira[k], ilk) === en) { secim = sira[k]; break; }
      }
      if (ilk) {
        degerler.push(secim === 'C' ? START_C : secim === 'B' ? START_B : START_A);
        m = secim;
        ilk = false;
      } else if (secim !== 'stay' && secim !== m) {
        degerler.push(secim === 'C' ? KOD_C : secim === 'B' ? KOD_B : KOD_A);
        m = secim;
      }
      if (m === 'C') {
        degerler.push(Number(metin.substr(i, 2)));
        i += 2;
      } else {
        degerler.push(degerAB(metin.charCodeAt(i), m));
        i += 1;
      }
    }
    var toplam = degerler[0];
    for (var p = 1; p < degerler.length; p++) toplam += degerler[p] * p;
    degerler.push(toplam % 103);
    return degerler;
  }

  // Alt tür zorlaması: A (büyük harf, rakam, işaret, kontrol karakterleri), B (büyük/küçük harf, işaret), C (çift sayıda rakam).
  function code128Alt(metin, alt) {
    metin = String(metin);
    var n = metin.length, d = [], j;
    if (!n) throw new Error('Code 128: boş metin kodlanamaz.');
    if (alt === 'C') {
      if (!/^[0-9]+$/.test(metin)) throw new Error('Code 128C: yalnızca rakam kodlanabilir.');
      if (n % 2) throw new Error('Code 128C: rakamlar ikişerli yazılır, çift sayıda rakam gerekir (şimdi ' + n + ').');
      d.push(START_C);
      for (j = 0; j < n; j += 2) d.push(Number(metin.substr(j, 2)));
    } else {
      d.push(alt === 'A' ? START_A : START_B);
      for (j = 0; j < n; j++) {
        var kod = metin.charCodeAt(j), v = kod > 127 ? -1 : degerAB(kod, alt);
        if (v < 0) {
          throw new Error('Code 128' + alt + ': "' + metin.charAt(j) + '" karakteri desteklenmiyor (' +
            (alt === 'A' ? 'A: büyük harf, rakam, işaret ve kontrol karakterleri; küçük harf yok)' : 'B: büyük/küçük harf, rakam ve işaretler; kontrol karakteri yok)') + '.');
        }
        d.push(v);
      }
    }
    var toplam = d[0];
    for (var p = 1; p < d.length; p++) toplam += d[p] * p;
    d.push(toplam % 103);
    return d;
  }

  function code128(metin, secenek) {
    var alt = secenek && secenek.alt;
    var d = alt === 'A' || alt === 'B' || alt === 'C' ? code128Alt(metin, alt) : code128Degerler(metin);
    var tum = d.concat([STOP]);
    var moduller = [];
    tum.forEach(function (v) { moduller = moduller.concat(haneler(C128[v])); });
    var modul = moduller.reduce(function (a, b) { return a + b; }, 0);
    return {
      karakterSayisi: String(metin).length, sembolSayisi: tum.length, modulSayisi: modul,
      moduller: moduller, degerler: d, sagLama: d[d.length - 1]
    };
  }

  /* ---------- Code 39 ---------- */
  var C39_SIRA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  // n=dar, w=geniş; 9 eleman: çubuk,boşluk,çubuk,...
  var C39_DESEN = ('nnnwwnwnn wnnwnnnnw nnwwnnnnw wnwwnnnnn nnnwwnnnw wnnwwnnnn nnwwwnnnn nnnwnnwnw wnnwnnwnn nnwwnnwnn ' +
    'wnnnnwnnw nnwnnwnnw wnwnnwnnn nnnnwwnnw wnnnwwnnn nnwnwwnnn nnnnnwwnw wnnnnwwnn nnwnnwwnn nnnnwwwnn ' +
    'wnnnnnnww nnwnnnnww wnwnnnnwn nnnnwnnww wnnnwnnwn nnwnwnnwn nnnnnnwww wnnnnnwwn nnwnnnwwn nnnnwnwwn ' +
    'wwnnnnnnw nwwnnnnnw wwwnnnnnn nwnnwnnnw wwnnwnnnn nwwnwnnnn nwnnnnwnw wwnnnnwnn nwwnnnwnn ' +
    'nwnwnwnnn nwnwnnnwn nwnnnwnwn nnnwnwnwn').split(' ');
  var C39_YILDIZ = 'nwnnwnwnn';

  function c39Elemanlar(d) {
    return d.split('').map(function (c) { return c === 'w' ? 3 : 1; });
  }

  function code39(metin, secenek) {
    metin = String(metin);
    var mod43 = !!(secenek && secenek.mod43);
    if (!metin.length) throw new Error('Code 39: boş metin kodlanamaz.');
    var toplam = 0, j;
    for (j = 0; j < metin.length; j++) {
      var v = C39_SIRA.indexOf(metin.charAt(j));
      if (v < 0) {
        throw new Error('Code 39: "' + metin.charAt(j) + '" karakteri desteklenmiyor (yalnızca A-Z 0-9 - . $ / + % ve boşluk; küçük harf yok).');
      }
      toplam += v;
    }
    var govde = metin;
    if (mod43) govde += C39_SIRA.charAt(toplam % 43);
    var desenler = [C39_YILDIZ];
    for (j = 0; j < govde.length; j++) desenler.push(C39_DESEN[C39_SIRA.indexOf(govde.charAt(j))]);
    desenler.push(C39_YILDIZ);
    var moduller = [];
    desenler.forEach(function (d, ix) {
      if (ix > 0) moduller.push(1); // karakterler arası dar boşluk
      moduller = moduller.concat(c39Elemanlar(d));
    });
    return {
      karakterSayisi: metin.length, sembolSayisi: desenler.length,
      modulSayisi: moduller.reduce(function (a, b) { return a + b; }, 0),
      moduller: moduller, govde: govde, sagLama: mod43 ? govde.charAt(govde.length - 1) : null
    };
  }

  /* ---------- Code 93 ---------- */
  var C93_SIRA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  var C93_BIT = ('100010100 101001000 101000100 101000010 100101000 100100100 100100010 101010000 100010010 100001010 ' +
    '110101000 110100100 110100010 110010100 110010010 110001010 101101000 101100100 101100010 100110100 ' +
    '100011010 101011000 101001100 101000110 100101100 100010110 110110100 110110010 110101100 110100110 ' +
    '110010110 110011010 101101100 101100110 100110110 100111010 ' +
    '100101110 111010100 111010010 111001010 101101110 101110110 110101110 ' +
    // 43..46: sağlama karakterlerinde kullanılan ($) (%) (/) (+) desenleri
    '100100110 111011010 111010110 100110010').split(' ');
  var C93_YILDIZ = '101011110';

  function bitlerdenModuller(bitler) {
    var m = [], onceki = null;
    for (var i = 0; i < bitler.length; i++) {
      if (bitler.charAt(i) === onceki) m[m.length - 1]++;
      else { m.push(1); onceki = bitler.charAt(i); }
    }
    return m;
  }

  function c93Sagla(degerler, tavan) {
    var t = 0, w = 1;
    for (var i = degerler.length - 1; i >= 0; i--) {
      t += degerler[i] * w;
      w = w === tavan ? 1 : w + 1;
    }
    return t % 47;
  }

  function c93Ad(d) { return d < 43 ? C93_SIRA.charAt(d) : ['($)', '(%)', '(/)', '(+)'][d - 43]; }

  function code93(metin) {
    metin = String(metin);
    if (!metin.length) throw new Error('Code 93: boş metin kodlanamaz.');
    var v = [];
    for (var j = 0; j < metin.length; j++) {
      var x = C93_SIRA.indexOf(metin.charAt(j));
      if (x < 0) {
        throw new Error('Code 93: "' + metin.charAt(j) + '" karakteri desteklenmiyor (yalnızca A-Z 0-9 - . $ / + % ve boşluk).');
      }
      v.push(x);
    }
    var c = c93Sagla(v, 20);
    var k = c93Sagla(v.concat([c]), 15);
    var tum = v.concat([c, k]);
    var bitler = C93_YILDIZ + tum.map(function (d) { return C93_BIT[d]; }).join('') + C93_YILDIZ + '1';
    var moduller = bitlerdenModuller(bitler);
    return {
      karakterSayisi: metin.length, sembolSayisi: tum.length + 2, modulSayisi: bitler.length,
      moduller: moduller, sagLama: c93Ad(c) + c93Ad(k)
    };
  }

  /* ---------- GS1: EAN-13 ve ITF-14 ---------- */
  // GS1 kontrol rakamı: sağdan sola ağırlıklar 3,1,3,1...; verilen metin kontrol rakamı HARİÇ rakamlardır.
  function gs1Sagla(rakamlar) {
    var t = 0;
    for (var i = rakamlar.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) t += Number(rakamlar.charAt(i)) * w;
    return (10 - (t % 10)) % 10;
  }

  // Yalnız rakam; tamUzunluk (kontrol dahil) ya da tamUzunluk-1 (kontrol hesaplanır) kabul edilir.
  function gs1Govde(ad, metin, tamUzunluk) {
    metin = String(metin);
    if (!/^[0-9]+$/.test(metin)) throw new Error(ad + ': yalnızca rakam kodlanabilir.');
    if (metin.length !== tamUzunluk && metin.length !== tamUzunluk - 1) {
      throw new Error(ad + ': ' + (tamUzunluk - 1) + ' rakam (kontrol rakamı otomatik eklenir) ya da kontrol rakamıyla birlikte ' + tamUzunluk + ' rakam verilmeli.');
    }
    var veri = metin.slice(0, tamUzunluk - 1), kontrol = gs1Sagla(veri);
    if (metin.length === tamUzunluk && Number(metin.charAt(tamUzunluk - 1)) !== kontrol) {
      throw new Error(ad + ': kontrol rakamı hatalı (beklenen ' + kontrol + ').');
    }
    return veri + kontrol;
  }

  var EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  var EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  var EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
  var EAN_PARITE = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

  function ean13(metin) {
    var govde = gs1Govde('EAN-13', metin, 13);
    var parite = EAN_PARITE[Number(govde.charAt(0))];
    var bitler = '101', j;
    for (j = 1; j <= 6; j++) {
      bitler += (parite.charAt(j - 1) === 'L' ? EAN_L : EAN_G)[Number(govde.charAt(j))];
    }
    bitler += '01010';
    for (j = 7; j <= 12; j++) bitler += EAN_R[Number(govde.charAt(j))];
    bitler += '101';
    return {
      karakterSayisi: String(metin).length, sembolSayisi: 12, modulSayisi: bitler.length,
      moduller: bitlerdenModuller(bitler), govde: govde, sagLama: govde.charAt(12)
    };
  }

  // Interleaved 2 of 5: her desen 5 eleman (n=dar, w=geniş)
  var ITF_DESEN = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn'];

  function itf14(metin) {
    var govde = gs1Govde('ITF-14', metin, 14);
    var moduller = [1, 1, 1, 1]; // başlangıç: dar çubuk, boşluk, çubuk, boşluk
    for (var j = 0; j < 14; j += 2) {
      var cubuk = ITF_DESEN[Number(govde.charAt(j))], bosluk = ITF_DESEN[Number(govde.charAt(j + 1))];
      for (var e = 0; e < 5; e++) {
        moduller.push(cubuk.charAt(e) === 'w' ? 3 : 1);
        moduller.push(bosluk.charAt(e) === 'w' ? 3 : 1);
      }
    }
    moduller.push(3, 1, 1); // bitiş: geniş çubuk, dar boşluk, dar çubuk
    return {
      karakterSayisi: String(metin).length, sembolSayisi: 7 + 2, modulSayisi: moduller.reduce(function (a, b) { return a + b; }, 0),
      moduller: moduller, govde: govde, sagLama: govde.charAt(13)
    };
  }

  /* ---------- Perakende: EAN-8, UPC-A, UPC-E, EAN-5, EAN-2 ---------- */
  function sagaBitler(govde, bas, say) {
    var s = '';
    for (var j = bas; j < bas + say; j++) s += EAN_R[Number(govde.charAt(j))];
    return s;
  }
  function solBitler(govde, bas, say) {
    var s = '';
    for (var j = bas; j < bas + say; j++) s += EAN_L[Number(govde.charAt(j))];
    return s;
  }
  function gs1Sonuc(metin, govde, bitler, sembol, sagLama) {
    return {
      karakterSayisi: String(metin).length, sembolSayisi: sembol, modulSayisi: bitler.length,
      moduller: bitlerdenModuller(bitler), govde: govde, sagLama: sagLama == null ? null : sagLama
    };
  }

  function ean8(metin) {
    var govde = gs1Govde('EAN-8', metin, 8);
    return gs1Sonuc(metin, govde, '101' + solBitler(govde, 0, 4) + '01010' + sagaBitler(govde, 4, 4) + '101', 8, govde.charAt(7));
  }

  function upca(metin) {
    var govde = gs1Govde('UPC-A', metin, 12);
    return gs1Sonuc(metin, govde, '101' + solBitler(govde, 0, 6) + '01010' + sagaBitler(govde, 6, 6) + '101', 12, govde.charAt(11));
  }

  // UPC-E (sıfır bastırmalı): 6 (sistem 0 varsayılır), 7 (sistem + 6) ya da 8 rakam (sistem + 6 + kontrol).
  var UPCE_PARITE0 = ['EEEOOO', 'EEOEOO', 'EEOOEO', 'EEOOOE', 'EOEEOO', 'EOOEEO', 'EOOOEE', 'EOEOEO', 'EOEOOE', 'EOOEOE'];
  function upceGenislet(sistem, d) { // d: 6 rakam -> 11 haneli UPC-A icsi
    var s = d.charAt(5), a = d.charAt(0), b = d.charAt(1), c = d.charAt(2), e = d.charAt(3), f = d.charAt(4);
    if (s === '0' || s === '1' || s === '2') return sistem + a + b + s + '0000' + c + e + f;
    if (s === '3') return sistem + a + b + c + '00000' + e + f;
    if (s === '4') return sistem + a + b + c + e + '00000' + f;
    return sistem + a + b + c + e + f + '0000' + s;
  }
  function upce(metin) {
    metin = String(metin);
    if (!/^[0-9]+$/.test(metin)) throw new Error('UPC-E: yalnızca rakam kodlanabilir.');
    if ([6, 7, 8].indexOf(metin.length) < 0) {
      throw new Error('UPC-E: 6 rakam (sistem 0 varsayılır), 7 rakam (sistem + 6) ya da kontrol rakamıyla 8 rakam verilmeli.');
    }
    var sistem = metin.length === 6 ? '0' : metin.charAt(0), d = metin.length === 6 ? metin : metin.slice(1, 7);
    if (sistem !== '0' && sistem !== '1') throw new Error('UPC-E: sistem rakamı yalnızca 0 ya da 1 olabilir.');
    var kontrol = gs1Sagla(upceGenislet(sistem, d));
    if (metin.length === 8 && Number(metin.charAt(7)) !== kontrol) {
      throw new Error('UPC-E: kontrol rakamı hatalı (beklenen ' + kontrol + ').');
    }
    var parite = UPCE_PARITE0[kontrol], bitler = '101';
    for (var j = 0; j < 6; j++) {
      var tek = parite.charAt(j) === 'O';
      if (sistem === '1') tek = !tek;
      bitler += (tek ? EAN_L : EAN_G)[Number(d.charAt(j))];
    }
    bitler += '010101';
    var k = gs1Sonuc(metin, sistem + d + kontrol, bitler, 8, String(kontrol));
    k.upcA = upceGenislet(sistem, d) + kontrol;
    return k;
  }

  // Ek kodlar (add-on): EAN-5 (fiyat/ek bilgi) ve EAN-2 (dergi sayısı)
  var EAN5_PARITE = ['GGLLL', 'GLGLL', 'GLLGL', 'GLLLG', 'LGGLL', 'LLGGL', 'LLLGG', 'LGLGL', 'LGLLG', 'LLGLG'];
  var EAN2_PARITE = ['LL', 'LG', 'GL', 'GG'];
  function ekKod(ad, metin, say, pariteDizisi) {
    metin = String(metin);
    if (!/^[0-9]+$/.test(metin)) throw new Error(ad + ': yalnızca rakam kodlanabilir.');
    if (metin.length !== say) throw new Error(ad + ': tam ' + say + ' rakam verilmeli.');
    var p = pariteDizisi(metin), parcalar = [];
    for (var j = 0; j < say; j++) parcalar.push((p.charAt(j) === 'L' ? EAN_L : EAN_G)[Number(metin.charAt(j))]);
    return gs1Sonuc(metin, metin, '1011' + parcalar.join('01'), say, null);
  }
  function ean5(metin) {
    return ekKod('EAN-5', metin, 5, function (m) {
      var t = 3 * (Number(m.charAt(0)) + Number(m.charAt(2)) + Number(m.charAt(4))) + 9 * (Number(m.charAt(1)) + Number(m.charAt(3)));
      return EAN5_PARITE[t % 10];
    });
  }
  function ean2(metin) {
    return ekKod('EAN-2', metin, 2, function (m) { return EAN2_PARITE[Number(m) % 4]; });
  }

  /* ---------- Codabar ---------- */
  var CB_DESEN = {
    '0': '0000011', '1': '0000110', '2': '0001001', '3': '1100000', '4': '0010010', '5': '1000010', '6': '0100001', '7': '0100100',
    '8': '0110000', '9': '1001000', '-': '0001100', '$': '0011000', ':': '1000101', '/': '1010001', '.': '1010100', '+': '0010101',
    'A': '0011010', 'B': '0101001', 'C': '0001011', 'D': '0001110'
  };
  // Başlangıç/bitiş harfi (A-D) metinde yoksa secenek.baslangic / secenek.bitis (varsayılan A ve B) eklenir.
  function codabar(metin, secenek) {
    secenek = secenek || {};
    metin = String(metin).toUpperCase();
    if (!metin.length) throw new Error('Codabar: boş metin kodlanamaz.');
    var bas = String(secenek.baslangic || 'A').toUpperCase(), bit = String(secenek.bitis || 'B').toUpperCase();
    if (!/^[A-D]$/.test(bas) || !/^[A-D]$/.test(bit)) throw new Error('Codabar: başlangıç ve bitiş harfi A, B, C ya da D olmalı.');
    var ic = metin;
    if (/^[A-D].*[A-D]$/.test(metin) && metin.length >= 2) { bas = metin.charAt(0); bit = metin.charAt(metin.length - 1); ic = metin.slice(1, -1); }
    if (!ic.length) throw new Error('Codabar: başlangıç ve bitiş harfleri arasında en az 1 karakter olmalı.');
    for (var j = 0; j < ic.length; j++) {
      if (!CB_DESEN[ic.charAt(j)] || /[A-D]/.test(ic.charAt(j))) {
        throw new Error('Codabar: "' + ic.charAt(j) + '" karakteri desteklenmiyor (0-9 - $ : / . + ve başlangıç/bitiş için A-D).');
      }
    }
    var tum = bas + ic + bit, moduller = [];
    tum.split('').forEach(function (c, ix) {
      if (ix > 0) moduller.push(1);
      CB_DESEN[c].split('').forEach(function (e) { moduller.push(e === '1' ? 3 : 1); });
    });
    return {
      karakterSayisi: tum.length, sembolSayisi: tum.length, modulSayisi: moduller.reduce(function (a, b) { return a + b; }, 0),
      moduller: moduller, govde: tum, sagLama: null
    };
  }

  /* ---------- MSI Plessey ---------- */
  function msiMod10(d) {
    var alt = '', diger = 0, j;
    for (j = d.length - 1; j >= 0; j -= 2) alt = d.charAt(j) + alt;
    for (j = d.length - 2; j >= 0; j -= 2) diger += Number(d.charAt(j));
    var cift = (BigInt(alt) * 2n).toString(), t = diger;
    for (j = 0; j < cift.length; j++) t += Number(cift.charAt(j));
    return (10 - (t % 10)) % 10;
  }
  function msiMod11(d) {
    var t = 0, w = 2;
    for (var j = d.length - 1; j >= 0; j--) { t += Number(d.charAt(j)) * w; w = w === 7 ? 2 : w + 1; }
    return (11 - (t % 11)) % 11;
  }
  // secenek.sagla: 'yok' (varsayılan) | 'mod10' | 'mod1010' | 'mod11'
  function msi(metin, secenek) {
    metin = String(metin);
    var mod = (secenek && secenek.sagla) || 'yok';
    if (!/^[0-9]+$/.test(metin)) throw new Error('MSI: yalnızca rakam kodlanabilir.');
    if (['yok', 'mod10', 'mod1010', 'mod11'].indexOf(mod) < 0) throw new Error('MSI: bilinmeyen sağlama türü: ' + mod);
    var govde = metin, sag = '';
    if (mod === 'mod10') sag = String(msiMod10(metin));
    else if (mod === 'mod1010') { var c1 = msiMod10(metin); sag = String(c1) + msiMod10(metin + c1); }
    else if (mod === 'mod11') {
      var c = msiMod11(metin);
      if (c === 10) throw new Error('MSI: Mod 11 sağlama değeri bu sayı için 10 çıkıyor ve tek rakamla yazılamaz; başka bir sağlama türü seçin.');
      sag = String(c);
    }
    govde += sag;
    var bitler = '110';
    for (var j = 0; j < govde.length; j++) {
      var ikili = Number(govde.charAt(j)).toString(2).padStart(4, '0');
      for (var b = 0; b < 4; b++) bitler += ikili.charAt(b) === '1' ? '110' : '100';
    }
    bitler += '1001';
    return {
      karakterSayisi: govde.length, sembolSayisi: govde.length + 2, modulSayisi: bitler.length,
      moduller: bitlerdenModuller(bitler), govde: govde, sagLama: sag || null
    };
  }

  /* ---------- Pharmacode (tek izli) ---------- */
  function pharmacode(metin) {
    metin = String(metin);
    if (!/^[0-9]+$/.test(metin)) throw new Error('Pharmacode: yalnızca rakam kodlanabilir.');
    var n = Number(metin);
    if (n < 3 || n > 131070) throw new Error('Pharmacode: değer 3 ile 131070 arasında olmalı.');
    var cubuklar = [];
    while (n > 0) {
      if (n % 2 === 1) { cubuklar.push(1); n = (n - 1) / 2; } else { cubuklar.push(3); n = (n - 2) / 2; }
    }
    cubuklar.reverse();
    var moduller = [];
    cubuklar.forEach(function (w, ix) { if (ix > 0) moduller.push(2); moduller.push(w); });
    return {
      karakterSayisi: metin.length, sembolSayisi: cubuklar.length, modulSayisi: moduller.reduce(function (a, b) { return a + b; }, 0),
      moduller: moduller, govde: String(Number(metin)), sagLama: null
    };
  }

  /* ---------- GS1 önek bilgisi (EAN-13 / UPC-A / EAN-8) ---------- */
  // Önek bir ülkeyi değil numarayı veren GS1 ofisini gösterir. Dönüş: {onek, tur, ulke, ulkeEn}
  var GS1_ULKE = [
    [0, 139, 'ABD ve Kanada', 'USA and Canada'], [300, 379, 'Fransa', 'France'], [400, 440, 'Almanya', 'Germany'],
    [450, 459, 'Japonya', 'Japan'], [490, 499, 'Japonya', 'Japan'], [460, 469, 'Rusya', 'Russia'], [500, 509, 'Birleşik Krallık', 'United Kingdom'],
    [690, 699, 'Çin', 'China'], [760, 769, 'İsviçre', 'Switzerland'], [800, 839, 'İtalya', 'Italy'], [840, 849, 'İspanya', 'Spain'],
    [868, 869, 'Türkiye', 'Türkiye'], [870, 879, 'Hollanda', 'Netherlands'], [880, 880, 'Güney Kore', 'South Korea'], [890, 890, 'Hindistan', 'India']
  ];
  function gs1OnekBilgisi(govde) {
    govde = String(govde);
    if (govde.length === 12) govde = '0' + govde;
    if (!/^[0-9]{8,13}$/.test(govde)) return null;
    var p = Number(govde.slice(0, 3)), onek = govde.slice(0, 3), i;
    var tur = null;
    if (p >= 200 && p <= 299) tur = 'ozel';
    else if ((p >= 20 && p <= 29) || (p >= 40 && p <= 49)) tur = 'ozel';
    else if ((p >= 50 && p <= 59) || (p >= 981 && p <= 984) || (p >= 990 && p <= 999)) tur = 'kupon';
    else if (p === 978 || p === 979) tur = 'kitap';
    else if (p === 977) tur = 'dergi';
    else if (p === 980) tur = 'iade';
    if (tur) return { onek: onek, tur: tur, ulke: '', ulkeEn: '' };
    for (i = 0; i < GS1_ULKE.length; i++) {
      if (p >= GS1_ULKE[i][0] && p <= GS1_ULKE[i][1]) return { onek: onek, tur: 'ulke', ulke: GS1_ULKE[i][2], ulkeEn: GS1_ULKE[i][3] };
    }
    return { onek: onek, tur: 'diger', ulke: '', ulkeEn: '' };
  }

  var KODLAYICI = {
    code128: code128, code39: code39, code93: code93, ean13: ean13, itf14: itf14,
    ean8: ean8, upca: upca, upce: upce, ean5: ean5, ean2: ean2, codabar: codabar, msi: msi, pharmacode: pharmacode
  };

  /* 2B standartlar (QR, Data Matrix): ayrı modüller; tarayıcıda QrKod / DataMatrixKod global, Node'da require. */
  function modul2d(ad) {
    if (typeof module === 'object' && module.exports) return require(ad === 'qr' ? './qr.js' : './datamatrix.js');
    var g = typeof self !== 'undefined' ? self : {};
    var m = ad === 'qr' ? g.QrKod : g.DataMatrixKod;
    if (!m) throw new Error('2B modülü yüklenmedi: ' + ad);
    return m;
  }
  var IKI_BOYUTLU = { qr: 1, datamatrix: 1 };

  function kodla(standart, metin, secenek) {
    if (IKI_BOYUTLU[standart]) {
      var k2 = modul2d(standart).kodla(metin);
      // Çubuk alanı yok: moduller boş; matris 0/1 dizi dizisi.
      return { karakterSayisi: String(metin).length, sembolSayisi: 1, modulSayisi: k2.boyut, moduller: [], matris: k2.matris, boyut: k2.boyut };
    }
    if (!KODLAYICI[standart]) throw new Error('Bilinmeyen barkod standardı: ' + standart);
    return KODLAYICI[standart](metin, secenek);
  }

  /* ---------- Standartlar ve uygunluk ---------- */
  var standartlar = [
    {
      id: 'code128', ad: 'Code 128', girdi: 'harf, rakam ve işaretler (ASCII 0-127)',
      aciklama: 'En yaygın ve en sıkı barkod türüdür. Harf, rakam ve işaretlerin hepsini taşır. Arka arkaya gelen rakamları ikişer ikişer sıkıştırdığı için rakam ağırlıklı barkodlarda en kısa çıktıyı verir. Kendi sağlama değeri vardır ve okuyucular hatalı okumayı kendiliğinden eler. Çoğu etiket için önerilen seçimdir.',
      harfRakam: true, kucukHarf: true, rakamSikistirma: true
    },
    {
      id: 'code39', ad: 'Code 39', girdi: 'büyük harf, rakam, boşluk ve - . $ / + %',
      aciklama: 'Eski ve çok yaygın bir türdür; neredeyse her okuyucu okur. Büyük harf, rakam ve birkaç işaret taşır, küçük harf yoktur. Her karakter geniş yer kaplar, bu yüzden barkod uzun çıkar. Basit ve sade olduğu için eski cihazlarla uyum gerekiyorsa seçilir.',
      harfRakam: true, kucukHarf: false, rakamSikistirma: false
    },
    {
      id: 'code93', ad: 'Code 93', girdi: 'büyük harf, rakam, boşluk ve - . $ / + %',
      aciklama: 'Code 39\'un daha sıkı hâlidir; aynı karakterleri daha dar yerde taşır ve iki sağlama karakteri ekler. Küçük harf yoktur. Yer dar olduğunda ve okuyucunuz destekliyorsa uygundur, ancak Code 128 kadar yaygın değildir.',
      harfRakam: true, kucukHarf: false, rakamSikistirma: false
    }
  ];

  // GS1 standartları (rakamlı, sabit uzunluk; sıra numarası arayüz listesini etkilemesin diye ayrı tutulur)
  var standartlarGs1 = [
    { id: 'ean13', ad: 'EAN-13', girdi: '12 rakam (kontrol rakamı eklenir) ya da 13 rakam (doğrulanır)', aciklama: 'Perakende ürün barkodu. 13 rakam taşır; sonuncusu kontrol rakamıdır. 12 rakam verirseniz kontrol rakamı otomatik eklenir, 13 rakam verirseniz kontrol rakamı doğrulanır. Yalnız rakam kabul eder.', harfRakam: false, kucukHarf: false, rakamSikistirma: false, sabitUzunluk: 13 },
    { id: 'ean8', ad: 'EAN-8', girdi: '7 rakam (kontrol rakamı eklenir) ya da 8 rakam (doğrulanır)', aciklama: 'Küçük ürünlerde (kalem, sakız gibi) EAN-13 sığmadığında kullanılan kısa perakende barkodu. 8 rakam taşır; sonuncusu kontrol rakamıdır. 7 rakam verirseniz kontrol rakamı otomatik eklenir. Numaralar GS1 tarafından ayrı ayrı verilir.', harfRakam: false, kucukHarf: false, rakamSikistirma: false, sabitUzunluk: 8 },
    { id: 'upca', ad: 'UPC-A', girdi: '11 rakam (kontrol rakamı eklenir) ya da 12 rakam (doğrulanır)', aciklama: 'Kuzey Amerika perakende barkodu. 12 rakam taşır; sonuncusu kontrol rakamıdır. Başına 0 eklenmiş hâli EAN-13 ile aynıdır, bu yüzden dünyadaki okuyucular okur. 11 rakam verirseniz kontrol rakamı otomatik eklenir.', harfRakam: false, kucukHarf: false, rakamSikistirma: false, sabitUzunluk: 12 },
    { id: 'itf14', ad: 'ITF-14', girdi: '13 rakam (kontrol rakamı eklenir) ya da 14 rakam (doğrulanır)', aciklama: 'Koli ve toplu paket barkodu (Interleaved 2 of 5). 14 rakam taşır; sonuncusu kontrol rakamıdır. 13 rakam verirseniz kontrol rakamı otomatik eklenir, 14 rakam verirseniz doğrulanır. Çerçeve çizgisi (bearer bar) eklenmez.', harfRakam: false, kucukHarf: false, rakamSikistirma: false, sabitUzunluk: 14 }
  ];

  // "Barkod türleri" sekmesi: perakende (GS1) ve endüstri türleri. grup: perakende | endustri; girdi: giriş kuralı özeti.
  // Üret/Kurallar listesini etkilemesin diye ayrı tutulur; ean13/itf14/code128/code39/code93 yukarıdaki listelerde tanımlıdır (ean8/upca standartlarGs1'de de bulunur; metinleri standartlarYeni ile aynıdır).
  var standartlarYeni = [
    { id: 'ean8', ad: 'EAN-8', grup: 'perakende', girdi: '7 rakam (kontrol rakamı eklenir) ya da 8 rakam (doğrulanır)', aciklama: 'Küçük ürünlerde (kalem, sakız gibi) EAN-13 sığmadığında kullanılan kısa perakende barkodu. 8 rakam taşır; sonuncusu kontrol rakamıdır. 7 rakam verirseniz kontrol rakamı otomatik eklenir. Numaralar GS1 tarafından ayrı ayrı verilir.' },
    { id: 'upca', ad: 'UPC-A', grup: 'perakende', girdi: '11 rakam (kontrol rakamı eklenir) ya da 12 rakam (doğrulanır)', aciklama: 'Kuzey Amerika perakende barkodu. 12 rakam taşır; sonuncusu kontrol rakamıdır. Başına 0 eklenmiş hâli EAN-13 ile aynıdır, bu yüzden dünyadaki okuyucular okur. 11 rakam verirseniz kontrol rakamı otomatik eklenir.' },
    { id: 'upce', ad: 'UPC-E', grup: 'perakende', girdi: '6 rakam (sistem 0 varsayılır), 7 rakam (sistem 0/1 + 6) ya da kontrol rakamıyla 8 rakam', aciklama: 'UPC-A numarasının sıfırları bastırılmış kısa hâli; küçük ambalajlarda yer kazandırır. Sistem rakamı yalnız 0 ya da 1 olabilir. Kontrol rakamı genişletilmiş 12 haneli UPC-A üzerinden hesaplanır ve çubuk desenindeki eşlik (parite) düzenini belirler.' },
    { id: 'ean5', ad: 'EAN-5', grup: 'perakende', girdi: 'tam 5 rakam', aciklama: 'Ana barkodun yanına konan ek kod. Kitaplarda önerilen fiyatı, bazı ürünlerde ek bilgiyi taşır. Tam 5 rakam alır; kontrol rakamı yoktur, doğrulama bilgisi çubukların eşlik düzeninde gizlidir. Tek başına değil, EAN-13 ya da UPC-A yanında kullanılır.' },
    { id: 'ean2', ad: 'EAN-2', grup: 'perakende', girdi: 'tam 2 rakam', aciklama: 'Ana barkodun yanına konan iki haneli ek kod; dergilerde ve gazetelerde sayı numarasını gösterir. Kontrol rakamı yoktur. Tek başına değil, ISSN barkodu gibi bir ana barkodun yanında kullanılır.' },
    { id: 'codabar', ad: 'Codabar', grup: 'endustri', girdi: '0-9 ve - $ : / . + karakterleri; başlangıç/bitiş harfi A-D (yazılmazsa seçili harfler eklenir)', aciklama: 'Kütüphane, kan bankası ve kargo etiketlerinde kullanılan eski bir türdür. Rakamlar, birkaç işaret ve başlangıç/bitiş için A-D harflerini taşır. Sağlama karakteri yoktur; yeni işlerde Code 128 genellikle daha iyidir.' },
    { id: 'msi', ad: 'MSI', grup: 'endustri', girdi: 'yalnız rakam; isteğe bağlı sağlama (Mod 10, Mod 10+10, Mod 11)', aciklama: 'Depo raflarında ve envanter etiketlerinde görülen rakamlı bir türdür (MSI Plessey). Hata kontrolü için bir ya da iki sağlama rakamı eklenebilir; hangisini kullandığınızı okuyan tarafla önceden anlaşmanız gerekir.' },
    { id: 'pharmacode', ad: 'Pharmacode', grup: 'endustri', girdi: '3 ile 131070 arasında bir tam sayı', aciklama: 'İlaç paketlerinde paketleme hattını kontrol etmek için kullanılan tek izli bir türdür. Yalnız 3 ile 131070 arasında bir sayı taşır; yazı satırı ve sağlama yoktur. Ürün tanıtımı için değil, üretim hattında paket ayrımı için tasarlanmıştır.' }
  ];

  // 2B standartlar (arayüz listesini etkilemesin diye ayrı tutulur)
  var standartlar2d = [
    { id: 'qr', ad: 'QR Code', aciklama: 'İki boyutlu kare kod (model 2, bayt modu, sürüm 1-10, hata düzeltme L/M/Q/H). Telefon kameralarıyla okunur, UTF-8 metin taşır.', harfRakam: true, kucukHarf: true, rakamSikistirma: false, ikiBoyutlu: true },
    { id: 'datamatrix', ad: 'Data Matrix', aciklama: 'İki boyutlu küçük kare kod (ECC200, ASCII kodlama, 10x10 - 32x32). Çok küçük etiketlerde kullanılır; rakamları ikişer ikişer sıkıştırır.', harfRakam: true, kucukHarf: true, rakamSikistirma: true, ikiBoyutlu: true }
  ];

  function uygunMu(standartId, metin) {
    metin = metin == null ? '' : String(metin);
    if (IKI_BOYUTLU[standartId]) {
      if (!metin.length) return { uygun: false, neden: 'Metin boş.' };
      try { modul2d(standartId).kodla(metin); return { uygun: true, neden: 'Metin bu 2B standartta kodlanabilir.' }; }
      catch (e) { return { uygun: false, neden: e.message }; }
    }
    if (!KODLAYICI[standartId]) return { uygun: false, neden: 'Bilinmeyen barkod standardı: ' + standartId };
    if (!metin.length) return { uygun: false, neden: 'Metin boş.' };
    try {
      KODLAYICI[standartId](metin);
      return { uygun: true, neden: 'Metindeki tüm karakterler bu standartta kodlanabilir.' };
    } catch (e) {
      return { uygun: false, neden: e.message };
    }
  }

  /* ---------- Uzunluk önerisi ---------- */
  var MIN_TOPLAM = 8, MAKS_TOPLAM = 30, MODUL_MM = 0.33, SESSIZ_MODUL = 10;

  function kodlanmisBilgi(standart, onek, toplamRakam) {
    var n = Number(toplamRakam);
    if (!(n >= 1) || n !== Math.floor(n)) throw new Error('Toplam rakam pozitif tam sayı olmalı.');
    var temsil = String(onek == null ? '' : onek) + new Array(n + 1).join('0');
    var k = kodla(standart, temsil);
    var mm = k.modulSayisi * MODUL_MM;
    return {
      karakter: k.karakterSayisi, sembol: k.sembolSayisi, modul: k.modulSayisi,
      modulMm: MODUL_MM, genisMm: Math.round(mm * 10) / 10, genisCm: Math.round(mm) / 10,
      sessizliGenisMm: Math.round((k.modulSayisi + 2 * SESSIZ_MODUL) * MODUL_MM * 10) / 10
    };
  }

  function uzunlukOner(secenek) {
    secenek = secenek || {};
    var onek = secenek.onek == null ? 'TO' : String(secenek.onek);
    var standart = secenek.standart || 'code128';
    var luhn = secenek.luhn !== false;
    if (!KODLAYICI[standart] && !IKI_BOYUTLU[standart]) throw new Error('Bilinmeyen barkod standardı: ' + standart);
    var enBuyuk, direnc;
    try {
      enBuyuk = BigInt(secenek.enBuyukSira);
      direnc = BigInt(secenek.tahminDirenci == null ? 100000 : secenek.tahminDirenci);
    } catch (e) {
      throw new Error('En büyük sıra ve tahmin direnci tam sayı olmalı.');
    }
    if (enBuyuk < 1n) throw new Error('En büyük sıra numarası en az 1 olmalı.');
    if (direnc < 1n) throw new Error('Tahmin direnci en az 1 olmalı.');
    var gereken = enBuyuk * direnc, luhnH = luhn ? 1 : 0;
    var adim = standart === 'code128' || standart === 'datamatrix' ? 2 : 1; // rakamları ikişer ikişer sıkıştıranlar
    var N = MIN_TOPLAM, ustSinir = false;
    while (9n * 10n ** BigInt(N - luhnH - 1) < gereken) {
      N += adim;
      if (N > MAKS_TOPLAM) { N = MAKS_TOPLAM; ustSinir = true; break; }
    }
    function secenekSatiri(t) {
      var b = kodlanmisBilgi(standart, onek, t);
      var uzay = 9n * 10n ** BigInt(t - luhnH - 1); // ilk rakam 1-9
      var d = uzay / enBuyuk;
      var direncSayi = Number(d);
      var yeter = uzay >= gereken;
      return {
        toplamRakam: t, karakter: b.karakter, sembol: b.sembol, modul: b.modul, tahminDirenci: direncSayi,
        not: (yeter ? 'İstenen dirence uygun' : 'İstenen direncin altında') +
          '; rastgele bir sayının geçerli çıkma olasılığı yaklaşık 1/' + direncSayi + '.' +
          (t === N ? ' (önerilen)' : '')
      };
    }
    var adaylar = [N - 2 * adim, N - adim, N, N + adim, N + 2 * adim].filter(function (t) {
      return t >= MIN_TOPLAM && t <= MAKS_TOPLAM;
    });
    var neden = 'En büyük sıra numarası ' + enBuyuk + ' ve istenen tahmin direnci 1/' + direnc +
      ' için en az ' + (N - luhnH) + ' rakamlık bir sayı alanı gerekir; rastgele denenen bir sayı geçerli bir sıra numarasına' +
      ' denk gelme olasılığı bu durumda ' + (ustSinir ? 'hedeften düşük olabilir (üst sınır olan ' + MAKS_TOPLAM + ' rakama ulaşıldı)' : '1/' + direnc + '\'den küçük kalır') + '.' +
      (luhn ? ' Son rakam Luhn kontrol rakamıdır, bu yüzden ' + (N - 1) + ' rakam sıra numarasından gelir.' : '') +
      (standart === 'code128' ? ' Code 128 rakamları ikişer ikişer sıkıştırdığı için toplam rakam çift seçildi.' : '') +
      (MIN_TOPLAM > 0 ? ' Alt sınır ' + MIN_TOPLAM + ' rakamdır.' : '');
    return {
      toplamRakam: N, yukRakam: N - luhnH, neden: neden, ustSinir: ustSinir,
      secenekler: adaylar.map(secenekSatiri)
    };
  }

  /* ---------- Örnek indeksleri ---------- */
  // En az 4 farklı örnek; ilk, son, orta + tohumlu sözde-rastgele ara değerler, tohumlu karışık sırada.
  // Aralık adetten küçükse aralıktaki tüm sayılar (karışık) döner; tamamlamayı çağıran yapar. Aynı girdi -> aynı çıktı.
  function ornekIndeksleri(bas, son, adet, tohum) {
    adet = Math.max(4, adet == null ? 4 : Math.floor(Number(adet)) || 4);
    bas = Number(bas); son = Number(son);
    if (!isFinite(bas) || !isFinite(son) || son < bas) return [];
    var a = tohum == null ? 1 : (Number(tohum) | 0), kap = son - bas + 1;
    function rnd() { // mulberry32
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var cikti = [];
    function ekle(v) { if (cikti.indexOf(v) < 0) cikti.push(v); }
    if (kap <= adet) { for (var i = bas; i <= son; i++) cikti.push(i); }
    else {
      ekle(bas); ekle(son); ekle(bas + Math.floor((son - bas) / 2));
      while (cikti.length < adet) ekle(bas + Math.floor(rnd() * kap));
    }
    for (var j = cikti.length - 1; j > 0; j--) { // Fisher-Yates
      var r = Math.floor(rnd() * (j + 1)), t2 = cikti[j]; cikti[j] = cikti[r]; cikti[r] = t2;
    }
    var sirali = true;
    for (var q = 1; q < cikti.length; q++) if (cikti[q] < cikti[q - 1]) { sirali = false; break; }
    if (sirali && cikti.length > 1) cikti.push(cikti.shift()); // sıralı çıkmasın
    return cikti;
  }

  /* ---------- SVG ---------- */
  function kac(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function svg(standart, metin, secenek) {
    secenek = secenek || {};
    if (IKI_BOYUTLU[standart]) {
      var o2 = {};
      ['modulGenislik', 'sessizBolge', 'hataDuzeltme'].forEach(function (a) { if (secenek[a] != null) o2[a] = secenek[a]; });
      return modul2d(standart).svg(metin, o2);
    }
    var mg = secenek.modulGenislik == null ? 2 : Number(secenek.modulGenislik);
    var yuk = secenek.yukseklik == null ? 80 : Number(secenek.yukseklik);
    var sessiz = secenek.sessizBolge == null ? 10 : Number(secenek.sessizBolge);
    var yazi = secenek.yaziGoster !== false;
    if (!(mg > 0) || !(yuk > 0) || !(sessiz >= 0)) throw new Error('SVG ölçüleri pozitif sayı olmalı.');
    var k = kodla(standart, metin, secenek);
    var genis = (k.modulSayisi + 2 * sessiz) * mg;
    var yaziYuk = yazi ? 20 : 0;
    var toplamYuk = yuk + yaziYuk;
    var x = sessiz * mg, rects = [];
    k.moduller.forEach(function (w, i) {
      if (i % 2 === 0) rects.push('<rect x="' + x + '" y="0" width="' + w * mg + '" height="' + yuk + '"/>');
      x += w * mg;
    });
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + genis + '" height="' + toplamYuk +
      '" viewBox="0 0 ' + genis + ' ' + toplamYuk + '">' +
      '<rect x="0" y="0" width="' + genis + '" height="' + toplamYuk + '" fill="#ffffff"/>' +
      '<g fill="#000000">' + rects.join('') + '</g>';
    if (yazi) {
      s += '<text x="' + genis / 2 + '" y="' + (yuk + 15) + '" text-anchor="middle" font-family="monospace" font-size="14" fill="#000000">' +
        kac(secenek.yaziMetni == null ? metin : secenek.yaziMetni) + '</text>';
    }
    return s + '</svg>';
  }

  return {
    code128: code128, code39: code39, code93: code93, ean13: ean13, itf14: itf14, gs1Sagla: gs1Sagla, kodla: kodla,
    ean8: ean8, upca: upca, upce: upce, ean5: ean5, ean2: ean2, codabar: codabar, msi: msi, pharmacode: pharmacode,
    gs1OnekBilgisi: gs1OnekBilgisi, standartlarYeni: standartlarYeni,
    code128Tablo: C128.slice(), svg: svg, standartlar: standartlar, standartlarGs1: standartlarGs1, standartlar2d: standartlar2d, uygunMu: uygunMu,
    uzunlukOner: uzunlukOner, kodlanmisBilgi: kodlanmisBilgi, ornekIndeksleri: ornekIndeksleri
  };
});

