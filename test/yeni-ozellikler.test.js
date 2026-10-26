// Çift basım uyarısı (gecmis.js), ürün profilleri (profil.js), etiket tasarımcısı (etiket.js + donustur.js)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Gecmis = require('../src/gecmis.js');
const Profil = require('../src/profil.js');
const Et = require('../src/etiket.js');
const D = require('../src/donustur.js');
const K = require('../src/kural.js');

const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');

function bellekDepo() {
  const m = {};
  return { m, getItem: (a) => (a in m ? m[a] : null), setItem: (a, v) => { m[a] = String(v); }, removeItem: (a) => { delete m[a]; } };
}
const kayit = (seri, bas, son, tarih) => ({ tarih: tarih || '2026-01-01T10:00:00.000Z', seriAdi: seri, bas, son, standart: 'code128', uzunluk: 12 });

// ---------- 1) çift basım: saf çakışma hesabı ----------
test('cakisma: aralık kesişimi ve sayılar kodla hesaplanır (sınırlar dahil)', () => {
  const l = [kayit('A', 1, 100), kayit('A', 101, 200), kayit('B', 1, 100), kayit('A', 500, 600)];
  let c = Gecmis.cakisma(l, 'A', 50, 150);
  assert.strictEqual(c.length, 2);
  assert.deepStrictEqual([c[0].kesisimBas, c[0].kesisimSon, c[0].kesisimAdet], [50, 100, 51]);
  assert.deepStrictEqual([c[1].kesisimBas, c[1].kesisimSon, c[1].kesisimAdet], [101, 150, 50]);
  assert.strictEqual(Gecmis.cakisma(l, 'A', 100, 100).length, 1); // tek nokta kesişimi
  assert.strictEqual(Gecmis.cakisma(l, 'A', 201, 499).length, 0); // bitişik ama kesişmiyor
  assert.strictEqual(Gecmis.cakisma(l, 'A', 200, 200)[0].kesisimAdet, 1);
  assert.strictEqual(Gecmis.cakisma(l, 'C', 1, 1000).length, 0); // farklı seri
  assert.strictEqual(Gecmis.cakisma(l, 'A', 1, 1000).length, 3);
});

test('cakisma: geçersiz girdi boş liste verir, istisna fırlatmaz', () => {
  assert.deepStrictEqual(Gecmis.cakisma(null, 'A', 1, 2), []);
  assert.deepStrictEqual(Gecmis.cakisma([kayit('A', 1, 5)], 'A', 5, 1), []);
  assert.deepStrictEqual(Gecmis.cakisma([kayit('A', 1, 5)], 'A', 1.5, 2), []);
  assert.deepStrictEqual(Gecmis.cakisma([kayit('A', 1, 5)], 7, 1, 2), []);
  assert.deepStrictEqual(Gecmis.cakisma([null, {}, 'x'], 'A', 1, 2), []);
});

test('cakisma: geçmiş örneği üzerinden, en yeni kayıt önde; yeni üretim kendisiyle çakışır', () => {
  const g = Gecmis.olustur(bellekDepo());
  assert.strictEqual(g.cakisma('S', 1, 10).length, 0);
  g.ekle({ seriAdi: 'S', bas: 1, son: 10, standart: 'code128', uzunluk: 12, tarih: '2026-02-01T00:00:00.000Z' });
  g.ekle({ seriAdi: 'S', bas: 5, son: 20, standart: 'qr', uzunluk: 12, tarih: '2026-03-01T00:00:00.000Z' });
  const c = g.cakisma('S', 8, 9);
  assert.strictEqual(c.length, 2);
  assert.strictEqual(c[0].kayit.tarih, '2026-03-01T00:00:00.000Z');
  assert.strictEqual(g.cakisma('S', 21, 30).length, 0);
  assert.strictEqual(g.cakisma('T', 1, 30).length, 0);
});

// ---------- 2) profiller ----------
const KURAL = Object.assign(K.varsayilan(), { onek: 'AB', bas: 10, son: 500, seriAdi: 'Ürün-2', yontem: 'feistel', luhn: false, standart: 'qr', uzunlukModu: 'elle', uzunluk: 14 });

