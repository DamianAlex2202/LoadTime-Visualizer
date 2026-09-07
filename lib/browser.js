(function (root) {
  'use strict';

  function getExtensionApi(globalObj) {
    const g = globalObj || {};
    if (g.browser && g.browser.runtime) return g.browser;
    if (g.chrome && g.chrome.runtime) return g.chrome;
    return null;
  }

  function getStorageArea(api) {
    if (!api || !api.storage) return null;
    if (api.storage.sync) return api.storage.sync;
    if (api.storage.local) return api.storage.local;
    return null;
  }

  function lastRuntimeError(api) {
    if (api && api.runtime && api.runtime.lastError) return api.runtime.lastError;
    return null;
  }

  function storageGet(area, key) {
    return new Promise((resolve, reject) => {
      try {
        const out = area.get(key);
        if (out && typeof out.then === 'function') {
          out.then(resolve, reject);
          return;
        }
      } catch (err) {
        reject(err);
        return;
      }
      area.get(key, (data) => {
        const err = lastRuntimeError(getExtensionApi(globalThis));
        if (err) reject(new Error(err.message || String(err)));
        else resolve(data);
      });
    });
  }

  function storageSet(area, value) {
    return new Promise((resolve, reject) => {
      try {
        const out = area.set(value);
        if (out && typeof out.then === 'function') {
          out.then(resolve, reject);
          return;
        }
      } catch (err) {
        reject(err);
        return;
      }
      area.set(value, () => {
        const err = lastRuntimeError(getExtensionApi(globalThis));
        if (err) reject(new Error(err.message || String(err)));
        else resolve();
      });
    });
  }

  async function sendToggleToActiveTab(api) {
    if (!api || !api.tabs) return;
    try {
      const tabs = await Promise.resolve(api.tabs.query({ active: true, currentWindow: true }));
      const tab = Array.isArray(tabs) ? tabs[0] : null;
      if (!tab || tab.id == null) return;
      await Promise.resolve(api.tabs.sendMessage(tab.id, { type: 'LOADTIME_TOGGLE' }));
    } catch (err) {
      // pages without the content script (about:debugging, chrome://, etc.)
    }
  }

  const api = {
    getExtensionApi,
    getStorageArea,
    storageGet,
    storageSet,
    sendToggleToActiveTab
  };
  root.LoadTime = Object.assign(root.LoadTime || {}, api);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
