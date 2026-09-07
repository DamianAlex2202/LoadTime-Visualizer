(function () {
  'use strict';

  const LT = globalThis.LoadTime;
  const HOST_ID = 'loadtime-overlay-host';

  let enabled = false;
  let host = null;
  let shadow = null;
  let toolbar = null;
  let stage = null;
  let raf = 0;
  let settings = LT.normalizeSettings(LT.DEFAULT_SETTINGS);
  const strips = new Map();

  const STYLE = `
    :host { display: block; }
    * { box-sizing: border-box; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    #toolbar {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 2147483647;
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 6px 8px;
      background: #111;
      color: #eee;
      font-size: 11px;
      border-radius: 6px;
      pointer-events: auto;
      box-shadow: 0 2px 10px rgba(0,0,0,.35);
    }
    #toolbar .brand { font-weight: 700; letter-spacing: 0.02em; margin-right: 4px; }
    .chip {
      border: 0;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
    }
    .chip[data-band="green"] { background: var(--green); }
    .chip[data-band="yellow"] { background: var(--yellow); color: #111; }
    .chip[data-band="red"] { background: var(--red); }
    .chip.off { background: #333 !important; color: #999 !important; text-decoration: line-through; }
    .strip {
      position: fixed;
      z-index: 2147483646;
      height: 16px;
      line-height: 16px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      padding: 0 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      outline: 2px solid currentColor;
      outline-offset: 0;
    }
  `;

  function applyCssVars() {
    if (!host) return;
    host.style.setProperty('--green', settings.colors.green);
    host.style.setProperty('--yellow', settings.colors.yellow);
    host.style.setProperty('--red', settings.colors.red);
    if (shadow) {
      shadow.host.style.setProperty('--green', settings.colors.green);
      shadow.host.style.setProperty('--yellow', settings.colors.yellow);
      shadow.host.style.setProperty('--red', settings.colors.red);
    }
  }

  function ensureHost() {
    if (host && shadow) {
      if (!host.isConnected && document.documentElement) {
        document.documentElement.appendChild(host);
      }
      return;
    }
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-loadtime-host', '1');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
    const root = document.documentElement;
    if (root) root.appendChild(host);
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    toolbar = document.createElement('div');
    toolbar.id = 'toolbar';
    toolbar.innerHTML =
      '<span class="brand">LoadTime</span>' +
      '<button type="button" class="chip" data-band="green">Grün</button>' +
      '<button type="button" class="chip" data-band="yellow">Gelb</button>' +
      '<button type="button" class="chip" data-band="red">Rot</button>';
    stage = document.createElement('div');
    stage.id = 'stage';
    shadow.appendChild(style);
    shadow.appendChild(toolbar);
    shadow.appendChild(stage);
    toolbar.addEventListener('click', onToolbarClick);
    applyCssVars();
    syncChips();
  }

  function onToolbarClick(evt) {
    const btn = evt.target.closest('[data-band]');
    if (!btn) return;
    const band = btn.getAttribute('data-band');
    settings.filters[band] = !settings.filters[band];
    syncChips();
    schedule();
  }

  function syncChips() {
    if (!toolbar) return;
    const chips = toolbar.querySelectorAll('.chip');
    for (let i = 0; i < chips.length; i++) {
      const band = chips[i].getAttribute('data-band');
      chips[i].classList.toggle('off', settings.filters[band] !== true);
      if (settings.filters[band] === true) {
        chips[i].style.background = settings.colors[band];
        chips[i].style.color = band === 'yellow' ? '#111' : '#fff';
      } else {
        chips[i].style.background = '#333';
        chips[i].style.color = '#999';
      }
    }
  }

  function depthOf(el) {
    let d = 0;
    let n = el;
    while (n && n.parentElement) {
      d += 1;
      n = n.parentElement;
    }
    return d;
  }

  function inViewport(rect) {
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function render() {
    if (!enabled) return;
    ensureHost();
    applyCssVars();
    const seen = new Set();
    const tracked = LT.measure.trackedElements();
    tracked.forEach((el) => {
      if (!el || !el.isConnected) {
        const stale = strips.get(el);
        if (stale) stale.remove();
        strips.delete(el);
        return;
      }
      const rec = LT.measure.getRecord(el);
      if (!rec) return;
      const ms = rec.subtreeMs;
      const band = LT.bandForDuration(ms, settings.greenMaxMs, settings.yellowMaxMs);
      if (!LT.isBandVisible(band, settings.filters)) {
        const hidden = strips.get(el);
        if (hidden) hidden.remove();
        strips.delete(el);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || !inViewport(rect)) {
        const hidden = strips.get(el);
        if (hidden) hidden.remove();
        strips.delete(el);
        return;
      }
      seen.add(el);
      let strip = strips.get(el);
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'strip';
        stage.appendChild(strip);
        strips.set(el, strip);
      }
      const color = settings.colors[band];
      const text = LT.formatLabel(rec.name, ms);
      strip.textContent = text;
      strip.title = text + ' (' + rec.source + ')';
      strip.style.background = color;
      strip.style.color = band === 'yellow' ? '#111' : '#fff';
      strip.style.outlineColor = color;
      strip.style.left = Math.round(rect.left) + 'px';
      strip.style.top = Math.round(rect.top) + 'px';
      strip.style.width = Math.max(24, Math.round(rect.width)) + 'px';
      strip.style.zIndex = String(2147483000 + depthOf(el));
    });
    strips.forEach((strip, el) => {
      if (!seen.has(el)) {
        strip.remove();
        strips.delete(el);
      }
    });
  }

  function schedule() {
    if (!enabled) return;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  }

  function onScrollOrResize() {
    schedule();
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (enabled) {
      ensureHost();
      host.style.display = 'block';
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize, true);
      schedule();
    } else {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
      if (host) host.style.display = 'none';
      strips.forEach((strip) => strip.remove());
      strips.clear();
    }
  }

  LT.overlay = {
    toggle: function () {
      setEnabled(!enabled);
    },
    applySettings: function (next) {
      const normalized = LT.normalizeSettings(next);
      normalized.filters = settings.filters;
      settings = normalized;
      applyCssVars();
      syncChips();
      schedule();
    },
    schedule,
    isEnabled: function () {
      return enabled;
    }
  };
})();
