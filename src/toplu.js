/* Toplu içe aktarma: CSV/TXT metninden ve XLSX dosyasından yalnızca İLK SÜTUNU okur. Saf JS; DOM ve ağ yok.
 * XLSX: basit ZIP (merkezi dizin) + sharedStrings/inlineStr okuyucu. Sıkıştırma çözümü için DecompressionStream('deflate-raw')
 * kullanılır (yoksa 'xlsx-sikistirma-yok' kodlu hata verilir; arayüz "CSV'ye çevirip yükleyin" der).
 * Hata nesneleri: { kod, neden } (kod makine okunur; neden Türkçe varsayılan metindir, arayüz çevirir). */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodToplu = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SATIR_LIMIT = 100000;           // okunacak en çok kayıt
  var DOSYA_LIMIT = 25 * 1024 * 1024; // bayt
  var ACILMIS_LIMIT = 64 * 1024 * 1024;
  var MAKS_DEGER = 200;               // tek hücrede en çok karakter (aşırı uzun satırlar hata sayılır)

  function hata(kod, neden) { var e = new Error(neden); e.kod = kod; return e; }

  // ---- CSV / TXT ----
  function ayrac(metin) {
    var say = { ';': 0, ',': 0, '\t': 0 }, ic = false, i, c;
    for (i = 0; i < metin.length && i < 20000; i++) {
      c = metin.charAt(i);
      if (c === '"') ic = !ic;
      else if (!ic) {
        if (c === '\n') break;
        if (c in say) say[c]++;
      }
    }
    var en = null, enSayi = 0;
    [';', '\t', ','].forEach(function (a) { if (say[a] > enSayi) { en = a; enSayi = say[a]; } });
    return en;
  }

  // ="TO123" (Excel metin formülü) ve baştaki kesme işaretini (CSV enjeksiyon önlemi) soyar.
  function hucreTemizle(s) {
    s = String(s).trim();
    var m = /^="(.*)"$/.exec(s);
    if (m) s = m[1].replace(/""/g, '"');
    if (/^'[=+\-@]/.test(s)) s = s.slice(1);
    return s.trim();
  }

  // Dönüş: { kayitlar: [{ satir, deger }], kesildi }  (satir: 1 tabanlı kayıt numarası; tümüyle boş kayıtlar atlanır)
  function csvIlkSutun(metin, limit) {
    limit = limit || SATIR_LIMIT;
    metin = String(metin == null ? '' : metin);
    if (metin.charCodeAt(0) === 0xFEFF) metin = metin.slice(1);
    var ay = ayrac(metin), kayitlar = [], kesildi = false;
    var i = 0, n = metin.length, kayitNo = 0;
    while (i < n) {
      kayitNo++;
      var ilk = '', ilkBitti = false, ic = false, bos = true, c;
      for (; i < n; i++) {
        c = metin.charAt(i);
        if (ic) {
          if (c === '"') { if (metin.charAt(i + 1) === '"') { if (!ilkBitti) ilk += '"'; i++; } else ic = false; }
          else if (!ilkBitti) ilk += c;
          bos = false;
          continue;
        }
        if (c === '"' && (ilkBitti || ilk === '')) { ic = true; bos = false; continue; }
        if (c === '\n' || c === '\r') { if (c === '\r' && metin.charAt(i + 1) === '\n') i++; i++; break; }
        if (ay !== null && c === ay) { ilkBitti = true; bos = false; continue; }
        if (!/\s/.test(c)) bos = false;
        if (!ilkBitti) ilk += c;
      }
      var d = hucreTemizle(ilk);
      if (bos && d === '') continue;
      if (kayitlar.length >= limit) { kesildi = true; break; }
      kayitlar.push({ satir: kayitNo, deger: d });
    }
    return { kayitlar: kayitlar, kesildi: kesildi };
  }

  // İlk kayıt rakam içermiyorsa başlık satırı sayılır ve atılır.
  function baslikAyikla(kayitlar) {
    if (kayitlar.length && !/\d/.test(kayitlar[0].deger)) return { kayitlar: kayitlar.slice(1), baslik: kayitlar[0].deger };
    return { kayitlar: kayitlar, baslik: null };
  }

  // Kayıtlardan sıra numarası listesi: yalnızca rakam (Excel'in "12.0" biçimi kabul), yinelenenler hata.
  // Dönüş: { sayilar: [{satir, sira}], hatalar: [{satir, deger, kod, neden}] }  (sira: güvenli tam sayıysa Number, değilse metin)
  function sayiListesi(kayitlar) {
    var sayilar = [], hatalar = [], gor = {};
    kayitlar.forEach(function (k) {
      var d = k.deger;
      if (d === '') { hatalar.push({ satir: k.satir, deger: d, kod: 'bos', neden: 'Boş değer.' }); return; }
      if (d.length > MAKS_DEGER) { hatalar.push({ satir: k.satir, deger: d.slice(0, 40) + '…', kod: 'cok-uzun', neden: 'Değer çok uzun.' }); return; }
      var s = d.replace(/^(\d+)\.0+$/, '$1');
      if (!/^\d+$/.test(s)) { hatalar.push({ satir: k.satir, deger: d, kod: 'sayi-degil', neden: 'Sıra numarası yalnızca rakamlardan oluşmalı.' }); return; }
      s = s.replace(/^0+(?=\d)/, '');
      if (s.length > 30) { hatalar.push({ satir: k.satir, deger: d, kod: 'cok-uzun', neden: 'Sıra numarası çok büyük.' }); return; }
      if (Object.prototype.hasOwnProperty.call(gor, s)) { hatalar.push({ satir: k.satir, deger: d, kod: 'yinelenen', ilkSatir: gor[s], neden: 'Yinelenen sıra numarası (ilk geçtiği satır ' + gor[s] + ').' }); return; }
      gor[s] = k.satir;
      sayilar.push({ satir: k.satir, sira: Number.isSafeInteger(Number(s)) ? Number(s) : s });
    });
    return { sayilar: sayilar, hatalar: hatalar };
  }

  // ---- XLSX ----
  function u16(b, i) { return b[i] | (b[i + 1] << 8); }
  function u32(b, i) { return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0; }

  // Dönüş: { ad -> { yontem, sikisikBoy, boy, ofset } }  (yalnızca merkezi dizin; ZIP64 ve şifreli girdiler desteklenmez)
  function zipDizin(b) {
    var eocd = -1, i;
    for (i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
      if (b[i] === 0x50 && b[i + 1] === 0x4B && b[i + 2] === 5 && b[i + 3] === 6) { eocd = i; break; }
    }
    if (eocd < 0) throw hata('xlsx-bozuk', 'Dosya geçerli bir XLSX (ZIP) değil.');
    var adet = u16(b, eocd + 10), basla = u32(b, eocd + 16);
    if (adet === 0xFFFF || basla === 0xFFFFFFFF) throw hata('xlsx-zip64', 'ZIP64 biçimi desteklenmiyor; dosyayı CSV olarak kaydedip yükleyin.');
    var dizin = Object.create(null), p = basla, dec = new TextDecoder('utf-8');
    for (i = 0; i < adet; i++) {
      if (p + 46 > b.length || u32(b, p) !== 0x02014B50) throw hata('xlsx-bozuk', 'ZIP dizini bozuk.');
      var bayrak = u16(b, p + 8), yontem = u16(b, p + 10), sik = u32(b, p + 20), boy = u32(b, p + 24);
      var ad = u16(b, p + 28), ek = u16(b, p + 30), yorum = u16(b, p + 32), ofset = u32(b, p + 42);
      var isim = dec.decode(b.subarray(p + 46, p + 46 + ad));
      if (bayrak & 1) throw hata('xlsx-sifreli', 'Parola korumalı XLSX dosyaları desteklenmiyor.');
      dizin[isim] = { yontem: yontem, sikisikBoy: sik, boy: boy, ofset: ofset };
      p += 46 + ad + ek + yorum;
    }
    return dizin;
  }

  async function varsayilanInflate(bayt) {
    if (typeof DecompressionStream === 'undefined') {
      throw hata('xlsx-sikistirma-yok', 'Bu tarayıcı sıkıştırılmış XLSX dosyasını açamıyor; dosyayı CSV olarak kaydedip yükleyin.');
    }
    var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
    w.write(bayt).then(function () { return w.close(); }).catch(function () { /* okuyucu hatayı görür */ });
    var r = ds.readable.getReader(), parcalar = [], toplam = 0;
    for (;;) {
      var x = await r.read();
      if (x.done) break;
      toplam += x.value.length;
      if (toplam > ACILMIS_LIMIT) { try { await r.cancel(); } catch (e) { /* yok say */ } throw hata('xlsx-buyuk', 'XLSX içeriği çok büyük.'); }
      parcalar.push(x.value);
    }
    var out = new Uint8Array(toplam), q = 0;
    parcalar.forEach(function (c) { out.set(c, q); q += c.length; });
    return out;
  }

  async function girdiOku(b, dizin, ad, inflate) {
    var g = dizin[ad];
    if (!g) return null;
    var p = g.ofset;
    if (p + 30 > b.length || u32(b, p) !== 0x04034B50) throw hata('xlsx-bozuk', 'ZIP girdisi bozuk.');
    var bas = p + 30 + u16(b, p + 26) + u16(b, p + 28);
    if (g.boy > ACILMIS_LIMIT) throw hata('xlsx-buyuk', 'XLSX içeriği çok büyük.');
    var ham = b.subarray(bas, bas + g.sikisikBoy);
    if (g.yontem === 0) return ham;
    if (g.yontem !== 8) throw hata('xlsx-yontem', 'Desteklenmeyen ZIP sıkıştırma yöntemi.');
    return inflate(ham);
  }

  var VARLIK = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  function xmlCoz(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, k) {
      if (k.charAt(0) === '#') {
        var n = k.charAt(1) === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
        try { return String.fromCodePoint(n); } catch (e) { return ''; }
      }
      return VARLIK[k];
    });
  }
  function tMetni(xml) { // <t ...>..</t> parçalarını birleştirir (rPh = fonetik yazı atlanır)
    var s = '', re = /<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g, m;
    xml = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
    while ((m = re.exec(xml))) s += m[1] ? xmlCoz(m[1]) : '';
    return s;
  }
  function ortakMetinler(xml) {
    var liste = [], re = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g, m;
    while ((m = re.exec(xml))) liste.push(m[1] ? tMetni(m[1]) : '');
    return liste;
  }
  function oznitelik(s, ad) {
    var m = new RegExp('\\b' + ad + '="([^"]*)"').exec(s);
    return m ? xmlCoz(m[1]) : null;
  }

  async function ilkSayfaYolu(b, dizin, inflate) {
    var dec = new TextDecoder('utf-8');
    try {
      var kitap = await girdiOku(b, dizin, 'xl/workbook.xml', inflate), iliski = await girdiOku(b, dizin, 'xl/_rels/workbook.xml.rels', inflate);
      if (kitap && iliski) {
        var sh = /<sheet\b[^>]*>/.exec(dec.decode(kitap));
        var rid = sh ? oznitelik(sh[0], 'r:id') : null;
        if (rid) {
          var rx = dec.decode(iliski), re = /<Relationship\b[^>]*>/g, m;
          while ((m = re.exec(rx))) {
            if (oznitelik(m[0], 'Id') === rid) {
              var hedef = oznitelik(m[0], 'Target') || '';
              return hedef.charAt(0) === '/' ? hedef.slice(1) : 'xl/' + hedef;
            }
          }
        }
      }
    } catch (e) { if (e && e.kod && e.kod !== 'xlsx-bozuk') throw e; }
    return 'xl/worksheets/sheet1.xml';
  }

  // bayt: Uint8Array. ayar: { limit, inflate } -> { kayitlar, kesildi } (A sütunu; boş hücreli satırlar atlanır, satir = Excel satır no)
  async function xlsxIlkSutun(bayt, ayar) {
    ayar = ayar || {};
    var limit = ayar.limit || SATIR_LIMIT, inflate = ayar.inflate || varsayilanInflate;
    if (!(bayt instanceof Uint8Array)) bayt = new Uint8Array(bayt);
    if (bayt.length > DOSYA_LIMIT) throw hata('dosya-buyuk', 'Dosya çok büyük (en çok 25 MB).');
    var dizin = zipDizin(bayt), dec = new TextDecoder('utf-8');
    var yol = await ilkSayfaYolu(bayt, dizin, inflate), sayfa = await girdiOku(bayt, dizin, yol, inflate);
    if (!sayfa) throw hata('xlsx-sayfa-yok', 'XLSX içinde çalışma sayfası bulunamadı.');
    var ortak = null, ortakXml = await girdiOku(bayt, dizin, 'xl/sharedStrings.xml', inflate);
    if (ortakXml) ortak = ortakMetinler(dec.decode(ortakXml));
    var xml = dec.decode(sayfa), re = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, m, kayitlar = [], kesildi = false;
    while ((m = re.exec(xml))) {
      var r = /\br="A(\d+)"/.exec(m[1]);
      if (!r || m[2] === undefined) continue;
      var tip = oznitelik(m[1], 't'), ic = m[2], deger = '';
      if (tip === 'inlineStr') deger = tMetni(ic);
      else {
        var v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(ic);
        if (!v) continue;
        deger = xmlCoz(v[1]);
        if (tip === 's') {
          var ix = Number(deger);
          deger = ortak && ix >= 0 && ix < ortak.length ? ortak[ix] : '';
        }
      }
      deger = hucreTemizle(deger);
      if (deger === '') continue;
      if (kayitlar.length >= limit) { kesildi = true; break; }
      kayitlar.push({ satir: Number(r[1]), deger: deger });
    }
    return { kayitlar: kayitlar, kesildi: kesildi };
  }

  // ad: dosya adı. icerik: metin (csv/txt) ya da ArrayBuffer/Uint8Array (xlsx)
  function turBul(ad) {
    var m = /\.([A-Za-z0-9]+)$/.exec(String(ad || ''));
    var u = m ? m[1].toLowerCase() : '';
    return u === 'xlsx' ? 'xlsx' : (u === 'csv' || u === 'txt' || u === 'tsv') ? 'metin' : u === 'xls' ? 'xls' : 'bilinmiyor';
  }

  return {
    SATIR_LIMIT: SATIR_LIMIT, DOSYA_LIMIT: DOSYA_LIMIT, csvIlkSutun: csvIlkSutun, baslikAyikla: baslikAyikla,
    sayiListesi: sayiListesi, xlsxIlkSutun: xlsxIlkSutun, turBul: turBul, hucreTemizle: hucreTemizle
  };
});
