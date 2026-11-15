; Yalnız kullanıcı başına kurulum: "tüm kullanıcılar" seçeneği ve yönetici yükseltmesi kapalı.
; Kaldırıcı ve program dosyaları kullanıcının kendi profilinde kalır; HKLM kaydı oluşmaz.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; Başlat menüsüne ayrı "Kaldır" kısayolu (Uygulamalar ve özellikler girdisine ek olarak).
!macro customInstall
  CreateShortCut "$SMPROGRAMS\TAARKOD - Kaldır.lnk" "$INSTDIR\${UNINSTALL_FILENAME}"
!macroend

; Kaldırırken: kısayolu temizle; güncelleme sırasında (isUpdated) hiçbir şey sorma/silme.
; Ayarlar ve kayıtlar varsayılan olarak KORUNUR; yalnız kullanıcı açıkça "Evet" derse silinir.
!macro customUnInstall
  Delete "$SMPROGRAMS\TAARKOD - Kaldır.lnk"
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Ayarlarınız ve temizlik kayıtlarınız da silinsin mi?$\r$\n(Hayır derseniz saklanır, programı sonra yeniden kurarsanız kaldığınız yerden devam eder.)" /SD IDNO IDNO barkod_ayar_kalsin
    Delete "$APPDATA\${PRODUCT_NAME}\ayarlar.json"
    Delete "$APPDATA\${PRODUCT_NAME}\temizlik-log.jsonl"
    RMDir "$APPDATA\${PRODUCT_NAME}"
    ; Eski ürün adıyla (Barkod Sıra Şifreleme) oluşmuş ayar klasörü; boşsa kaldırılır, recursive silme yok.
    Delete "$APPDATA\Barkod Sıra Şifreleme\ayarlar.json"
    Delete "$APPDATA\Barkod Sıra Şifreleme\temizlik-log.jsonl"
    RMDir "$APPDATA\Barkod Sıra Şifreleme"
    barkod_ayar_kalsin:
  ${endIf}
!macroend

; Eski "Barkod Sıra Şifreleme" (1.0.0 vb.) kurulumunu kurucu çalışınca kendisi kaldırır (Yusuf 2026-11-15).
; Uninstall kayıtlarında GörünenAd "Barkod S" ile başlayan girdinin kaldırıcısı sessiz (/S) çalıştırılır;
; kayıt silinene kadar en çok 30 sn beklenir. Ayar/kayıt klasörüne dokunulmaz (kaldırıcı ayarları korur: /S'de IDNO).
; HKLM (tüm kullanıcılar) girdisi yönetici izni ister; yalnız sessiz olmayan kurulumda denenir, böylece /S kurulum takılmaz.
!macro barkodEskiKaldir KOK
  StrCpy $0 0
  barkod_dongu_${KOK}:
    EnumRegKey $1 ${KOK} "Software\Microsoft\Windows\CurrentVersion\Uninstall" $0
    StrCmp $1 "" barkod_son_${KOK}
    IntOp $0 $0 + 1
    ReadRegStr $2 ${KOK} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$1" "DisplayName"
    StrCpy $2 $2 8
    StrCmp $2 "Barkod S" 0 barkod_dongu_${KOK}
    ReadRegStr $3 ${KOK} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$1" "UninstallString"
    StrCmp $3 "" barkod_dongu_${KOK}
    ExecWait '$3 /S'
    StrCpy $4 0
    barkod_bekle_${KOK}:
      ReadRegStr $5 ${KOK} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$1" "UninstallString"
      StrCmp $5 "" barkod_gitti_${KOK}
      IntCmp $4 30 barkod_dongu_${KOK}
      Sleep 1000
      IntOp $4 $4 + 1
      Goto barkod_bekle_${KOK}
    barkod_gitti_${KOK}:
    ; kayıt silindi: numaralama kaydığı için aynı sıradan devam et (süre dolarsa sonraki girdiye geçilir, döngüye girmez)
    IntOp $0 $0 - 1
    Goto barkod_dongu_${KOK}
  barkod_son_${KOK}:
!macroend

!macro customInit
  Push $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5
  !insertmacro barkodEskiKaldir HKCU
  ${ifNot} ${Silent}
    !insertmacro barkodEskiKaldir HKLM
  ${endIf}
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
!macroend
