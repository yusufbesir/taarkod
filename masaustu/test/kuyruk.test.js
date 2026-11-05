// Sahip: Yusuf. yazan: [Claude#taarkod-T2 2026-11-05]
// etiket-kuyrugu OKURU: düğme görünürlüğü, öneri dosyası biçimi/konumu, alan yokken hata yok, boş TAA_VERI_KOK ile açılış.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const kuyruk = require('../kuyruk');
const veri = require('../../taa/taa-veri.js');

const kaynak = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const preloadKaynak = fs.readFileSync(path.join(__dirname, '..', 'preload.js'), 'utf8');
const sablon = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'sablon.html'), 'utf8');
const yapi = fs.readFileSync(path.join(__dirname, '..', '..', 'barkod-sifreleme.html'), 'utf8');

// TAA_VERI_KOK ve APPDATA geçici klasöre yönlendirilir; gerçek kullanıcı verisine dokunulmaz.
function ortam() {
  const kok = fs.mkdtempSync(path.join(os.tmpdir(), 'taarkod-kuyruk-'));
  const env = { TAA_VERI_KOK: path.join(kok, 'veri'), APPDATA: path.join(kok, 'appdata'), XDG_DATA_HOME: path.join(kok, 'xdg'), HOME: kok };
  return { kok, env };
}
// Sahip (Fiyat Etiketi) alanı oluşturur ve kuyruk dosyasını yazar.
function alanKur(env) {
  const s = veri.acSahip({ alan: 'etiket-kuyrugu', program: 'fiyatetiketi', surum: '1.33.0', env });
  s.yaz('kuyruk.json', '{"kalemler":[]}');
  return s;
}

test('düğme görünürlüğü: alan + SAHIP.toml varsa var, yoksa yok', () => {
  const { env } = ortam();
  assert.deepStrictEqual(kuyruk.durum(env), { var: false });
  fs.mkdirSync(path.join(env.TAA_VERI_KOK, 'etiket-kuyrugu'), { recursive: true }); // klasör var, SAHIP.toml yok
  assert.deepStrictEqual(kuyruk.durum(env), { var: false });
  alanKur(env);
  const d = kuyruk.durum(env);
  assert.strictEqual(d.var, true);
  assert.strictEqual(d.sahip, 'fiyatetiketi');
});

test('arayüz: düğme varsayılan gizli, yalnız kuyrukDurum yanıtıyla görünür; ana işlem IPC ucu var', () => {
  [sablon, yapi].forEach((h) => {
    assert.match(h, /<button type="button" id="kuyrukGonder" class="ikinci" hidden disabled>Fiyat Etiketi kuyruğuna gönder<\/button>/);
    assert.match(h, /\$\('kuyrukGonder'\)\.hidden=!kuyrukVar/);
    assert.match(h, /kuyrukVar=!!\(r&&r\.var===true\)/);
    assert.match(h, /kuyrukVar=false;disaDurum\(\)/); // IPC hatası: gizli kalır
    assert.match(h, /typeof M\.kuyrukDurum!=='function'/); // tarayıcıda (köprü yok) düğme hiç görünmez
  });
  assert.match(preloadKaynak, /kuyrukDurum:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('taa:kuyruk-durum'\)/);
  assert.match(preloadKaynak, /kuyrukOner:/);
  ['taa:kuyruk-durum', 'taa:kuyruk-oner'].forEach((k) => {
    const i = kaynak.indexOf("ipcMain.handle('" + k + "'");
    assert.ok(i >= 0, k);
    assert.match(kaynak.slice(i, kaynak.indexOf('\n  });', i)), /gonderenKontrol\(event\)/, k);
  });
});

test('öneri dosyası: yalnız oneriler/ altında, sözleşme biçiminde; kuyruk dosyası değişmez', () => {
  const { env } = ortam();
  const s = alanKur(env);
  const once = fs.readFileSync(path.join(s.dizin, 'kuyruk.json'), 'utf8');
  const sahipOnce = fs.readFileSync(path.join(s.dizin, 'SAHIP.toml'), 'utf8');
  const r = kuyruk.oner(['8690000000017', '8690000000024', '8690000000017'], env);
  assert.strictEqual(r.tamam, true);
  assert.strictEqual(r.adet, 2); // tekrar atılır
  const od = path.join(s.dizin, 'oneriler');
  const dosyalar = fs.readdirSync(od).filter((f) => f.endsWith('.json'));
  assert.strictEqual(dosyalar.length, 1);
  assert.strictEqual(dosyalar[0], r.id + '.json');
  const o = JSON.parse(fs.readFileSync(path.join(od, dosyalar[0]), 'utf8'));
  assert.strictEqual(o.sema, 1);
  assert.strictEqual(o.oneren, 'taarkod');
  assert.ok(!isNaN(Date.parse(o.zaman)));
  assert.deepStrictEqual(o.degisiklik, { ekle: [{ barkod: '8690000000017', adet: 1 }, { barkod: '8690000000024', adet: 1 }] });
  // sahip dosyalarına dokunulmadı; alan kökünde yeni dosya yok
  assert.strictEqual(fs.readFileSync(path.join(s.dizin, 'kuyruk.json'), 'utf8'), once);
  assert.strictEqual(fs.readFileSync(path.join(s.dizin, 'SAHIP.toml'), 'utf8'), sahipOnce);
  assert.deepStrictEqual(fs.readdirSync(s.dizin).sort(), ['SAHIP.toml', 'kuyruk.json', 'oneriler']);
  // geçici dosya kalmadı
  assert.deepStrictEqual(fs.readdirSync(od), dosyalar);
});

