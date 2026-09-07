(function (root) {
  'use strict';

  function bandForDuration(ms, greenMaxMs, yellowMaxMs) {
    if (!Number.isFinite(ms) || ms < 0) return null;
    if (!Number.isFinite(greenMaxMs) || !Number.isFinite(yellowMaxMs)) return null;
    if (ms < greenMaxMs) return 'green';
    if (ms < yellowMaxMs) return 'yellow';
    return 'red';
  }

  function isBandVisible(band, filters) {
    if (!band || !filters || typeof filters !== 'object') return false;
    return filters[band] === true;
  }

  const api = { bandForDuration, isBandVisible };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
