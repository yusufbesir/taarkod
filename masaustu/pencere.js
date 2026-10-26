'use strict';
// Pencere çerçevesi: sistem başlık çubuğu gizlenir, uygulamanın kendi üst şeridi (.ust) çerçeve olur.
// Saf modül (Electron'a bağımlı değil); main.js kullanır, testler doğrudan çağırır.
// Renkler src/sablon.html'deki --ust / --ustSimge belirteçleriyle aynı olmalıdır (test denetler).
const YUKSEKLIK = 48; // CSS: html[data-masaustu] --ustY
const HEX = /^#[0-9a-fA-F]{6}$/;
const TEMALAR = {
  acik: { ust: '#0F3B2E', simge: '#F6F1E3', zemin: '#F4F4EC' },
  koyu: { ust: '#0A1514', simge: '#E7EEE9', zemin: '#12201F' }
};

function renkGecerli(r) { return typeof r === 'string' && HEX.test(r); }
function tema(koyu) { return koyu ? TEMALAR.koyu : TEMALAR.acik; }

// BrowserWindow'a eklenecek çerçeve seçenekleri. macOS'ta trafik ışıkları solda (üst şerit 84 px boşluk bırakır),
// Windows/Linux'ta sağ üstte titleBarOverlay (kapat/küçült/büyüt) şerit renginde ve şerit yüksekliğindedir.
function secenekler(platform, koyu) {
  const t = tema(koyu);
  const o = { titleBarStyle: 'hidden', backgroundColor: t.zemin };
  if (platform === 'darwin') {
    o.trafficLightPosition = { x: 18, y: Math.round((YUKSEKLIK - 12) / 2) };
  } else {
    o.titleBarOverlay = { color: t.ust, symbolColor: t.simge, height: YUKSEKLIK };
  }
  return o;
}

// setTitleBarOverlay için: yalnız iki geçerli #RRGGBB kabul edilir, başka her şey null.
function overlayGuncelle(renk, simge) {
  if (!renkGecerli(renk) || !renkGecerli(simge)) return null;
  return { color: renk, symbolColor: simge, height: YUKSEKLIK };
}

module.exports = { YUKSEKLIK, TEMALAR, renkGecerli, tema, secenekler, overlayGuncelle };
