(function (root) {
  'use strict';

  const SOURCE_TAG = Object.freeze({
    resource: 'net',
    datastar: 'ds',
    dom: 'dom'
  });

  function formatLabel(name, ms, source) {
    const trimmed = name == null ? '' : String(name).trim();
    const labelName = trimmed || 'element';
    const t = Math.max(0, Math.round(Number(ms) || 0));
    const base = labelName + ' · ' + t + 'ms';
    const tag = SOURCE_TAG[source];
    return tag ? base + ' · ' + tag : base;
  }

  function nameFromUrl(url) {
    if (!url) return '(resource)';
    try {
      const u = new URL(String(url), 'https://example.invalid');
      const segs = u.pathname.split('/').filter(Boolean);
      const last = segs[segs.length - 1];
      if (last) return decodeURIComponent(last);
      return u.hostname || String(url);
    } catch (err) {
      return String(url);
    }
  }

  function firstClassName(el) {
    const raw = el.className;
    if (!raw) return '';
    if (typeof raw === 'string') return raw.trim().split(/\s+/)[0] || '';
    if (typeof raw.baseVal === 'string') return raw.baseVal.trim().split(/\s+/)[0] || '';
    return '';
  }

  function nameFromElement(el) {
    if (!el || el.nodeType !== 1) return 'element';
    if (el.id) return '#' + el.id;
    const tag = String(el.tagName || 'element').toLowerCase();
    const cls = firstClassName(el);
    if (cls) return tag + '.' + cls;
    return tag;
  }

  const api = { formatLabel, nameFromUrl, nameFromElement };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
