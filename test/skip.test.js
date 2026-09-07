const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { HOST_ID, SKIP_TAGS, isSkippable } = require('../lib/skip.js');

describe('isSkippable', () => {
  it('skips non-elements, overlay host, and measurement-noise tags', () => {
    assert.equal(isSkippable(null), true);
    assert.equal(isSkippable({ nodeType: 3 }), true);
    assert.equal(isSkippable({ nodeType: 1, id: HOST_ID, tagName: 'DIV' }), true);
    assert.equal(isSkippable({ nodeType: 1, id: '', tagName: 'SCRIPT' }), true);
    assert.equal(isSkippable({ nodeType: 1, id: '', tagName: 'HTML' }), true);
  });

  it('keeps visible content tags including BODY', () => {
    assert.equal(isSkippable({ nodeType: 1, id: '', tagName: 'DIV' }), false);
    assert.equal(isSkippable({ nodeType: 1, id: '', tagName: 'BODY' }), false);
    assert.equal(isSkippable({ nodeType: 1, id: '', tagName: 'IMG' }), false);
  });

  it('exports the skip tag set used by the content script', () => {
    assert.equal(SKIP_TAGS.SCRIPT, true);
    assert.equal(SKIP_TAGS.HEAD, true);
  });
});
