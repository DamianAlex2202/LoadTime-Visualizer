(function () {
  'use strict';

  const LT = globalThis.LoadTime;

  const records = new WeakMap();
  const tracked = new Set();
  const pendingDatastar = new WeakMap();
  let inflightDatastar = 0;
  let datastarBatchStart = 0;
  let domBatchStart = 0;
  let started = false;

  function isSkippable(el) {
    return LT.isSkippable(el);
  }

  function childSubtreeTimes(el) {
    const out = [];
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const rec = records.get(children[i]);
      if (rec && Number.isFinite(rec.subtreeMs)) out.push(rec.subtreeMs);
    }
    return out;
  }

  function notify() {
    if (LT.overlay && typeof LT.overlay.schedule === 'function') {
      LT.overlay.schedule();
    }
  }

  function bubble(fromEl) {
    let node = fromEl;
    while (node && node.nodeType === 1 && node.tagName !== 'HTML') {
      if (!isSkippable(node) || node.tagName === 'BODY') {
        const rec = records.get(node) || {
          ownMs: 0,
          name: LT.nameFromElement(node),
          source: 'dom',
          url: '',
          subtreeMs: 0
        };
        rec.subtreeMs = LT.computeSubtreeMs(rec.ownMs, childSubtreeTimes(node));
        records.set(node, rec);
        tracked.add(node);
      }
      node = node.parentElement;
    }
    notify();
  }

  function setOwn(el, info) {
    if (!el || (isSkippable(el) && el.tagName !== 'BODY')) return;
    const incoming = info.source || 'dom';
    const prev = records.get(el);
    if (prev && !LT.shouldReplaceSource(prev.source, incoming)) return;
    const name = info.name || (info.url ? LT.nameFromUrl(info.url) : LT.nameFromElement(el));
    const ownMs = Number.isFinite(info.ownMs) ? Math.max(0, info.ownMs) : 0;
    records.set(el, {
      ownMs,
      name,
      source: incoming,
      url: info.url || (prev && prev.url) || '',
      subtreeMs: ownMs
    });
    tracked.add(el);
    bubble(el);
  }

  function walkElements(node, fn) {
    if (!node) return;
    if (node.nodeType === 1) {
      fn(node);
      const children = node.children;
      for (let i = 0; i < children.length; i++) walkElements(children[i], fn);
      return;
    }
    if (node.nodeType === 11 || node.nodeType === 9) {
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) walkElements(children[i], fn);
    }
  }

  function untrackTree(node) {
    walkElements(node, (el) => {
      tracked.delete(el);
    });
    notify();
  }

  function appearMsAndSource() {
    const now = performance.now();
    if (inflightDatastar === 0 && document.readyState !== 'loading' && !domBatchStart) {
      domBatchStart = now;
      queueMicrotask(() => {
        domBatchStart = 0;
      });
    }
    return LT.resolveAppear(now, {
      inflight: inflightDatastar,
      batchStart: datastarBatchStart,
      readyState: document.readyState,
      domBatchStart: domBatchStart || now
    });
  }

  function handleAdded(node) {
    walkElements(node, (el) => {
      if (isSkippable(el) && el.tagName !== 'BODY') return;
      const prev = records.get(el);
      const next = appearMsAndSource();
      if (prev && !LT.shouldReplaceSource(prev.source, next.source)) return;
      setOwn(el, {
        ownMs: next.ownMs,
        name: LT.nameFromElement(el),
        source: next.source
      });
    });
  }

  function resourceDuration(entry) {
    return LT.resourceDuration(entry);
  }

  function urlsOf(el) {
    return LT.urlsOf(el);
  }

  function absUrl(value) {
    return LT.absoluteUrl(value, location.href);
  }

  function findElementsForResourceUrl(url) {
    const matches = [];
    const nodes = document.querySelectorAll('img, image, script, link, video, audio, iframe, source, embed, object');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const candidates = urlsOf(el);
      for (let j = 0; j < candidates.length; j++) {
        if (absUrl(candidates[j]) === url) {
          matches.push(el);
          break;
        }
      }
    }
    return matches;
  }

  function applyResourceEntry(entry) {
    const ms = resourceDuration(entry);
    const els = findElementsForResourceUrl(entry.name);
    for (let i = 0; i < els.length; i++) {
      setOwn(els[i], {
        ownMs: ms,
        name: LT.nameFromUrl(entry.name),
        source: 'resource',
        url: entry.name
      });
    }
  }

  function onDatastarFetch(evt) {
    const detail = evt.detail || {};
    const phase = LT.classifyDatastarFetch(detail).phase;
    const target = evt.target instanceof Element ? evt.target : document.documentElement;
    if (phase === 'start') {
      const startedAt = performance.now();
      pendingDatastar.set(target, startedAt);
      inflightDatastar += 1;
      if (inflightDatastar === 1) datastarBatchStart = startedAt;
      return;
    }
    if (phase === 'end') {
      const start = pendingDatastar.get(target) || datastarBatchStart;
      const ms = Math.max(0, performance.now() - start);
      pendingDatastar.delete(target);
      inflightDatastar = Math.max(0, inflightDatastar - 1);
      if (inflightDatastar === 0) datastarBatchStart = 0;
      if (target && !isSkippable(target)) {
        setOwn(target, {
          ownMs: ms,
          name: LT.nameFromElement(target),
          source: 'datastar'
        });
      }
    }
  }

  function start() {
    if (started) return;
    started = true;

    if (document.documentElement) handleAdded(document.documentElement);

    const mo = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        for (let a = 0; a < m.addedNodes.length; a++) handleAdded(m.addedNodes[a]);
        for (let r = 0; r < m.removedNodes.length; r++) untrackTree(m.removedNodes[r]);
      }
    });
    mo.observe(document.documentElement || document, { childList: true, subtree: true });

    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = 0; i < entries.length; i++) applyResourceEntry(entries[i]);
      });
      po.observe({ type: 'resource', buffered: true });
    } catch (err) {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = 0; i < entries.length; i++) applyResourceEntry(entries[i]);
      });
      po.observe({ entryTypes: ['resource'] });
    }

    document.addEventListener('datastar-fetch', onDatastarFetch, true);

    document.addEventListener(
      'load',
      (evt) => {
        const el = evt.target;
        if (!(el instanceof Element)) return;
        const src = el.currentSrc || el.src || '';
        if (!src) return;
        const abs = absUrl(src);
        const entries = performance.getEntriesByName(abs, 'resource');
        if (entries.length) applyResourceEntry(entries[entries.length - 1]);
      },
      true
    );
  }

  LT.measure = {
    start,
    getRecord: function (el) {
      return records.get(el);
    },
    trackedElements: function () {
      return tracked;
    }
  };
})();
