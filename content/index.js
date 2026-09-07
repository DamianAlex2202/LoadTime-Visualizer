(function () {
  'use strict';

  const LT = globalThis.LoadTime;

  LT.measure.start();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get('loadtimeSettings', (data) => {
      if (chrome.runtime.lastError) return;
      LT.overlay.applySettings(data && data.loadtimeSettings);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' || !changes.loadtimeSettings) return;
      LT.overlay.applySettings(changes.loadtimeSettings.newValue);
    });
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!msg || msg.type !== 'LOADTIME_TOGGLE') return;
      LT.overlay.toggle();
      sendResponse({ ok: true, enabled: LT.overlay.isEnabled() });
    });
  }
})();
