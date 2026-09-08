(function (root) {
  'use strict';

  function isToggleHotkey(evt) {
    if (!evt) return false;
    const key = String(evt.key || '').toLowerCase();
    if (key !== 'l') return false;
    const ctrlOrMeta = !!(evt.ctrlKey || evt.metaKey);
    return ctrlOrMeta && !!evt.shiftKey && !evt.altKey;
  }

  function shouldBindPageHotkey(commands, commandName) {
    if (!Array.isArray(commands)) return true;
    const cmd = commands.find((c) => c && c.name === commandName);
    return !(cmd && String(cmd.shortcut || '').trim());
  }

  function shouldAcceptToggle(now, lastAt, minGapMs) {
    const gap = Number.isFinite(minGapMs) ? minGapMs : 80;
    if (!Number.isFinite(lastAt)) return true;
    return now - lastAt >= gap;
  }

  function isEditableTarget(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    const tag = String(el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  const api = { isToggleHotkey, shouldBindPageHotkey, shouldAcceptToggle, isEditableTarget };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
