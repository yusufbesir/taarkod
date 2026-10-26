/* Dışa aktarma biçimleri: satır listesini (sira/seri/barkod) metne (xlsx için ikili Uint8Array) çevirir. Saf JS; DOM, ağ ve bağımlılık yok.
 * Satır nesnesinden YALNIZCA sira, seri ve barkod okunur; fazladan alanlar (anahtar kelime, kural vb.) hiçbir zaman çıktıya girmez.
 * Büyük listeler için metin ~20000 satırlık parçalar halinde üretilir (parcaUret); donustur parçaları birleştirir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodDonustur = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PARCA_SATIR = 20000;
  var SQL_TOPLU = 1000;
  var VARSAYILAN_TABLO = 'barkodlar';
  var TABLO_RE = /^[A-Za-z0-9_]{1,40}$/;
  var YASAK_KONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F￾￿]/;
  var ZPL_RE = /^[ -~]+$/;
  var BOS_DOSYA = 'barkod-kodlari';

  var BICIMLER = [
    { id: 'csv-noktalivirgul', ad: 'CSV (Excel Türkçe, ;)', uzanti: 'csv', mime: 'text/csv;charset=utf-8', aciklama: 'Türkçe Excel için noktalı virgül ayraçlı, BOM\'lu CSV.' },
    { id: 'csv-virgul', ad: 'CSV (uluslararası, ,)', uzanti: 'csv', mime: 'text/csv;charset=utf-8', aciklama: 'Virgül ayraçlı standart CSV.' },
    { id: 'tsv', ad: 'TSV (sekmeli)', uzanti: 'tsv', mime: 'text/tab-separated-values;charset=utf-8', aciklama: 'Sekme ayraçlı metin tablosu.' },
    { id: 'xlsx', ad: 'Excel (.xlsx)', uzanti: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ikili: true, aciklama: 'Gerçek Excel çalışma kitabı; tüm hücreler metindir (baştaki sıfırlar ve uzun rakamlar bozulmaz).' },
    { id: 'json', ad: 'JSON', uzanti: 'json', mime: 'application/json;charset=utf-8', aciklama: 'Nesne dizisi; sıra numarası metin olarak tutulur.' },
    { id: 'jsonl', ad: 'JSON Lines', uzanti: 'jsonl', mime: 'application/x-ndjson;charset=utf-8', aciklama: 'Satır başına bir JSON nesnesi.' },
    { id: 'xml', ad: 'XML', uzanti: 'xml', mime: 'application/xml;charset=utf-8', aciklama: 'UTF-8 XML belgesi.' },
    { id: 'sql', ad: 'SQL (INSERT)', uzanti: 'sql', mime: 'application/sql;charset=utf-8', aciklama: 'Her 1000 satırda yeni INSERT deyimi.' },
    { id: 'html-tablo', ad: 'HTML tablo', uzanti: 'html', mime: 'text/html;charset=utf-8', aciklama: 'Kendi başına çalışan, betiksiz HTML tablo.' },
    { id: 'markdown-tablo', ad: 'Markdown tablo', uzanti: 'md', mime: 'text/markdown;charset=utf-8', aciklama: 'Boru (|) ayraçlı Markdown tablosu.' },
    { id: 'txt', ad: 'Düz metin', uzanti: 'txt', mime: 'text/plain;charset=utf-8', aciklama: 'Satır başına yalnızca barkod.' },
    { id: 'zpl', ad: 'ZPL (Zebra)', uzanti: 'zpl', mime: 'text/plain;charset=utf-8', aciklama: 'Zebra etiket yazıcıları için etiketler (varsayılan Code 128; Code 39/93, QR ve Data Matrix da seçilebilir).' },
    { id: 'tspl', ad: 'TSPL (TSC)', uzanti: 'tspl', mime: 'text/plain;charset=utf-8', aciklama: 'TSC etiket yazıcıları için TSPL komutları (etiket boyutu mm cinsinden).' }
  ];

  function bicimBul(id) {
    for (var i = 0; i < BICIMLER.length; i++) if (BICIMLER[i].id === id) return BICIMLER[i];
    return null;
  }

  // ---- Satır doğrulama ----
  function satirOku(s, i) {
    var no = i + 1;
    if (s === null || typeof s !== 'object' || Array.isArray(s)) {
      throw new Error('Satır ' + no + ' geçersiz: nesne bekleniyordu.');
    }
    var sira = s.sira, seri = s.seri, barkod = s.barkod;
    if (typeof sira === 'number') {
      if (!isFinite(sira)) throw new Error('Satır ' + no + ' geçersiz: sıra numarası sonlu bir sayı olmalı.');
      sira = String(sira);
    } else if (typeof sira !== 'string') {
      throw new Error('Satır ' + no + ' geçersiz: sıra numarası sayı ya da metin olmalı.');
    }
    if (seri === undefined || seri === null) seri = '';
    if (typeof seri !== 'string') throw new Error('Satır ' + no + ' geçersiz: seri metin olmalı.');
    if (typeof barkod !== 'string' || barkod === '') {
      throw new Error('Satır ' + no + ' geçersiz: barkod boş olmayan bir metin olmalı.');
    }
    if (YASAK_KONTROL_RE.test(sira) || YASAK_KONTROL_RE.test(seri) || YASAK_KONTROL_RE.test(barkod)) {
      throw new Error('Satır ' + no + ' geçersiz: değerlerde denetim (kontrol) karakteri bulunamaz.');
    }
    return { sira: sira, seri: seri, barkod: barkod };
  }

  // ---- Kaçışlar ----
  function csvHucre(s, ayrac) {
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    var gerek = s.indexOf(ayrac) >= 0 || /["\r\n]/.test(s);
    return gerek ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvFormul(s, ayrac) { // ="barkod" hücresi; mevcut davranış: ayraç/satır sonu yoksa tırnaksız
    var f = '="' + s.replace(/"/g, '""') + '"';
    return f.indexOf(ayrac) >= 0 || /[\r\n]/.test(f) ? '"' + f.replace(/"/g, '""') + '"' : f;
  }
  var XML_HARITA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '\t': '&#9;', '\n': '&#10;', '\r': '&#13;' };
  function xmlKac(s) { return s.replace(/[&<>"'\t\n\r]/g, function (c) { return XML_HARITA[c]; }); }
  var HTML_HARITA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function htmlKac(s) { return s.replace(/[&<>"']/g, function (c) { return HTML_HARITA[c]; }); }
  function mdKac(s) {
    return s.replace(/[\\`*_\[\]<>|#!~&]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '\\' + c;
    }).replace(/\r\n|\r|\n/g, '<br>');
  }
  function sqlMetin(s) {
    if (s.indexOf('\\') >= 0) {
      throw new Error('SQL çıktısında ters eğik çizgi (\\) kullanılamaz; bazı veritabanlarında kaçış olarak yorumlanır.');
    }
    return "'" + s.replace(/'/g, "''") + "'";
  }
  var ETIKET_STANDART = ['code128', 'code39', 'code93', 'qr', 'datamatrix'];
  function standartSec(v) {
    if (v === undefined || v === null) return 'code128';
    if (ETIKET_STANDART.indexOf(v) < 0) throw new Error('"standart" şunlardan biri olmalı: ' + ETIKET_STANDART.join(', ') + '.');
    return v;
  }
  function sayiSecenek(v, ad, min, max, varsayilan) {
    if (v === undefined || v === null) return varsayilan;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
      throw new Error('"' + ad + '" ' + min + ' ile ' + max + ' arasında bir tam sayı (nokta) olmalı.');
    }
    return v;
  }

  // ---- Biçim tanımları: ust(sec) başlık, satir(s, i, sec), alt(n, sec) bitiş. sec önceden hazırlanır. ----
  function csvBicimi(ayrac, bom) {
    return {
      hazirla: function (sec) { return { xl: !!sec.excelMetin }; },
      ust: function () { return (bom ? '﻿' : '') + ['Sira No', 'Seri', 'Barkod'].join(ayrac) + '\r\n'; },
      satir: function (s, i, h) {
        return csvHucre(s.sira, ayrac) + ayrac + csvHucre(s.seri, ayrac) + ayrac +
          (h.xl ? csvFormul(s.barkod, ayrac) : csvHucre(s.barkod, ayrac)) + '\r\n';
      },
      alt: function () { return ''; }
    };
  }

  // ---- Etiket metni (ZPL/TSPL): güvenli kaçışlama. Türkçe harfler ASCII'ye çevrilir, ASCII dışı ve denetim karakterleri atılır. ----
  var ETIKET_METIN_MAKS = 80, ETIKET_SATIR_MAKS = 4;
  function asciiMetin(s) {
    s = String(s === null || s === undefined ? '' : s).replace(/[çÇğĞıİöÖşŞüÜ]/g, function (c) { return TR_HARITA[c]; });
    return s.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // ZPL ^FD: ^ (komut başlatır) ve ~ (denetim komutu) atılır.
  function zplMetni(s) { return asciiMetin(s).replace(/[\^~\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, ETIKET_METIN_MAKS); }
  // TSPL "..." içinde: çift/tek tırnak ve ters bölü atılır.
  function tsplMetni(s) { return asciiMetin(s).replace(/["'\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, ETIKET_METIN_MAKS); }
  function sinirSayi(v, min, max, vars) {
    v = Math.round(Number(v));
    return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : vars;
  }
  // sec.etiketMetin = { ustYuk, satirlar: [{ metin, x, y, h, w, hiza, font, kat }] } (etiket.js yaziciMetinDuzeni üretir).
  // Metin burada yeniden temizlenir; sayılar sınırlanır. Boş kalan satır atlanır.
  function etiketMetniHazirla(em, kacis, ad) {
    if (em === undefined || em === null) return { satirlar: [], ustYuk: 0 };
    if (typeof em !== 'object' || !Array.isArray(em.satirlar)) throw new Error('Seçenek etiketMetin geçersiz.');
    var satirlar = [];
    em.satirlar.slice(0, ETIKET_SATIR_MAKS).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var m = kacis(r.metin);
      if (!m) return;
      satirlar.push({
        metin: m, x: sinirSayi(r.x, 0, 3000, 0), y: sinirSayi(r.y, 0, 3000, 0), h: sinirSayi(r.h, 8, 300, 30), w: sinirSayi(r.w, 4, 300, 18),
        genis: sinirSayi(r.genis, 1, 3000, 400), hiza: r.hiza === 'C' || r.hiza === 'R' ? r.hiza : 'L',
        font: ['1', '2', '3', '4', '5'].indexOf(String(r.font)) >= 0 ? String(r.font) : '2', kat: sinirSayi(r.kat, 1, 10, 1)
      });
    });
    return { satirlar: satirlar, ustYuk: satirlar.length ? sinirSayi(em.ustYuk, 0, 3000, 0) : 0 };
  }

  var IMPL = {
    'csv-noktalivirgul': csvBicimi(';', true),
    'csv-virgul': csvBicimi(',', false),
    'tsv': csvBicimi('\t', false),
    'json': {
      ust: function () { return '['; },
      satir: function (s, i) {
        return (i ? ',' : '') + '\n' + JSON.stringify({ sira: s.sira, seri: s.seri, barkod: s.barkod });
      },
      alt: function (n) { return n ? '\n]\n' : ']\n'; }
    },
    'jsonl': {
      ust: function () { return ''; },
      satir: function (s) { return JSON.stringify({ sira: s.sira, seri: s.seri, barkod: s.barkod }) + '\n'; },
      alt: function () { return ''; }
    },
    'xml': {
      ust: function () { return '<?xml version="1.0" encoding="UTF-8"?>\n<barkodlar>\n'; },
      satir: function (s) {
        return '  <barkod sira="' + xmlKac(s.sira) + '" seri="' + xmlKac(s.seri) + '">' + xmlKac(s.barkod) + '</barkod>\n';
      },
      alt: function () { return '</barkodlar>\n'; }
    },
    'sql': {
      hazirla: function (sec) {
        var t = sec.tabloAdi === undefined || sec.tabloAdi === null ? VARSAYILAN_TABLO : sec.tabloAdi;
        if (typeof t !== 'string' || !TABLO_RE.test(t)) {
          throw new Error('Tablo adı geçersiz: yalnızca harf, rakam ve _ kullanılabilir; en fazla 40 karakter olmalı.');
        }
        return { tablo: t };
      },
      ust: function () { return ''; },
      satir: function (s, i, h) {
        var on = i % SQL_TOPLU === 0
          ? (i ? ';\n' : '') + 'INSERT INTO ' + h.tablo + ' (sira_no, seri, barkod) VALUES\n'
          : ',\n';
        return on + '(' + sqlMetin(s.sira) + ', ' + sqlMetin(s.seri) + ', ' + sqlMetin(s.barkod) + ')';
      },
      alt: function (n) { return n ? ';\n' : ''; }
    },
    'html-tablo': {
      ust: function () {
        var th = 'style="border:1px solid #999;padding:4px 8px;background:#eee;text-align:left"';
        return '<!DOCTYPE html>\n<html lang="tr"><head><meta charset="utf-8"><title>Barkod listesi</title></head>\n' +
          '<body style="font-family:sans-serif">\n<table style="border-collapse:collapse">\n' +
          '<thead><tr><th ' + th + '>Sira No</th><th ' + th + '>Seri</th><th ' + th + '>Barkod</th></tr></thead>\n<tbody>\n';
      },
      satir: function (s) {
        var td = '<td style="border:1px solid #999;padding:4px 8px">';
        return '<tr>' + td + htmlKac(s.sira) + '</td>' + td + htmlKac(s.seri) + '</td>' +
          td.replace('padding:4px 8px', 'padding:4px 8px;font-family:monospace') + htmlKac(s.barkod) + '</td></tr>\n';
      },
      alt: function () { return '</tbody>\n</table>\n</body></html>\n'; }
    },
    'markdown-tablo': {
      ust: function () { return '| Sira No | Seri | Barkod |\n| --- | --- | --- |\n'; },
      satir: function (s) { return '| ' + mdKac(s.sira) + ' | ' + mdKac(s.seri) + ' | ' + mdKac(s.barkod) + ' |\n'; },
      alt: function () { return ''; }
    },
    'txt': {
      ust: function () { return ''; },
      satir: function (s, i) {
        if (/[\r\n]/.test(s.barkod)) throw new Error('Satır ' + (i + 1) + ' geçersiz: düz metin biçiminde barkod satır sonu içeremez.');
        return s.barkod + '\n';
      },
      alt: function () { return ''; }
    },
    'zpl': {
      hazirla: function (sec) {
        var g = sayiSecenek(sec.etiketGenisligi, 'etiketGenisligi', 50, 3000, 0);
        var y = sayiSecenek(sec.etiketYuksekligi, 'etiketYuksekligi', 50, 3000, 0);
        var std = standartSec(sec.standart), kenar = sayiSecenek(sec.kenar, 'kenar', 0, 500, 30);
        var cy = sayiSecenek(sec.cubukYuksekligi, 'cubukYuksekligi', 10, 1000, 100);
        var mod = sayiSecenek(sec.modul, 'modul', 1, 10, 0);
        var em = etiketMetniHazirla(sec.etiketMetin, zplMetni), ust = '';
        em.satirlar.forEach(function (r) {
          ust += '^FO' + r.x + ',' + r.y + '^A0N,' + r.h + ',' + r.w + '^FB' + r.genis + ',1,0,' + r.hiza + ',0^FD' + r.metin + '^FS';
        });
        return { on: '^XA' + (g ? '^PW' + g : '') + (y ? '^LL' + y : '') + (mod ? '^BY' + mod : '') + ust, std: std, kenar: kenar + em.ustYuk, kenarX: kenar, cy: cy, mod: mod };
      },
      ust: function () { return ''; },
      satir: function (s, i, h) {
        var b = s.barkod;
        if (!ZPL_RE.test(b) || /[\^~>]/.test(b)) {
          throw new Error('Satır ' + (i + 1) + ' geçersiz: ZPL için yalnızca ASCII yazdırılabilir karakterler kabul edilir; ^, ~ ve > kullanılamaz.');
        }
        var sembol, veri = b;
        if (h.std === 'code128') sembol = '^BCN,' + h.cy + ',Y,N,N';
        else if (h.std === 'code39') sembol = '^B3N,N,' + h.cy + ',Y,N';
        else if (h.std === 'code93') sembol = '^BAN,' + h.cy + ',Y,N,N';
        else if (h.std === 'qr') { sembol = '^BQN,2,' + (h.mod || 4); veri = 'MA,' + b; }
        else sembol = '^BXN,' + (h.mod || 4) + ',200';
        return h.on + '^FO' + h.kenarX + ',' + h.kenar + sembol + '^FD' + veri + '^FS^XZ\n';
      },
      alt: function () { return ''; }
    },
    'tspl': {
      hazirla: function (sec) {
        var gm = sayiSecenek(sec.etiketGenisMm, 'etiketGenisMm', 10, 300, 50);
        var ym = sayiSecenek(sec.etiketYuksekMm, 'etiketYuksekMm', 10, 300, 30);
        var bos = sayiSecenek(sec.bosluk, 'bosluk', 0, 20, 2);
        var kenar = sayiSecenek(sec.kenar, 'kenar', 0, 500, 30);
        var cy = sayiSecenek(sec.cubukYuksekligi, 'cubukYuksekligi', 10, 1000, 100);
        var std = standartSec(sec.standart), mod = sayiSecenek(sec.modul, 'modul', 1, 10, std === 'qr' ? 4 : 2);
        var alan = sayiSecenek(sec.sembolNokta, 'sembolNokta', 20, 1500, 200);
        var em = etiketMetniHazirla(sec.etiketMetin, tsplMetni), ust = '';
        em.satirlar.forEach(function (r) {
          ust += 'TEXT ' + r.x + ',' + r.y + ',"' + r.font + '",0,' + r.kat + ',' + r.kat + ',"' + r.metin + '"\r\n';
        });
        return {
          std: std, kenar: kenar + em.ustYuk, kenarX: kenar, cy: cy, mod: mod, alan: alan,
          on: 'SIZE ' + gm + ' mm,' + ym + ' mm\r\nGAP ' + bos + ' mm,0 mm\r\nDIRECTION 1\r\nCLS\r\n' + ust
        };
      },
      ust: function () { return ''; },
      satir: function (s, i, h) {
        var b = s.barkod;
        if (!ZPL_RE.test(b) || /["\\]/.test(b)) {
          throw new Error('Satır ' + (i + 1) + ' geçersiz: TSPL için yalnızca ASCII yazdırılabilir karakterler kabul edilir; " ve \\ kullanılamaz.');
        }
        var k = h.kenarX + ',' + h.kenar, kmd;
        if (h.std === 'qr') kmd = 'QRCODE ' + k + ',M,' + h.mod + ',A,0,"' + b + '"';
        else if (h.std === 'datamatrix') kmd = 'DMATRIX ' + k + ',' + h.alan + ',' + h.alan + ',"' + b + '"';
        else {
          var tur = h.std === 'code128' ? '128' : h.std === 'code39' ? '39' : '93';
          kmd = 'BARCODE ' + k + ',"' + tur + '",' + h.cy + ',1,0,' + h.mod + ',' + h.mod + ',"' + b + '"';
        }
        return h.on + kmd + '\r\nPRINT 1,1\r\n';
      },
      alt: function () { return ''; }
    }
  };

  function parcaUret(bicim, satirlar, secenekler) {
    var bb = typeof bicim === 'string' ? bicimBul(bicim) : null;
    if (bb && bb.ikili) throw new Error('"' + bb.ad + '" ikili bir biçimdir; donusturIkili kullanılmalı.');
    if (typeof bicim !== 'string' || !Object.prototype.hasOwnProperty.call(IMPL, bicim)) {
      throw new Error('Bilinmeyen dışa aktarma biçimi: ' + String(bicim).slice(0, 40));
    }
    if (!Array.isArray(satirlar)) throw new Error('Satırlar bir dizi olmalı.');
    var sec = secenekler && typeof secenekler === 'object' ? secenekler : {};
    var im = IMPL[bicim];
    var h = im.hazirla ? im.hazirla(sec) : null;
    var parcalar = [], tmp = [im.ust(h)];
    for (var i = 0; i < satirlar.length; i++) {
      tmp.push(im.satir(satirOku(satirlar[i], i), i, h));
      if ((i + 1) % PARCA_SATIR === 0) { parcalar.push(tmp.join('')); tmp = []; }
    }
    tmp.push(im.alt(satirlar.length, h));
    parcalar.push(tmp.join(''));
    return parcalar;
  }


  // ---- XLSX (OOXML) + sıkıştırmasız ("stored") ZIP yazıcı. Tüm hücreler satır içi metindir (t="inlineStr"). ----
  var CRC_TABLO = null;
  function crcTablo() {
    if (CRC_TABLO) return CRC_TABLO;
    CRC_TABLO = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC_TABLO[n] = c >>> 0;
    }
    return CRC_TABLO;
  }
  function crcGuncelle(crc, bayt) { // crc: ham (ters çevrilmemiş) durum
    var t = crcTablo();
    for (var i = 0; i < bayt.length; i++) crc = t[(crc ^ bayt[i]) & 0xFF] ^ (crc >>> 8);
    return crc >>> 0;
  }
  function crc32(bayt) { return (crcGuncelle(0xFFFFFFFF, bayt) ^ 0xFFFFFFFF) >>> 0; }

  var DOS_TARIH = ((2024 - 1980) << 9) | (1 << 5) | 1; // sabit tarih: çıktı belirleyici olsun
  function u16(v, i, x) { v[i] = x & 0xFF; v[i + 1] = (x >>> 8) & 0xFF; }
  function u32(v, i, x) { v[i] = x & 0xFF; v[i + 1] = (x >>> 8) & 0xFF; v[i + 2] = (x >>> 16) & 0xFF; v[i + 3] = (x >>> 24) & 0xFF; }

  // dosyalar: [{ad: ASCII metin, parcalar: [Uint8Array...]}]; "stored" ZIP döndürür.
  function zipYaz(dosyalar) {
    var enc = new TextEncoder();
    var bilgi = [], toplam = 0, i, j;
    for (i = 0; i < dosyalar.length; i++) {
      var d = dosyalar[i], crc = 0xFFFFFFFF, boy = 0;
      for (j = 0; j < d.parcalar.length; j++) { crc = crcGuncelle(crc, d.parcalar[j]); boy += d.parcalar[j].length; }
      var ad = enc.encode(d.ad);
      bilgi.push({ ad: ad, parcalar: d.parcalar, crc: (crc ^ 0xFFFFFFFF) >>> 0, boy: boy, ofset: toplam });
      toplam += 30 + ad.length + boy;
    }
    var merkezBas = toplam, merkezBoy = 0;
    for (i = 0; i < bilgi.length; i++) merkezBoy += 46 + bilgi[i].ad.length;
    var son = merkezBas + merkezBoy + 22;
    if (son > 0xFFFFFFFF) throw new Error('Dosya çok büyük (4 GB sınırı); satır sayısını azaltın.');
    var out = new Uint8Array(son), p = 0, f;
    for (i = 0; i < bilgi.length; i++) {
      f = bilgi[i];
      u32(out, p, 0x04034B50); u16(out, p + 4, 20); u16(out, p + 6, 0); u16(out, p + 8, 0);
      u16(out, p + 10, 0); u16(out, p + 12, DOS_TARIH); u32(out, p + 14, f.crc);
      u32(out, p + 18, f.boy); u32(out, p + 22, f.boy); u16(out, p + 26, f.ad.length); u16(out, p + 28, 0);
      out.set(f.ad, p + 30); p += 30 + f.ad.length;
      for (j = 0; j < f.parcalar.length; j++) { out.set(f.parcalar[j], p); p += f.parcalar[j].length; }
    }
    for (i = 0; i < bilgi.length; i++) {
      f = bilgi[i];
      u32(out, p, 0x02014B50); u16(out, p + 4, 20); u16(out, p + 6, 20); u16(out, p + 8, 0); u16(out, p + 10, 0);
      u16(out, p + 12, 0); u16(out, p + 14, DOS_TARIH); u32(out, p + 16, f.crc);
      u32(out, p + 20, f.boy); u32(out, p + 24, f.boy); u16(out, p + 28, f.ad.length);
      u16(out, p + 30, 0); u16(out, p + 32, 0); u16(out, p + 34, 0); u16(out, p + 36, 0);
      u32(out, p + 38, 0); u32(out, p + 42, f.ofset);
      out.set(f.ad, p + 46); p += 46 + f.ad.length;
    }
    u32(out, p, 0x06054B50); u16(out, p + 4, 0); u16(out, p + 6, 0);
    u16(out, p + 8, bilgi.length); u16(out, p + 10, bilgi.length);
    u32(out, p + 12, merkezBoy); u32(out, p + 16, merkezBas); u16(out, p + 20, 0);
    return out;
  }

  var XML_BASLIK = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var NS_ANA = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var NS_ILISKI = 'http://schemas.openxmlformats.org/package/2006/relationships';
  var NS_BELGE_ILISKI = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  function xlsxSabitParcalar() {
    return {
      icerik: XML_BASLIK + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
      kokIliski: XML_BASLIK + '<Relationships xmlns="' + NS_ILISKI + '">' +
        '<Relationship Id="rId1" Type="' + NS_BELGE_ILISKI + '/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      kitap: XML_BASLIK + '<workbook xmlns="' + NS_ANA + '" xmlns:r="' + NS_BELGE_ILISKI + '">' +
        '<sheets><sheet name="Barkodlar" sheetId="1" r:id="rId1"/></sheets></workbook>',
      kitapIliski: XML_BASLIK + '<Relationships xmlns="' + NS_ILISKI + '">' +
        '<Relationship Id="rId1" Type="' + NS_BELGE_ILISKI + '/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="' + NS_BELGE_ILISKI + '/styles" Target="styles.xml"/></Relationships>',
      // xf 0: varsayılan, 1: metin biçimi (numFmtId 49 = "@"), 2: kalın başlık (metin biçimli)
      stiller: XML_BASLIK + '<styleSheet xmlns="' + NS_ANA + '">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
    };
  }

  function xlsxHucre(ref, deger, stil) {
    var koru = /^\s|\s$/.test(deger) ? ' xml:space="preserve"' : '';
    return '<c r="' + ref + '" s="' + stil + '" t="inlineStr"><is><t' + koru + '>' + xmlKac(deger) + '</t></is></c>';
  }

  function xlsxUret(satirlar) {
    var enc = new TextEncoder(), sb = xlsxSabitParcalar();
    function b(m) { return enc.encode(m); }
    var sayfa = [b(XML_BASLIK + '<worksheet xmlns="' + NS_ANA + '">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      '<cols><col min="1" max="1" width="30" style="1" customWidth="1"/><col min="2" max="2" width="24" style="1" customWidth="1"/><col min="3" max="3" width="36" style="1" customWidth="1"/></cols>' +
      '<sheetData><row r="1">' + xlsxHucre('A1', 'Sira No', 2) + xlsxHucre('B1', 'Seri', 2) + xlsxHucre('C1', 'Barkod', 2) + '</row>')];
    var tmp = [];
    for (var i = 0; i < satirlar.length; i++) {
      var s = satirOku(satirlar[i], i), r = i + 2;
      tmp.push('<row r="' + r + '">' + xlsxHucre('A' + r, s.sira, 1) + xlsxHucre('B' + r, s.seri, 1) + xlsxHucre('C' + r, s.barkod, 1) + '</row>');
      if ((i + 1) % PARCA_SATIR === 0) { sayfa.push(b(tmp.join(''))); tmp = []; }
    }
    tmp.push('</sheetData></worksheet>');
    sayfa.push(b(tmp.join('')));
    return zipYaz([
      { ad: '[Content_Types].xml', parcalar: [b(sb.icerik)] },
      { ad: '_rels/.rels', parcalar: [b(sb.kokIliski)] },
      { ad: 'xl/workbook.xml', parcalar: [b(sb.kitap)] },
      { ad: 'xl/_rels/workbook.xml.rels', parcalar: [b(sb.kitapIliski)] },
      { ad: 'xl/styles.xml', parcalar: [b(sb.stiller)] },
      { ad: 'xl/worksheets/sheet1.xml', parcalar: sayfa }
    ]);
  }

  var IKILI_IMPL = { 'xlsx': xlsxUret };

  function donusturIkili(bicim, satirlar, secenekler) {
    if (typeof bicim !== 'string' || !Object.prototype.hasOwnProperty.call(IKILI_IMPL, bicim)) {
      throw new Error('Bilinmeyen ikili dışa aktarma biçimi: ' + String(bicim).slice(0, 40));
    }
    if (!Array.isArray(satirlar)) throw new Error('Satırlar bir dizi olmalı.');
    return IKILI_IMPL[bicim](satirlar, secenekler && typeof secenekler === 'object' ? secenekler : {});
  }

  function donustur(bicim, satirlar, secenekler) {
    return parcaUret(bicim, satirlar, secenekler).join('');
  }

  var TR_HARITA = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };

  function dosyaAdi(bicimId, seri) {
    var b = bicimBul(bicimId);
    if (!b) throw new Error('Bilinmeyen dışa aktarma biçimi: ' + String(bicimId).slice(0, 40));
    var ad = String(seri === undefined || seri === null ? '' : seri)
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, function (c) { return TR_HARITA[c]; })
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 60);
    return (ad || BOS_DOSYA) + '.' + b.uzanti;
  }

  return { zplMetni: zplMetni, tsplMetni: tsplMetni, ETIKET_METIN_MAKS: ETIKET_METIN_MAKS, BICIMLER: BICIMLER, donustur: donustur, parcaUret: parcaUret, donusturIkili: donusturIkili, dosyaAdi: dosyaAdi, PARCA_SATIR: PARCA_SATIR };
});
