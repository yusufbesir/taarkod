'use strict';
// Tür profili: tek kaynak tablo, alan durumları, balon metinleri, GS1 Luhn kilidi, yöntem kısıtı.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../src/kural.js');
const Y = require('../src/yontemler.js');
const EN = require('../src/dil_en.js');
const Dil = require('../src/dil.js');

const sablon = fs.readFileSync(path.join(__dirname, '../src/sablon.html'), 'utf8');
const betik = sablon.slice(sablon.lastIndexOf('<script>'));
const TURLER = ['ean13', 'ean8', 'upca', 'itf14', 'code128', 'code39', 'code93', 'qr', 'datamatrix'];
const GS1 = { ean13: 13, ean8: 8, upca: 12, itf14: 14 };

test('profil tablosu: dokuz tür var ve STANDARTLAR ile aynı kümedir', () => {
  assert.deepStrictEqual(K.TUR_PROFILI_ID.slice().sort(), TURLER.slice().sort());
  assert.deepStrictEqual(K.STANDARTLAR.slice().sort(), TURLER.slice().sort());
  TURLER.forEach((t) => {
    const p = K.turProfili(t);
    assert.strictEqual(p.id, t);
    assert.ok(['rakam', 'buyukHarfRakam', 'ascii', 'metin'].includes(p.karakter), t);
    assert.ok(['gs1', 'luhn'].includes(p.kontrol), t);
    assert.ok(p.yontemler.length > 0, t);
  });
  assert.throws(() => K.turProfili('bilinmeyen'), /Bilinmeyen/);
  assert.throws(() => K.turProfili('__proto__'), /Bilinmeyen/);
});

test('profil: GS1 türleri sabit uzunluk, yalnız rakam, GS1 kontrol hanesi zorunlu', () => {
  Object.keys(GS1).forEach((t) => {
    const p = K.turProfili(t);
    assert.deepStrictEqual(p.uzunluk, { tur: 'sabit', deger: GS1[t] });
    assert.strictEqual(p.karakter, 'rakam');
    assert.strictEqual(p.kontrol, 'gs1');
    assert.strictEqual(p.kontrolZorunlu, true);
    assert.strictEqual(K.GS1_UZUNLUK[t], GS1[t]);
  });
});

test('profil: diğer türler aralık uzunluk, Luhn isteğe bağlı; karakter kümeleri', () => {
  ['code128', 'code39', 'code93', 'qr', 'datamatrix'].forEach((t) => {
    const p = K.turProfili(t);
    assert.strictEqual(p.uzunluk.tur, 'aralik');
    assert.strictEqual(p.uzunluk.min, 3); assert.strictEqual(p.uzunluk.max, 30);
    assert.strictEqual(p.kontrol, 'luhn'); assert.strictEqual(p.kontrolZorunlu, false);
    assert.strictEqual(K.GS1_UZUNLUK[t], undefined);
  });
  assert.strictEqual(K.turProfili('code39').karakter, 'buyukHarfRakam');
  assert.strictEqual(K.turProfili('code93').karakter, 'buyukHarfRakam');
  assert.strictEqual(K.turProfili('code128').karakter, 'ascii');
});

test('profil: varsayılan önekler ON_AYAR_ONEK ve turOnAyari ile tutarlı', () => {
  const beklenen = { ean13: '869', ean8: '86', upca: '0', itf14: '1869', code128: 'TO', code39: 'TO', code93: 'TO', qr: 'TO', datamatrix: 'TO' };
  TURLER.forEach((t) => {
    assert.strictEqual(K.turProfili(t).onek, beklenen[t], t);
    assert.strictEqual(K.ON_AYAR_ONEK[t], beklenen[t], t);
    assert.strictEqual(K.turOnAyari('code128', t, 'TO').onAyar, beklenen[t], t);
  });
});

test('profil: kopya döner, tabloyu dışarıdan değiştirmek mümkün değil', () => {
  const p = K.turProfili('ean13');
  p.uzunluk.deger = 99; p.alanlar.luhn = 'serbest'; p.yontemler.length = 0;
  const q = K.turProfili('ean13');
  assert.strictEqual(q.uzunluk.deger, 13); assert.strictEqual(q.alanlar.luhn, 'kilitli'); assert.strictEqual(q.yontemler.length, 3);
});

test('alanDurumu: GS1 türlerinde Luhn kilitli ve açık; uzunluk alanları anlamsız', () => {
  Object.keys(GS1).forEach((t) => ['otomatik', 'elle'].forEach((mod) => {
    const d = K.alanDurumu(t, mod, false);
    assert.deepStrictEqual(d.luhn, { devre: true, deger: true }, t); // kapalı gelse bile açık
    assert.strictEqual(d.uzunlukModu.devre, true);
    assert.strictEqual(d.uzunluk.devre, true);
    assert.strictEqual(d.direnc.devre, true);
  }));
});

