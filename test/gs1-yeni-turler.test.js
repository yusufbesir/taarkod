'use strict';
// EAN-8 ve UPC-A: Üret/Kurallar hattında GS1 modu; tür değişince önek ön ayarı; mavi ünlem balonu arayüz yapısı.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../src/barkod.js');
const K = require('../src/kural.js');
const Y = require('../src/yontemler.js');
const Dogrula = require('../src/dogrula.js');
const Gecmis = require('../src/gecmis.js');
const EN = require('../src/dil_en.js');
const Dil = require('../src/dil.js');

const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src/sablon.html'), 'utf8');
const betik = sablon.slice(sablon.lastIndexOf('<script>'));

const kural = (std, onek, yontem, ek) => K.calismaKurali(Object.assign({ onek, standart: std, luhn: false, yontem: yontem || 'feistel', bas: 1, son: 1000, seriAdi: 'S' }, ek || {}), 'anahtarkelime').calisma;
const rnd = (() => { let a = 12345; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

test('EAN-8 / UPC-A: kural sabitleri ve standart listesi', () => {
  assert.strictEqual(K.GS1_UZUNLUK.ean8, 8);
  assert.strictEqual(K.GS1_UZUNLUK.upca, 12);
  assert.ok(K.STANDARTLAR.includes('ean8') && K.STANDARTLAR.includes('upca'));
  assert.deepStrictEqual(B.standartlarGs1.map((x) => x.id), ['ean13', 'ean8', 'upca', 'itf14']);
  B.standartlarGs1.forEach((x) => assert.strictEqual(x.sabitUzunluk, K.GS1_UZUNLUK[x.id]));
  assert.strictEqual(K.uzunlukBelirle({ onek: '86', standart: 'ean8', bas: 1, son: 100 }).toplamRakam, 6);
  assert.strictEqual(K.uzunlukBelirle({ onek: '0', standart: 'upca', bas: 1, son: 100 }).toplamRakam, 11);
  assert.strictEqual(K.uzunlukBelirle({ onek: '86', standart: 'ean8', bas: 1, son: 100 }).yukRakam, 5);
  // geçmiş kaydı yeni türleri kabul eder
  ['ean8', 'upca'].forEach((std) => assert.ok(Gecmis.kayitTemizle({ tarih: '2026-01-01T00:00:00Z', seriAdi: 'S', bas: 1, son: 5, standart: std, uzunluk: 8 })));
  // kural dosyası yeni türleri korur, luhn her zaman açık
  const r = K.kuralTemizle({ standart: 'upca', onek: '0', luhn: false });
  assert.strictEqual(r.kural.standart, 'upca'); assert.strictEqual(r.kural.luhn, true);
});

[['ean8', '86', 8], ['ean8', '', 8], ['ean8', '8', 8], ['upca', '0', 12], ['upca', '', 12], ['upca', '12345', 12]].forEach(([std, onek, uzun]) => {
  test('gidiş-dönüş: ' + std + ' önek "' + onek + '" yüzlerce rastgele sıra no, her yöntem', () => {
    const yuk = uzun - onek.length - 1, kap = 9 * Math.pow(10, yuk - 1) - 1;
    Y.YONTEMLER.forEach((y) => {
      const c = kural(std, onek, y.id, { son: Math.min(kap, 1000000) });
      const ust = Math.min(kap, 1000000), goruldu = new Set();
      for (let i = 0; i < 150; i++) {
        const n = i === 0 ? 0 : i === 1 ? ust : 1 + Math.floor(rnd() * ust);
        const m = K.barkodMetni(n, c);
        assert.strictEqual(m.length, uzun);
        assert.ok(m.startsWith(onek) && /^\d+$/.test(m));
        assert.notStrictEqual(m.charAt(onek.length), '0'); // şifreli kısmın ilk rakamı 1-9
        assert.strictEqual(String(B.gs1Sagla(m.slice(0, -1))), m.slice(-1));
        assert.doesNotThrow(() => B.kodla(std, m));
        const r = K.coz(m, c);
        assert.strictEqual(r.gecerli, true, r.neden);
        assert.strictEqual(r.sira, n);
        goruldu.add(n + ':' + m);
      }
      assert.ok(goruldu.size > 100);
    });
  });
});

test('EAN-8 / UPC-A: bire bir eşleme (aynı sıra no farklı kod vermez, farklı sıra no aynı kodu vermez)', () => {
  const c = kural('ean8', '86', 'feistel', { son: 5000 }), s = new Set();
  for (let n = 1; n <= 3000; n++) s.add(K.barkodMetni(n, c));
  assert.strictEqual(s.size, 3000);
  const c2 = kural('upca', '0', 'dogrusal', { son: 5000 }), s2 = new Set();
  for (let n = 1; n <= 3000; n++) s2.add(K.barkodMetni(n, c2));
  assert.strictEqual(s2.size, 3000);
});

test('EAN-8 / UPC-A: SVG üretimi ve bilinen modül sayıları', () => {
  const c = kural('ean8', '86'), m = K.barkodMetni(7, c);
  assert.strictEqual(B.kodla('ean8', m).modulSayisi, 67);
  assert.match(B.svg('ean8', m), /^<svg /);
  const c2 = kural('upca', '0'), m2 = K.barkodMetni(7, c2);
  assert.strictEqual(B.kodla('upca', m2).modulSayisi, 95);
  assert.match(B.svg('upca', m2), /^<svg /);
  assert.strictEqual(K.standartUygunMu(c).uygun, true);
  assert.strictEqual(K.standartUygunMu(c2).uygun, true);
});

test('EAN-8 / UPC-A: çözme ve doğrulama hataları', () => {
  ['ean8', 'upca'].forEach((std) => {
    const c = kural(std, std === 'ean8' ? '86' : '0');
    const m = K.barkodMetni(5, c), kotu = m.slice(0, -1) + ((Number(m.slice(-1)) + 1) % 10);
    const r = K.coz(kotu, c);
    assert.strictEqual(r.gecerli, false); assert.match(r.neden, /GS1 kontrol rakamı/);
    assert.strictEqual(K.coz(m.slice(1), c).gecerli, false);
    const d = Dogrula.denetle([{ satir: 1, deger: m }, { satir: 2, deger: kotu }, { satir: 3, deger: m }, { satir: 4, deger: 'X' + m }], c, {});
    assert.strictEqual(d.ozet.gecerli, 1);
    assert.strictEqual(d.ozet.luhn, 1); // GS1 kontrol rakamı 'luhn' sınıfında sayılır
    assert.strictEqual(d.ozet.yinelenen, 1);
    assert.strictEqual(d.ozet.onek + d.ozet.bicim, 1);
  });
});

test('kural doğrulama hataları: harfli/uzun önek, sığmayan sıra no, bozuk GS1 kuralı', () => {
  assert.throws(() => K.uzunlukBelirle({ onek: 'TO', standart: 'ean8', bas: 1, son: 10 }), /EAN-13, EAN-8, UPC-A ve ITF-14 önekinde yalnızca rakam/);
  assert.throws(() => K.uzunlukBelirle({ onek: 'A', standart: 'upca', bas: 1, son: 10 }), /yalnızca rakam/);
  assert.throws(() => K.uzunlukBelirle({ onek: '123456', standart: 'ean8', bas: 1, son: 10 }), /Önek çok uzun: EAN-8 toplam 8 rakamdır/);
  assert.strictEqual(K.uzunlukBelirle({ onek: '12345', standart: 'ean8', bas: 1, son: 9 }).yukRakam, 2);
  assert.throws(() => K.uzunlukBelirle({ onek: '86', standart: 'ean8', bas: 1, son: 90000 }), /sığmıyor/);
  assert.doesNotThrow(() => K.uzunlukBelirle({ onek: '86', standart: 'ean8', bas: 1, son: 89999 }));
  assert.throws(() => K.uzunlukBelirle({ onek: '0123456789'.slice(0, 8), standart: 'upca', bas: 1, son: 1e9 }), /sığmıyor/);
  assert.throws(() => K.barkodMetni(1, { onek: '86', standart: 'ean8', luhn: true, yontem: 'feistel', toplamRakam: 7, kelime: 'a' }), /GS1 kuralı geçersiz/);
  assert.throws(() => K.barkodMetni(1, { onek: '86', standart: 'upca', luhn: true, yontem: 'feistel', toplamRakam: 6, kelime: 'a' }), /GS1 kuralı geçersiz/);
  // İngilizce hata çevirisi
  const d = Dil.olustur(null, ['en']);
  assert.match(d.hata('Seçilen standart bu önekle kullanılamaz: EAN-13, EAN-8, UPC-A ve ITF-14 önekinde yalnızca rakam olabilir.'), /digits only/);
  assert.match(d.hata('Önek çok uzun: EAN-8 toplam 8 rakamdır; şifreli sıra numarasına en az 2 rakam kalmalı.'), /^Prefix too long: EAN-8 has 8 digits/);
});

test('tür ön ayarı: önek tablosu', () => {
  assert.deepStrictEqual(K.ON_AYAR_ONEK, { code128: 'TO', code39: 'TO', code93: 'TO', qr: 'TO', datamatrix: 'TO', ean13: '869', ean8: '86', upca: '0', itf14: '1869' });
  K.STANDARTLAR.forEach((s) => assert.ok(K.ON_AYAR_ONEK[s] !== undefined, s));
  // her ön ayar kendi türünde geçerli bir kural verir
  K.STANDARTLAR.forEach((s) => assert.doesNotThrow(() => K.uzunlukBelirle({ onek: K.ON_AYAR_ONEK[s], standart: s, bas: 1, son: 100 }), s));
});

test('tür ön ayarı: ön ayardaki önek yeni türün ön ayarına geçer', () => {
  const r = K.turOnAyari('code128', 'ean13', 'TO');
  assert.deepStrictEqual(r, { onek: '869', degisti: true, korundu: false, onAyar: '869', toplam: 13 });
  assert.strictEqual(K.turOnAyari('ean13', 'itf14', '869').onek, '1869');
  assert.strictEqual(K.turOnAyari('itf14', 'ean8', '1869').onek, '86');
  assert.strictEqual(K.turOnAyari('ean8', 'upca', '86').onek, '0');
  assert.strictEqual(K.turOnAyari('upca', 'code39', '0').onek, 'TO');
  assert.strictEqual(K.turOnAyari('code39', 'qr', 'TO').degisti, false);
  assert.strictEqual(K.turOnAyari('qr', 'datamatrix', 'TO').onek, 'TO');
  assert.strictEqual(K.turOnAyari('ean13', 'code128', '869').toplam, 0);
  assert.strictEqual(K.turOnAyari('code128', 'upca', 'TO').toplam, 12);
});

test('tür ön ayarı: elle yazılan geçerli önek korunur, geçersizse ön ayara geçilir', () => {
  assert.deepStrictEqual(K.turOnAyari('code128', 'ean13', '123'), { onek: '123', degisti: false, korundu: true, onAyar: '869', toplam: 13 });
  assert.strictEqual(K.turOnAyari('code128', 'ean13', 'AB').onek, '869'); // harfli: GS1'de geçersiz
  assert.strictEqual(K.turOnAyari('code128', 'code39', 'AB-1').onek, 'AB-1'); // Code 39 için geçerli
  assert.strictEqual(K.turOnAyari('code128', 'code39', 'ab').onek, 'TO'); // küçük harf Code 39'da yok
  assert.strictEqual(K.turOnAyari('ean13', 'code128', '12345').onek, '12345'); // elle rakamlı önek Code 128'de de geçerli
  assert.strictEqual(K.turOnAyari('code128', 'ean8', '123456').onek, '86'); // çok uzun: şifreli kısma 2 rakam kalmaz
  assert.strictEqual(K.turOnAyari('code128', 'ean8', '12345').onek, '12345'); // tam sınır: 8-5-1 = 2 şifreli rakam
  assert.strictEqual(K.turOnAyari('code128', 'upca', '123456789012'.slice(0, 8)).onek, '12345678'); // 12-8-1 = 3
  assert.strictEqual(K.turOnAyari('code128', 'ean13', '').onek, ''); // boş önek elle seçilmiştir ve GS1'de geçerlidir
  assert.strictEqual(K.turOnAyari('ean13', 'ean8', '869').onek, '86'); // 869 ean13'ün ön ayarı: elle değil
  assert.strictEqual(K.turOnAyari('ean13', 'ean8', '1234').onek, '1234');
  assert.strictEqual(K.turOnAyari('ean13', 'ean13', '869').degisti, false);
  assert.strictEqual(K.turOnAyari('code128', 'ean13', 'TO').korundu, false);
  assert.throws(() => K.turOnAyari('code128', 'bilinmeyen', 'TO'), /Bilinmeyen/);
  assert.strictEqual(K.turOnAyari('code128', 'ean13', undefined).onek, '869');
});

test('arayüz: ön ayar yalnız tür seçiminde (turSecildi) uygulanır; kuralaYaz/dosya/geçmiş/varsayılan yolları uygulamaz', () => {
  assert.strictEqual((betik.match(/K\.turOnAyari\(/g) || []).length, 1);
  const a = betik.indexOf('function turSecildi()');
  assert.ok(betik.slice(a, a + 400).includes('K.turOnAyari('));
  const ky = betik.slice(betik.indexOf('function kuralaYaz('), betik.indexOf('/* ---------- uzunluk paneli'));
  assert.ok(!/turOnAyari|turSecildi/.test(ky));
  assert.match(betik, /\$\('standart'\)\.addEventListener\('change',turSecildi\)/);
  assert.match(betik, /\$\('standartUret'\)\.addEventListener\('change',function\(\)\{\$\('standart'\)\.value=this\.value;turSecildi\(\)\}\)/);
  // genel input/change dinleyicisi standart'ı artık dinlemez (ön ayarı atlamasın)
  assert.ok(!/\['onek','standart','luhn'/.test(betik));
  // varsayılana dön, dosya yükleme, geçmiş ve profil kuralaYaz üzerinden geçer
  assert.match(betik, /\$\('varsayilan'\)\.onclick=function\(\)\{kuralaYaz\(K\.varsayilan\(\)\)/);
  assert.ok(betik.slice(betik.indexOf('function kuralaYaz('), betik.indexOf('function kuralaYaz(') + 160).includes("sonOnAyar=null;$('onAyarNot').textContent=''"));
  // canlı bölgeye not: durum (aria-live) ve görünür not
  assert.match(sablon, /<div id="durum" class="tamam" role="status" aria-live="polite">/);
  assert.match(sablon, /<p class="not" id="onAyarNot"><\/p>/);
  assert.match(betik, /var n=onAyarMetni\(\);\$\('onAyarNot'\)\.textContent=n;durum\(n\)/);
  assert.match(betik, /dilYenile[\s\S]*\$\('onAyarNot'\)\.textContent=onAyarMetni\(\)/); // dil değişince not yeniden yazılır
  ['on.gs1', 'on.std', 'on.bos', 'on.geri'].forEach((k) => assert.ok(EN.m[k], k));
  assert.match(EN.m['on.gs1'], /^Rules adjusted for \{0\}: prefix \{1\}, \{2\} digits in total \(check digit included\)\.$/);
});

test('mavi ünlem balonu: bileşen yapısı, erişilebilirlik ve güvenlik', () => {
  const bilesen = betik.slice(betik.indexOf('function ipucuKur('), betik.indexOf('function ipucuOnek('));
  assert.ok(bilesen.length > 500);
  assert.match(bilesen, /d\.type='button'/);
  assert.match(bilesen, /d\.textContent='!'/);
  assert.match(bilesen, /setAttribute\('aria-label',T\('ip\.aria','Açıklama'\)\)/);
  assert.match(bilesen, /setAttribute\('aria-describedby',id\)/);
  assert.match(bilesen, /setAttribute\('role','tooltip'\)/);
  assert.match(bilesen, /addEventListener\('mouseenter'/);
  assert.match(bilesen, /addEventListener\('focus'/);
  assert.match(bilesen, /addEventListener\('click'/);
  assert.match(bilesen, /e\.key==='Escape'/);
  assert.match(bilesen, /document\.addEventListener\('click'/);
  assert.match(bilesen, /Math\.max\(8,Math\.min\(/); // ekran dışına taşmaz
  assert.match(bilesen, /s\.textContent=p/); // içerik yalnız textContent
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|fetch\(/.test(bilesen));
  assert.match(sablon, /default-src 'none'/);
  // CSS: mavi daire, kontrast belirteçleri her iki temada, dar ekranda taşmaz
  assert.match(sablon, /\.ipucuDugme\{[^}]*border-radius:50%/);
  assert.match(sablon, /--bilgi:#1550B8;--bilgiYazi:#FFFFFF/);
  assert.strictEqual((sablon.match(/--bilgi:#8DB8FF;--bilgiYazi:#0B1B33/g) || []).length, 2); // sistem koyu + elle koyu tema
  assert.match(sablon, /\.ipucuBalon\{[^}]*max-width:min\(22rem,calc\(100vw - 16px\)\)/);
  assert.match(sablon, /\.ipucuBalon\[hidden\]\{display:none\}/);
});

test('mavi ünlem balonu: istenen tüm alanların yanında, etiketin dışında (erişilebilir ad bozulmaz)', () => {
  const adlar = ['onek', 'standart', 'luhn', 'seri', 'bas', 'son', 'uzunluk', 'direnc', 'toplam', 'yontem', 'sakla'];
  adlar.forEach((a) => {
    assert.strictEqual((sablon.match(new RegExp('data-ipucu="' + a + '"', 'g')) || []).length, 1, a);
    assert.match(betik, new RegExp("ipucuYaz\\('" + a + "'"), a);
  });
  // yer tutucu <label>, <h3> ya da <legend> içine girmez
  assert.ok(!/<(label|h3)\b[^>]*>[^<]*<span class="ipucuYer"/.test(sablon));
  assert.ok(!/<label[^>]*>(?:(?!<\/label>)[\s\S])*data-ipucu/.test(sablon));
  // satır altı "not" paragrafları balona taşındı; uyarı kutusu (.sabit) görünür kaldı
  assert.ok(!sablon.includes('id="standartNot"'));
  assert.ok(!sablon.includes('<p class="not">Tahmin direnci:'));
  assert.match(sablon, /<div class="sabit">Dikkat: Harf karıştırma/);
  // her türe özel önek metni var ve türler birbirinden ayrışır
  const onekAnahtar = ['ip.onek.ean13', 'ip.onek.ean8', 'ip.onek.upca', 'ip.onek.itf14', 'ip.onek.c39', 'ip.onek.qr', 'ip.onek.dm', 'ip.onek.c128'];
  onekAnahtar.forEach((k) => { assert.ok(betik.includes("T('" + k + "'"), k); assert.ok(EN.m[k], 'EN ' + k); });
  assert.match(EN.m['ip.aria'], /^Explanation$/);
  // EAN-13 metni istenen bilgileri içerir
  assert.match(betik, /869, Türkiye’ye ayrılmış GS1 önekidir/);
  assert.match(betik, /Önek \+ şifreli rakamlar \+ 1 kontrol hanesi = 13 hane/);
});

test('arayüz: Barkod türü listesinde EAN-8 ve UPC-A, EN karşılıkları var', () => {
  assert.match(sablon, /<option value="ean8">EAN-8 \(GS1, küçük ürün\)<\/option>/);
  assert.match(sablon, /<option value="upca">UPC-A \(GS1, Kuzey Amerika\)<\/option>/);
  assert.ok(EN.s['EAN-8 (GS1, küçük ürün)'] && EN.s['UPC-A (GS1, Kuzey Amerika)']);
  const d = Dil.olustur(null, ['en']);
  B.standartlarGs1.forEach((x) => assert.ok(d.standart(x).aciklama.length > 20, x.id));
  assert.strictEqual(d.standart(B.standartlarGs1.find((x) => x.id === 'ean8')).ad, 'EAN-8');
});