test('profil: kaydet/al/listele/sil gidiş-dönüşü, aynı ad güncellenir', () => {
  const p = Profil.olustur(bellekDepo());
  p.kaydet('Çay 100g', KURAL);
  assert.deepStrictEqual(p.al('Çay 100g').kural, Object.fromEntries(Profil.ALANLAR.map((a) => [a, KURAL[a]])));
  p.kaydet('Çay 100g', Object.assign({}, KURAL, { son: 900 }));
  assert.strictEqual(p.listele().length, 1);
  assert.strictEqual(p.al('Çay 100g').kural.son, 900);
  assert.strictEqual(p.sil('Çay 100g'), true);
  assert.strictEqual(p.sil('Çay 100g'), false);
  assert.deepStrictEqual(p.listele(), []);
});

test('profil: anahtar kelime hiçbir yere (depo, dışa aktarma) yazılmaz', () => {
  const depo = bellekDepo(), p = Profil.olustur(depo);
  const calisma = K.calismaKurali(K.varsayilan(), 'gizlikelime').calisma; // kelime alanı taşıyan çalışma kuralı
  const kirli = Object.assign({}, KURAL, { kelime: 'gizlikelime', anahtarKelime: 'gizlikelime', calisma: calisma });
  p.kaydet('P1', kirli);
  const ham = JSON.stringify(depo.m) + p.disaAktar();
  assert.ok(!/gizlikelime/.test(ham));
  assert.ok(!/kelime/i.test(ham));
  assert.deepStrictEqual(Object.keys(p.al('P1').kural).sort(), Profil.ALANLAR.slice().sort());
  // dosyadan gelen kelime alanı da atılır
  const r = p.iceAktar(JSON.stringify({ tur: 'taarkod-profil', profiller: [{ ad: 'P2', kural: Object.assign({}, KURAL, { kelime: 'gizlikelime' }), kelime: 'gizlikelime' }] }));
  assert.strictEqual(r.eklenen, 1);
  assert.ok(!/gizlikelime/.test(JSON.stringify(depo.m) + p.disaAktar()));
});

test('profil: ad beyaz listesi (en çok 40 karakter) ve geçersiz kural reddedilir', () => {
  const p = Profil.olustur(bellekDepo());
  ['', '   ', 'a'.repeat(41), 'x<b>', 'ad;drop', 'a\nb', 5, null].forEach((ad) => assert.throws(() => p.kaydet(ad, KURAL), /Profil geçersiz/, String(ad)));
  p.kaydet('a'.repeat(40), KURAL);
  p.kaydet('  Boşluklu ad  ', KURAL);
  assert.ok(p.al('Boşluklu ad'));
  assert.throws(() => p.kaydet('X', Object.assign({}, KURAL, { standart: 'upc99' })), /Profil geçersiz/);
  assert.throws(() => p.kaydet('X', Object.assign({}, KURAL, { bas: 10, son: 5 })), /Profil geçersiz/);
  const eksik = Object.assign({}, KURAL); delete eksik.yontem;
  assert.throws(() => p.kaydet('X', eksik), /Profil geçersiz/);
  p.kaydet('__proto__', KURAL); // dizi tabanlı depo: özel ad sorun çıkarmaz
  assert.ok(p.al('__proto__'));
  assert.strictEqual({}.kural, undefined);
});

test('profil: en çok 30 profil', () => {
  const p = Profil.olustur(bellekDepo());
  for (let i = 0; i < 30; i++) p.kaydet('P' + i, KURAL);
  assert.throws(() => p.kaydet('P30', KURAL), /En fazla 30 profil/);
  p.kaydet('P3', Object.assign({}, KURAL, { son: 77 })); // mevcut ad güncellenebilir
  assert.strictEqual(p.listele().length, 30);
  const r = p.iceAktar(JSON.stringify({ tur: 'taarkod-profil', profiller: [{ ad: 'Yeni', kural: KURAL }] }));
  assert.deepStrictEqual(r, { eklenen: 0, atlanan: 1 });
});