test('alanDurumu: diğer türlerde Luhn serbest, uzunluk yalnız elle, direnç yalnız otomatik', () => {
  ['code128', 'code39', 'code93', 'qr', 'datamatrix'].forEach((t) => {
    assert.deepStrictEqual(K.alanDurumu(t, 'otomatik', false).luhn, { devre: false, deger: false });
    assert.deepStrictEqual(K.alanDurumu(t, 'otomatik', true).luhn, { devre: false, deger: true });
    const o = K.alanDurumu(t, 'otomatik', true), e = K.alanDurumu(t, 'elle', true);
    assert.strictEqual(o.uzunlukModu.devre, false);
    assert.strictEqual(o.uzunluk.devre, true); assert.strictEqual(o.direnc.devre, false);
    assert.strictEqual(e.uzunluk.devre, false); assert.strictEqual(e.direnc.devre, true);
  });
});

test('GS1 Luhn kilidi: kural temizleme luhn=false gelse de açar; uzunlukBelirle sabit toplamı verir', () => {
  Object.keys(GS1).forEach((t) => {
    assert.strictEqual(K.kuralTemizle({ standart: t, onek: K.ON_AYAR_ONEK[t], luhn: false }).kural.luhn, true);
    const b = K.uzunlukBelirle({ standart: t, onek: K.ON_AYAR_ONEK[t], bas: 1, son: 10 });
    assert.strictEqual(K.ON_AYAR_ONEK[t].length + b.toplamRakam, GS1[t]);
  });
});

test('yöntem kısıtı: her türde bilinen üç yöntem izinli, bilinmeyen/izinsiz engellenir', () => {
  const idler = Y.YONTEMLER.map((y) => y.id);
  TURLER.forEach((t) => {
    assert.deepStrictEqual(K.turProfili(t).yontemler.slice().sort(), idler.slice().sort(), t);
    idler.forEach((y) => assert.strictEqual(K.yontemIzinliMi(t, y), true, t + '/' + y));
    assert.strictEqual(K.yontemIzinliMi(t, 'aes'), false);
    assert.strictEqual(K.yontemIzinliMi(t, '__proto__'), false);
  });
  assert.strictEqual(K.yontemIzinliMi('bilinmeyen', 'feistel'), false);
  assert.strictEqual(K.yontemIzinliMi('ean13', undefined), false);
  // üretim hattı da kontrol eder (kuralTemizle bilinmeyen yöntemi zaten varsayılana indirir)
  assert.ok(K.calismaKurali({ standart: 'ean13', onek: '869', yontem: 'dogrusal', bas: 1, son: 5, seriAdi: 'S' }, 'kelime').calisma);
  assert.ok(/yontemIzinliMi\(k\.standart, k\.yontem\)/.test(fs.readFileSync(path.join(__dirname, '../src/kural.js'), 'utf8')));
});

test('önek nedeni: onekTureUygunMu ile tutarlı, neden metni dolu', () => {
  const ornek = ['', '869', '0', 'AB', 'ab', 'TO', 'AB-1', '12345', '123456', '12345678', '1234567890'];
  TURLER.forEach((t) => ornek.forEach((o) => {
    const uygun = K.onekTureUygunMu(t, o), neden = K.onekNedeni(t, o);
    assert.strictEqual(uygun, neden === '', t + ' "' + o + '" ' + neden);
  }));
  assert.match(K.onekNedeni('ean13', 'AB'), /yalnızca rakam/);
  assert.match(K.onekNedeni('ean8', '123456'), /en çok 5 hane/);
});

