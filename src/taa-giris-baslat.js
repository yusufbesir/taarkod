// Sahip: Yusuf. yazan: [Claude#KM2-hesap-giris 2026-11-25]
// TaaRkod açılışında TAA ortak girişi (KM1). window.taaGiris masaüstü preload.js'den gelir;
// tarayıcıda tek dosya olarak açıldığında köprü yoktur ve bu betik hiçbir şey yapmaz.
// Kural: bu bilgisayarda taa-kimlik kuruluysa giriş zorunlu; kurulu değilse program eskisi gibi açılır.
// Geçerli oturum varsa ekran gösterilmez. Şifre bu dosyada hiç tutulmaz.
(function () {
  'use strict';
  var api = window.taaGiris;
  if (!api) return;   // preload köprüsü yok: araç bilgisi alınamaz
  var ARALIK_MS = 10 * 60 * 1000;   // süren oturum aralıkla yeniden denetlenir (süre dolunca ya da yetki kalkınca giriş istenir)

  // TaaRkod temasını ortak ekranın değişkenlerine bağla (tema değişince kendiliğinden uyar).
  var stil = document.createElement('style');
  stil.textContent = ':root{--taa-arka:var(--kagit);--taa-panel:var(--yuzey);--taa-yazi:var(--murek);--taa-soluk:var(--soluk);' +
    '--taa-vurgu:var(--eylem);--taa-vurgu-yazi:var(--eylemYazi);--taa-cizgi:var(--cizgi);--taa-hata:var(--hata);--taa-r:var(--r2)}' +
    '.taa-oturum-uyari{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:560px;z-index:2147483000;' +
    'background:var(--yuzey);color:var(--uyari);border:1px solid var(--uyari);border-radius:var(--r2);padding:12px 44px 12px 16px;' +
    'box-shadow:var(--gol);font:inherit;line-height:1.45}' +
    '.taa-oturum-uyari button,.taa-oturum-uyari button:hover{position:absolute;right:8px;top:8px;min-width:28px;min-height:28px;padding:0;border:0;box-shadow:none;background:none;color:inherit;font-size:18px;cursor:pointer}';
  document.head.appendChild(stil);

  function uyariGoster(oturum) {
    var metin = window.TaaGirisEkrani.uyariMetni(oturum);
    if (!metin) return;
    var d = document.createElement('div');
    d.className = 'taa-oturum-uyari';
    d.setAttribute('role', 'alert');
    d.textContent = metin;
    var k = document.createElement('button');
    k.type = 'button'; k.setAttribute('aria-label', 'Kapat'); k.textContent = '×';
    k.addEventListener('click', function () { d.remove(); });
    d.appendChild(k);
    document.body.appendChild(d);
  }

  // Ortak bilgisayarda giren kişi kalıcı olmasın: köşede "Çıkış" düğmesi (basınca giriş yeniden istenir).
  function cikisGoster(oturum) {
    if (window.TaaGirisEkrani && window.TaaGirisEkrani.cikisDugmesi) {
      window.TaaGirisEkrani.cikisDugmesi({ api: api, oturum: oturum, cikinca: girisAc });
    }
  }

  function girildi(oturum) { uyariGoster(oturum); cikisGoster(oturum); }

  function girisAc() {
    var d = document.getElementById('taa-giris-cikis'); if (d) d.remove();
    if (document.querySelector('.taa-giris')) return;   // zaten açık
    if (!window.TaaGirisEkrani) { kilitle(); return; }   // ekran betiği yüklenemedi: girişsiz açılmaz
    window.TaaGirisEkrani.ac(document.body, { programAdi: 'TaaRkod', api: api, girildi: girildi });
  }

  // Ekran betiği yoksa sayfa kapatılır; program yeniden kurulmalı.
  function kilitle() {
    if (document.getElementById('taa-giris-kilit')) return;
    Array.prototype.forEach.call(document.body.children, function (e) { e.inert = true; });
    var d = document.createElement('div');
    d.id = 'taa-giris-kilit';
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:var(--kagit);color:var(--murek);font:inherit;text-align:center';
    d.textContent = 'Giriş ekranı yüklenemedi. TaaRkod\'u yeniden kurun ya da yöneticinize haber verin.';
    document.body.appendChild(d);
  }

  function denetle() {
    return Promise.resolve().then(function () { return api.baslangic(); }).then(function (b) {
      if (!b || !b.arac) return;          // taa-kimlik kurulu değil: eski davranış
      if (b.oturum) { cikisGoster(b.oturum); return; }   // geçerli oturum var
      girisAc();
    }).catch(function () { girisAc(); }); // emin olunamıyorsa giriş istenir
  }

  function basla() {
    denetle();
    setInterval(denetle, ARALIK_MS);
    // Başka programda çıkış yapıldıysa ortak bilgisayarda pencere öne gelince hemen fark edilsin (en çok 5 sn'de bir).
    var son = Date.now();
    function odakDenetle() {
      if (document.visibilityState === 'hidden' || Date.now() - son < 5000) return;
      son = Date.now();
      denetle();
    }
    window.addEventListener('focus', odakDenetle);
    document.addEventListener('visibilitychange', odakDenetle);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla);
  else basla();
})();