test('profil: JSON içe aktarma tüm alanları doğrular, bilinmeyen alanları atar', () => {
  const dis = Profil.olustur(bellekDepo());
  dis.kaydet('Gecerli', KURAL);
  const dosya = JSON.parse(dis.disaAktar());
  assert.strictEqual(dosya.tur, 'taarkod-profil');
  const iyi = dosya.profiller[0];
  const ham = {
    tur: 'taarkod-profil',
    profiller: [
      Object.assign({}, iyi, { fazla: 'x', kural: Object.assign({}, iyi.kural, { bilinmeyen: 1 }) }),
      { ad: 'Kotu1', kural: Object.assign({}, iyi.kural, { uzunluk: 99 }) },
      { ad: 'Kotu2', kural: Object.assign({}, iyi.kural, { onek: '<script>' }) },
      { ad: 'Kotu3', kural: Object.assign({}, iyi.kural, { luhn: 'evet' }) },
      { ad: 'Kotu4', kural: 'x' },
      { ad: 'a'.repeat(50), kural: iyi.kural },
      'bozuk', null
    ]
  };
  const p = Profil.olustur(bellekDepo());
  const r = p.iceAktar(JSON.stringify(ham));
  assert.deepStrictEqual(r, { eklenen: 1, atlanan: 7 });
  const k = p.listele()[0];
  assert.deepStrictEqual(Object.keys(k).sort(), ['ad', 'kural']);
  assert.deepStrictEqual(Object.keys(k.kural).sort(), Profil.ALANLAR.slice().sort());
  assert.throws(() => p.iceAktar('{'), /JSON/);
  assert.throws(() => p.iceAktar('{"a":1}'), /profil dosyası/);
  assert.throws(() => p.iceAktar('x'.repeat(200001)), /çok büyük/);
  // gidiş-dönüş
  const q = Profil.olustur(bellekDepo()); q.iceAktar(dis.disaAktar());
  assert.deepStrictEqual(q.listele(), dis.listele());
});

test('profil: localStorage hata verirse bellek yedeği; bozuk depo verisi güvenli', () => {
  const bozuk = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const p = Profil.olustur(bozuk);
  p.kaydet('Bellek', KURAL);
  assert.strictEqual(p.al('Bellek').kural.onek, 'AB');
  const depo = bellekDepo(); depo.m[Profil.ANAHTAR] = '[{"ad":"X","kural":{"onek":1}},5,null]';
  assert.deepStrictEqual(Profil.olustur(depo).listele(), []);
  depo.m[Profil.ANAHTAR] = 'bozuk{';
  assert.deepStrictEqual(Profil.olustur(depo).listele(), []);
  assert.strictEqual(Profil.olustur(null).kalici(), false);
});

// ---------- 3) etiket tasarımcısı ----------
const S50 = Et.sablonBul('50x30'), S100 = Et.sablonBul('100x50');

test('girdiTemizle: denetim karakterleri, uzunluk ve seçenek beyaz listesi', () => {
  const g = Et.girdiTemizle({ urun: '  Ürün\n\tadı\u0000  ', ek: 'x'.repeat(200), boyut: 'dev', hiza: 'xx' });
  assert.strictEqual(g.urun, 'Ürün adı');
  assert.strictEqual(g.ek.length, 80);
  assert.strictEqual(g.boyut, 'orta');
  assert.strictEqual(g.hiza, 'orta');
  assert.strictEqual(Et.girdiTemizle({ urun: 'a'.repeat(100) }).urun.length, 60);
  assert.deepStrictEqual(Et.girdiTemizle(null), { urun: '', ek: '', boyut: 'orta', hiza: 'orta' });
});

function sigiyor(d, sb, kenar, blokOrani) {
  const W = sb.genis - 2 * kenar, Y = sb.yuk - 2 * kenar;
  d.satirlar.forEach((r) => {
    assert.ok(Array.from(r.metin).length * r.yaziMm * 0.62 <= W + 1e-6, 'genişlik taştı: ' + r.metin);
    assert.ok(r.yaziMm >= 1.6 - 1e-9);
  });
  assert.ok(d.yukMm <= Y * blokOrani + 1e-6, 'yükseklik taştı: ' + d.yukMm);
}

