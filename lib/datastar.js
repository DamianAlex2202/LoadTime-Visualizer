(function (root) {
  'use strict';

  const END_TYPES = {
    finished: true,
    error: true,
    'retries-failed': true
  };

  function classifyDatastarFetch(detail) {
    const type = detail && detail.type;
    if (type === 'started') return { phase: 'start' };
    if (END_TYPES[type]) return { phase: 'end' };
    return { phase: 'other' };
  }

  function datastarAppear(now, state) {
    const inflight = state && state.inflight;
    const batchStart = state && state.batchStart;
    if (inflight > 0 && batchStart > 0) {
      return { ownMs: Math.max(0, now - batchStart), source: 'datastar' };
    }
    return { ownMs: now, source: 'dom' };
  }

  const api = { classifyDatastarFetch, datastarAppear };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
