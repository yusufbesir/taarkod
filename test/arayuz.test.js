const test = require('node:test');
const assert = require('node:assert');
const K = require('../src/kural.js');
const Core = require('../src/core.js');

const KELIME = 'deneme';
function calisma(ek) {
  const k = Object.assign(K.varsayilan(), ek || {});
  return K.calismaKurali(k, KELIME).calisma;
}

test('barkodMetni: önek + rakamlar + Luhn, çözme geri verir', () => {
  const c = calisma();
  const m = K.barkodMetni(5, c);
  assert.ok(m.startsWith('TO'));
  const kalan = m.slice(2);
  assert.match(kalan, /^\d+$/);
  assert.strictEqual(kalan.length, c.toplamRakam);
  assert.ok(Core.luhnGecerli(kalan));
  const r = K.coz(m, c);
  assert.strictEqual(r.gecerli, true);
  assert.strictEqual(r.sira, 5);
});

test('her yöntem ve Luhn kapalıyken gidiş-dönüş', () => {
  ['harf-karistirma', 'dogrusal', 'feistel'].forEach((y) => {
    [true, false].forEach((l) => {
      const c = calisma({ yontem: y, luhn: l });
      const m = K.barkodMetni(1234, c);
      if (!l) assert.strictEqual(m.length, 2 + c.toplamRakam);
      assert.strictEqual(K.coz(m, c).sira, 1234);
    });
  });
});

test('coz: önek, uzunluk, Luhn ve rakam hataları Türkçe neden verir', () => {
  const c = calisma();
  const m = K.barkodMetni(7, c);
  assert.match(K.coz('XX' + m.slice(2), c).neden, /önekiyle başlamıyor/);
  assert.match(K.coz(m + '1', c).neden, /rakam bekleniyordu/);
  assert.match(K.coz('TO12a4', c).neden, /yalnızca rakam/);
  const son = Number(m.slice(-1));
  const bozuk = m.slice(0, -1) + ((son + 1) % 10);
  assert.match(K.coz(bozuk, c).neden, /Luhn/);
  assert.match(K.coz('', c).neden, /boş/);
  assert.strictEqual(K.coz(bozuk, c).gecerli, false);
});

test('sığmayan sıra no hata verir', () => {
  const c = calisma({ uzunlukModu: 'elle', uzunluk: 4, son: 100 }); // 3 şifreli rakam
  assert.throws(() => K.barkodMetni(1000, c), /sığmıyor/);
});

test('uzunlukBelirle: otomatik öneri ve elle sığma denetimi', () => {
  const b = K.uzunlukBelirle(K.varsayilan());
  assert.ok(b.oneri && b.oneri.secenekler.length >= 3);
  assert.ok(b.oneri.secenekler.every((s) => typeof s.genisMm === 'number'));
  assert.ok(Math.pow(10, b.yukRakam) >= 100 * 100000);
  assert.throws(() => K.uzunlukBelirle(Object.assign(K.varsayilan(), { uzunlukModu: 'elle', uzunluk: 4, son: 5000 })), /sığmıyor/);
});

test('standartUygunMu: Code 39 küçük harfli öneki reddeder', () => {
  assert.throws(() => calisma({ standart: 'code39', onek: 'To' }), /önekle kullanılamaz/);
  const c = Object.assign({}, calisma({ standart: 'code39' }), { onek: 'To' });
  assert.strictEqual(K.standartUygunMu(c).uygun, false);
  assert.strictEqual(K.standartUygunMu(calisma({ standart: 'code39' })).uygun, true);
  assert.strictEqual(K.standartUygunMu(calisma({ onek: 'to' })).uygun, true);
});

test('disaAktar: anahtar kelime ve bilinmeyen alanlar dosyaya girmez', () => {
  const k = Object.assign(K.varsayilan(), { kelime: 'gizli', anahtar: 'gizli', x: 1 });
  const j = K.disaAktar(k);
  assert.ok(!/gizli|kelime|anahtar/.test(j));
  const o = JSON.parse(j);
  assert.deepStrictEqual(Object.keys(o).sort(), ['bas', 'luhn', 'onek', 'seriAdi', 'son', 'standart', 'surum', 'tahminDirenci', 'uzunluk', 'uzunlukModu', 'yontem'].sort());
});

test('iceAktar: sıkı doğrulama', () => {
  const r = K.iceAktar(JSON.stringify({
    onek: 'AB', standart: 'code39', yontem: 'feistel', luhn: false, bas: 10, son: 20,
    kelime: 'gizli', __proto__: { x: 1 }, uzunluk: 99, tahminDirenci: '5', seriAdi: '<b>'
  }));
  assert.strictEqual(r.kural.onek, 'AB');
  assert.strictEqual(r.kural.standart, 'code39');
  assert.strictEqual(r.kural.yontem, 'feistel');
  assert.strictEqual(r.kural.luhn, false);
  assert.strictEqual(r.kural.uzunluk, K.varsayilan().uzunluk);
  assert.strictEqual(r.kural.tahminDirenci, K.varsayilan().tahminDirenci);
  assert.strictEqual(r.kural.seriAdi, K.varsayilan().seriAdi);
  assert.ok(!('kelime' in r.kural));
  assert.ok(r.uyarilar.length >= 3);
  assert.throws(() => K.iceAktar('{bozuk'), /JSON/);
  assert.throws(() => K.iceAktar('[1]'), /geçerli bir kural/);
  assert.throws(() => K.iceAktar('x'.repeat(200000)), /büyük/);
  assert.strictEqual(K.iceAktar(JSON.stringify({ yontem: 'constructor' })).kural.yontem, 'harf-karistirma');
  assert.strictEqual(K.iceAktar(JSON.stringify({ bas: 50, son: 10 })).kural.son, 100);
});

