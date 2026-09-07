(function () {
  'use strict';

  const LT = globalThis.LoadTime;
  LT.measure.start();

  const ext = LT.getExtensionApi(globalThis);

  async function loadSettings() {
    const area = LT.getStorageArea(ext);
    if (!area) return;
    try {
      const data = await LT.storageGet(area, 'loadtimeSettings');
      LT.overlay.applySettings(data && data.loadtimeSettings);
    } catch (err) {
      // keep defaults
    }
  }

  if (ext) {
    loadSettings();
    if (ext.storage && ext.storage.onChanged) {
      ext.storage.onChanged.addListener((changes, areaName) => {
        if (!changes.loadtimeSettings) return;
        if (areaName !== 'sync' && areaName !== 'local') return;
        LT.overlay.applySettings(changes.loadtimeSettings.newValue);
      });
    }
    if (ext.runtime && ext.runtime.onMessage) {
      ext.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (!msg || msg.type !== 'LOADTIME_TOGGLE') return;
        LT.overlay.toggle();
        sendResponse({ ok: true, enabled: LT.overlay.isEnabled() });
      });
    }
  }

  window.addEventListener(
    'keydown',
    (evt) => {
      if (!LT.isToggleHotkey(evt)) return;
      evt.preventDefault();
      LT.overlay.toggle();
    },
    true
  );
})();
