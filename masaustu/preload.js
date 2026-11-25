'use strict';
// Sandbox preload: yalnız 'electron' require edilebilir. Yalnız dar bir köprü sunulur.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('barkodMasaustu', {
  surumBilgi: () => ipcRenderer.invoke('surum:bilgi'),
  klasorSec: () => ipcRenderer.invoke('temizlik:klasorSec'),
  tara: () => ipcRenderer.invoke('temizlik:tara'),
  uygula: () => ipcRenderer.invoke('temizlik:uygula'),
  otomatikAyarla: (acik) => ipcRenderer.invoke('ayar:otomatik', acik === true),
  // Üst şerit rengi değişince sistem düğmelerinin rengini eşler; doğrulama main.js'te (yalnız #RRGGBB)
  pencereTema: (renk, simge) => ipcRenderer.invoke('pencere:tema', renk, simge),
  // TAA etiket-kuyrugu okuru: alan var mı, ve barkodları öneri olarak bırak (kuyruğa yazmaz)
  kuyrukDurum: () => ipcRenderer.invoke('taa:kuyruk-durum'),
  kuyrukOner: (barkodlar) => ipcRenderer.invoke('taa:kuyruk-oner', Array.isArray(barkodlar) ? barkodlar : [])
});

// TAA ortak giriş (KM1). Sandbox preload'da yalnız 'electron' yüklenebildiği için kanal adları
// taa/taa-giris.js KANAL ile aynı yazılır (masaustu/test/taa-giris-taarkod.test.js eşitliği denetler).
contextBridge.exposeInMainWorld('taaGiris', {
  baslangic: () => ipcRenderer.invoke('taa-giris:baslangic'),
  giris: (kullanici, parola) => ipcRenderer.invoke('taa-giris:giris', { kullanici: String(kullanici || ''), parola: String(parola || '') }),
  basvur: (kullanici, yeniParola) => ipcRenderer.invoke('taa-giris:basvur', { kullanici: String(kullanici || ''), yeniParola: yeniParola == null ? undefined : String(yeniParola) }),
  durum: () => ipcRenderer.invoke('taa-giris:durum'),
  yetki: (izin) => ipcRenderer.invoke('taa-giris:yetki', { izin: String(izin || '') }),
  cikis: () => ipcRenderer.invoke('taa-giris:cikis')
});
