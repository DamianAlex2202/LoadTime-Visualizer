(function (root) {
  'use strict';

  const HEX = /^#[0-9A-Fa-f]{6}$/;
  const MAX_MS = 600000;

  const DEFAULT_SETTINGS = Object.freeze({
    greenMaxMs: 300,
    yellowMaxMs: 500,
    colors: Object.freeze({
      green: '#1f7a3a',
      yellow: '#c9a227',
      red: '#b42318'
    }),
    filters: Object.freeze({
      green: true,
      yellow: true,
      red: true
    })
  });

  function clampMs(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(MAX_MS, Math.max(0, Math.round(n)));
  }

  function normalizeColor(value, fallback) {
    if (typeof value === 'string' && HEX.test(value.trim())) {
      return '#' + value.trim().slice(1).toLowerCase();
    }
    return fallback;
  }

  function normalizeSettings(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let greenMaxMs = clampMs(src.greenMaxMs, DEFAULT_SETTINGS.greenMaxMs);
    let yellowMaxMs = clampMs(src.yellowMaxMs, DEFAULT_SETTINGS.yellowMaxMs);
    if (greenMaxMs >= yellowMaxMs) {
      const low = Math.min(greenMaxMs, yellowMaxMs);
      const high = Math.max(greenMaxMs, yellowMaxMs);
      if (low === high) {
        yellowMaxMs = Math.min(MAX_MS, low + 1);
        greenMaxMs = low;
      } else {
        greenMaxMs = low;
        yellowMaxMs = high;
      }
    }

    const colorsIn = src.colors && typeof src.colors === 'object' ? src.colors : {};
    const filtersIn = src.filters && typeof src.filters === 'object' ? src.filters : {};

    return {
      greenMaxMs,
      yellowMaxMs,
      colors: {
        green: normalizeColor(colorsIn.green, DEFAULT_SETTINGS.colors.green),
        yellow: normalizeColor(colorsIn.yellow, DEFAULT_SETTINGS.colors.yellow),
        red: normalizeColor(colorsIn.red, DEFAULT_SETTINGS.colors.red)
      },
      filters: {
        green: filtersIn.green !== false,
        yellow: filtersIn.yellow !== false,
        red: filtersIn.red !== false
      }
    };
  }

  function validateOptionsInput(greenMaxMs, yellowMaxMs) {
    if (!Number.isFinite(greenMaxMs) || !Number.isFinite(yellowMaxMs)) {
      return { error: 'Bitte gültige Millisekunden eingeben.' };
    }
    if (greenMaxMs < 0 || yellowMaxMs < 0 || greenMaxMs > MAX_MS || yellowMaxMs > MAX_MS) {
      return { error: 'Schwellen müssen zwischen 0 und 600000 ms liegen.' };
    }
    if (greenMaxMs >= yellowMaxMs) {
      return { error: 'Grün muss kleiner als Gelb sein.' };
    }
    return { ok: true };
  }

  const api = { DEFAULT_SETTINGS, normalizeSettings, validateOptionsInput };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
