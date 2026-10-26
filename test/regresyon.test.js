'use strict';
// Kalıcı regresyon: mevcut türlerin (code128, code39, code93, qr, datamatrix, ean13, itf14) çıktısı 1.4.1'den beri birebir aynı kalmalı.
// Vektörler, EAN-8/UPC-A eklenmeden önce üretilip özetlenerek test/regresyon-vektor.json dosyasına kaydedildi.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const K = require('../src/kural.js');
const C = require('../src/barkod.js');
const Y = require('../src/yontemler.js');
const VEKTOR = require('./regresyon-vektor.json').vektor;

const ONEKLER = {
  code128: ['TO', 'A-1', ''], code39: ['TO', 'X1'], code93: ['TO'], qr: ['TO', 'AB'], datamatrix: ['TO'],
  ean13: ['869', '', '1'], itf14: ['1869', '']
};
const SIRA = [1, 2, 3, 7, 99, 100, 12345, 999999];

function hesapla(st, on, y, kelime, luhn, mod) {
  const k = Object.assign(K.varsayilan(), { onek: on, standart: st, yontem: y, luhn, uzunlukModu: mod, uzunluk: 14, son: 1000000 });
  const b = K.calismaKurali(k, kelime);
  const metinler = SIRA.map((n) => { try { return K.barkodMetni(n, b.calisma); } catch (e) { return 'HATA:' + e.message; } });
  let svg = ''; try { svg = C.svg(st, metinler[2]); } catch (e) { svg = 'HATA'; }
  return {
    toplam: b.belirle.toplamRakam, yuk: b.belirle.yukRakam, metinler, svgLen: svg.length,
    svgHash: crypto.createHash('sha256').update(svg).digest('hex').slice(0, 16)
  };
}

test('regresyon: mevcut 7 türün tüm sabit vektörleri (kural + kelime + sıra no) değişmedi', () => {
  let say = 0;
  for (const st of Object.keys(ONEKLER)) for (const on of ONEKLER[st]) for (const y of Y.YONTEMLER.map((x) => x.id))
    for (const kelime of ['anahtar', 'Tez Deneme 42']) for (const luhn of [true, false]) for (const mod of ['otomatik', 'elle']) {
      const anahtar = [st, on, y, kelime, luhn, mod].join('|');
      const beklenen = VEKTOR[anahtar];
      assert.ok(beklenen, 'vektör yok: ' + anahtar);
      const h = crypto.createHash('sha256').update(JSON.stringify(hesapla(st, on, y, kelime, luhn, mod))).digest('hex').slice(0, 20);
      assert.strictEqual(h, beklenen, 'çıktı değişti: ' + anahtar);
      say++;
    }
  assert.strictEqual(say, Object.keys(VEKTOR).length);
});

test('regresyon: okunur örnekler (Feistel, "anahtar", elle 14 rakam, kontrol hanesi açık)', () => {
  const beklenen = {
    code128: ['TO28034814871858', 'TO90195332959666', 'TO16232201320984'],
    code39: ['TO28034814871858', 'TO90195332959666', 'TO16232201320984'],
    code93: ['TO28034814871858', 'TO90195332959666', 'TO16232201320984'],
    qr: ['TO28034814871858', 'TO90195332959666', 'TO16232201320984'],
    datamatrix: ['TO28034814871858', 'TO90195332959666', 'TO16232201320984'],
    ean13: ['8697788497256', '8691667874664', '8697491064127'],
    itf14: ['18697788497253', '18691667874661', '18697491064124']
  };
  const onek = { code128: 'TO', code39: 'TO', code93: 'TO', qr: 'TO', datamatrix: 'TO', ean13: '869', itf14: '1869' };
  Object.keys(beklenen).forEach((st) => {
    const k = Object.assign(K.varsayilan(), { onek: onek[st], standart: st, yontem: 'feistel', luhn: true, uzunlukModu: 'elle', uzunluk: 14, son: 1000000 });
    const b = K.calismaKurali(k, 'anahtar').calisma;
    assert.deepStrictEqual([1, 2, 3].map((n) => K.barkodMetni(n, b)), beklenen[st], st);
  });
});