test('sığma: 50x30 ve 100x50 ekran düzeni uzun metinde küçülür/kısalır, taşmaz', () => {
  const uzun = 'Çok uzun bir ürün adı: Kırmızı Biberli Zeytinyağlı Soğuk Sıkım 5 Litre Teneke'.repeat(2);
  [S50, S100].forEach((sb) => {
    ['kucuk', 'orta', 'buyuk'].forEach((boyut) => {
      const d = Et.ekranDuzeni(sb, { urun: uzun, ek: uzun, boyut }, true);
      assert.ok(d.satirlar.length >= 1);
      sigiyor(d, sb, 1.2, 0.5);
    });
  });
  const kisa = Et.ekranDuzeni(S50, { urun: 'Çay', boyut: 'orta' }, false);
  assert.strictEqual(kisa.satirlar[0].metin, 'Çay');
  assert.strictEqual(kisa.satirlar[0].yaziMm, 2.8);
  assert.strictEqual(kisa.satirlar[0].kuculdu, false);
  const orta = Et.ekranDuzeni(S50, { urun: 'Biraz uzun ürün adı burada', boyut: 'buyuk' }, false);
  assert.strictEqual(orta.satirlar[0].kuculdu, true);
  assert.strictEqual(orta.satirlar[0].kisaldi, false);
  const cok = Et.ekranDuzeni(S50, { urun: uzun }, false);
  assert.strictEqual(cok.satirlar[0].kisaldi, true);
  assert.ok(cok.satirlar[0].metin.endsWith('\u2026'));
  assert.strictEqual(Et.ekranDuzeni(S50, {}, false).satirlar.length, 0);
});

test('sığma: çok küçük etikette yükseklik yetmezse son satırlar düşer', () => {
  const d = Et.metinDuzeni(40, 8, { urun: 'A', ek: 'B' }, { kenarMm: 1.2, blokOrani: 0.5 });
  assert.ok(d.gizlenen >= 1);
  assert.ok(d.yukMm <= (8 - 2.4) * 0.5 + 1e-6);
});

test('yaziciMetinDuzeni: nokta düzeni sınırlar içinde; ZPL/TSPL dile göre kaçışlanır', () => {
  [S50, S100].forEach((sb) => ['zpl', 'tspl'].forEach((dil) => [203, 300].forEach((dpi) => {
    const uzun = 'Ürün ^~ "adı" \\ çok uzun uzun uzun uzun uzun uzun uzun uzun uzun uzun'.repeat(2);
    const d = Et.yaziciMetinDuzeni(sb, dpi, { urun: uzun, ek: uzun, boyut: 'buyuk', hiza: 'sag' }, dil);
    const W = Et.mmNokta(sb.genis, dpi) - 2 * Et.mmNokta(Et.KENAR_MM, dpi), Y = Et.mmNokta(sb.yuk, dpi);
    assert.ok(d.satirlar.length >= 1);
    d.satirlar.forEach((r) => {
      assert.ok(r.metin.length * r.w <= W + 1, `${dil} ${dpi} genişlik: ${r.metin.length}*${r.w} > ${W}`);
      assert.ok(r.x >= 0 && r.x + r.metin.length * r.w <= Et.mmNokta(sb.genis, dpi) + 1);
      assert.ok(/^[\x20-\x7E]+$/.test(r.metin));
      if (dil === 'zpl') assert.ok(!/[\^~]/.test(r.metin));
      else assert.ok(!/["'\\]/.test(r.metin));
    });
    assert.ok(d.ustYuk < Y * 0.5, 'metin bloğu etiketin yarısını aşmamalı');
  })));
  assert.throws(() => Et.yaziciMetinDuzeni(S50, 150, {}, 'zpl'), /dpi/);
  assert.throws(() => Et.yaziciMetinDuzeni(S50, 203, {}, 'pcl'), /zpl ya da tspl/);
  assert.deepStrictEqual(Et.yaziciMetinDuzeni(S50, 203, {}, 'zpl'), { satirlar: [], ustYuk: 0, gizlenen: 0 });
});

test('yaziciSecenek: ustYuk barkod yüksekliğini azaltır, parametresiz davranış aynı', () => {
  const a = Et.yaziciSecenek(S50, 203, 'code128', 100), b = Et.yaziciSecenek(S50, 203, 'code128', 100, 60);
  assert.ok(b.cubukYuksekligi < a.cubukYuksekligi);
  assert.deepStrictEqual(Et.yaziciSecenek(S50, 203, 'code128', 100, 0), a);
});

// minimal geçerli dosya başlıkları
const PNG = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]).toString('base64');
const JPG = 'data:image/jpeg;base64,' + Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10]).toString('base64');
const SVG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64');

