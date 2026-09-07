(function (root) {
  'use strict';

  function resourceDuration(entry) {
    if (!entry || typeof entry !== 'object') return 0;
    if (Number.isFinite(entry.duration) && entry.duration > 0) return entry.duration;
    if (Number.isFinite(entry.responseEnd) && Number.isFinite(entry.startTime)) {
      const delta = entry.responseEnd - entry.startTime;
      if (delta > 0) return delta;
    }
    return 0;
  }

  function absoluteUrl(value, base) {
    try {
      return new URL(String(value), base).href;
    } catch (err) {
      return '';
    }
  }

  function urlsOf(el) {
    if (!el) return [];
    const out = [];
    if (el.currentSrc) out.push(el.currentSrc);
    if (el.src) out.push(el.src);
    if (el.href) out.push(el.href);
    if (typeof el.getAttribute === 'function') {
      const src = el.getAttribute('src');
      const href = el.getAttribute('href');
      if (src) out.push(src);
      if (href) out.push(href);
    }
    return out;
  }

  const api = { resourceDuration, absoluteUrl, urlsOf };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
