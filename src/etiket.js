/* Etiket şablonları ve yazdırma düzeni: mm ölçüleri, sayfa düzeni, @page kuralı, ZPL/TSPL için nokta (dot) hesapları.
 * Etiket metni (ürün adı, ek satır, hizalama, yazı boyutu) ve logo denetimi de burada: sığma hesabı saf fonksiyondur.
 * Saf JS; DOM yok. Rulo şablonlarda her etiket ayrı sayfadır; A4 ızgarada sayfa 210x297 mm ve etiketler hücrelere dizilir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./donustur.js'));
  else kok.BarkodEtiket = fabrika(kok.BarkodDonustur);
})(typeof self !== 'undefined' ? self : this, function (Donustur) {
  'use strict';

  var A4_GENIS = 210, A4_YUK = 297, KENAR_MM = 2;

  function izgara(s, r) {
    return { id: 'a4-' + s + 'x' + r, tur: 'izgara', genis: A4_GENIS / s, yuk: A4_YUK / r, sutun: s, satir: r, sayfaGenis: A4_GENIS, sayfaYuk: A4_YUK };
  }
  function rulo(g, y) { return { id: g + 'x' + y, tur: 'rulo', genis: g, yuk: y, sutun: 1, satir: 1, sayfaGenis: g, sayfaYuk: y }; }

  var SABLONLAR = [rulo(40, 25), rulo(50, 30), rulo(100, 50), rulo(100, 150), izgara(3, 8), izgara(4, 10)];

  function sablonBul(id) {
    for (var i = 0; i < SABLONLAR.length; i++) if (SABLONLAR[i].id === id) return SABLONLAR[i];
    return null;
  }

  function mmNokta(mm, dpi) {
    if (!(mm >= 0) || !(dpi > 0)) throw new Error('mm ve dpi pozitif sayı olmalı.');
    return Math.round(mm * dpi / 25.4);
  }
  function sinirla(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // adet etiket için sayfa düzeni
  function sayfaDuzeni(sablon, adet) {
    var basina = sablon.sutun * sablon.satir, n = Math.max(0, Math.floor(adet));
    return { sayfaBasina: basina, sayfaSayisi: n === 0 ? 0 : Math.ceil(n / basina), sutun: sablon.sutun, satir: sablon.satir };
  }

  // Dinamik <style> elementine yazılacak @page kuralı (yazdırma sayfası boyutu şablona göre)
  function sayfaCss(sablon) {
    return '@page{size:' + sablon.sayfaGenis + 'mm ' + sablon.sayfaYuk + 'mm;margin:0}';
  }

  function yaziciyaUygun(sablon) { return !!sablon && sablon.tur === 'rulo'; }

  // ZPL/TSPL seçenekleri. toplamModul: 1B için kodun modül sayısı, 2B için matris kenarı. dpi: 203 ya da 300.
  // ustYukNokta (isteğe bağlı): etiketin üstündeki metin bloğunun yüksekliği; barkod için kalan yükseklik buna göre daralır.
  function yaziciSecenek(sablon, dpi, standart, toplamModul, ustYukNokta) {
    if (!yaziciyaUygun(sablon)) throw new Error('Yazıcı dili için yalnızca rulo etiket şablonları kullanılabilir.');
    if (dpi !== 203 && dpi !== 300) throw new Error('Çözünürlük 203 ya da 300 dpi olmalı.');
    var iki = standart === 'qr' || standart === 'datamatrix';
    var g = mmNokta(sablon.genis, dpi), y = mmNokta(sablon.yuk, dpi), kenar = mmNokta(KENAR_MM, dpi);
    var kullG = Math.max(1, g - 2 * kenar), kullY = Math.max(1, y - 2 * kenar - Math.max(0, Math.round(Number(ustYukNokta) || 0))), n = Math.max(1, Math.floor(Number(toplamModul) || 1));
    var modul = iki ? Math.floor(Math.min(kullG, kullY) / (n + 0)) : Math.floor(kullG / (n + 20));
    modul = sinirla(modul, 1, 10);
    return {
      standart: standart, etiketGenisligi: sinirla(g, 50, 3000), etiketYuksekligi: sinirla(y, 50, 3000),
      etiketGenisMm: sablon.genis, etiketYuksekMm: sablon.yuk, kenar: kenar,
      cubukYuksekligi: sinirla(Math.round(kullY * 0.6), 10, 1000), modul: modul,
      sembolNokta: sinirla(modul * n, 20, 1500), dpi: dpi
    };
  }

  // ---- Etiket metni ve logo ----
  var BOYUTLAR = { kucuk: 2.0, orta: 2.8, buyuk: 3.6 }; // yazı yüksekliği (mm)
  var HIZALAR = ['sol', 'orta', 'sag'];
  var URUN_MAKS = 60, EK_MAKS = 80, LOGO_MAKS_BAYT = 200 * 1024;
  var SATIR_ARALIK = 1.2, KARAKTER_ORANI = 0.62, EN_KUCUK_YAZI = 1.6, EKRAN_KENAR_MM = 1.2;

  function metinTemizle(s, maks) {
    s = String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
    return Array.from(s).slice(0, maks).join('');
  }
  // Ham girdiden güvenli etiket metni alanları: { urun, ek, boyut, hiza }
  function girdiTemizle(g) {
    g = g && typeof g === 'object' ? g : {};
    return {
      urun: metinTemizle(g.urun, URUN_MAKS), ek: metinTemizle(g.ek, EK_MAKS),
      boyut: Object.prototype.hasOwnProperty.call(BOYUTLAR, g.boyut) ? g.boyut : 'orta',
      hiza: HIZALAR.indexOf(g.hiza) >= 0 ? g.hiza : 'orta'
    };
  }

  // Metin satırlarını etiketin kullanılabilir alanına sığdırır (mm). Taşma olursa önce yazı küçülür (en az 1,6 mm),
  // hâlâ taşarsa metin kısaltılır; yükseklik yetmezse son satırlar düşer. Dönüş: { satirlar:[{ad,metin,yaziMm,kisaldi,kuculdu}], yukMm, gizlenen }.
  // sec: kenarMm, ustPayMm (logo vb. için ayrılan yükseklik), blokOrani (kullanılabilir yüksekliğin en çok ne kadarı metin), kisaltma, donustur(fn).
  function metinDuzeni(genisMm, yukMm, girdi, sec) {
    sec = sec || {};
    var g = girdiTemizle(girdi), kenar = sec.kenarMm === undefined ? EKRAN_KENAR_MM : sec.kenarMm;
    var kisaltma = sec.kisaltma === undefined ? '…' : sec.kisaltma, don = sec.donustur || function (x) { return x; };
    var W = Math.max(0, genisMm - 2 * kenar), Y = Math.max(0, yukMm - 2 * kenar);
    var maksYuk = Math.max(0, Y * (sec.blokOrani === undefined ? 0.45 : sec.blokOrani) - (sec.ustPayMm || 0));
    var ham = [['urun', don(g.urun)], ['ek', don(g.ek)]].filter(function (x) { return x[1] !== ''; });
    var boyut = BOYUTLAR[g.boyut], gizlenen = 0, satirlar = [];
    // yükseklik yetmiyorsa en küçük yazıyla bile sığmayan son satırlar düşer
    while (ham.length && ham.length * EN_KUCUK_YAZI * SATIR_ARALIK > maksYuk + 1e-9) { ham.pop(); gizlenen++; }
    if (!ham.length) return { satirlar: [], yukMm: 0, gizlenen: gizlenen };
    var olcek = Math.min(1, maksYuk / (ham.length * boyut * SATIR_ARALIK));
    ham.forEach(function (r) {
      var y = Math.max(EN_KUCUK_YAZI, boyut * olcek), kuculdu = y < boyut - 1e-9, metin = r[1], kisaldi = false;
      var kap = function (yy) { return Math.floor(W / (yy * KARAKTER_ORANI) + 1e-9); };
      if (Array.from(metin).length > kap(y)) {
        y = Math.max(EN_KUCUK_YAZI, Math.min(y, W / (Array.from(metin).length * KARAKTER_ORANI)));
        kuculdu = y < boyut - 1e-9;
        var c = Array.from(metin), kp = kap(y);
        if (c.length > kp) {
          var k = Math.max(0, kp - Array.from(kisaltma).length);
          metin = c.slice(0, k).join('').replace(/\s+$/, '') + (kp >= Array.from(kisaltma).length ? kisaltma : '');
          if (Array.from(metin).length > kp) metin = c.slice(0, kp).join('');
          kisaldi = true;
        }
      }
      y = Math.floor(y * 100 + 1e-9) / 100;
      satirlar.push({ ad: r[0], metin: metin, yaziMm: y, kisaldi: kisaldi, kuculdu: kuculdu });
    });
    var yuk = 0; satirlar.forEach(function (r) { yuk += r.yaziMm * SATIR_ARALIK; });
    return { satirlar: satirlar, yukMm: Math.round(yuk * 100) / 100, gizlenen: gizlenen, hiza: g.hiza };
  }

  // Ekran/yazdırma önizlemesi için: kenar 1,2 mm (CSS dolgusu), logo varsa yüksekliğin %20'si ayrılır.
  function ekranDuzeni(sablon, girdi, logoVar) {
    return metinDuzeni(sablon.genis, sablon.yuk, girdi, { kenarMm: EKRAN_KENAR_MM, ustPayMm: logoVar ? sablon.yuk * 0.2 : 0, blokOrani: 0.5 });
  }

  var TSPL_FONT = [['1', 8, 12], ['2', 12, 20], ['3', 16, 24], ['4', 24, 32], ['5', 32, 48]]; // [ad, hücre genişliği, yüksekliği] (nokta)
  var HIZA_ZPL = { sol: 'L', orta: 'C', sag: 'R' };

  // ZPL/TSPL için nokta cinsinden metin düzeni. dil: 'zpl' | 'tspl'. Metin dile göre kaçışlanır (donustur.js).
  // Dönüş donustur.js'nin sec.etiketMetin alanına verilir: { ustYuk, satirlar:[{metin,x,y,h,w,genis,hiza,font,kat}] }; ayrıca gizlenen sayısı.
  function yaziciMetinDuzeni(sablon, dpi, girdi, dil) {
    if (dil !== 'zpl' && dil !== 'tspl') throw new Error('Dil zpl ya da tspl olmalı.');
    if (dpi !== 203 && dpi !== 300) throw new Error('Çözünürlük 203 ya da 300 dpi olmalı.');
    var don = dil === 'zpl' ? Donustur.zplMetni : Donustur.tsplMetni;
    var md = metinDuzeni(sablon.genis, sablon.yuk, girdi, { kenarMm: KENAR_MM, blokOrani: 0.4, kisaltma: '...', donustur: don });
    var kenar = mmNokta(KENAR_MM, dpi), W = Math.max(1, mmNokta(sablon.genis, dpi) - 2 * kenar), y = 0, hiza = md.hiza;
    var satirlar = md.satirlar.map(function (r) {
      var h = Math.max(8, mmNokta(r.yaziMm, dpi)), o;
      if (dil === 'zpl') {
        var w = Math.max(4, Math.round(h * KARAKTER_ORANI));
        var zm = r.metin, zk = Math.floor(W / w); // nokta yuvarlaması genişliği aşabilir: gerekirse yeniden kısalt
        if (zm.length > zk) zm = zm.slice(0, Math.max(0, zk - 3)).replace(/\s+$/, '') + (zk >= 3 ? '...' : '');
        o = { metin: zm, x: kenar, y: kenar + y, h: h, w: w, genis: W, hiza: HIZA_ZPL[hiza], font: '2', kat: 1 };
        y += Math.round(h * SATIR_ARALIK);
      } else {
        // en büyük sığan bitmap font; yazı yüksekliğine ve genişliğe göre
        var f = TSPL_FONT[0], i, metin = r.metin;
        for (i = TSPL_FONT.length - 1; i >= 0; i--) {
          if (TSPL_FONT[i][2] <= h && metin.length * TSPL_FONT[i][1] <= W) { f = TSPL_FONT[i]; break; }
        }
        var kp = Math.floor(W / f[1]);
        if (metin.length > kp) metin = metin.slice(0, Math.max(0, kp - 3)).replace(/\s+$/, '') + (kp >= 3 ? '...' : '');
        var gen = metin.length * f[1], x = hiza === 'sol' ? 0 : hiza === 'sag' ? W - gen : Math.floor((W - gen) / 2);
        o = { metin: metin, x: kenar + Math.max(0, x), y: kenar + y, h: f[2], w: f[1], genis: W, hiza: 'L', font: f[0], kat: 1 };
        y += Math.round(f[2] * 1.15);
      }
      return o;
    });
    return { satirlar: satirlar, ustYuk: satirlar.length ? y + mmNokta(0.8, dpi) : 0, gizlenen: md.gizlenen };
  }

  // Logo: yalnızca base64 data: URI (PNG, JPEG, SVG), en çok 200 KB (çözülmüş bayt); imza baytları türle uyuşmalı.
  var LOGO_RE = /^data:image\/(png|jpeg|svg\+xml);base64,([A-Za-z0-9+\/]+={0,2})$/;
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function bayt(b64, n) { // ilk n baytı çözer (bağımsız, atob'a gerek yok)
    var out = [], bits = 0, acc = 0, i;
    for (i = 0; i < b64.length && out.length < n; i++) {
      var v = B64.indexOf(b64.charAt(i)); if (v < 0) break;
      acc = (acc << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); acc &= (1 << bits) - 1; }
    }
    return out;
  }
  function logoUriGecerli(uri) {
    if (typeof uri !== 'string' || uri.length > Math.ceil(LOGO_MAKS_BAYT / 3) * 4 + 40) return false;
    var m = LOGO_RE.exec(uri);
    if (!m || m[2].length % 4 !== 0) return false;
    var pad = (m[2].match(/=+$/) || [''])[0].length, boyut = m[2].length / 4 * 3 - pad;
    if (boyut <= 0 || boyut > LOGO_MAKS_BAYT) return false;
    var b = bayt(m[2], 64);
    if (m[1] === 'png') return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    if (m[1] === 'jpeg') return b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    var t = b.map(function (c) { return String.fromCharCode(c); }).join('');
    return /<svg|<\?xml/i.test(t);
  }

  return {
    BOYUTLAR: BOYUTLAR, HIZALAR: HIZALAR, LOGO_MAKS_BAYT: LOGO_MAKS_BAYT, girdiTemizle: girdiTemizle, metinDuzeni: metinDuzeni, ekranDuzeni: ekranDuzeni,
    yaziciMetinDuzeni: yaziciMetinDuzeni, logoUriGecerli: logoUriGecerli,
    SABLONLAR: SABLONLAR, KENAR_MM: KENAR_MM, sablonBul: sablonBul, mmNokta: mmNokta, sayfaDuzeni: sayfaDuzeni,
    sayfaCss: sayfaCss, yaziciyaUygun: yaziciyaUygun, yaziciSecenek: yaziciSecenek
  };
});
