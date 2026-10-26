/* tema.js 1.1 - ortak tema modülü (TAARKOD + Tutaa). Bu dosya iki uygulamada AYNEN paylaşılır; uygulamaya özgü kod içermez.
 * Uygulamaya özgü değerler (varsayılan palet, "Klasik" eski görünüm) uret/uretAyrinti'ye ikinci bağımsız değişken (uyg) olarak verilir.
 * Saf fonksiyonlar, DOM yok. UMD: tarayıcıda global BarkodTema, Node'da module.exports.
 * Belirteç adları: ust ustYazi ustSoluk ustSimge ustUstu ustCizgi kagit yuzey yuzey2 cizgi kenar murek soluk
 *   eylem eylemKoyu eylemYazi eylemSoluk iplik iplikYazi iplikUstu hata tamam uyari bilgi bilgiYazi odak golge  (hepsi #RRGGBB; ustUstu #RRGGBBAA)
 * secim: { palet, bicim:'ton'|'tum', mod:'acik'|'koyu', kontrast:'normal'|'yuksek', iplik:<IPLIKLAR kimliği>, serit:'dolu'|'ince', ozel:{ust,eylem,iplik} }
 * Biçimler (ortak-tema-belirtec-plani.md §2): Ton = yalnız vurgu katmanı palete göre, zemin/yüzey/şerit uygulamanın sabit değerinde;
 *   Tüm arayüz = şerit, zemin, yüzey, çizgi, kenar ve metin paletin tohum renginden (HSL) türetilir.
 *   1.1: Tüm arayüz zemini belirgin tonlu (açık L93 / koyu L10, doygunluk tavanı 40); yüzey-zemin farkı CIE76 ΔE≥5, paletler arası zemin ΔE≥4.
 *   Tohumu soluk paletler (Antrasit, Taş) ayırt edici bir zemin tonu taşır (ONAYARLAR[].zemin = [H, S]); Özel tohumlarda S 3-10 arası ise 10'a çıkarılır.
 * Kontrast (§4): WCAG göreli parlaklık; eşik sağlanmazsa ilgili rengin L'si ±2% adımla (en çok 40) kaydırılır, olmazsa kombinasyon reddedilir.
 * Yüksek kontrast tüm eşiklere +1.5 ekler. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodTema = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SURUM = '1.1';
  var ADIM = 2, EN_COK_ADIM = 40, YUKSEK_EK = 1.5;
  var HEX6 = /^#[0-9a-fA-F]{6}$/;

  // Ön ayar tablosu (Tutaa tema ve ozellestirme gorevi.md §3). kagit/murek sütunları tablodaki önerilerdir (önizleme kutucuğu için);
  // "Ton" biçiminde zemin uygulamanın sabit değeridir. acikEk/koyu: yalnız Çam'da, TAARKOD 1.7.1 vurgu değerlerini birebir korur.
  var ONAYARLAR = {
    lacivert: { ad: 'Lacivert', en: 'Navy', ust: '#1B2A4A', eylem: '#1F4E8C', iplik: '#E0693A', kagit: '#F5F3EE', murek: '#1A2233', zemin: [218, 50] },
    antrasit: { ad: 'Antrasit', en: 'Charcoal', ust: '#2B2F36', eylem: '#3F5A7A', iplik: '#E3A21A', kagit: '#F4F4F2', murek: '#1C1F24', zemin: [200, 12] },
    bordo: { ad: 'Bordo', en: 'Burgundy', ust: '#4A1C2B', eylem: '#8A2E45', iplik: '#D9A441', kagit: '#F6F1EE', murek: '#2A1A20', zemin: [342, 45] },
    cam: {
      ad: 'Çam', en: 'Pine', ust: '#0F3B2E', eylem: '#1E6B52', iplik: '#F4C430', kagit: '#F4F4EC', murek: '#17262B', zemin: [160, 55],
      acikEk: { eylemKoyu: '#14513D', eylemSoluk: '#E4EFE8' },
      koyu: { eylem: '#5FC7A0', eylemKoyu: '#7FD6B5', eylemYazi: '#0C1A18', eylemSoluk: '#1F3733', iplikUstu: '#17262B' }
    },
    eflatun: { ad: 'Eflatun', en: 'Violet', ust: '#2E2650', eylem: '#5B3FA0', iplik: '#E7B23C', kagit: '#F3F1F7', murek: '#1F1A33', zemin: [268, 40] },
    tas: { ad: 'Taş', en: 'Stone', ust: '#4E463C', eylem: '#7A5C2E', iplik: '#E8B04A', kagit: '#F6F3EC', murek: '#2A2620', zemin: [38, 28] }
  };
  var PALETLER = ['lacivert', 'antrasit', 'bordo', 'cam', 'eflatun', 'tas', 'klasik', 'ozel'];
  // Gelişmiş: bağımsız iplik rengi seçenekleri ('palet' = paletin kendi ipliği, 'yok' = dikiş çizgisi gizlenir; renk paletinki kalır)
  var IPLIKLAR = { palet: null, kirmizi: '#E0693A', amber: '#E3A21A', mavi: '#4A90D9', beyaz: '#FFFFFF', yok: null };
  var OZEL_VARSAYILAN = { ust: '#1B2A4A', eylem: '#1F4E8C', iplik: '#E0693A' };

  // Durum renkleri sabittir (renk tek başına bilgi taşımaz: arayüz simge + metin ekler)
  var DURUM = {
    acik: { hata: '#B3261E', tamam: '#1E6B52', uyari: '#7A4F00', bilgi: '#1550B8', bilgiYazi: '#FFFFFF', golge: '#0F231E' },
    koyu: { hata: '#FF9E96', tamam: '#7FD9B3', uyari: '#F2C14E', bilgi: '#8DB8FF', bilgiYazi: '#0B1B33', golge: '#000000' }
  };
  var CIFT_ANAHTAR = ['ust', 'ustYazi', 'ustSoluk', 'ustSimge', 'ustUstu', 'kagit', 'yuzey', 'yuzey2', 'cizgi', 'kenar', 'murek', 'soluk', 'hata', 'tamam', 'uyari', 'bilgi', 'bilgiYazi', 'golge'];
  var TUM_ANAHTAR = ['ust', 'ustYazi', 'ustSoluk', 'ustSimge', 'ustUstu', 'ustCizgi', 'kagit', 'yuzey', 'yuzey2', 'cizgi', 'kenar', 'murek', 'soluk',
    'eylem', 'eylemKoyu', 'eylemYazi', 'eylemSoluk', 'iplik', 'iplikYazi', 'iplikUstu', 'hata', 'tamam', 'uyari', 'bilgi', 'bilgiYazi', 'odak', 'golge'];

  // Kontrast kuralları: [karşıt renk (hareket eden), [zemin renkleri], eşik, plan §4 tablosunda mı]. Sıra düzeltme sırasıdır.
  var KURALLAR = [
    ['murek', ['kagit', 'yuzey', 'yuzey2'], 4.5, true],
    ['soluk', ['kagit', 'yuzey', 'yuzey2'], 4.5, true],
    ['kenar', ['yuzey', 'kagit', 'yuzey2'], 3, true],
    ['ustYazi', ['ust'], 4.5, true],
    ['ustSoluk', ['ust'], 4.5, true],
    ['eylem', ['kagit', 'yuzey', 'yuzey2', 'eylemSoluk'], 4.5, true],
    ['eylemYazi', ['eylem', 'eylemKoyu'], 4.5, true],
    ['murek', ['eylemSoluk'], 4.5, false],
    ['iplik', ['ust'], 3, true],
    ['iplikYazi', ['kagit', 'yuzey'], 4.5, true],
    ['iplikUstu', ['iplik'], 4.5, false],
    ['odak', ['kagit', 'yuzey'], 3, true],
    ['hata', ['yuzey', 'kagit', 'yuzey2'], 4.5, true],
    ['tamam', ['yuzey', 'kagit', 'yuzey2'], 4.5, true],
    ['uyari', ['yuzey', 'kagit', 'yuzey2'], 4.5, false],
    ['bilgi', ['yuzey', 'kagit'], 4.5, false],
    ['bilgiYazi', ['bilgi'], 4.5, false]
  ];

  /* ---------- renk matematiği ---------- */
  function gecerliHex(s) { return typeof s === 'string' && HEX6.test(s); }
  function rgbDizi(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function hexYaz(r, g, b) {
    return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase();
  }
  function hslDizi(h) {
    var c = rgbDizi(h).map(function (v) { return v / 255; }), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    var l = (mx + mn) / 2, d = mx - mn, s = 0, H = 0;
    if (d > 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (mx === c[0]) H = ((c[1] - c[2]) / d) % 6; else if (mx === c[1]) H = (c[2] - c[0]) / d + 2; else H = (c[0] - c[1]) / d + 4;
      H *= 60; if (H < 0) H += 360;
    }
    return [H, s * 100, l * 100];
  }
  function hslHex(H, S, L) {
    H = ((H % 360) + 360) % 360; S = Math.max(0, Math.min(100, S)) / 100; L = Math.max(0, Math.min(100, L)) / 100;
    var c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs((H / 60) % 2 - 1)), m = L - c / 2, r = 0, g = 0, b = 0;
    if (H < 60) { r = c; g = x; } else if (H < 120) { r = x; g = c; } else if (H < 180) { g = c; b = x; }
    else if (H < 240) { g = x; b = c; } else if (H < 300) { r = x; b = c; } else { r = c; b = x; }
    return hexYaz((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  function parlaklik(h) {
    var c = rgbDizi(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function oran(a, b) {
    var x = parlaklik(a.slice(0, 7)), y = parlaklik(b.slice(0, 7));
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function karistir(a, b, t) { // a'dan b'ye t oranında (sRGB doğrusal olmayan, basit)
    var p = rgbDizi(a), q = rgbDizi(b);
    return hexYaz(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t);
  }
  function lKaydir(h, d) { var z = hslDizi(h); return hslHex(z[0], z[1], z[2] + d); }
  function enAz(m, ad, arkalar) { return Math.min.apply(null, arkalar.map(function (a) { return oran(m[ad], m[a]); })); }

  // Eşik sağlanana dek m[ad]'ın L'sini ±2% kaydırır (en çok 40 adım). Yön: zeminlerden uzaklaşan (daha çok kontrast veren) uç.
  function sabitle(m, ad, arkalar, esik, kayit) {
    if (enAz(m, ad, arkalar) >= esik) return true;
    var beyaz = Math.min.apply(null, arkalar.map(function (a) { return oran('#FFFFFF', m[a]); }));
    var siyah = Math.min.apply(null, arkalar.map(function (a) { return oran('#000000', m[a]); }));
    var yon = beyaz >= siyah ? 1 : -1, z = hslDizi(m[ad]), once = m[ad];
    for (var i = 0; i < EN_COK_ADIM; i++) {
      z[2] = Math.max(0, Math.min(100, z[2] + yon * ADIM));
      m[ad] = hslHex(z[0], z[1], z[2]);
      if (enAz(m, ad, arkalar) >= esik) { kayit.push({ ad: ad, once: once, sonra: m[ad] }); return true; }
    }
    return false;
  }

  // Orta tonlu şerit tohumu (Tüm arayüz): şerit yazısı eşiği sağlayamıyorsa şerit rengi yazıdan uzağa 2% adımla kaydırılır.
  function sertleStir(m, esik, kayit) {
    var once = m.ust, z = hslDizi(m.ust), yon = parlaklik(m.ustYazi) > parlaklik(m.ust) ? -1 : 1;
    for (var i = 0; i < EN_COK_ADIM; i++) {
      z[2] = Math.max(0, Math.min(100, z[2] + yon * ADIM));
      m.ust = hslHex(z[0], z[1], z[2]); m.ustCizgi = m.ust;
      if (oran(m.ustYazi, m.ust) >= esik) { kayit.push({ ad: 'ust', once: once, sonra: m.ust }); return true; }
    }
    m.ust = once; m.ustCizgi = once;
    return false;
  }

  // iplik hem şeritten (iplik/ust) hem de üstüne yazılan metinden (iplikUstu/iplik) yeterince ayrışmalı: iplik şeritten uzağa kaydırılır, metin yeniden seçilir.
  function iplikUzaklastir(m, esik, esikUst, kayit) {
    var once = m.iplik, z = hslDizi(m.iplik), yon = oran('#FFFFFF', m.ust) >= oran('#000000', m.ust) ? 1 : -1;
    for (var i = 0; i < EN_COK_ADIM; i++) {
      z[2] = Math.max(0, Math.min(100, z[2] + yon * ADIM));
      m.iplik = hslHex(z[0], z[1], z[2]);
      m.iplikUstu = [m.murek, m.kagit, '#000000', '#FFFFFF'].sort(function (a, b) { return oran(b, m.iplik) - oran(a, m.iplik); })[0];
      if (oran(m.iplikUstu, m.iplik) >= esik && oran(m.iplik, m.ust) >= esikUst) { kayit.push({ ad: 'iplik', once: once, sonra: m.iplik }); return true; }
    }
    m.iplik = once;
    return false;
  }

  /* ---------- türetim ---------- */
  function tohumHS(ust) { var z = hslDizi(ust); return { H: z[0], S: z[1] }; }

  // "Tüm arayüz": paletin tohum renginden (plan §2) zemin, yüzey, çizgi, kenar, metin ve şerit türetimi.
  // zemin: isteğe bağlı [H, S] (paletin ayırt edici zemin tonu); yoksa tohumun kendi H ve S'si kullanılır.
  function turetNotr(ust, koyu, zemin) {
    var t = tohumHS(ust), H = zemin ? zemin[0] : t.H, S = zemin ? zemin[1] : t.S, n = {}, d = DURUM[koyu ? 'koyu' : 'acik'];
    if (!zemin && S >= 3 && S < 10) S = 10; // soluk özel tohum: zemin gri kalmasın (tam gri tohum nötr kalır)
    if (!koyu) {
      n.ust = ust.toUpperCase(); n.ustYazi = '#F6F1E3';
      n.kagit = hslHex(H, Math.min(S, 40), 93); n.yuzey = hslHex(H, Math.min(S, 32), 99.4); n.yuzey2 = hslHex(H, Math.min(S, 40), 88.5);
      n.cizgi = hslHex(H, Math.min(S, 28), 79); n.kenar = hslHex(H, Math.min(S, 18), 44);
      n.murek = hslHex(H, 20, 12); n.soluk = hslHex(H, Math.min(S, 15), 34);
    } else {
      n.ust = hslHex(H, Math.min(S, 30), 5); n.ustYazi = hslHex(H, 15, 92);
      n.kagit = hslHex(H, Math.min(S, 40), 10); n.yuzey = hslHex(H, Math.min(S, 40), 15); n.yuzey2 = hslHex(H, Math.min(S, 40), 19);
      n.cizgi = hslHex(H, Math.min(S, 30), 26); n.kenar = hslHex(H, Math.min(S, 15), 55);
      n.murek = hslHex(H, 15, 92); n.soluk = hslHex(H, Math.min(S, 15), 70);
    }
    n.ustSoluk = karistir(n.ustYazi, n.ust, 0.3); n.ustSimge = n.ustYazi; n.ustUstu = n.ustYazi + '1F';
    ['hata', 'tamam', 'uyari', 'bilgi', 'bilgiYazi', 'golge'].forEach(function (k) { n[k] = d[k]; });
    return n;
  }

  // Vurgu katmanı (eylem, iplik): palet tablosundan; koyu temada parlak türev.
  function turetVurgu(p, koyu, m, iplikRenk) {
    var v = {}, z = hslDizi(p.eylem), H = z[0], S = z[1], L = z[2];
    var ek = koyu ? p.koyu : p.acikEk;
    if (!koyu) {
      v.eylem = p.eylem.toUpperCase();
      v.eylemKoyu = (ek && ek.eylemKoyu) || hslHex(H, S, L - 7);
      v.eylemSoluk = (ek && ek.eylemSoluk) || hslHex(H, Math.min(S, 40), 92);
      var ink = hslHex(H, 30, 8);
      v.eylemYazi = oran('#FFFFFF', v.eylem) >= oran(ink, v.eylem) ? '#FFFFFF' : ink;
    } else if (ek) {
      v.eylem = ek.eylem; v.eylemKoyu = ek.eylemKoyu; v.eylemYazi = ek.eylemYazi; v.eylemSoluk = ek.eylemSoluk;
    } else {
      v.eylem = hslHex(H, Math.min(S, 60), 62); v.eylemKoyu = hslHex(H, Math.min(S, 60), 72);
      v.eylemYazi = hslHex(H, 40, 8); v.eylemSoluk = hslHex(H, Math.min(S, 30), 17);
    }
    v.iplik = (iplikRenk || p.iplik).toUpperCase();
    var zi = hslDizi(v.iplik);
    v.iplikYazi = v.iplik;
    if (!koyu) { // açık zeminde yazı olarak kullanılacak koyulaştırılmış iplik
      for (var i = 0; i < 40 && Math.min(oran(v.iplikYazi, m.kagit), oran(v.iplikYazi, m.yuzey)) < 4.5; i++) { zi[2] -= ADIM; v.iplikYazi = hslHex(zi[0], zi[1], zi[2]); }
    }
    v.iplikUstu = ek && ek.iplikUstu && !iplikRenk ? ek.iplikUstu : (oran(m.murek, v.iplik) >= oran(m.kagit, v.iplik) ? m.murek : m.kagit);
    v.odak = koyu ? v.iplik : m.murek;
    return v;
  }

  /* ---------- seçim ---------- */
  function varsayilanSecim(uyg) {
    uyg = uyg || VARSAYILAN_UYG;
    return { palet: uyg.varsayilanPalet, bicim: 'ton', mod: 'acik', kontrast: 'normal', iplik: 'palet', serit: 'dolu', ozel: { ust: OZEL_VARSAYILAN.ust, eylem: OZEL_VARSAYILAN.eylem, iplik: OZEL_VARSAYILAN.iplik } };
  }
  function normallestir(secim, uyg) {
    uyg = uyg || VARSAYILAN_UYG;
    var s = secim && typeof secim === 'object' ? secim : {}, v = varsayilanSecim(uyg), o = {};
    o.palet = PALETLER.indexOf(s.palet) >= 0 && (s.palet !== 'klasik' || uyg.klasik) ? s.palet : v.palet;
    o.bicim = s.bicim === 'tum' ? 'tum' : 'ton';
    o.mod = s.mod === 'koyu' ? 'koyu' : 'acik';
    o.kontrast = s.kontrast === 'yuksek' ? 'yuksek' : 'normal';
    o.iplik = Object.prototype.hasOwnProperty.call(IPLIKLAR, s.iplik) ? s.iplik : 'palet';
    o.serit = s.serit === 'ince' ? 'ince' : 'dolu';
    var oz = s.ozel && typeof s.ozel === 'object' ? s.ozel : {};
    o.ozel = {};
    ['ust', 'eylem', 'iplik'].forEach(function (k) { o.ozel[k] = gecerliHex(oz[k]) ? oz[k].toUpperCase() : v.ozel[k]; });
    return o;
  }
  function paletTanimi(s, uyg) {
    if (s.palet === 'ozel') return { ad: 'Özel', en: 'Custom', ust: s.ozel.ust, eylem: s.ozel.eylem, iplik: s.ozel.iplik };
    if (s.palet === 'klasik') { var a = uyg.klasik.acik; return { ad: 'Klasik', en: 'Classic', ust: a.ust, eylem: a.eylem, iplik: a.iplik }; }
    return ONAYARLAR[s.palet];
  }
  // Kutucuk önizlemesi için {ust, eylem, iplik}
  function renkler(palet, secim, uyg) {
    var s = normallestir(Object.assign({}, secim || {}, { palet: palet }), uyg);
    var p = paletTanimi(s, uyg || VARSAYILAN_UYG);
    return { ust: p.ust.toUpperCase(), eylem: p.eylem.toUpperCase(), iplik: p.iplik.toUpperCase() };
  }

  function dogrula(m, yuksek) {
    var ek = yuksek ? YUKSEK_EK : 0, bad = [];
    KURALLAR.forEach(function (k) {
      k[1].forEach(function (a) {
        var r = oran(m[k[0]], m[a]);
        if (r + 1e-9 < k[2] + ek) bad.push({ fg: k[0], bg: a, oran: r, esik: k[2] + ek });
      });
    });
    return bad;
  }

  // Ana işlev: { ok, belirtec, duzeltmeler, red } ; ok=false ise belirtec uygulamanın varsayılan (reddedilmemiş) görünümüdür.
  function uretAyrinti(secim, uyg) {
    uyg = uyg || VARSAYILAN_UYG;
    var s = normallestir(secim, uyg), koyu = s.mod === 'koyu', ek = s.kontrast === 'yuksek' ? YUKSEK_EK : 0;
    var p = paletTanimi(s, uyg), m = {}, kayit = [], i, k;
    var iplikRenk = IPLIKLAR[s.iplik] || null;
    if (s.palet === 'klasik') {
      var kl = uyg.klasik[koyu ? 'koyu' : 'acik'], nt = turetNotr(kl.ust, koyu);
      Object.keys(kl).forEach(function (a) { m[a] = kl[a]; });
      ['uyari', 'golge'].forEach(function (a) { if (!m[a]) m[a] = nt[a]; });
      var vk = turetVurgu({ eylem: kl.eylem, iplik: kl.iplik }, koyu, m, iplikRenk);
      ['iplikYazi', 'iplikUstu', 'odak'].forEach(function (a) { if (!m[a]) m[a] = vk[a]; });
      if (iplikRenk) { m.iplik = vk.iplik; m.iplikYazi = vk.iplikYazi; m.iplikUstu = vk.iplikUstu; if (koyu) m.odak = vk.iplik; }
    } else {
      var notr;
      if (s.bicim === 'tum') notr = turetNotr(p.ust, koyu, p.zemin);
      else if (uyg.klasik) { notr = {}; CIFT_ANAHTAR.forEach(function (a) { notr[a] = uyg.klasik[koyu ? 'koyu' : 'acik'][a]; }); var nt2 = turetNotr(uyg.klasik.acik.ust, koyu); CIFT_ANAHTAR.forEach(function (a) { if (!notr[a]) notr[a] = nt2[a]; }); }
      else notr = turetNotr(ONAYARLAR[uyg.varsayilanPalet].ust, koyu);
      Object.keys(notr).forEach(function (a) { m[a] = notr[a]; });
      m.ustCizgi = m.ust;
      var v = turetVurgu(p, koyu, m, iplikRenk);
      Object.keys(v).forEach(function (a) { m[a] = v[a]; });
    }
    // ince çizgili şerit: şerit zemini yüzey rengi olur, marka rengi ince üst çizgi (ustCizgi) olarak kalır
    if (s.serit === 'ince') {
      m.ustCizgi = m.ust; m.ust = m.yuzey; m.ustYazi = m.murek; m.ustSoluk = m.soluk; m.ustSimge = m.murek; m.ustUstu = m.murek + '1F';
    } else m.ustCizgi = m.ust;

    var red = null;
    for (var gec = 0; gec < 3; gec++) {
      var degisti = false;
      for (i = 0; i < KURALLAR.length; i++) {
        k = KURALLAR[i];
        var once = m[k[0]];
        sabitle(m, k[0], k[1], k[2] + ek, kayit);
        if (k[0] === 'ustYazi' && s.bicim === 'tum' && s.serit !== 'ince' && s.palet !== 'klasik' && enAz(m, 'ustYazi', ['ust']) < k[2] + ek) sertleStir(m, k[2] + ek, kayit); // orta tonlu şerit tohumu yazıdan uzaklaştırılır
        if (k[0] === 'iplikUstu' && enAz(m, 'iplikUstu', ['iplik']) < k[2] + ek) iplikUzaklastir(m, k[2] + ek, 3 + ek, kayit); // iplik/şerit kuralı yüzünden orta tonda kalan iplik, metinden uzaklaştırılır
        if (m[k[0]] !== once) {
          degisti = true;
          if (k[0] === 'eylem') m.eylemKoyu = lKaydir(m.eylem, koyu ? 10 : -7); // yazı rengi aynı turda yeniden denetlenir
          if (k[0] === 'iplik') { // iplik değişince üstüne yazılan metin ve yazı olarak kullanılan türev yeniden seçilir
            m.iplikUstu = [m.murek, m.kagit, '#000000', '#FFFFFF'].sort(function (a, b) { return oran(b, m.iplik) - oran(a, m.iplik); })[0];
            if (!koyu) { m.iplikYazi = m.iplik; sabitle(m, 'iplikYazi', ['kagit', 'yuzey'], 4.5 + ek, kayit); }
          }
        }
      }
      if (!degisti) break;
    }
    var kalan = dogrula(m, s.kontrast === 'yuksek');
    red = kalan.length ? kalan[0] : null;
    if (red) {
      var yedek = Object.assign({}, s, { palet: uyg.varsayilanPalet, bicim: 'ton', iplik: 'palet', serit: 'dolu' });
      var r2 = yedek.palet === s.palet && s.bicim === 'ton' && s.iplik === 'palet' && s.serit === 'dolu' ? null : uretAyrinti(yedek, uyg);
      return { ok: false, belirtec: r2 ? r2.belirtec : m, duzeltmeler: kayit, red: red, taslak: m };
    }
    var cikti = {};
    TUM_ANAHTAR.forEach(function (a) { cikti[a] = m[a]; });
    return { ok: true, belirtec: cikti, duzeltmeler: kayit, red: null };
  }
  function uret(secim, uyg) { return uretAyrinti(secim, uyg).belirtec; }

  // Genel varsayılan uygulama (Klasik yok): varsayılan palet Lacivert. Uygulamalar kendi uyg nesnesini verir.
  var VARSAYILAN_UYG = { ad: 'ortak', varsayilanPalet: 'lacivert', klasik: null };

  return {
    SURUM: SURUM, ONAYARLAR: ONAYARLAR, PALETLER: PALETLER, IPLIKLAR: IPLIKLAR, TUM_ANAHTAR: TUM_ANAHTAR, KURALLAR: KURALLAR, DURUM: DURUM,
    varsayilanSecim: varsayilanSecim, normallestir: normallestir, uret: uret, uretAyrinti: uretAyrinti, dogrula: dogrula, renkler: renkler,
    sabitle: sabitle, oran: oran, parlaklik: parlaklik, gecerliHex: gecerliHex, hslDizi: hslDizi, hslHex: hslHex
  };
});