test('arayüz: tür değişiminde alanlar profil kaynağından (alanDurumu) uygulanır', () => {
  const g = betik.slice(betik.indexOf('function guncelle()'), betik.indexOf('function gorunumDurum()'));
  assert.match(g, /K\.alanDurumu\(/);
  assert.match(g, /\$\('luhn'\)\.disabled=ad\.luhn\.devre/);
  assert.match(g, /\$\('uzunluk'\)\.disabled=ad\.uzunluk\.devre/);
  assert.match(g, /\$\('direnc'\)\.disabled=ad\.direnc\.devre/);
  assert.match(g, /yontemKisit\(\)/);
  assert.ok(!/K\.GS1_UZUNLUK\[\$\('standart'\)\.value\]/.test(g.slice(0, 700)), 'alan durumu artık GS1 tablosuna doğrudan bakmaz');
});

test('arayüz: izinsiz yöntem kartı devre dışı + neden; seçili izinsizse ilk izinliye geçer; güvenli yazım', () => {
  const f = betik.slice(betik.indexOf('function yontemKisit()'), betik.indexOf('function yontemSecili()'));
  assert.match(f, /K\.yontemIzinliMi\(/);
  assert.match(f, /r\.disabled=!izin/);
  assert.match(f, /yontemNeden/);
  assert.match(f, /textContent=T\('y\.izinsiz'/);
  assert.match(f, /K\.turProfili\(st\)\.yontemler\[0\]/);
  assert.ok(!/innerHTML|eval\(|fetch\(/.test(f));
});

test('arayüz: tür değişiminde başka türün önek/alanı taşınmaz; geri yüklenen/ön ayar notu görünür', () => {
  assert.doesNotMatch(betik, /K\.onekNedeni\(yeni,onceki\)/, 'eski önek artık yeni türe taşınmaz (tür başına ayrı değer)');
  assert.match(betik, /T\('on\.geri'/);
  assert.ok(EN.m['on.geri'] && EN.m['y.izinsiz']);
  // geçersiz önek yazılırsa mevcut doğrulama yolu (uzunlukBelirle -> hataKural) çalışır
  assert.match(K.onekNedeni('ean13', 'AB'), /yalnızca rakam/);
});

const BALON_ANAHTAR = ['ip.kar.rakam', 'ip.kar.buyuk', 'ip.kar.ascii', 'ip.kar.metin', 'ip.tur.sabit', 'ip.tur.aralik', 'ip.kontrol.gs1', 'ip.kontrol.luhn', 'ip.ut.sabit', 'ip.ut.aralik', 'ip.yt.hepsi', 'ip.yt.kisit', 'on.geri', 'y.izinsiz'];

test('balon: profilden üretilen metinler her alan için çağrılır, Türkçe metni kodda, EN sözlükte, yer tutucular aynı', () => {
  assert.match(betik, /ipucuYaz\('onek',ipucuOnek\(st\)\.concat\(\[ipucuKarakter\(st\)\]\)\)/);
  assert.match(betik, /ipucuTurOzet\(st\)\]\)/);
  assert.match(betik, /ipucuKontrol\(st\)\]\)/);
  assert.match(betik, /ipucuUzunlukTur\(st\)\]\)/);
  assert.match(betik, /ipucuYontemTur\(st\)\]\)/);
  BALON_ANAHTAR.forEach((k) => {
    assert.ok(EN.m[k], 'EN yok: ' + k);
    const m = new RegExp("T\\('" + k.replace(/\./g, '\\.') + "','([^']*)'").exec(betik);
    assert.ok(m, 'Türkçe metin yok: ' + k);
    const yer = (s) => (s.match(/\{\d+\}/g) || []).sort().join(',');
    assert.strictEqual(yer(m[1]), yer(EN.m[k]), 'yer tutucu farkı: ' + k);
    // balon metni kısa: en çok 2 cümle (son noktalama dahil)
    if (k.startsWith('ip.')) assert.ok((m[1].match(/[.!?](?:\s+[A-ZÇĞİÖŞÜ]|$)/g) || []).length <= 2, k);
  });
});

test('balon: her tür için profil metinleri üretilir (boş değil) ve EN çeviri biçimlenir', () => {
  const dil = Dil.olustur(null, ['en']);
  assert.strictEqual(dil.dil(), 'en');
  TURLER.forEach((t) => {
    const p = K.turProfili(t);
    const anahtarlar = [p.karakter === 'rakam' ? 'ip.kar.rakam' : p.karakter === 'buyukHarfRakam' ? 'ip.kar.buyuk' : p.karakter === 'ascii' ? 'ip.kar.ascii' : 'ip.kar.metin',
      p.uzunluk.tur === 'sabit' ? 'ip.tur.sabit' : 'ip.tur.aralik', p.kontrolZorunlu ? 'ip.kontrol.gs1' : 'ip.kontrol.luhn',
      p.uzunluk.tur === 'sabit' ? 'ip.ut.sabit' : 'ip.ut.aralik', 'ip.yt.hepsi'];
    anahtarlar.forEach((k) => {
      const a = k === 'ip.tur.sabit' ? [p.uzunluk.deger, p.onek] : k === 'ip.tur.aralik' ? [p.uzunluk.min, p.uzunluk.max, p.onek] : k === 'ip.ut.sabit' ? [p.uzunluk.deger] : [p.uzunluk.min, p.uzunluk.max];
      const s = dil.t.apply(null, [k, 'x'].concat(a));
      assert.ok(s.length > 20 && !/\{\d\}/.test(s), t + ' ' + k + ': ' + s);
    });
  });
});

test('EN: yeni önek neden hata iletileri çevrilir', () => {
  assert.match(Dil.hataCevirEN(K.onekNedeni('ean13', 'AB')), /^In a 13-digit GS1 type the prefix can only consist of digits\.$/);
  assert.match(Dil.hataCevirEN(K.onekNedeni('ean8', '123456')), /^Because the total is 8 digits, the prefix can be at most 5 digits/);
});
