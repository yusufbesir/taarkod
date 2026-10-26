/* TAARKOD tema ayarları (tema.js'e ikinci bağımsız değişken olarak verilir). tema.js ortak dosyadır; uygulamaya özgü her şey burada durur.
 * klasik = TAARKOD 1.7.1 görünümünün BİREBİR değerleri (yeni belirteç adlarıyla): --cam->eylem, --camKoyu->eylemKoyu, --camYazi->eylemYazi,
 * --camSoluk->eylemSoluk, --sari/--dikis->iplik, --mavi->bilgi, --maviYazi->bilgiYazi. Eski rgba(246,241,227,.12) = ustUstu #F6F1E31F (alfa 31/255).
 * "Ton" biçiminde zemin/yüzey/şerit bu değerlerden gelir (uygulamanın marka sabiti). */
(function (kok, fabrika) {
  if (typeof module === 'object' && module.exports) module.exports = fabrika();
  else kok.BarkodTemaUygulama = fabrika();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    ad: 'TAARKOD',
    varsayilanPalet: 'cam',
    depoAnahtar: 'barkod-gorunum',
    klasik: {
      acik: {
        ust: '#0F3B2E', ustYazi: '#F6F1E3', ustSoluk: '#B7CDC2', ustSimge: '#F6F1E3', ustUstu: '#F6F1E31F',
        kagit: '#F4F4EC', yuzey: '#FFFFFF', yuzey2: '#ECEEE4', cizgi: '#D8DBCE', kenar: '#76847C', murek: '#17262B', soluk: '#4B5C60',
        eylem: '#1E6B52', eylemKoyu: '#14513D', eylemYazi: '#FFFFFF', eylemSoluk: '#E4EFE8',
        iplik: '#F4C430', iplikUstu: '#17262B',
        hata: '#B3261E', tamam: '#1E6B52', bilgi: '#1550B8', bilgiYazi: '#FFFFFF', odak: '#17262B'
      },
      koyu: {
        ust: '#0A1514', ustYazi: '#E7EEE9', ustSoluk: '#9DB5AB', ustSimge: '#E7EEE9', ustUstu: '#E7EEE91F',
        kagit: '#12201F', yuzey: '#1A2B2A', yuzey2: '#162524', cizgi: '#2E4442', kenar: '#6F8A82', murek: '#E7EEE9', soluk: '#A7BBB3',
        eylem: '#5FC7A0', eylemKoyu: '#7FD6B5', eylemYazi: '#0C1A18', eylemSoluk: '#1F3733',
        iplik: '#F4C430', iplikUstu: '#17262B',
        hata: '#FF9E96', tamam: '#7FD9B3', bilgi: '#8DB8FF', bilgiYazi: '#0B1B33', odak: '#F4C430'
      }
    }
  };
});
