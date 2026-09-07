const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { bandForDuration, isBandVisible } = require('../lib/color.js');

describe('bandForDuration', () => {
  it('returns green below 300ms', () => {
    assert.equal(bandForDuration(0, 300, 500), 'green');
    assert.equal(bandForDuration(299, 300, 500), 'green');
  });

  it('returns yellow from greenMax inclusive until yellowMax', () => {
    assert.equal(bandForDuration(300, 300, 500), 'yellow');
    assert.equal(bandForDuration(499, 300, 500), 'yellow');
  });

  it('returns red at and above yellowMax', () => {
    assert.equal(bandForDuration(500, 300, 500), 'red');
    assert.equal(bandForDuration(1200, 300, 500), 'red');
  });

  it('returns null for non-finite or negative values', () => {
    assert.equal(bandForDuration(NaN, 300, 500), null);
    assert.equal(bandForDuration(-1, 300, 500), null);
    assert.equal(bandForDuration(undefined, 300, 500), null);
  });
});

describe('isBandVisible', () => {
  const filters = { green: false, yellow: true, red: true };

  it('hides disabled bands', () => {
    assert.equal(isBandVisible('green', filters), false);
    assert.equal(isBandVisible('yellow', filters), true);
  });

  it('hides unknown or missing bands', () => {
    assert.equal(isBandVisible(null, filters), false);
    assert.equal(isBandVisible('blue', filters), false);
  });
});
