(function (root) {
  'use strict';

  function isToggleHotkey(evt) {
    if (!evt) return false;
    const key = String(evt.key || '').toLowerCase();
    if (key !== 'l') return false;
    const ctrlOrMeta = !!(evt.ctrlKey || evt.metaKey);
    return ctrlOrMeta && !!evt.shiftKey && !evt.altKey;
  }

  const api = { isToggleHotkey };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