test('logoUriGecerli: yalnızca PNG/JPEG/SVG base64 data URI, imza ve 200 KB sınırı', () => {
  [PNG, JPG, SVG].forEach((u) => assert.strictEqual(Et.logoUriGecerli(u), true));
  assert.strictEqual(Et.logoUriGecerli('data:image/gif;base64,R0lGODlh'), false);
  assert.strictEqual(Et.logoUriGecerli('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.strictEqual(Et.logoUriGecerli('javascript:alert(1)'), false);
  assert.strictEqual(Et.logoUriGecerli('http://x/y.png'), false);
  assert.strictEqual(Et.logoUriGecerli(PNG.replace('image/png', 'image/jpeg')), false); // tür/imza uyuşmuyor
  assert.strictEqual(Et.logoUriGecerli('data:image/png;base64,' + Buffer.from('not a png file').toString('base64')), false);
  assert.strictEqual(Et.logoUriGecerli('data:image/svg+xml;base64,' + Buffer.from('<html></html>').toString('base64')), false);
  assert.strictEqual(Et.logoUriGecerli('data:image/png;utf8,abc'), false);
  assert.strictEqual(Et.logoUriGecerli(PNG + '"onerror="x'), false);
  assert.strictEqual(Et.logoUriGecerli(null), false);
  const sinir = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 0]), Buffer.alloc(Et.LOGO_MAKS_BAYT - 8)]);
  assert.strictEqual(Et.logoUriGecerli('data:image/png;base64,' + sinir.toString('base64')), true);
  assert.strictEqual(Et.logoUriGecerli('data:image/png;base64,' + Buffer.concat([sinir, Buffer.from([1])]).toString('base64')), false);
});

// ---------- ZPL / TSPL çıktısı ----------
const SATIR = [{ sira: '1', seri: 'S', barkod: 'TO123456' }];

test('ZPL: etiket metni ^FD ile girer; ^ ve ~ temizlenir, Türkçe ASCII olur', () => {
  const md = Et.yaziciMetinDuzeni(S50, 203, { urun: 'Çay ^XZ~DG Şeker', ek: '2026-10 Parti', hiza: 'orta' }, 'zpl');
  const c = D.donustur('zpl', SATIR, { standart: 'code128', etiketGenisligi: 406, etiketYuksekligi: 244, etiketMetin: md });
  assert.match(c, /\^FD(Cay XZDG Seker)\^FS/);
  assert.match(c, /\^FD2026-10 Parti\^FS/);
  assert.match(c, /\^FB\d+,1,0,C,0/);
  // yalnızca üretilen komutlar: kullanıcı metninden ^ ya da ~ sızmaz
  const fdler = c.match(/\^FD[^^]*\^FS/g);
  assert.strictEqual(fdler.length, 3); // 2 metin + barkod
  assert.ok(!/~/.test(c));
  assert.strictEqual((c.match(/\^XA/g) || []).length, 1);
  assert.strictEqual((c.match(/\^XZ/g) || []).length, 1);
  // barkod metnin altına kayar
  const bo = /\^FO(\d+),(\d+)\^BC/.exec(c);
  assert.ok(Number(bo[2]) >= md.ustYuk);
});

test('ZPL: doğrudan verilen kötü metin donustur içinde yeniden temizlenir', () => {
  const em = { ustYuk: 40, satirlar: [{ metin: '^XA^FO0,0^FDhack~JA\u0001é', x: 10, y: 10, h: 99999, w: -4, genis: 300, hiza: 'Z' }, { metin: '^~', x: 0, y: 0 }] };
  const c = D.donustur('zpl', SATIR, { standart: 'code128', etiketMetin: em });
  assert.ok(c.includes('^FDXAFO0,0FDhackJA^FS'), c);
  assert.strictEqual((c.match(/\^FD/g) || []).length, 2); // ikinci satır boşaldı, atlandı
  assert.ok(!/\^A0N,99999/.test(c));
  assert.throws(() => D.donustur('zpl', SATIR, { standart: 'code128', etiketMetin: 'x' }), /etiketMetin/);
});

