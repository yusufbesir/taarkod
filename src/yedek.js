/* Parolalı kural yedeği: PBKDF2 (SHA-256, >= 310000 yineleme) ile türetilen anahtarla AES-GCM (WebCrypto).
 * Yedeğe YALNIZCA kural ayarları (önek, uzunluk, standart, yöntem, seri tanımları...) yazılır: içerik BarkodKural.disaAktar çıktısıdır
 * ve anahtar kelime bu çıktıda bulunamaz. Parola unutulursa kurtarma yoktur. Tuz ve iv her yedekte rastgeledir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./kural.js'));
  else kok.BarkodYedek = fabrika(kok.BarkodKural);
})(typeof self !== 'undefined' ? self : this, function (K) {
  'use strict';

  var SURUM = 1, TUR = 'taarkod-kural-yedegi';
  var YINELEME = 600000, YINELEME_MIN = 310000, YINELEME_MAKS = 5000000;
  var PAROLA_MIN = 8, DOSYA_MAKS = 200000;

  function hata(kod, mesaj) { var e = new Error(mesaj); e.kod = kod; return e; }

  function webCrypto(c) {
    var w = c || (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
    if (!w || !w.subtle || typeof w.getRandomValues !== 'function') throw hata('destek-yok', 'Bu tarayıcıda WebCrypto yok.');
    return w;
  }

  function b64(bayt) {
    var s = '';
    for (var i = 0; i < bayt.length; i += 8192) s += String.fromCharCode.apply(null, bayt.subarray(i, i + 8192));
    return btoa(s);
  }
  function b64Coz(m) {
    if (typeof m !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(m)) throw hata('bozuk', 'Yedek dosyası bozuk.');
    var s = atob(m), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }

  function parolaDenetle(p) {
    if (typeof p !== 'string' || p.length < PAROLA_MIN) throw hata('parola-kisa', 'Parola en az ' + PAROLA_MIN + ' karakter olmalı.');
  }

  async function anahtarTuret(w, parola, tuz, yineleme) {
    var ham = await w.subtle.importKey('raw', new TextEncoder().encode(parola.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return w.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: tuz, iterations: yineleme },
      ham, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Doğrulanmış başlık alanları AES-GCM ek veri (AAD) olarak bağlanır: başlıkla oynanırsa çözme başarısız olur.
  function aad(surum, yineleme) { return new TextEncoder().encode(TUR + '|' + surum + '|' + yineleme); }

  // kural: kural nesnesi (anahtar kelime içermez; içerse bile disaAktar beyaz listesi onu atar). Dönüş: JSON metni.
  async function sifrele(kural, parola, secenek) {
    secenek = secenek || {};
    parolaDenetle(parola);
    var w = webCrypto(secenek.crypto), yineleme = secenek.yineleme || YINELEME;
    if (yineleme < YINELEME_MIN) throw hata('yineleme', 'Yineleme sayısı en az ' + YINELEME_MIN + ' olmalı.');
    var duz = new TextEncoder().encode(K.disaAktar(kural));
    var tuz = w.getRandomValues(new Uint8Array(16)), iv = w.getRandomValues(new Uint8Array(12));
    var anahtar = await anahtarTuret(w, parola, tuz, yineleme);
    var sifreli = new Uint8Array(await w.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(SURUM, yineleme) }, anahtar, duz));
    return JSON.stringify({
      surum: SURUM, tur: TUR, kdf: 'PBKDF2-SHA256', yineleme: yineleme, sifre: 'AES-256-GCM',
      tuz: b64(tuz), iv: b64(iv), veri: b64(sifreli)
    }, null, 2) + '\n';
  }

  // Dönüş: K.iceAktar sonucu { kural, uyarilar }. Yanlış parola ya da bozuk dosya: kodlu hata.
  async function coz(metin, parola, secenek) {
    secenek = secenek || {};
    if (typeof metin !== 'string' || metin.length > DOSYA_MAKS) throw hata('bozuk', 'Yedek dosyası çok büyük ya da okunamadı.');
    var o;
    try { o = JSON.parse(metin); } catch (e) { throw hata('bozuk', 'Dosya geçerli bir JSON değil.'); }
    if (!o || typeof o !== 'object' || o.tur !== TUR) throw hata('bozuk', 'Dosya bir TAARKOD kural yedeği değil.');
    if (o.surum !== SURUM) throw hata('surum', 'Yedek sürümü desteklenmiyor: ' + String(o.surum).slice(0, 10));
    if (o.kdf !== 'PBKDF2-SHA256' || o.sifre !== 'AES-256-GCM') throw hata('bozuk', 'Yedek şifreleme türü desteklenmiyor.');
    if (!Number.isInteger(o.yineleme) || o.yineleme < YINELEME_MIN || o.yineleme > YINELEME_MAKS) throw hata('yineleme', 'Yedekteki yineleme sayısı kabul edilen aralıkta değil.');
    var tuz = b64Coz(o.tuz), iv = b64Coz(o.iv), veri = b64Coz(o.veri);
    if (tuz.length !== 16 || iv.length !== 12 || veri.length < 17) throw hata('bozuk', 'Yedek dosyası bozuk.');
    if (typeof parola !== 'string' || parola === '') throw hata('parola-kisa', 'Parola gerekli.');
    var w = webCrypto(secenek.crypto), duz;
    try {
      var anahtar = await anahtarTuret(w, parola, tuz, o.yineleme);
      duz = await w.subtle.decrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(o.surum, o.yineleme) }, anahtar, veri);
    } catch (e) { throw hata('parola', 'Parola yanlış ya da yedek dosyası değiştirilmiş.'); }
    return K.iceAktar(new TextDecoder().decode(duz));
  }

  return { SURUM: SURUM, TUR: TUR, YINELEME: YINELEME, YINELEME_MIN: YINELEME_MIN, PAROLA_MIN: PAROLA_MIN, sifrele: sifrele, coz: coz };
});
