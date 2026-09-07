const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_SETTINGS, normalizeSettings } = require('../lib/settings.js');

describe('DEFAULT_SETTINGS', () => {
  it('uses the agreed 300/500 thresholds and all filters on', () => {
    assert.equal(DEFAULT_SETTINGS.greenMaxMs, 300);
    assert.equal(DEFAULT_SETTINGS.yellowMaxMs, 500);
    assert.deepEqual(DEFAULT_SETTINGS.filters, { green: true, yellow: true, red: true });
  });
});

describe('normalizeSettings', () => {
  it('fills defaults for empty input', () => {
    const out = normalizeSettings(null);
    assert.equal(out.greenMaxMs, 300);
    assert.equal(out.colors.red, DEFAULT_SETTINGS.colors.red);
  });

  it('rejects inverted thresholds and keeps green strictly below yellow', () => {
    const out = normalizeSettings({ greenMaxMs: 800, yellowMaxMs: 200 });
    assert.equal(out.greenMaxMs < out.yellowMaxMs, true);
    assert.equal(out.greenMaxMs, 200);
    assert.equal(out.yellowMaxMs, 800);
  });

  it('reports invalid option form input without mutating defaults', () => {
    const { validateOptionsInput } = require('../lib/settings.js');
    assert.equal(validateOptionsInput(NaN, 500).error.includes('gültig'), true);
    assert.equal(validateOptionsInput(800, 200).error.includes('kleiner'), true);
    assert.equal(validateOptionsInput(-1, 500).error.includes('600000'), true);
    assert.equal(validateOptionsInput(300, 500).error, undefined);
  });

  it('clamps durations to 0..600000 and requires #RRGGBB colors', () => {
    const out = normalizeSettings({
      greenMaxMs: -10,
      yellowMaxMs: 999999,
      colors: { green: 'green', yellow: '#ff0', red: '#00FF00' }
    });
    assert.equal(out.greenMaxMs, 0);
    assert.equal(out.yellowMaxMs, 600000);
    assert.equal(out.colors.green, DEFAULT_SETTINGS.colors.green);
    assert.equal(out.colors.yellow, DEFAULT_SETTINGS.colors.yellow);
    assert.equal(out.colors.red, '#00ff00');
  });
});
