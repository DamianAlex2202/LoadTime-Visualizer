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

  function onPageHotkey(evt) {
    if (!LT.isToggleHotkey(evt)) return;
    if (LT.isEditableTarget(evt.target)) return;
    evt.preventDefault();
    LT.overlay.toggle();
  }

  function commandsGetAll(api) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (cmds) => {
        if (settled) return;
        settled = true;
        resolve(cmds);
      };
      try {
        const maybe = api.commands.getAll((cmds) => done(cmds));
        if (maybe && typeof maybe.then === 'function') maybe.then(done, () => done(null));
      } catch (err) {
        done(null);
      }
    });
  }

  function bindPageHotkeyFallback() {
    const attach = () => {
      window.addEventListener('keydown', onPageHotkey, true);
    };
    if (!ext || !ext.commands || typeof ext.commands.getAll !== 'function') {
      attach();
      return;
    }
    commandsGetAll(ext)
      .then((cmds) => {
        if (LT.shouldBindPageHotkey(cmds, 'toggle-overlay')) attach();
      })
      .catch(attach);
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

  bindPageHotkeyFallback();
})();
