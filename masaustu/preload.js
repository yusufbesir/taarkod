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
  pencereTema: (renk, simge) => ipcRenderer.invoke('pencere:tema', renk, simge)
});
