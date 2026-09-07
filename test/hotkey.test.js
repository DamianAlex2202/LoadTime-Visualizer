const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isToggleHotkey } = require('../lib/hotkey.js');

describe('isToggleHotkey', () => {
  it('matches Ctrl+Shift+L and Meta+Shift+L', () => {
    assert.equal(isToggleHotkey({ key: 'l', ctrlKey: true, shiftKey: true, altKey: false }), true);
    assert.equal(isToggleHotkey({ key: 'L', metaKey: true, shiftKey: true, altKey: false }), true);
  });

  it('rejects other combinations', () => {
    assert.equal(isToggleHotkey({ key: 'l', ctrlKey: true, shiftKey: false, altKey: false }), false);
    assert.equal(isToggleHotkey({ key: 'k', ctrlKey: true, shiftKey: true, altKey: false }), false);
    assert.equal(isToggleHotkey({ key: 'l', ctrlKey: true, shiftKey: true, altKey: true }), false);
    assert.equal(isToggleHotkey(null), false);
  });
});
