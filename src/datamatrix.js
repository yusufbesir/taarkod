/* Data Matrix ECC200 kodlayıcı: ASCII kodlama, kare semboller 10x10 .. 32x32, Reed-Solomon GF(256) 0x12D.
 * Dış kütüphane yok. moduller2d(metin, secenek) -> 0/1 dizi dizisi (sessiz bölge hariç).
 * 127'den büyük karakterler UTF-8 baytlarına çevrilip Upper Shift (235) ile kodlanır. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.DataMatrixKod = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // boyut: sembol kenarı; veri/ecc: sözcük sayısı; bolge: bölge başına kenar sayısı; ic: bölge veri kenarı
  var BOYUTLAR = [
    { boyut: 10, veri: 3, ecc: 5, bolge: 1, ic: 8 },
    { boyut: 12, veri: 5, ecc: 7, bolge: 1, ic: 10 },
    { boyut: 14, veri: 8, ecc: 10, bolge: 1, ic: 12 },
    { boyut: 16, veri: 12, ecc: 12, bolge: 1, ic: 14 },
    { boyut: 18, veri: 18, ecc: 14, bolge: 1, ic: 16 },
    { boyut: 20, veri: 22, ecc: 18, bolge: 1, ic: 18 },
    { boyut: 22, veri: 30, ecc: 20, bolge: 1, ic: 20 },
    { boyut: 24, veri: 36, ecc: 24, bolge: 1, ic: 22 },
    { boyut: 26, veri: 44, ecc: 28, bolge: 1, ic: 24 },
    { boyut: 32, veri: 62, ecc: 36, bolge: 2, ic: 14 }
  ];

  /* ---------- Reed-Solomon, GF(256) 0x12D ---------- */
  var EXP = [], LOG = [];
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x12D; }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function carp(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rsUret(veri, n) {
    var g = [1], i, j;
    for (i = 1; i <= n; i++) { // (x - a^i) çarpımı, kökler a^1..a^n
      var y = new Array(g.length + 1).fill(0);
      for (j = 0; j < g.length; j++) { y[j] ^= g[j]; y[j + 1] ^= carp(g[j], EXP[i]); }
      g = y;
    }
    g = g.slice(1);
    var r = new Array(n).fill(0);
    veri.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      g.forEach(function (c, k) { r[k] ^= carp(c, f); });
    });
    return r;
  }

  /* ---------- ASCII kodlama ---------- */
  function utf8(s) {
    var o = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00); i++; }
      }
      if (c < 0x80) o.push(c);
      else if (c < 0x800) o.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) o.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else o.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return o;
  }

  function asciiKodla(baytlar) {
    var cw = [], i = 0;
    while (i < baytlar.length) {
      var b = baytlar[i];
      if (b >= 48 && b <= 57 && i + 1 < baytlar.length && baytlar[i + 1] >= 48 && baytlar[i + 1] <= 57) {
        cw.push(130 + (b - 48) * 10 + (baytlar[i + 1] - 48)); i += 2;
      } else if (b < 128) { cw.push(b + 1); i++; }
      else { cw.push(235, b - 128 + 1); i++; }
    }
    return cw;
  }

  function doldur(cw, kap) {
    if (cw.length < kap) cw.push(129);
    while (cw.length < kap) {
      var r = 129 + ((149 * (cw.length + 1)) % 253) + 1;
      if (r > 254) r -= 254;
      cw.push(r);
    }
    return cw;
  }

  /* ---------- Yerleştirme (ISO 16022 Ek F) ---------- */
  function yerlestir(nrow, ncol, cw) {
    var dizi = new Array(nrow * ncol).fill(0), chr = 1, row = 4, col = 0;
    function modul(r, c, ch, bit) {
      if (r < 0) { r += nrow; c += 4 - ((nrow + 4) % 8); }
      if (c < 0) { c += ncol; r += 4 - ((ncol + 4) % 8); }
      dizi[r * ncol + c] = ch * 10 + bit;
    }
    function utah(r, c, ch) {
      modul(r - 2, c - 2, ch, 1); modul(r - 2, c - 1, ch, 2);
      modul(r - 1, c - 2, ch, 3); modul(r - 1, c - 1, ch, 4); modul(r - 1, c, ch, 5);
      modul(r, c - 2, ch, 6); modul(r, c - 1, ch, 7); modul(r, c, ch, 8);
    }
    function kose1(ch) {
      modul(nrow - 1, 0, ch, 1); modul(nrow - 1, 1, ch, 2); modul(nrow - 1, 2, ch, 3);
      modul(0, ncol - 2, ch, 4); modul(0, ncol - 1, ch, 5); modul(1, ncol - 1, ch, 6);
      modul(2, ncol - 1, ch, 7); modul(3, ncol - 1, ch, 8);
    }
    function kose2(ch) {
      modul(nrow - 3, 0, ch, 1); modul(nrow - 2, 0, ch, 2); modul(nrow - 1, 0, ch, 3);
      modul(0, ncol - 4, ch, 4); modul(0, ncol - 3, ch, 5); modul(0, ncol - 2, ch, 6);
      modul(0, ncol - 1, ch, 7); modul(1, ncol - 1, ch, 8);
    }
    function kose3(ch) {
      modul(nrow - 3, 0, ch, 1); modul(nrow - 2, 0, ch, 2); modul(nrow - 1, 0, ch, 3);
      modul(0, ncol - 2, ch, 4); modul(0, ncol - 1, ch, 5); modul(1, ncol - 1, ch, 6);
      modul(2, ncol - 1, ch, 7); modul(3, ncol - 1, ch, 8);
    }
    function kose4(ch) {
      modul(nrow - 1, 0, ch, 1); modul(nrow - 1, ncol - 1, ch, 2); modul(0, ncol - 3, ch, 3);
      modul(0, ncol - 2, ch, 4); modul(0, ncol - 1, ch, 5); modul(1, ncol - 3, ch, 6);
      modul(1, ncol - 2, ch, 7); modul(1, ncol - 1, ch, 8);
    }
    do {
      if (row === nrow && col === 0) kose1(chr++);
      if (row === nrow - 2 && col === 0 && ncol % 4) kose2(chr++);
      if (row === nrow - 2 && col === 0 && ncol % 8 === 4) kose3(chr++);
      if (row === nrow + 4 && col === 2 && !(ncol % 8)) kose4(chr++);
      do {
        if (row < nrow && col >= 0 && !dizi[row * ncol + col]) utah(row, col, chr++);
        row -= 2; col += 2;
      } while (row >= 0 && col < ncol);
      row += 1; col += 3;
      do {
        if (row >= 0 && col < ncol && !dizi[row * ncol + col]) utah(row, col, chr++);
        row += 2; col -= 2;
      } while (row < nrow && col >= 0);
      row += 3; col += 1;
    } while (row < nrow || col < ncol);
    var sabit = !dizi[nrow * ncol - 1];
    var cikti = dizi.map(function (v) {
      if (!v) return 0;
      return (cw[Math.floor(v / 10) - 1] >> (8 - (v % 10))) & 1;
    });
    if (sabit) { cikti[nrow * ncol - 1] = 1; cikti[nrow * ncol - ncol - 2] = 1; }
    return cikti;
  }

  function kodla(metin, secenek) {
    secenek = secenek || {};
    var baytlar = utf8(String(metin == null ? '' : metin));
    var cw = asciiKodla(baytlar), s = null, i;
    var enAz = secenek.enAzBoyut == null ? 0 : Number(secenek.enAzBoyut);
    for (i = 0; i < BOYUTLAR.length; i++) {
      if (BOYUTLAR[i].boyut >= enAz && BOYUTLAR[i].veri >= cw.length) { s = BOYUTLAR[i]; break; }
    }
    if (!s) throw new Error('Data Matrix: metin çok uzun (' + cw.length + ' sözcük); en çok 32x32 (62 sözcük) desteklenir.');
    cw = doldur(cw, s.veri);
    cw = cw.concat(rsUret(cw, s.ecc));
    var map = s.bolge * s.ic, duz = yerlestir(map, map, cw);
    var N = s.boyut, m = [], x, y;
    for (y = 0; y < N; y++) m.push(new Array(N).fill(0));
    var adim = s.ic + 2;
    for (var ry = 0; ry < s.bolge; ry++) for (var rx = 0; rx < s.bolge; rx++) {
      var x0 = rx * adim, y0 = ry * adim;
      for (y = 0; y < adim; y++) for (x = 0; x < adim; x++) {
        var v;
        if (x === 0 || y === adim - 1) v = 1;                   // sol ve alt: düz
        else if (y === 0) v = x % 2 === 0 ? 1 : 0;              // üst: dönüşümlü
        else if (x === adim - 1) v = y % 2 === 1 ? 1 : 0;       // sağ: dönüşümlü
        else v = duz[(ry * s.ic + y - 1) * map + rx * s.ic + x - 1];
        m[y0 + y][x0 + x] = v;
      }
    }
    return { matris: m, boyut: N, veriSozcuk: s.veri, eccSozcuk: s.ecc, sozcukler: cw, bayt: baytlar.length };
  }

  function moduller2d(metin, secenek) { return kodla(metin, secenek).matris; }

  // secenek: modulGenislik (varsayılan 4), sessizBolge (varsayılan 1 modül)
  function svg(metin, secenek) {
    secenek = secenek || {};
    var mg = secenek.modulGenislik == null ? 4 : Number(secenek.modulGenislik);
    var sessiz = secenek.sessizBolge == null ? 1 : Number(secenek.sessizBolge);
    if (!(mg > 0) || !(sessiz >= 0)) throw new Error('SVG ölçüleri pozitif sayı olmalı.');
    var m = moduller2d(metin, secenek), n = m.length, boy = (n + 2 * sessiz) * mg, d = [];
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if (m[y][x]) d.push('M' + (x + sessiz) * mg + ' ' + (y + sessiz) * mg + 'h' + mg + 'v' + mg + 'h-' + mg + 'z');
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + boy + '" height="' + boy + '" viewBox="0 0 ' + boy + ' ' + boy +
      '" shape-rendering="crispEdges"><rect x="0" y="0" width="' + boy + '" height="' + boy + '" fill="#ffffff"/>' +
      '<path fill="#000000" d="' + d.join('') + '"/></svg>';
  }

  return { kodla: kodla, moduller2d: moduller2d, svg: svg, boyutlar: BOYUTLAR.map(function (b) { return b.boyut; }) };
});
