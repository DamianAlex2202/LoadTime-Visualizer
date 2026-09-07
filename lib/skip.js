(function (root) {
  'use strict';

  const HOST_ID = 'loadtime-overlay-host';
  const SKIP_TAGS = Object.freeze({
    SCRIPT: true,
    STYLE: true,
    LINK: true,
    META: true,
    HEAD: true,
    NOSCRIPT: true,
    TEMPLATE: true,
    BR: true,
    WBR: true,
    HTML: true
  });

  function isSkippable(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.id === HOST_ID) return true;
    if (SKIP_TAGS[el.tagName]) return true;
    return false;
  }

  const api = { HOST_ID, SKIP_TAGS, isSkippable };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