test('TSPL: TEXT komutu; tırnak ve ters bölü temizlenir, bozulma olmaz', () => {
  const md = Et.yaziciMetinDuzeni(S50, 203, { urun: 'Ürün "özel" \\ \'x\'', ek: 'Parti: 7', hiza: 'sol' }, 'tspl');
  const c = D.donustur('tspl', SATIR, { standart: 'code128', etiketGenisMm: 50, etiketYuksekMm: 30, etiketMetin: md });
  const satirlar = c.split('\r\n').filter((x) => x.startsWith('TEXT '));
  assert.strictEqual(satirlar.length, 2);
  assert.match(satirlar[0], /^TEXT \d+,\d+,"\d",0,1,1,"Urun ozel x"$/);
  assert.match(satirlar[1], /"Parti: 7"$/);
  satirlar.forEach((l) => assert.strictEqual((l.match(/"/g) || []).length, 4));
  assert.ok(c.indexOf('TEXT') < c.indexOf('BARCODE'));
  assert.strictEqual((c.match(/PRINT 1,1/g) || []).length, 1);
});

test('ZPL/TSPL: metin yoksa çıktı eskisiyle birebir aynı; logo çıktıya girmez', () => {
  const z = D.donustur('zpl', SATIR, { standart: 'code128', etiketGenisligi: 406, etiketYuksekligi: 244 });
  assert.strictEqual(z, '^XA^PW406^LL244^FO30,30^BCN,100,Y,N,N^FDTO123456^FS^XZ\n');
  const zo = D.donustur('zpl', SATIR, { standart: 'code128', etiketGenisligi: 406, etiketYuksekligi: 244, etiketMetin: { satirlar: [], ustYuk: 0 } });
  assert.strictEqual(zo, z);
  const t = D.donustur('tspl', SATIR, { standart: 'qr' });
  assert.ok(!/TEXT/.test(t));
  // logo seçeneği (data URI) verilse bile ZPL/TSPL çıktısında yer almaz
  ['zpl', 'tspl'].forEach((b) => assert.ok(!/data:image|base64/.test(D.donustur(b, SATIR, { standart: 'code128', logo: PNG }))));
});

// ---------- arayüz bağlantıları ----------
test('arayüz: yeni öğeler var, innerHTML yok, profil/çift basım/etiket kodu anahtar kelimeye dokunmaz', () => {
  ['profKaydet', 'profYukle', 'profSil', 'profDisa', 'profIce', 'profListe', 'profAd', 'ciftUyari', 'cift1', 'cift3', 'ciftDosya',
    'etUrun', 'etEk', 'etBoyut', 'etHiza', 'etLogoSec', 'etLogoDosya', 'etLogoKaldir'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
  assert.ok(!/innerHTML|insertAdjacentHTML|document\.write/.test(sablon));
  const bas = sablon.indexOf('*/', sablon.indexOf('ürün profilleri (anahtar kelime YOK')), son = sablon.indexOf('Etiket sayfası: şablonlar');
  assert.ok(bas > 0 && son > bas);
  const profilKod = sablon.slice(bas, son).replace(/Anahtar kelime profilde yoktur[^']*/g, '');
  assert.ok(!/kelime|\$\('kelime'\)/i.test(profilKod.replace(/\/\*.*?\*\//g, '')), 'profil kodu kelimeye dokunmamalı');
  const ciftKod = sablon.slice(sablon.indexOf('çift basım uyarısı: aynı seri'), sablon.indexOf('function gecmisYaz()'));
  assert.ok(!/\$\('kelime'\)|kelimeAlan/.test(ciftKod));
  // yalnızca tercih ('0'/'1') saklanır
  assert.match(ciftKod, /tercihDepo\.yaz\(CIFT_ANAHTAR,this\.checked\?'1':'0'\)/);
  assert.match(sablon, /img-src data:/);
  const html = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  assert.ok(html.includes('BarkodProfil'));
});

test('build: profil.js parça listesinde, kural.js ve depo.js sonrasında', () => {
  const b = fs.readFileSync(path.join(kok, 'build.js'), 'utf8');
  const sira = ['depo.js', 'kural.js', 'profil.js'].map((f) => b.indexOf("'" + f + "'"));
  assert.ok(sira.every((i) => i >= 0));
  assert.ok(sira[0] < sira[2]);
  assert.ok(b.indexOf("'kural.js'") < b.indexOf("'profil.js'"));
  assert.ok(b.indexOf("'donustur.js'") < b.indexOf("'etiket.js'"));
});
