(function (root) {
  'use strict';

  const SOURCE_RANK = Object.freeze({
    dom: 0,
    resource: 1,
    datastar: 2
  });

  function computeSubtreeMs(ownMs, childSubtreeMs) {
    let max = Number.isFinite(ownMs) ? ownMs : 0;
    if (!Array.isArray(childSubtreeMs)) return max;
    for (let i = 0; i < childSubtreeMs.length; i++) {
      const child = childSubtreeMs[i];
      if (Number.isFinite(child) && child > max) max = child;
    }
    return max;
  }

  function shouldReplaceSource(existing, incoming) {
    if (!incoming) return false;
    if (!existing) return true;
    const a = SOURCE_RANK[existing];
    const b = SOURCE_RANK[incoming];
    if (a == null || b == null) return incoming === existing;
    return b >= a;
  }

  const api = { SOURCE_RANK, computeSubtreeMs, shouldReplaceSource };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
