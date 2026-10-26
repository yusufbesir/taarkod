// Kullanım: node build.js  -> barkod-sifreleme.html (tek dosya, internet gerekmez)
const fs = require('fs'), path = require('path');
const d = __dirname;
const parcalar = ['core.js', 'yontemler.js', 'barkod.js', 'qr.js', 'datamatrix.js', 'donustur.js', 'kural.js',
  'depo.js', 'gecmis.js', 'profil.js', 'toplu.js', 'dogrula.js', 'etiket.js', 'tara.js', 'yedek.js', 'gs1.js', 'tema.js', 'tema_uygulama.js', 'dil_en.js', 'dil.js'].map((f) => {
  const s = fs.readFileSync(path.join(d, 'src', f), 'utf8');
  if (/<\/script/i.test(s)) throw new Error(f + ' içinde </script bulundu; satır içi gömülemez.');
  return s;
});
const sablon = fs.readFileSync(path.join(d, 'src/sablon.html'), 'utf8');
if (sablon.split('/*CORE*/').length !== 2) throw new Error('Şablonda tam bir /*CORE*/ yer tutucusu olmalı.');
if (sablon.split('/*FONTLAR*/').length !== 2) throw new Error('Şablonda tam bir /*FONTLAR*/ yer tutucusu olmalı.');
if (sablon.split('/*YAZI_LISANS*/null').length !== 2) throw new Error('Şablonda tam bir /*YAZI_LISANS*/null yer tutucusu olmalı.');

// Kullanılmayan newsreader-400 / newsreader-italic-400 gömülmez (dosyalar yazi/ içinde kalır): başlıklar yalnız 600, italik kullanım yok.
// Yazı tipleri (yazi/*.woff2, OFL): base64 data: URI olarak @font-face içine gömülür; uzak url yok, font-src yalnız data:.
// Yalnız Latin + Latin Extended-A (Türkçe ğ ı ş İ ç ö ü) aralığı bildirilir; kapsam dışı karakterler (ör. ₺ Space Mono'da yok) CSS yedek yığınından gelir.
const YAZI_ARALIK = 'U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const YAZI_DOSYALARI = [
  ['Newsreader', 600, 'normal', 'newsreader-600.woff2'],
  ['Space Mono', 400, 'normal', 'spacemono-400.woff2'],
  ['Space Mono', 700, 'normal', 'spacemono-700.woff2']
];
const fontCss = YAZI_DOSYALARI.map((f) => {
  const b = fs.readFileSync(path.join(d, 'yazi', f[3]));
  if (b.slice(0, 4).toString('latin1') !== 'wOF2') throw new Error(f[3] + ' geçerli bir WOFF2 dosyası değil.');
  return '@font-face{font-family:"' + f[0] + '";font-style:' + f[2] + ';font-weight:' + f[1] + ';font-display:swap;src:url(data:font/woff2;base64,' + b.toString('base64') + ') format("woff2");unicode-range:' + YAZI_ARALIK + '}';
}).join('\n');
const okuLisans = (ad) => fs.readFileSync(path.join(d, 'yazi', ad), 'utf8').replace(/\r\n?/g, '\n').trim();
// "<" kaçışlanır: metin satır içi betiğe gömülür, </script oluşamaz.
const lisansJson = JSON.stringify({ newsreader: okuLisans('Newsreader-OFL.txt'), spacemono: okuLisans('SpaceMono-OFL.txt') }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Sıra önemli: kural.js diğerlerine, yontemler.js core.js'ye, gecmis.js/profil.js/dil.js depo.js'e (profil.js ayrıca kural.js'e), dil.js dil_en.js'e, yedek.js kural.js'e dayanır. Hepsi tek <script> bloğunda UMD global olur.
const cikti = sablon
  .replace('/*FONTLAR*/', () => fontCss)
  .replace('/*YAZI_LISANS*/null', () => lisansJson)
  .replace('/*CORE*/', () => parcalar.join('\n;\n'));
fs.writeFileSync(path.join(d, 'barkod-sifreleme.html'), cikti);
console.log('barkod-sifreleme.html üretildi (' + Buffer.byteLength(cikti) + ' bayt)');