test('yeniSeri ve seriArtir', () => {
  const y = K.yeniSeri(Object.assign(K.varsayilan(), { bas: 1, son: 100 }));
  assert.strictEqual(y.seriAdi, 'Seri-2');
  assert.strictEqual(y.bas, 101);
  assert.strictEqual(y.son, 200);
  assert.strictEqual(K.seriArtir('A09'), 'A10');
  assert.strictEqual(K.seriArtir('Parti'), 'Parti-2');
});

test('önek ve seri adı doğrulama', () => {
  assert.throws(() => K.onekDogrula('=cmd'));
  assert.throws(() => K.onekDogrula('ÇOK'));
  assert.throws(() => K.onekDogrula('123456789'));
  assert.strictEqual(K.onekDogrula(''), '');
  assert.throws(() => K.seriAdiDogrula('a;b'));
});

test('siraNoAyikla', () => {
  assert.strictEqual(K.siraNoAyikla(' 007 '), 7);
  assert.strictEqual(K.siraNoAyikla('12345678901234567890'), '12345678901234567890');
  assert.throws(() => K.siraNoAyikla('1a'));
});

// ---- Arayüz yapısı (src/sablon.html ve derleme çıktısı) ----
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const kok = path.join(__dirname, '..');
const sablon = fs.readFileSync(path.join(kok, 'src', 'sablon.html'), 'utf8');
const betik = sablon.slice(sablon.lastIndexOf('<script>'));

test('şablon: BarkodDonustur kullanılıyor, biçim seçici ve seçeneklere bağlı alanlar var', () => {
  assert.match(sablon, /BarkodDonustur/);
  assert.match(sablon, /D\.BICIMLER/);
  assert.match(sablon, /D\.parcaUret/);
  assert.match(sablon, /D\.dosyaAdi/);
  ['bicimler', 'opXl', 'opSql', 'opZpl', 'tabloAdi', 'etG', 'etY', 'kopyala', 'onizlemePre', 'hataBicim'].forEach((i) => {
    assert.ok(sablon.includes('id="' + i + '"'), 'id eksik: ' + i);
  });
  assert.match(betik, /KOPYA_LIMIT=5000/);
  assert.match(betik, /ONIZ_SATIR=8/);
});

test('şablon: eski kimlikler ve sekme yapısı korunuyor', () => {
  ['kelime', 'goster', 'onek', 'standart', 'luhn', 'seri', 'bas', 'son', 'direnc', 'uzunluk', 'yontemler', 'varsayilan',
    'disa', 'ice', 'yeniSeri', 'dosya', 'sayi', 'uret1', 'tekIndir', 'kod', 'coz', 'liste', 'iptal', 'indir', 'xl',
    'ilerleme', 'tablo', 'ornekKart', 'ornekler', 'olcek', 'yazdir', 'durum'].forEach((i) => {
    assert.ok(sablon.includes('id="' + i + '"'), 'id eksik: ' + i);
  });
  for (let i = 1; i <= 5; i++) {
    assert.match(sablon, new RegExp('id="s' + i + '"[^>]*role="tab"'));
    assert.match(sablon, new RegExp('id="p' + i + '"[^>]*role="tabpanel"'));
  }
  assert.match(sablon, /role="tablist"/);
  assert.match(betik, /ArrowDown/);
  assert.match(sablon, /id="durum"[^>]*aria-live="polite"/);
});

test('şablon: tema anahtarı var, localStorage yalnız tema tercihini yazar', () => {
  assert.match(sablon, /<select id="tema">/);
  assert.match(sablon, /value="sistem"[\s\S]*value="acik"[\s\S]*value="koyu"/);
  assert.match(betik, /prefers-color-scheme|data-tema/);
  const yazimlar = betik.match(/localStorage\.setItem\([^)]*\)/g) || [];
  assert.strictEqual(yazimlar.length, 2, 'yalnız tema ve görünüm seçimi yazılır');
  assert.ok(yazimlar.some((y) => /TEMA_ANAHTAR,v/.test(y)));
  assert.ok(yazimlar.some((y) => /GOR_ANAHTAR,JSON\.stringify\(gorSecim\)/.test(y)));
  assert.ok(!/localStorage/.test(betik.replace(/window\.localStorage\.(get|set)Item\((TEMA_ANAHTAR|GOR_ANAHTAR)[^)]*\)/g, '')), 'localStorage başka yerde kullanılıyor');
  assert.ok(!/sessionStorage|indexedDB|document\.cookie/.test(betik));
  // her localStorage erişimi try/catch içinde
  assert.match(betik, /try\{var v=window\.localStorage\.getItem/);
  assert.match(betik, /try\{window\.localStorage\.setItem/);
});