test('öneri girdisi doğrulanır: geçersiz/boş liste öneri yazmaz, üst sınır uygulanır', () => {
  const { env } = ortam();
  const s = alanKur(env);
  [[], null, 'abc', [1, {}, null, '', '   ', 'a\nb', 'x'.repeat(200)]].forEach((g) => {
    assert.deepStrictEqual(kuyruk.oner(g, env), { tamam: false, neden: 'bos' });
  });
  assert.ok(!fs.existsSync(path.join(s.dizin, 'oneriler')));
  const cok = Array.from({ length: kuyruk.AZAMI_BARKOD + 50 }, (_, i) => 'B' + i);
  assert.strictEqual(kuyruk.ekleListesi(cok).length, kuyruk.AZAMI_BARKOD);
  const r = kuyruk.oner(cok, env);
  assert.strictEqual(r.tamam, true);
  assert.ok(fs.statSync(path.join(s.dizin, 'oneriler', r.id + '.json')).size <= 256 * 1024);
});

test('alan yokken hata yok: durum yok, öneri yazılmaz, hiçbir şey oluşmaz', () => {
  const { env } = ortam();
  assert.doesNotThrow(() => kuyruk.durum(env));
  let r;
  assert.doesNotThrow(() => { r = kuyruk.oner(['8690000000017'], env); });
  assert.deepStrictEqual(r, { tamam: false, neden: 'alan-yok' });
  assert.ok(!fs.existsSync(path.join(env.TAA_VERI_KOK, 'etiket-kuyrugu', 'oneriler')));
});

test('digerleri kaldırılmış: boş TAA_VERI_KOK ile açılış mantığı hatasız, sahip olunmayan alanlar boş/salt okunur', () => {
  const { kok, env } = ortam();
  fs.mkdirSync(env.TAA_VERI_KOK, { recursive: true }); // boş kök
  assert.doesNotThrow(() => kuyruk.durum(env));
  assert.strictEqual(kuyruk.durum(env).var, false);
  // Kök hiç yokken de hatasız
  const yok = { ...env, TAA_VERI_KOK: path.join(kok, 'hic-yok') };
  assert.strictEqual(kuyruk.durum(yok).var, false);
  // Okuyan olarak hiçbir alan açılamaz (boş); okuma kodu da yazma yolu sunmaz
  ['etiket-kuyrugu', 'urunler', 'belgeler'].forEach((a) => {
    assert.throws(() => veri.acOkur({ alan: a, program: 'taarkod', env }), (e) => e.kod === 'SahipYok' || /SAHIP/.test(e.message));
  });
  assert.deepStrictEqual(fs.readdirSync(env.TAA_VERI_KOK), []); // okuyan klasör/dosya oluşturmadı
  // Alan sonradan doğarsa okur salt okunurdur: yazma API'si yok
  alanKur(env);
  const okur = veri.acOkur({ alan: 'etiket-kuyrugu', program: 'taarkod', env });
  assert.strictEqual(typeof okur.yaz, 'undefined');
  assert.strictEqual(okur.oku('kuyruk.json'), '{"kalemler":[]}');
  assert.strictEqual(okur.oku('olmayan.json'), null);
});

test('kuyruk.js: silme/süreç yok, kuyruk dosyasına yazma yolu yok; program.toml sözleşmeye uyar', () => {
  const k = fs.readFileSync(path.join(__dirname, '..', 'kuyruk.js'), 'utf8');
  assert.doesNotMatch(k, /child_process|unlink|rmSync|\brmdir|\.rm\(|writeFile|appendFile|rename/);
  assert.doesNotMatch(k, /acSahip/); // TaaRkod sahip olmaz
  const toml = fs.readFileSync(path.join(__dirname, '..', '..', 'program.toml'), 'utf8');
  const paket = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.ok(toml.includes('surum = "' + paket.version + '"'));
  assert.match(toml, /^veri_sahibi = \[\]/m);
  assert.match(toml, /^veri_okur\s*=\s*\["etiket-kuyrugu"\]/m);
  assert.match(toml, /^sunar\s*=\s*\["kod\.uret@1"\]/m);
  assert.match(toml, /^ister\s*=\s*\["etiket\.kuyruga_ekle@1"\]/m);
  assert.match(toml, /^ayar_alani\s*=\s*"programlar\.taarkod"/m);
});

test('paketleme: kuyruk.js ve app/taa-veri.js dosya listesinde, kopyala betiği taa-veri.js kopyalar', () => {
  const paket = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  ['kuyruk.js', 'app/taa-veri.js'].forEach((f) => assert.ok(paket.build.files.includes(f), f));
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'kopyala.js'), 'utf8'), /taa-veri\.js/);
});
