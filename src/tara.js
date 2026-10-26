/* Kameradan/görselden barkod okuma: navigator.mediaDevices.getUserMedia + BarcodeDetector (tarayıcıya yerleşik; dış kütüphane yok).
 * Ortam (navigator, BarcodeDetector, createImageBitmap) dışarıdan verilir; böylece Node'da sahte nesnelerle sınanır.
 * Hata nesnelerinde .kod bulunur: 'destek-yok' | 'kamera-yok' | 'izin' | 'mesgul' | 'guvensiz' | 'okunamadi' | 'genel'.
 * Kamera akışı durdur() ile ya da değer okunduğunda kapatılır (tüm izler stop()). */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodTara = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ISTENEN = ['qr_code', 'data_matrix', 'code_128', 'code_39', 'code_93'];
  var MAKS_DEGER = 500;

  function hata(kod, mesaj) { var e = new Error(mesaj || kod); e.kod = kod; return e; }

  // env: { navigator, BarcodeDetector, createImageBitmap, isSecureContext }
  function destek(env) {
    env = env || {};
    var md = env.navigator && env.navigator.mediaDevices;
    return {
      kamera: !!(md && typeof md.getUserMedia === 'function'),
      detector: typeof env.BarcodeDetector === 'function',
      gorsel: typeof env.createImageBitmap === 'function',
      guvenli: env.isSecureContext !== false
    };
  }

  function hataKodu(e) {
    if (e && e.kod) return e.kod;
    var ad = e && e.name;
    if (ad === 'NotAllowedError' || ad === 'SecurityError' || ad === 'PermissionDeniedError') return 'izin';
    if (ad === 'NotFoundError' || ad === 'DevicesNotFoundError' || ad === 'OverconstrainedError') return 'kamera-yok';
    if (ad === 'NotReadableError' || ad === 'TrackStartError' || ad === 'AbortError') return 'mesgul';
    return 'genel';
  }

  // Okunan değeri güvenli metne çevirir: denetim karakterleri atılır, uzun değerler reddedilir.
  function degerTemizle(v) {
    if (typeof v !== 'string') return null;
    v = v.replace(/[\u0000-\u001F\u007F]/g, '').trim();
    return v && v.length <= MAKS_DEGER ? v : null;
  }
  function degerSec(sonuclar) {
    if (!sonuclar || !sonuclar.length) return null;
    for (var i = 0; i < sonuclar.length; i++) {
      var d = degerTemizle(sonuclar[i] && sonuclar[i].rawValue);
      if (d) return d;
    }
    return null;
  }

  async function detectorOlustur(env) {
    if (typeof env.BarcodeDetector !== 'function') throw hata('destek-yok', 'BarcodeDetector yok.');
    var bicimler = ISTENEN;
    try {
      if (typeof env.BarcodeDetector.getSupportedFormats === 'function') {
        var d = await env.BarcodeDetector.getSupportedFormats();
        var ortak = ISTENEN.filter(function (f) { return d.indexOf(f) >= 0; });
        if (ortak.length) bicimler = ortak;
      }
    } catch (e) { /* varsayılan listeyle dene */ }
    return new env.BarcodeDetector({ formats: bicimler });
  }

  // Görsel dosyasından okur. Dönüş: değer (metin); bulunamazsa 'okunamadi' hatası.
  async function dosyadanOku(env, dosya) {
    var d = destek(env);
    if (!d.detector) throw hata('destek-yok', 'Bu tarayıcıda BarcodeDetector yok.');
    if (!d.gorsel) throw hata('destek-yok', 'Görsel okunamıyor.');
    var det = await detectorOlustur(env), bmp;
    try { bmp = await env.createImageBitmap(dosya); } catch (e) { throw hata('okunamadi', 'Görsel açılamadı.'); }
    try {
      var deger = degerSec(await det.detect(bmp));
      if (!deger) throw hata('okunamadi', 'Görselde barkod bulunamadı.');
      return deger;
    } finally { if (bmp && typeof bmp.close === 'function') bmp.close(); }
  }

  // video: <video> öğesi. secenek: { aralik (ms), tamam(deger), hata(kod) }. Dönüş: { durdur }
  async function kameraAc(env, video, secenek) {
    secenek = secenek || {};
    var d = destek(env);
    if (!d.kamera) throw hata('destek-yok', 'Kamera erişimi yok.');
    if (!d.guvenli) throw hata('guvensiz', 'Kamera yalnızca güvenli bağlamda açılır.');
    if (!d.detector) throw hata('destek-yok', 'BarcodeDetector yok.');
    var det = await detectorOlustur(env), akis;
    try { akis = await env.navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }
    catch (e) { throw hata(hataKodu(e), e && e.message); }
    var bitti = false, zaman = null;
    function durdur() {
      bitti = true;
      if (zaman) { clearTimeout(zaman); zaman = null; }
      try { akis.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* yok say */ }
      try { video.srcObject = null; } catch (e) { /* yok say */ }
    }
    try {
      video.srcObject = akis;
      if (typeof video.play === 'function') await video.play();
    } catch (e) { durdur(); throw hata(hataKodu(e), e && e.message); }
    var aralik = secenek.aralik || 250;
    function dongu() {
      if (bitti) return;
      Promise.resolve(det.detect(video)).then(function (r) {
        if (bitti) return;
        var deger = degerSec(r);
        if (deger) { durdur(); if (secenek.tamam) secenek.tamam(deger); return; }
        zaman = setTimeout(dongu, aralik);
      }, function (e) {
        if (bitti) return;
        durdur(); if (secenek.hata) secenek.hata(hataKodu(e));
      });
    }
    zaman = setTimeout(dongu, 0);
    return { durdur: durdur };
  }

  return { ISTENEN: ISTENEN, destek: destek, hataKodu: hataKodu, degerSec: degerSec, degerTemizle: degerTemizle, dosyadanOku: dosyadanOku, kameraAc: kameraAc };
});
