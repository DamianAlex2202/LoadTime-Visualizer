const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  isToggleHotkey,
  shouldBindPageHotkey,
  shouldAcceptToggle,
  isEditableTarget
} = require('../lib/hotkey.js');

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

describe('shouldBindPageHotkey', () => {
  it('skips the page listener when the browser command already has a shortcut', () => {
    assert.equal(
      shouldBindPageHotkey([{ name: 'toggle-overlay', shortcut: 'Ctrl+Shift+L' }], 'toggle-overlay'),
      false
    );
  });

  it('binds the page listener when the command is missing or unassigned', () => {
    assert.equal(shouldBindPageHotkey([], 'toggle-overlay'), true);
    assert.equal(shouldBindPageHotkey([{ name: 'toggle-overlay', shortcut: '' }], 'toggle-overlay'), true);
    assert.equal(shouldBindPageHotkey(null, 'toggle-overlay'), true);
  });
});

describe('shouldAcceptToggle', () => {
  it('rejects a second toggle inside the debounce window', () => {
    assert.equal(shouldAcceptToggle(100, undefined, 80), true);
    assert.equal(shouldAcceptToggle(150, 100, 80), false);
    assert.equal(shouldAcceptToggle(181, 100, 80), true);
  });
});

describe('isEditableTarget', () => {
  it('ignores typing in inputs and contenteditable nodes', () => {
    assert.equal(isEditableTarget({ nodeType: 1, tagName: 'INPUT', isContentEditable: false }), true);
    assert.equal(isEditableTarget({ nodeType: 1, tagName: 'DIV', isContentEditable: true }), true);
    assert.equal(isEditableTarget({ nodeType: 1, tagName: 'BUTTON', isContentEditable: false }), false);
  });
});
