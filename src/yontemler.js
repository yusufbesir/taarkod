/* Seçilebilir şifreleme yöntemleri.
 * Kriptografik güvenlik iddiası taşımaz; amaç ardışık sıra numaralarını gizlemektir.
 * Anahtar kelime koda gömülü değildir, her çağrıda dışarıdan verilir. */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika(require('./core.js'));
  else kok.BarkodYontem = fabrika(kok.BarkodSifre);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  // ---------- SHA-256 (düz JS, senkron) ----------
  var K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  var W = new Uint32Array(64);

  // bayt dizisi (Uint8Array) -> 32 baytlık Uint8Array
  function sha256Bayt(m) {
    var uz = m.length, blok = ((uz + 9 + 63) >> 6), top = blok * 64;
    var p = new Uint8Array(top);
    p.set(m);
    p[uz] = 0x80;
    var bit = uz * 8;
    p[top - 4] = (bit >>> 24) & 255; p[top - 3] = (bit >>> 16) & 255; p[top - 2] = (bit >>> 8) & 255; p[top - 1] = bit & 255;
    // bit uzunluğunun üst 32 biti (uz < 2^29 kabul edilir; burada metinler kısa)
    sikistir(p, top);
    var o = new Uint8Array(32);
    for (var k = 0; k < 8; k++) { o[4 * k] = H[k] >>> 24; o[4 * k + 1] = (H[k] >>> 16) & 255; o[4 * k + 2] = (H[k] >>> 8) & 255; o[4 * k + 3] = H[k] & 255; }
    return o;
  }

  var H = new Uint32Array(8);
  // Hazır doldurulmuş (padding'li) tamponu sıkıştırır; sonuç H içinde kalır.
  function sikistir(p, top) {
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (var b = 0; b < top; b += 64) {
      var i;
      for (i = 0; i < 16; i++) W[i] = (p[b + 4 * i] << 24) | (p[b + 4 * i + 1] << 16) | (p[b + 4 * i + 2] << 8) | p[b + 4 * i + 3];
      for (i = 16; i < 64; i++) {
        var x = W[i - 15], y = W[i - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      var a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K256[i] + W[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + bb) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    H[0] = h0; H[1] = h1; H[2] = h2; H[3] = h3; H[4] = h4; H[5] = h5; H[6] = h6; H[7] = h7;
  }

  // Yalnızca ASCII (0-127) metin için; burada kullanılan tüm metinler ASCII'dir.
  function asciiBayt(s) {
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 127;
    return u;
  }
  function onaltili(u) {
    var s = '';
    for (var i = 0; i < u.length; i++) s += (u[i] < 16 ? '0' : '') + u[i].toString(16);
    return s;
  }
  function sha256(metin) { return onaltili(sha256Bayt(asciiBayt(String(metin)))); }

  // ---------- Ortak yardımcılar ----------
  function harfSiralari(kelime, hane) {
    Core.planOlustur(kelime, hane); // geçersiz kelime/hane için Türkçe hata
    var k = Core.kucukHarf(kelime).replace(/\s+/g, '');
    var r = [];
    for (var i = 0; i < k.length; i++) r.push(Core.ALFABE.indexOf(k[i]) + 1); // 1 tabanlı sıra no
    return r;
  }

  function us10(n) { return BigInt('1' + new Array(n + 1).join('0')); }

  function sayiBigInt(n, hane) {
    var v;
    if (typeof n === 'string') {
      if (!/^\d+$/.test(n)) throw new Error('Sıra numarası pozitif tam sayı olmalı.');
      v = BigInt(n);
    } else {
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Sıra numarası pozitif tam sayı olmalı.');
      v = BigInt(n);
    }
    if (v >= us10(hane)) throw new Error('Sıra numarası ' + hane + ' haneye sığmıyor.');
    return v;
  }

  function doldur(v, hane) {
    var s = v.toString();
    while (s.length < hane) s = '0' + s;
    return s;
  }

  function kodBigInt(kod, hane) {
    if (typeof kod !== 'string' || !/^\d+$/.test(kod) || kod.length !== hane) throw new Error('Kod tam olarak ' + hane + ' haneli rakamlardan oluşmalı.');
    return BigInt(kod);
  }

  function sonucuCevir(v) {
    var s = v.toString();
    return Number.isSafeInteger(Number(s)) ? Number(s) : s;
  }

  function haneKontrol(hane) {
    if (!(Number.isInteger(hane) && hane >= 2 && hane <= 30)) throw new Error('Hane sayısı 2 ile 30 arasında olmalı.');
  }

  // ---------- Yöntem 2: doğrusal ----------
  function genisletilmisTers(a, m) {
    var r0 = m, r1 = a % m, t0 = 0n, t1 = 1n;
    while (r1 !== 0n) {
      var q = r0 / r1, tmp = r0 - q * r1; r0 = r1; r1 = tmp;
      tmp = t0 - q * t1; t0 = t1; t1 = tmp;
    }
    if (r0 !== 1n) throw new Error('Çarpan modülle aralarında asal değil.');
    return ((t0 % m) + m) % m;
  }

  // Harf sıralarından belirlenimci rakam akışı (tohumdan LCG).
  function rakamAkisi(idx, tuz, uzunluk) {
    var MASK = (1n << 64n) - 1n, durum = BigInt(tuz) + 1n;
    for (var i = 0; i < idx.length; i++) durum = ((durum * 1000003n) + BigInt(idx[i])) & MASK;
    var s = '';
    for (var j = 0; j < uzunluk + 8; j++) {
      durum = (durum * 6364136223846793005n + 1442695040888963407n) & MASK;
      if (j >= 8) s += String(Number((durum >> 33n) % 10n)); // ilk birkaç adım atılır
    }
    return s;
  }

  var dogrusalOnbellek = {};
  function dogrusalParam(kelime, hane) {
    var idx = harfSiralari(kelime, hane);
    var anahtar = idx.join(',') + '|' + hane;
    if (dogrusalOnbellek[anahtar]) return dogrusalOnbellek[anahtar];
    var M = us10(hane);
    var a = rakamAkisi(idx, 7, hane).split('');
    a[0] = String(1 + (Number(a[0]) % 9));                // ilk hane sıfır değil: a >= 10^(hane-1)
    a[hane - 1] = String([1, 3, 7, 9][Number(a[hane - 1]) % 4]); // 10 ile aralarında asal
    var b = rakamAkisi(idx, 13, hane).split('');
    b[0] = String(1 + (Number(b[0]) % 9));                // b de büyük
    var p = { a: BigInt(a.join('')), b: BigInt(b.join('')) % M, M: M };
    p.ters = genisletilmisTers(p.a, M);
    dogrusalOnbellek[anahtar] = p;
    return p;
  }

  function dogrusalSifrele(n, kelime, hane) {
    haneKontrol(hane);
    var p = dogrusalParam(kelime, hane);
    return doldur((p.a * sayiBigInt(n, hane) + p.b) % p.M, hane);
  }
  function dogrusalCoz(kod, kelime, hane) {
    haneKontrol(hane);
    var p = dogrusalParam(kelime, hane);
    var c = kodBigInt(kod, hane);
    return sonucuCevir((((c - p.b) % p.M + p.M) * p.ters) % p.M);
  }

  // ---------- Yöntem 3: Feistel ----------
  var TUR = 8, ANAHTAR_TEKRAR = 5000;
  var feistelOnbellek = {};

  function feistelParam(kelime, hane) {
    var idx = harfSiralari(kelime, hane);
    var anahtar = idx.join(',') + '|' + hane;
    if (feistelOnbellek[anahtar]) return feistelOnbellek[anahtar];
    var metin = idx.join(',') + '|' + hane + '|feistel';
    var mb = asciiBayt(metin);
    var h = sha256Bayt(mb);
    for (var i = 0; i < ANAHTAR_TEKRAR; i++) {
      var g = new Uint8Array(32 + mb.length);
      g.set(h); g.set(mb, 32);
      h = sha256Bayt(g);
    }
    var ana = onaltili(h), solU = Math.floor(hane / 2), sagU = hane - solU;
    var p = { ana: ana, solU: solU, sagU: sagU, solM: us10(solU), sagM: us10(sagU), turAnahtar: [] };
    p.tampon = [];
    for (var t = 0; t < TUR; t++) {
      var onek = asciiBayt(ana + ':' + t + ':');
      p.tampon.push({ onek: onek, ucuk: [hazirTampon(onek, solU), hazirTampon(onek, sagU)] });
    }
    feistelOnbellek[anahtar] = p;
    return p;
  }

  // Önek + sabit uzunlukta rakamlar için önceden doldurulmuş SHA-256 tamponu.
  function hazirTampon(onek, rakamSayisi) {
    var uz = onek.length + rakamSayisi, top = ((uz + 9 + 63) >> 6) * 64, buf = new Uint8Array(top);
    buf.set(onek); buf[uz] = 0x80;
    var bit = uz * 8;
    buf[top - 2] = (bit >>> 8) & 255; buf[top - 1] = bit & 255;
    return { buf: buf, top: top, ofs: onek.length };
  }

  var HEX8 = '00000000';
  // Tur fonksiyonu: SHA-256(tur anahtarı + tur no + diğer yarının rakamları) mod 10^len
  function turFonk(p, t, yariMetin, mod) {
    var u = p.tampon[t].ucuk[mod === p.solM ? 0 : 1];
    for (var i = 0; i < yariMetin.length; i++) u.buf[u.ofs + i] = yariMetin.charCodeAt(i);
    sikistir(u.buf, u.top);
    var hx = '';
    for (var k = 0; k < 8; k++) { var w = (H[k] >>> 0).toString(16); hx += HEX8.slice(w.length) + w; }
    return BigInt('0x' + hx) % mod;
  }

  function feistelSifrele(n, kelime, hane) {
    haneKontrol(hane);
    var p = feistelParam(kelime, hane);
    var s = doldur(sayiBigInt(n, hane), hane);
    var L = BigInt(s.slice(0, p.solU)), R = BigInt(s.slice(p.solU));
    for (var t = 0; t < TUR; t++) {
      if (t % 2 === 0) L = (L + turFonk(p, t, doldur(R, p.sagU), p.solM)) % p.solM;
      else R = (R + turFonk(p, t, doldur(L, p.solU), p.sagM)) % p.sagM;
    }
    return doldur(L, p.solU) + doldur(R, p.sagU);
  }

  function feistelCoz(kod, kelime, hane) {
    haneKontrol(hane);
    var p = feistelParam(kelime, hane);
    kodBigInt(kod, hane);
    var L = BigInt(kod.slice(0, p.solU)), R = BigInt(kod.slice(p.solU));
    for (var t = TUR - 1; t >= 0; t--) {
      if (t % 2 === 0) L = ((L - turFonk(p, t, doldur(R, p.sagU), p.solM)) % p.solM + p.solM) % p.solM;
      else R = ((R - turFonk(p, t, doldur(L, p.solU), p.sagM)) % p.sagM + p.sagM) % p.sagM;
    }
    return sonucuCevir(BigInt(doldur(L, p.solU) + doldur(R, p.sagU)));
  }

  // ---------- Yöntem listesi ----------
  var YONTEMLER = [
    {
      id: 'harf-karistirma', ad: 'Harf karıştırma',
      kisa: 'Mevcut/varsayılan yöntem: anahtar kelimenin harf sırasına göre rakamları kaydırır, yerlerini değiştirir ve birbirine zincirler.',
      nasil: 'Anahtar kelimedeki harfler Türkçe alfabedeki sıralarına göre dizilir ve bu sıralama rakamların yerlerini belirleyen bir karıştırma planına dönüşür. Her rakam önce kendi konumuna göre kaydırılır, sonra yeni yerine taşınır. Ardından rakamlar soldan sağa ve sağdan sola birbirine karıştırılır; böylece tek bir rakamın değişmesi bütün koda yayılır. Her adım geri alınabildiği için doğru kelimeyle özgün sıra numarası aynen bulunur.',
      artilar: ['Çok hızlıdır.', 'Çıktı her zaman istenen hane uzunluğundadır.', 'Ardışık numaralar birbirine benzemez.'],
      eksiler: ['Rakam rakam çalıştığı için çok sayıda örnek görenin planı çözme ihtimali Feistel yöntemine göre yüksektir.', 'Matematiksel olarak sağlam bir güvenlik kanıtı yoktur.'],
      gizleme: 3, tahminDirenci: 2, hiz: 5, onerilen: false
    },
    {
      id: 'dogrusal', ad: 'Doğrusal (çarp ve ekle)',
      kisa: 'Numarayı büyük bir sayıyla çarpıp başka bir büyük sayıyı ekler; en basit ve en hızlı, ama en zayıf seçenektir.',
      nasil: 'Anahtar kelimeden iki büyük sayı türetilir: bir çarpan ve bir eklenti. Numara çarpanla çarpılır, eklenti eklenir ve sonuç hane sınırını aşınca başa sarar, tıpkı saatin 12\'den sonra 1\'e dönmesi gibi. Çarpan 10 ile aralarında asal seçildiği için iki numara hiçbir zaman aynı koda düşmez ve işlem geri alınabilir. Geri alma, çarpanın "tersini" bulan klasik bir yöntemle (genişletilmiş Öklid) yapılır.',
      artilar: ['Çok hızlıdır ve çok basittir.', 'Çıktı her zaman istenen hane uzunluğundadır.', 'Çakışma olmaz, tamamen tersinirdir.'],
      eksiler: ['Ardışık numaralar her seferinde aynı adım kadar ilerler; iki kodun farkı görülürse desen fark edilebilir.', 'Birkaç numara-kod çifti bilen biri çarpan ve eklentiyi hesaplayabilir; zayıf bir gizlemedir.', 'Ciddi bir koruma gerekiyorsa seçilmemelidir.'],
      gizleme: 1, tahminDirenci: 1, hiz: 5, onerilen: false
    },
    {
      id: 'feistel', ad: 'Feistel ağı (SHA-256 turları)',
      kisa: 'Rakam metnini iki yarıya bölüp SHA-256 ile defalarca karıştıran, biçimi koruyan en güçlü seçenek.',
      nasil: 'Kod iki yarıya bölünür. Her turda bir yarı, diğer yarının özetinden (SHA-256) çıkan bir sayıyla değiştirilir; sonra roller yer değiştirir. Tur anahtarları, anahtar kelimenin binlerce kez özetlenmesiyle üretilir; bu yüzden kelimeyi tahmin etmeye çalışmak yavaştır. Özetin kendisi geri alınamaz ama toplama işlemi geri alınabilir, dolayısıyla bütün ağ doğru kelimeyle tersine çalıştırılabilir. Tek bir numara değişince kodun hemen her hanesi değişir.',
      artilar: ['Ardışık numaraları en iyi gizleyen yöntemdir.', 'Çıktı, istenen hane uzunluğunda salt rakamdır; barkoda doğrudan uyar.', 'Kelime tahmini bilinçli olarak yavaşlatılmıştır.', 'Çakışma olmaz, tamamen tersinirdir.'],
      eksiler: ['Diğerlerinden yavaştır (yine de yüz binlerce numara birkaç saniyede üretilir).', 'Yöntemi anlamak ve denetlemek daha zordur.', 'Çok kısa hanelerde (2-4) olası kod sayısı az olduğu için gizleme sınırlıdır.'],
      gizleme: 5, tahminDirenci: 4, hiz: 3, onerilen: true
    }
  ];

  var ISLEMLER = {
    'harf-karistirma': { sifrele: function (n, k, h) { return Core.sifrele(n, k, h); }, coz: function (c, k, h) { return Core.coz(c, k, h); } },
    'dogrusal': { sifrele: dogrusalSifrele, coz: dogrusalCoz },
    'feistel': { sifrele: feistelSifrele, coz: feistelCoz }
  };

  function islem(id) {
    if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(ISLEMLER, id)) throw new Error('Bilinmeyen şifreleme yöntemi: ' + String(id));
    return ISLEMLER[id];
  }

  function sifrele(yontemId, n, kelime, hane) {
    var i = islem(yontemId);
    hane = hane === undefined ? 6 : hane;
    haneKontrol(hane);
    return i.sifrele(n, kelime, hane);
  }

  function coz(yontemId, kod, kelime, hane) {
    var i = islem(yontemId);
    hane = hane === undefined ? 6 : hane;
    haneKontrol(hane);
    return i.coz(kod, kelime, hane);
  }

  return { YONTEMLER: YONTEMLER, sifrele: sifrele, coz: coz, sha256: sha256 };
});