test('şablon: innerHTML/eval/ağ yok; CSP aynı', () => {
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(betik));
  assert.ok(!/\beval\s*\(|new Function|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|importScripts/.test(betik));
  assert.ok(!/(src|href)\s*=\s*["']https?:/i.test(sablon));
  assert.ok(!/@import|url\(\s*["']?https?:/i.test(sablon));
  assert.ok(sablon.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:">'));
});

test('şablon: anahtar kelime çıktılara girmiyor', () => {
  // kelime alanı yalnızca hazirla() ve canliOrnek() içinde (kural çalışma nesnesine) okunur
  const okumalar = betik.match(/\$\('kelime'\)\.value/g) || [];
  assert.strictEqual(okumalar.length, 2); // hazirla ve canliOrnek ön denetimi
  assert.ok(!/satirlar[\s\S]{0,300}kelime/.test(betik.slice(betik.indexOf('function satirlar'), betik.indexOf('function disaDurum'))));
  assert.ok(!/kelime/.test(betik.slice(betik.indexOf('function disSecenek'), betik.indexOf('function satirlar'))));
});

test('şablon: kısayollar, sürükle-bırak, azaltılmış hareket, dar ekran', () => {
  assert.match(betik, /e\.key.*toLowerCase/);
  assert.match(betik, /k==='enter'/);
  assert.match(betik, /k==='s'[\s\S]{0,80}preventDefault|preventDefault\(\);\s*\/\/ tarayıcının/);
  assert.match(sablon, /Ctrl<\/kbd>\+<kbd>S/);
  assert.match(sablon, /id="birakma"/);
  assert.match(betik, /'drop'/);
  assert.match(betik, /K\.iceAktar/);
  assert.match(sablon, /prefers-reduced-motion:reduce/);
  assert.match(sablon, /max-width:800px/);
  assert.match(sablon, /@media print/);
});

test('build: donustur.js çıktıya gömülü ve çalışır', () => {
  execFileSync(process.execPath, [path.join(kok, 'build.js')], { cwd: kok });
  const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  assert.match(cikti, /BarkodDonustur/);
  assert.match(cikti, /function parcaUret/);
  assert.ok(!cikti.includes('/*CORE*/'));
  assert.strictEqual((cikti.match(/<script>/g) || []).length, 2);
  assert.ok(cikti.includes("default-src 'none'"));
});

test('önizleme sekmesi: 6 sekme, yeni kimlikler, Liste sekmesinden sonra (ayarlar sağda)', () => {
  for (let i = 1; i <= 6; i++) {
    assert.match(sablon, new RegExp('id="s' + i + '"[^>]*role="tab"'));
    assert.match(sablon, new RegExp('id="p' + i + '"[^>]*role="tabpanel"'));
  }
  // 8 sekme (Üret, Çöz, Liste, Doğrula, Geçmiş, Yardım, Kurallar, Önizleme); Dışa aktar (p7) Liste sekmesinin 2. adımıdır, kendi sekmesi yok
  assert.strictEqual((sablon.match(/role="tab"/g) || []).length, 9);
  assert.strictEqual((sablon.match(/role="tabpanel"/g) || []).length, 10);
  assert.match(sablon, /id="s6"[^>]*aria-controls="p6"/);
  assert.match(sablon, /id="p6"[^>]*aria-labelledby="s6"/);
  const sira = [1, 2, 3, 8, 9, 10, 4, 6, 5].map((i) => sablon.indexOf('id="s' + i + '"'));
  assert.deepStrictEqual(sira.slice().sort((a, b) => a - b), sira, 'menü sırası Üret, Çöz, Liste, Doğrula, Geçmiş, Barkod türleri, Kurallar, Önizleme (çekmece), Yardım');
  assert.match(betik, /SEKME_SIRA=\[1,2,3,8,9,10,4,6,5\],CEKMECE_SEKME=\[10,4,6\]/);
  assert.match(betik, /Home[\s\S]{0,80}SEKME_SIRA\[0\]/);
  ['onizKelime', 'onizGoster', 'onizBas', 'onizAdet', 'onizYenile', 'onizTopluGit', 'onizOrnekler', 'onizSablonMetin',
    'pzStandart', 'pzBicim', 'pzUzunluk', 'pzYontem', 'canliGit', 'hataOniz'].forEach((i) => {
    assert.ok(sablon.includes('id="' + i + '"'), 'id eksik: ' + i);
  });
  assert.match(sablon, /id="onizAdet"[^>]*value="6"/);
  assert.match(betik, /sayiOku\('onizAdet','Kaç örnek',4,ONIZ_MAKS\)/);
  assert.match(betik, /ONIZ_MAKS=12/);
  assert.match(betik, /ONIZ_GECIKME=150/);
  assert.match(sablon, /Bu kurallarla toplu üretime geç/);
  assert.match(sablon, /Önizleme sekmesinde örnek barkodları görebilirsiniz/);
  assert.match(betik, /aktifSekme===6\?\$\('onizYenile'\)/); // Ctrl+Enter
  assert.match(sablon, /Önizleme açıkken\): örnek barkodları yeniler/);
});

test('önizleme sekmesi: innerHTML yok, SVG mevcut DOMParser yolundan, kelime saklanmaz', () => {
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(betik));
  const g = betik.slice(betik.indexOf('function onizYenile'), betik.indexOf("$('onizYenile').onclick"));
  assert.ok(g.length > 200);
  assert.match(g, /svgYerlestir\(/);
  assert.ok(!/localStorage|sessionStorage|clipboard|indirBlob|disaAktar|Blob/.test(g));
  assert.ok(!/kelime\)?\.value|\.kelime/.test(g.replace(/kelimeAlan\.value\)\{/, '')), 'önizleme kelimeyi yalnız boşluk denetimi için okur');
  // iki kelime alanı da parola türünde ve otomatik doldurma kapalı; ad (name) yok
  ['kelime', 'onizKelime'].forEach((i) => {
    assert.match(sablon, new RegExp('<input id="' + i + '" type="password" autocomplete="off"'));
    assert.ok(!new RegExp('<input id="' + i + '"[^>]*name=').test(sablon));
  });
  // kelime alanının değeri yalnızca hazirla/canliOrnek içinde okunur, eşleme değişkenle yapılır
  assert.strictEqual((betik.match(/\$\('kelime'\)\.value/g) || []).length, 2);
  assert.strictEqual((betik.match(/localStorage\.setItem\(/g) || []).length, 2);
  // kural dışa aktarımı ve satırlar kelime/önizleme alanlarına dokunmaz
  assert.ok(!/oniz|kelime/i.test(betik.slice(betik.indexOf('function disSecenek'), betik.indexOf('function disaDurum'))));
});

test('önizleme sekmesi: kelimesiz boş şablon, gerçek barkod yok; sağ panel bağlantısı', () => {
  assert.match(betik, /'\?'\.repeat\(b\.yukRakam\)/);
  assert.match(sablon, /Örnek üretmek için anahtar kelime girin/);
  // kelime boşken yalnızca şablon dalı çalışır ve return eder
  const g = betik.slice(betik.indexOf('function onizYenile'));
  assert.ok(g.indexOf('if(!kelimeAlan.value){') < g.indexOf('K.barkodMetni('));
  assert.match(g, /onizSablon'\)\.hidden=false;[\s\S]{0,300}return;/);
  assert.match(betik, /if\(!\$\('kelime'\)\.value\)\{\$\('canliGit'\)\.hidden=false;return\}/);
  assert.ok(!sablon.includes('Örnek barkod için anahtar kelimeyi girin.'));
  assert.match(sablon, /id="canliGit"[^>]*hidden/);
  assert.match(betik, /canliGit'\)\.onclick=function\(\)\{sekme\(6,true\)\}/);
  assert.match(g, /K\.coz\(m,h\.c\)/);
  assert.match(g, /Luhn geçerli/);
  assert.match(g, /geri çözüldü/);
});

test('önizleme sekmesi: işlevsel kontrol (sahte DOM olmadan çekirdek mantığı)', () => {
  // şablonun kullandığı çekirdek çağrıları: Luhn + geri çözme, sığmayan sıra no anlaşılır hata verir
  const c = calisma();
  const m = K.barkodMetni(3, c);
  assert.ok(require('../src/core.js').luhnGecerli(m.slice(c.onek.length)));
  assert.strictEqual(K.coz(m, c).sira, 3);
  const dar = calisma({ uzunlukModu: 'elle', uzunluk: 4, son: 100 });
  assert.throws(() => K.barkodMetni(5000, dar), /sığmıyor/);
});

test('build: çıktıda Önizleme sekmesi var', () => {
  execFileSync(process.execPath, [path.join(kok, 'build.js')], { cwd: kok });
  const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  assert.match(cikti, /id="s6"[^>]*role="tab"[^>]*>Önizleme<\/button>/);
  assert.match(cikti, /id="p6"[^>]*role="tabpanel"/);
  assert.match(cikti, /function onizYenile/);
  assert.ok(cikti.indexOf('id="s3"') < cikti.indexOf('id="s6"'));
  assert.ok(!/innerHTML/.test(cikti.slice(cikti.lastIndexOf('<script>'))));
});

// ---- Dışa aktar sekmesi (s7/p7) ----
const D = require('../src/donustur.js');
const vm = require('node:vm');
function kategoriKodu() {
  const a = betik.indexOf('/*KATEGORI_BASLA*/'), b = betik.indexOf('/*KATEGORI_BITIS*/');
  assert.ok(a > 0 && b > a);
  return betik.slice(a, b);
}
function panelMetni(n) {
  const a = sablon.indexOf('id="p' + n + '"');
  const sonra = sablon.slice(a + 5).search(/<div class="panel" id="p\d"/);
  return sablon.slice(a, sonra < 0 ? sablon.indexOf('</main>') : a + 5 + sonra);
}

test('dışa aktar adımı: Liste sekmesi p3 ve p7yi tek akışta gösterir, sekme çubuğu metin sekmeleri, dar ekranda sarar', () => {
  assert.match(sablon, /id="s3"[^>]*role="tab"[^>]*aria-controls="p3 p7"/);
  assert.match(sablon, /id="p7"[^>]*role="tabpanel"[^>]*aria-labelledby="s3"/);
  assert.ok(!sablon.includes('id="s7"'), 'Dışa aktar için ayrı sekme yok');
  const adlar = [...sablon.slice(sablon.indexOf('id="gezinme"'), sablon.indexOf('</nav>')).matchAll(/role="tab"[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  assert.deepStrictEqual(adlar, ['Üret', 'Çöz', 'Liste', 'Doğrula', 'Geçmiş', 'Barkod türleri', 'Kurallar', 'Önizleme', 'Yardım']);
  const govde = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
  assert.strictEqual((govde.match(/<svg/g) || []).length, 1, 'gövdede yalnız üst çubuk logosu SVG olabilir');
  assert.ok(!/<svg/.test(govde.replace(/<h1><svg[\s\S]*?<\/svg><span>TAARKOD<\/span><\/h1>/, '')), 'menüde ve gövdede (üst çubuk logosu dışında) simge yok');
  assert.match(sablon, /\.sekmeIc\{[^}]*flex-wrap:wrap/);
  assert.match(betik, /if\(n===7\)n=3/);
  assert.match(betik, /\$\('p7'\)\.hidden=n!==3/);
  assert.match(sablon, /<h2>1\. Listeyi üret<\/h2>[\s\S]*<h2>2\. Kaydet<\/h2>/);
});

test('dışa aktar sekmesi: p3te dışa aktarma kalmadı, p7de var', () => {
  const p3 = panelMetni(3), p7 = panelMetni(7);
  ['bicimler', 'indir', 'kopyala', 'onizlemePre', 'hataBicim', 'xl', 'tabloAdi', 'etG', 'etY', 'opSql', 'opZpl'].forEach((i) => {
    assert.ok(!p3.includes('id="' + i + '"'), 'p3te kalmış: ' + i);
    assert.ok(p7.includes('id="' + i + '"'), 'p7de yok: ' + i);
  });
  assert.ok(!/Dışa aktar<\/h2>|Canlı önizleme \(ilk 8/.test(p3));
  assert.match(p3, /id="disaGitBtn"[^>]*hidden>2\. Kaydet adımına geç/);
  assert.match(p7, /Henüz liste üretilmedi/);
  assert.match(p7, /id="topluGit"[^>]*>1\. Listeyi üret adımına git/);
  assert.match(p7, /id="disaDurumSatir"[^>]*aria-live="polite"/);
  assert.match(p7, /id="indir" disabled/);
  assert.match(p7, /id="kopyala"[^>]*disabled/);
  // çok dilli arayüz: metin T(anahtar, 'Türkçe {0}', ...) ile kurulur (Türkçe metin kodda durur)
  assert.match(betik, /T\('d\.liste','Üretilmiş liste: \{0\} satır \(\{1\}\)',uretim\.n\.length,uretim\.seri\)/);
});

test('dışa aktar sekmesi: kategori eşlemesi BICIMLER içindeki her biçimi kapsar; bilinmeyen biçim Diğer grubuna düşer', () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(kategoriKodu().replace(/\bvar /g, 'globalThis.') + ';', ctx);
  const harita = ctx.BICIM_KATEGORI;
  const gruplar = JSON.parse(JSON.stringify(ctx.kategoriGrupla(D.BICIMLER, harita)));
  assert.deepStrictEqual(gruplar.map((g) => g.ad), ['Tablo', 'Veri', 'Belge', 'Etiket']);
  assert.deepStrictEqual(gruplar.map((g) => g.bicimler.map((b) => b.id)), [
    ['csv-noktalivirgul', 'csv-virgul', 'tsv', 'xlsx'], ['json', 'jsonl', 'xml', 'sql'], ['html-tablo', 'markdown-tablo', 'txt'], ['zpl', 'tspl']]);
  assert.strictEqual(D.BICIMLER.length, 13); // 12 + TSPL (TSC)
  assert.strictEqual(gruplar.reduce((t, g) => t + g.bicimler.length, 0), D.BICIMLER.length);
  D.BICIMLER.forEach((b) => assert.ok(harita[b.id], 'eşlemede yok: ' + b.id));
  // eşlemede olmayan yeni biçim Diğer grubuna düşer, hiçbir biçim kaybolmaz; "constructor" gibi kimlikler de güvenli
  const ek = D.BICIMLER.concat([{ id: 'yeni-bicim', ad: 'Yeni', uzanti: 'yb', aciklama: 'x' }, { id: 'constructor', ad: 'C', uzanti: 'c', aciklama: 'x' }]);
  const g2 = JSON.parse(JSON.stringify(ctx.kategoriGrupla(ek, harita)));
  const diger = g2.find((g) => g.ad === 'Diğer');
  assert.deepStrictEqual(diger.bicimler.map((b) => b.id), ['yeni-bicim', 'constructor']);
  assert.strictEqual(g2.reduce((t, g) => t + g.bicimler.length, 0), ek.length);
});

test('dışa aktar sekmesi: indirme ve kopyalama yalnız seçili tek biçimi üretir', () => {
  const ind = betik.slice(betik.indexOf('function indirListe'), betik.indexOf("$('indir').onclick"));
  assert.strictEqual((ind.match(/D\.parcaUret\(/g) || []).length, 1);
  assert.strictEqual((ind.match(/indirBlob\(/g) || []).length, 1);
  assert.match(ind, /D\.parcaUret\(b,satirlar\(\),disSecenek\(\)\)/);
  assert.match(ind, /bi\.ikili\?\[D\.donusturIkili\(b,satirlar\(\),disSecenek\(\)\)\]/);
  assert.match(ind, /var b=bicimSecili\(\)/);
  const kop = betik.slice(betik.indexOf("$('kopyala').onclick"), betik.indexOf('/* ---------- kural yönetimi'));
  assert.strictEqual((kop.match(/D\.parcaUret\(/g) || []).length, 1);
  assert.match(kop, /parcaUret\(bicimSecili\(\)/);
  assert.ok(!/forEach|zip|Zip|JSZip/.test(ind + kop));
  assert.ok(!/D\.BICIMLER\.(forEach|map)/.test(ind + kop));
  // seçili biçime özel seçenekler yalnız o biçimdeyken görünür
  assert.match(betik, /\$\('opXl'\)\.hidden=b!=='csv-noktalivirgul';\$\('opSql'\)\.hidden=b!=='sql';\$\('opZpl'\)\.hidden=b!=='zpl'/);
  assert.match(betik, /T\('d\.indir','\{0\} olarak indir',biAd\+\(biAd\.indexOf\('\.'\+bi\.uzanti\)<0\?' \(\.'\+bi\.uzanti\+'\)':''\)\)/);
  // Ctrl+S her sekmede seçili biçimi indirir
  assert.match(betik, /if\(uretim&&!calisiyor\)indirListe\(\)/);
});

test('dışa aktar sekmesi: innerHTML yok, tercih (biçim/kategori) ve kelime saklanmaz/çıktıya girmez', () => {
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(betik));
  assert.strictEqual((betik.match(/localStorage\.setItem\(/g) || []).length, 2);
  assert.ok(!/localStorage[^;]{0,80}(bicim|kategori|seciliBicim)/i.test(betik));
  assert.ok(!/localStorage|sessionStorage|cookie/.test(kategoriKodu()));
  const blok = betik.slice(betik.indexOf('function bicimSecili'), betik.indexOf('function indirListe'));
  assert.ok(!/kelime/i.test(blok.replace(/ \* /g, '')), 'dışa aktarma kodu kelimeye dokunmuyor');
  assert.strictEqual((betik.match(/\$\('kelime'\)\.value/g) || []).length, 2);
});

test('build: çıktıda Liste sekmesinde Kaydet (dışa aktar) adımı var', () => {
  execFileSync(process.execPath, [path.join(kok, 'build.js')], { cwd: kok });
  const cikti = fs.readFileSync(path.join(kok, 'barkod-sifreleme.html'), 'utf8');
  assert.match(cikti, /id="s3"[^>]*role="tab"[^>]*aria-controls="p3 p7"[^>]*>Liste<\/button>/);
  assert.match(cikti, /id="p7"[^>]*role="tabpanel"/);
  assert.ok(cikti.indexOf('id="p3"') < cikti.indexOf('id="p7"') && cikti.indexOf('id="p7"') < cikti.indexOf('id="p4"'));
  assert.match(cikti, /function kategoriGrupla/);
  assert.ok(!/innerHTML/.test(cikti.slice(cikti.lastIndexOf('<script>'))));
});

test('masaüstü sürüm kartı: yalnız window.barkodMasaustu varsa görünür, innerHTML/localStorage yok', () => {
  assert.match(sablon, /id="surumKart"[^>]*\shidden/);
  assert.match(sablon, /var M=window\.barkodMasaustu;\s*if\(!M\|\|!\$\('surumKart'\)\)return;\s*\$\('surumKart'\)\.hidden=false/);
  const blok = betik.slice(betik.indexOf('var M=window.barkodMasaustu'), betik.indexOf('/* ---------- başlangıç'));
  assert.ok(blok.length > 200);
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|localStorage|sessionStorage|fetch\(/.test(blok));
  assert.match(blok, /textContent/);
  assert.match(blok, /window\.confirm\(/);
  assert.match(sablon, /id="surumSil"[^>]*disabled/);
  assert.match(sablon, /id="surumOto"[^>]*checked/);
});

test('masaüstü kartı: doğrulama yoksa temizlik yapılmadı bilgisi, düğme devre dışı, elle onay yolu yok', () => {
  const blok = betik.slice(betik.indexOf('var M=window.barkodMasaustu'), betik.indexOf('/* ---------- başlangıç'));
  assert.match(blok, /r\.klasor&&!r\.dogrulandi/);
  assert.match(blok, /Doğrulama dosyası bulunamadı, temizlik yapılmadı/);
  assert.match(blok, /\$\('surumSil'\)\.disabled=true/);
  assert.ok(!/zorla|yine de sil|doğrulamadan/i.test(blok));
});

// ---------- Önekten sonraki ilk rakam 1-9 (cycle-walking) ----------
test('ilk rakam hiçbir yöntemde 0 değil; 1..5000 gidiş-dönüş', () => {
  ['harf-karistirma', 'dogrusal', 'feistel'].forEach((y) => {
    [true, false].forEach((l) => {
      const c = calisma({ yontem: y, luhn: l });
      for (let n = 1; n <= 5000; n++) {
        const m = K.barkodMetni(n, c);
        assert.match(m.charAt(2), /[1-9]/, y + ' n=' + n);
        const r = K.coz(m, c);
        assert.strictEqual(r.gecerli, true, y + ' n=' + n);
        assert.strictEqual(r.sira, n);
      }
    });
  });
  const c = calisma();
  assert.strictEqual(K.coz(K.barkodMetni(0, c), c).sira, 0);
});

test('kapasite sınırı 9*10^(yuk-1): son değer çalışır, sonrası hata', () => {
  ['harf-karistirma', 'dogrusal', 'feistel'].forEach((y) => {
    const c = calisma({ yontem: y, uzunlukModu: 'elle', uzunluk: 4, luhn: true, son: 100 }); // yuk=3 -> 900
    const m = K.barkodMetni(899, c);
    assert.match(m.charAt(2), /[1-9]/);
    assert.strictEqual(K.coz(m, c).sira, 899);
    assert.throws(() => K.barkodMetni(900, c), /sığmıyor/);
    // tüm uzay birebir: 900 sıra no 900 farklı koda gider
    const kume = new Set();
    for (let n = 0; n < 900; n++) kume.add(K.barkodMetni(n, c));
    assert.strictEqual(kume.size, 900);
  });
  assert.throws(() => K.uzunlukBelirle(Object.assign(K.varsayilan(), { uzunlukModu: 'elle', uzunluk: 4, luhn: true, son: 900 })), /sığmıyor/);
  assert.doesNotThrow(() => K.uzunlukBelirle(Object.assign(K.varsayilan(), { uzunlukModu: 'elle', uzunluk: 4, luhn: true, son: 899 })));
});

test('coz: ilk rakamı 0 olan barkod reddedilir', () => {
  [true, false].forEach((l) => {
    const c = calisma({ luhn: l });
    const yuk = c.toplamRakam - (l ? 1 : 0);
    const s = '0' + '1'.repeat(yuk - 1);
    const m = 'TO' + s + (l ? String(Core.luhnRakami(s)) : '');
    const r = K.coz(m, c);
    assert.strictEqual(r.gecerli, false);
    assert.match(r.neden, /ilk rakam 0 olamaz/);
  });
});

test('döngü sınırı: farklı kelime/yöntem karışımlarında sonlanır ve hata ya da doğru sonuç verir', () => {
  const kelimeler = ['ab', 'deneme', 'ÇĞİşö', 'zzzy', 'xy'.repeat(25)];
  ['harf-karistirma', 'dogrusal', 'feistel'].forEach((y) => {
    kelimeler.forEach((kw) => {
      const k = Object.assign(K.varsayilan(), { yontem: y, uzunlukModu: 'elle', uzunluk: 3, luhn: false, son: 10 });
      let c;
      try { c = K.calismaKurali(k, kw).calisma; } catch (e) { return; }
      for (let n = 0; n < 90; n++) {
        const m = K.barkodMetni(n, c);
        assert.match(m.charAt(2), /[1-9]/);
        assert.strictEqual(K.coz(m, c).sira, n);
      }
    });
  });
  // yöntem permütasyon değilse (bozuk) sınır aşılınca hata verir
  const Yontem = require('../src/yontemler.js');
  const eski = Yontem.sifrele;
  Yontem.sifrele = () => '000';
  try {
    assert.throws(() => K.barkodMetni(1, calisma({ uzunlukModu: 'elle', uzunluk: 4, son: 10 })), /döngüsü sınırı/);
  } finally { Yontem.sifrele = eski; }
});

test('tek numara: sıra no onay kutusu, otomatik seçim, sayaç sıfırlama', () => {
  assert.match(sablon, /<input type="checkbox" id="sayiElle">/);
  assert.match(sablon, /<label class="satirici"><input type="checkbox" id="sayiElle">[^<]*kendim gireyim/);
  assert.match(sablon, /id="sayiKap" hidden/);
  assert.match(sablon, /id="sayi"[^>]*disabled/);
  const g = betik.slice(betik.indexOf("$('uret1').onclick"), betik.indexOf("$('tekIndir').onclick"));
  assert.match(g, /\$\('sayiElle'\)\.checked/);
  assert.match(g, /tekSayac==null\?h\.k\.bas:tekSayac/);
  assert.match(g, /n>h\.k\.son/);
  assert.match(g, /Kullanılan sıra numarası/);
  assert.match(g, /siraNoAyikla\(\$\('sayi'\)\.value\)/);
  assert.match(betik, /\$\('bas'\)\.addEventListener\('input',function\(\)\{tekSayac=null\}\)/);
  assert.match(sablon, /Önekten sonraki ilk rakam her zaman 1-9/);
});

test('çöz: sorgulanan barkodun SVG\'si yeniden üretilir, güvenli yoldan', () => {
  ['cozKap', 'cozSvg', 'cozIndir', 'cozSvgNot'].forEach((i) => assert.ok(sablon.includes('id="' + i + '"'), i));
  const g = betik.slice(betik.indexOf('function cozSvgGoster'), betik.indexOf("$('coz').onclick"));
  assert.match(g, /C\.uygunMu\(/);
  assert.match(g, /C\.svg\(/);
  assert.match(g, /svgYerlestir\(\$\('cozSvg'\)/);
  assert.match(g, /textContent/);
  assert.ok(!/innerHTML/.test(g));
  const c = betik.slice(betik.indexOf("$('coz').onclick"), betik.indexOf('toplu üretim'));
  assert.ok(c.indexOf('cozSvgGoster()') > 0 && c.indexOf('cozSvgGoster()') < c.indexOf('K.coz('), 'çözmeden önce, hata olsa da');
  assert.match(betik, /\$\('kod'\)\.addEventListener\('input',cozSvgTemizle\)/);
});

test('örnekler: en az 4, karışık, deterministik; yenile farklı tohum', () => {
  assert.match(betik, /Math\.max\(4,adet\)/);
  assert.match(betik, /ornekSecimi\(b,e,4,1\)/);
  assert.match(betik, /onizTohum\+\+/);
  assert.match(betik, /aralık dışından deneme amaçlı üretildi/);
  const B = require('../src/barkod.js');
  const o = B.ornekIndeksleri(1, 50, 4, 1);
  assert.ok(new Set(o).size >= 4);
  assert.notDeepStrictEqual(o, o.slice().sort((a, b) => a - b));
  assert.deepStrictEqual(B.ornekIndeksleri(1, 50, 4, 1), o);
  assert.notDeepStrictEqual(B.ornekIndeksleri(1, 50, 6, 2), B.ornekIndeksleri(1, 50, 6, 3));
});

// ---- Yeniden tasarım: Rehber (p5), etiket görünümü, renk ----
test('rehber: başlarken, en az 10 soru (details), kontrol listesi, hakkında; gerçek kurallarla uyumlu', () => {
  const p5 = panelMetni(5);
  assert.match(p5, /<h2>Yardım<\/h2>/);
  assert.match(p5, /Başlarken/);
  assert.ok((p5.match(/<details class="sss"/g) || []).length >= 10);
  assert.match(p5, /Bir şey ters gitti/);
  assert.match(p5, /Hakkında/);
  ['Anahtar kelime nedir', 'unutursam', 'ilk rakam her zaman 1-9', 'zorunda mıyım', 'barkod türünü', 'geçersiz', 'Excel', 'dışa aktarma biçimi', 'Kaç numara', 'nereye gidiyor', 'Kaldır', 'okunmuyor'].forEach((s) => assert.ok(p5.includes(s), 'rehberde yok: ' + s));
  assert.ok(p5.includes('id="surumKart"') && p5.includes('id="sss-coz"'));
  assert.match(betik, /\$\('cozYardim'\)\.onclick/);
  assert.ok(!sablon.includes('id="yardim"'), 'üst çubukta ayrı Yardım bağlantısı yok; Yardım bir sekmedir');
  assert.match(sablon, /id="s5"[^>]*>Yardım</);
});

test('etiket görünümü: sarı şerit, Kopyala ve İndir; mavi ton ve gömülü yazı tipi yalnız data:', () => {
  assert.match(sablon, /class="etiketSerit"/);
  assert.match(sablon, /id="tekKopyala"/);
  assert.match(betik, /\$\('tekKopyala'\)\.onclick/);
  assert.ok(!/#2457d6|#7ba1ff|#e6edff|(?<!repeating-)linear-gradient|radial-gradient/i.test(sablon));
  // yazı tipleri yalnız build'de gömülür (sıkı denetim: test/yazi-gomme.test.js); şablonda yalnız yer tutucu var
  assert.match(sablon, /\/\*FONTLAR\*\//);
  assert.ok(sablon.includes('--iplik:#F4C430') && sablon.includes('--eylem:#1E6B52'));
  assert.match(sablon, /prefers-reduced-motion:reduce/);
});

test('TAARKOD: başlık, üst çubukta 24px aria-hidden SVG logo + ad, data: URI favicon, eski ad yok', () => {
  assert.match(sablon, /<title>TAARKOD<\/title>/);
  assert.match(sablon, /<h1><svg width="26" height="24"[^>]*aria-hidden="true"[\s\S]*?<\/svg><span>TAARKOD<\/span><\/h1>/);
  assert.match(sablon, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,%3Csvg /);
  assert.match(sablon, /img-src data:; font-src data:"/);
  assert.ok(!/Barkod Sıra (Şifreleme|Karıştırma)/.test(sablon), 'eski görünen ad kalmamalı');
  assert.ok(sablon.includes('“TAARKOD - Kaldır”'));
  assert.ok(panelMetni(5).includes('<strong>TAARKOD</strong>'));
  assert.ok(sablon.includes('TAARKOD-Kurulum/Tasinabilir-X.Y.Z.exe'));
});

test('şablon: "Kuralları saklayın" bölümü sade yapıda, id\'ler duruyor', () => {
  const a = sablon.indexOf('<h3>Kuralları saklayın</h3>');
  assert.ok(a > 0);
  const bolum = sablon.slice(a, sablon.indexOf('</section>', a));
  ['disa', 'ice', 'yeniSeri', 'varsayilan', 'dosya', 'birakma'].forEach((i) => {
    assert.ok(bolum.includes('id="' + i + '"'), 'id eksik: ' + i);
  });
  assert.match(bolum, /<h4>Kaydet<\/h4>/);
  assert.match(bolum, /<h4>Yükle<\/h4>/);
  assert.match(bolum, /<h4>Sıfırlama<\/h4>/);
  assert.match(bolum, /Kural dosyasını \(\.json\) buraya bırakın veya seçin/);
  assert.match(bolum, /id="ice">Dosya seç</);
  assert.match(bolum, /Anahtar kelime dosyaya yazılmaz\./);
  // "Kurallar tarayıcıda saklanmaz" uyarısı satır altı yazı yerine başlığın yanındaki mavi ünlem balonundadır
  assert.match(bolum, /data-ipucu="sakla"/);
  assert.match(betik, /T\('ip\.sakla','Kurallar tarayıcıda saklanmaz; kalıcılık için dosyaya aktarın\.'\)/);
  assert.ok(!/sürükleyip bırakın ya da seçmek için tıklayın/.test(bolum), 'eski uzun metin kaldı');
  assert.strictEqual((bolum.match(/<p class="not">/g) || []).length, 3);
  // yeni seri ve varsayılan birincil renkte değil
  assert.match(bolum, /class="metin" id="yeniSeri"/);
  assert.match(bolum, /class="metin" id="varsayilan"/);
});

test('paneller iç içe değil: her .panel aynı derinlikte (Kurallar/Yardım Geçmiş içinde gizlenmez)', () => {
  const g = sablon.slice(sablon.indexOf('<body>'), sablon.indexOf('<script>'));
  let derinlik = 0; const d = new Set();
  for (const m of g.matchAll(/<div\b[^>]*>|<\/div>/g)) {
    if (m[0] === '</div>') { derinlik--; continue; }
    if (/class="panel"/.test(m[0])) d.add(derinlik);
    derinlik++;
  }
  assert.strictEqual(d.size, 1, 'paneller farklı derinliklerde: ' + [...d]);
});

test('geçmiş: tek barkod üretimi de kaydedilir (anahtar kelime kaydedilmez)', () => {
  const blok = betik.slice(betik.indexOf("$('uret1').onclick"), betik.indexOf("$('uret1').onclick") + 2500);
  assert.match(blok, /gecmiseEkle\(h\.k\.seriAdi,n,n,h\.c,1\)/);
});
