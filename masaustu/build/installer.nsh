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
