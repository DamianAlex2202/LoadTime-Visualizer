const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { packExtension } = require('../scripts/pack-extension.js');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

describe('packExtension', () => {
  it('writes Chrome and Firefox unpacked dirs with the right background keys', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'loadtime-pack-'));
    const result = packExtension({ rootDir: path.join(__dirname, '..'), outDir: out });
    const chromeManifest = readJson(path.join(result.chromeDir, 'manifest.json'));
    const firefoxManifest = readJson(path.join(result.firefoxDir, 'manifest.json'));

    assert.equal(chromeManifest.background.service_worker, 'background.js');
    assert.equal(chromeManifest.background.scripts, undefined);
    assert.equal(chromeManifest.browser_specific_settings, undefined);

    assert.ok(Array.isArray(firefoxManifest.background.scripts));
    assert.ok(firefoxManifest.background.scripts.includes('background.js'));
    assert.equal(firefoxManifest.browser_specific_settings.gecko.id, 'loadtime-visualizer@damianalex2202');
    assert.ok(fs.existsSync(path.join(result.firefoxDir, 'content', 'overlay.js')));
    assert.ok(fs.existsSync(path.join(result.chromeDir, 'lib', 'browser.js')));
  });
});
