/* tasarim.js 1.0 - TaaRkod tasarım dilleri: Mühür (varsayılan), Mekik, İstif. Uygulamaya özgüdür; ortak tema.js'e dokunmaz.
 * Her tasarımın açık/koyu jetonları FABLE-KARAR.md §2'den birebir alınmıştır (zemin yuzey yuzey2 kenar metin soluk vurgu vurguMetin
 * basari hata uyari ustSerit ustSeritMetin). belirtec() bu jetonları arayüzün mevcut belirteç adlarına (tema.js TUM_ANAHTAR) eşler;
 * böylece eski CSS kuralları da tasarımın renklerini alır, iskelet farkları CSS'te html[data-tasarim=...] altında durur.
 * Vurgu rengi isteğe bağlı olarak dışarıdan (palet/özel renk) verilir: tonu, zemin ve yüzeylerde en az 4,5:1 (yüksek kontrastta 6:1)
 * sağlanana dek açılır ya da koyulaştırılır; vurguMetin otomatik seçilir. basari/hata/uyari vurgudan bağımsızdır.
 * Saf fonksiyonlar, DOM yok. UMD: tarayıcıda global BarkodTasarim, Node'da module.exports. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodTasarim = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SURUM = '1.0';
  var HEX6 = /^#[0-9a-fA-F]{6}$/;
  var VARSAYILAN = 'muhur';
  // Ayarlar'daki sıra; 'klasik' önceki sürümün görünümüdür (tema.js paletleriyle), burada jetonu yoktur.
  var SIRA = ['muhur', 'mekik', 'istif', 'klasik'];

  var TASARIMLAR = {
    muhur: {
      ad: 'Mühür', en: 'Seal',
      yazi: { baslik: 'Manrope', govde: 'Manrope', mono: 'DM Mono' },
      acik: {
        zemin: '#F6F2F4', yuzey: '#FFFFFF', yuzey2: '#EEE7EC', kenar: '#8E7E89', metin: '#291E27', soluk: '#695764',
        vurgu: '#853652', vurguMetin: '#FFFFFF', basari: '#23653C', hata: '#AF243C', uyari: '#805300',
        ustSerit: '#F6F2F4', ustSeritMetin: '#291E27', golKart: '0 6px 20px #291E2710'
      },
      koyu: {
        zemin: '#1D171C', yuzey: '#292127', yuzey2: '#362B33', kenar: '#8D7886', metin: '#F7F0F4', soluk: '#C5B2BF',
        vurgu: '#E9A4BD', vurguMetin: '#30101D', basari: '#8DD6A3', hata: '#FF9AA8', uyari: '#F0C77B',
        ustSerit: '#1D171C', ustSeritMetin: '#F7F0F4', golKart: '0 6px 20px #00000026'
      }
    },
    mekik: {
      ad: 'Mekik', en: 'Shuttle',
      yazi: { baslik: 'Instrument Sans', govde: 'Inter', mono: 'JetBrains Mono' },
      acik: {
        zemin: '#F0F4F5', yuzey: '#FFFFFF', yuzey2: '#E3EBEE', kenar: '#71858C', metin: '#1C2C33', soluk: '#4F636B',
        vurgu: '#285E70', vurguMetin: '#FFFFFF', basari: '#236743', hata: '#AD3038', uyari: '#785500',
        ustSerit: '#FFFFFF', ustSeritMetin: '#1C2C33', golKart: '0 8px 24px #1C2C331A'
      },
      koyu: {
        zemin: '#141F24', yuzey: '#1E2C33', yuzey2: '#293B44', kenar: '#708992', metin: '#EDF5F8', soluk: '#ADC1CA',
        vurgu: '#8BC9DC', vurguMetin: '#102D36', basari: '#8CD5AE', hata: '#FFA5A9', uyari: '#E8C67C',
        ustSerit: '#1E2C33', ustSeritMetin: '#EDF5F8', golKart: '0 8px 24px #00000033'
      }
    },
    istif: {
      ad: 'İstif', en: 'Stack',
      yazi: { baslik: 'IBM Plex Sans Condensed', govde: 'IBM Plex Sans', mono: 'IBM Plex Mono' },
      acik: {
        zemin: '#F2F3F4', yuzey: '#FFFFFF', yuzey2: '#E5E8EB', kenar: '#7A8189', metin: '#252B32', soluk: '#58616B',
        vurgu: '#745044', vurguMetin: '#FFFFFF', basari: '#2C6744', hata: '#B12C35', uyari: '#7A5700',
        ustSerit: '#252B32', ustSeritMetin: '#F0F4F7', golKart: '0 2px 0 #252B3214'
      },
      koyu: {
        zemin: '#1B2025', yuzey: '#262D34', yuzey2: '#333C45', kenar: '#7E8B98', metin: '#F0F4F7', soluk: '#B6C2CC',
        vurgu: '#DCB2A0', vurguMetin: '#352019', basari: '#92D5AE', hata: '#FF9EA7', uyari: '#E8C77F',
        ustSerit: '#12161A', ustSeritMetin: '#F0F4F7', golKart: '0 2px 0 #00000040'
      }
    }
  };
  // İstif'in koyu şeridi açık modda da koyudur: şeritte ikincil metin ustSeritMetin olur (soluk kullanılmaz, FABLE-KARAR §3).
  var KOYU_SERIT = { istif: true };

  /* ---------- renk matematiği (tema.js'ten bağımsız kopya; ortak dosyaya bağımlılık yok) ---------- */
  function gecerliHex(s) { return typeof s === 'string' && HEX6.test(s); }
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase();
  }
  function parlaklik(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function oran(a, b) { var x = parlaklik(a), y = parlaklik(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function karistir(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function hsl(h) {
    var c = rgb(h).map(function (v) { return v / 255; }), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    var L = (mx + mn) / 2, S = 0, H = 0, d = mx - mn;
    if (d) {
      S = d / (1 - Math.abs(2 * L - 1));
      H = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
      H = (H * 60 + 360) % 360;
    }
    return [H, S * 100, L * 100];
  }
  function hslHex(H, S, L) {
    S = Math.max(0, Math.min(100, S)) / 100; L = Math.max(0, Math.min(100, L)) / 100;
    var C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs((H / 60) % 2 - 1)), m = L - C / 2, r = 0, g = 0, b = 0;
    if (H < 60) { r = C; g = X; } else if (H < 120) { r = X; g = C; } else if (H < 180) { g = C; b = X; } else if (H < 240) { g = X; b = C; } else if (H < 300) { r = X; b = C; } else { r = C; b = X; }
    return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  function enAz(renk, arkalar) { return Math.min.apply(null, arkalar.map(function (a) { return oran(renk, a); })); }

  /* Verilen rengi, arka planların hepsinde eşiği sağlayana dek koyu modda açar, açık modda koyulaştırır (L ±2, en çok 50 adım). */
  function uyarla(renk, arkalar, esik, koyu) {
    if (enAz(renk, arkalar) >= esik) return renk;
    var z = hsl(renk), r = renk;
    for (var i = 1; i <= 50; i++) {
      r = hslHex(z[0], z[1], z[2] + (koyu ? 2 : -2) * i);
      if (enAz(r, arkalar) >= esik) return r;
    }
    return koyu ? '#FFFFFF' : '#000000';
  }
  /* Vurgu üstündeki metin: tasarımın kendi vurguMetin'i yeterliyse o, değilse beyaz/siyahtan iyi olanı (biri her zaman >= 4,58). */
  function ustMetin(vurgu, tercih, esik) {
    var aday = [tercih, '#FFFFFF', '#000000'];
    for (var i = 0; i < aday.length; i++) if (oran(aday[i], vurgu) >= esik) return aday[i];
    return oran('#FFFFFF', vurgu) >= oran('#000000', vurgu) ? '#FFFFFF' : '#000000';
  }

  function tasarimVar(ad) { return Object.prototype.hasOwnProperty.call(TASARIMLAR, ad); }
  function jetonlar(ad, mod) {
    var t = TASARIMLAR[tasarimVar(ad) ? ad : VARSAYILAN];
    return t[mod === 'koyu' ? 'koyu' : 'acik'];
  }

  /* belirtec(ad, mod, secenek) -> { belirtec: {tema.js TUM_ANAHTAR adlarıyla}, ek: {logoVurgu, golKart}, jeton: {kullanılan tasarım jetonları} }
   * secenek: { vurgu: '#RRGGBB' | null (tasarımın kendi vurgusu), kontrast: 'normal' | 'yuksek' } */
  function belirtec(ad, mod, secenek) {
    var o = secenek || {}, koyu = mod === 'koyu', yuksek = o.kontrast === 'yuksek';
    var t = jetonlar(ad, mod), esik = yuksek ? 6 : 4.5, arka = [t.zemin, t.yuzey, t.yuzey2];
    var soluk = t.soluk, kenar = t.kenar;
    if (yuksek) {
      // yüksek kontrast: yardımcı metin metne doğru koyulaşır (>= 6:1), kenar yardımcı metin rengini alır
      for (var i = 0; i <= 20 && enAz(soluk, arka) < 6; i++) soluk = karistir(t.soluk, t.metin, i / 20);
      kenar = soluk;
    }
    var dis = gecerliHex(o.vurgu) ? o.vurgu.toUpperCase() : null;
    var vurgu = uyarla(dis || t.vurgu, arka, esik, koyu);
    var vurguMetin = dis || yuksek ? ustMetin(vurgu, t.vurguMetin, esik) : t.vurguMetin;
    // üzerine gelme tonu: vurgudan metne doğru %16; üstündeki yazı yine eşiği sağlamalı
    var vurguKoyu = karistir(vurgu, t.metin, 0.16);
    if (oran(vurguMetin, vurguKoyu) < esik) vurguKoyu = karistir(vurgu, t.zemin, 0.16);
    if (oran(vurguMetin, vurguKoyu) < esik) vurguKoyu = vurgu;
    // seçili/üzerine gelme zemini: yüzeye az vurgu karışır; vurgu ve metin bu zeminde de eşiği sağlamalı
    var vurguSoluk = t.yuzey2;
    for (var a = 14; a >= 0; a -= 2) {
      var s = karistir(t.yuzey, vurgu, a / 100);
      if (oran(vurgu, s) >= esik && oran(t.metin, s) >= esik) { vurguSoluk = s; break; }
    }
    var serit = t.ustSerit, seritMetin = t.ustSeritMetin;
    var seritSoluk = KOYU_SERIT[ad] ? seritMetin : (enAz(soluk, [serit]) >= 4.5 ? soluk : seritMetin);
    // logo anahtar çubuğu şeritte durur: koyu şeritte (İstif açık) koyu modun vurgusu kullanılır, en az 3:1
    var logoVurgu = KOYU_SERIT[ad] && !koyu ? TASARIMLAR[ad].koyu.vurgu : vurgu;
    if (dis) logoVurgu = uyarla(dis, [serit], 3, parlaklik(serit) < 0.2);
    if (oran(logoVurgu, serit) < 3) logoVurgu = seritMetin;
    var b = {
      ust: serit, ustYazi: seritMetin, ustSoluk: seritSoluk, ustSimge: seritMetin, ustUstu: seritMetin + '1F', ustCizgi: serit,
      kagit: t.zemin, yuzey: t.yuzey, yuzey2: t.yuzey2, cizgi: karistir(t.yuzey, kenar, 0.45), kenar: kenar, murek: t.metin, soluk: soluk,
      eylem: vurgu, eylemKoyu: vurguKoyu, eylemYazi: vurguMetin, eylemSoluk: vurguSoluk,
      iplik: vurgu, iplikYazi: vurgu, iplikUstu: vurguMetin,
      hata: t.hata, tamam: t.basari, uyari: t.uyari, bilgi: vurgu, bilgiYazi: vurguMetin, odak: vurgu,
      golge: koyu ? '#000000' : t.metin
    };
    return { belirtec: b, ek: { logoVurgu: logoVurgu, golKart: t.golKart }, jeton: { zemin: t.zemin, yuzey: t.yuzey, yuzey2: t.yuzey2, metin: t.metin, vurgu: vurgu, vurguMetin: vurguMetin } };
  }

  /* Ayarlar'daki tasarım kartının 4 renk noktası: zemin, yüzey, vurgu, metin */
  function ornek(ad, mod, vurgu) {
    var j = belirtec(ad, mod, { vurgu: vurgu }).jeton;
    return [j.zemin, j.yuzey, j.vurgu, j.metin];
  }

  return {
    SURUM: SURUM, VARSAYILAN: VARSAYILAN, SIRA: SIRA, TASARIMLAR: TASARIMLAR,
    belirtec: belirtec, ornek: ornek, jetonlar: jetonlar, tasarimVar: tasarimVar,
    oran: oran, karistir: karistir, uyarla: uyarla
  };
});
