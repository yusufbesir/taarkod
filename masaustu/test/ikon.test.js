const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const kok = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(kok, 'package.json'), 'utf8'));

test('package.json simge alanları icon.ico kullanır', () => {
  assert.strictEqual(pkg.build.win.icon, 'build/icon.ico');
  assert.strictEqual(pkg.build.nsis.installerIcon, 'build/icon.ico');
  assert.strictEqual(pkg.build.nsis.uninstallerIcon, 'build/icon.ico');
  assert.strictEqual(pkg.build.nsis.installerHeaderIcon, 'build/icon.ico');
  assert.strictEqual(pkg.build.win.signAndEditExecutable, false);
});

test('afterPack tanımlı, dosya var, pakete girmez', () => {
  assert.strictEqual(pkg.build.afterPack, 'build/afterpack.js');
  assert.ok(fs.existsSync(path.join(kok, pkg.build.afterPack)));
  assert.ok(!pkg.build.files.some((f) => /afterpack|icon\.ico/.test(f)));
  assert.strictEqual(pkg.devDependencies.resedit, '3.0.2');
  assert.strictEqual(pkg.version, '1.8.0');
});

test('icon.ico geçerli, PNG gömülü ve 256 girişi var', () => {
  const b = fs.readFileSync(path.join(kok, 'build', 'icon.ico'));
  assert.strictEqual(b.readUInt16LE(0), 0);
  assert.strictEqual(b.readUInt16LE(2), 1);
  const n = b.readUInt16LE(4);
  const boyutlar = [];
  for (let i = 0; i < n; i++) {
    const o = 6 + i * 16;
    const w = b[o] || 256;
    boyutlar.push(w);
    const boy = b.readUInt32LE(o + 8), ofs = b.readUInt32LE(o + 12);
    assert.strictEqual(b.subarray(ofs, ofs + 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(ofs + boy <= b.length);
  }
  assert.deepStrictEqual(boyutlar, [16, 24, 32, 48, 64, 128, 256]);
});
