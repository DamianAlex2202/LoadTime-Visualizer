(function () {
  'use strict';

  const LT = globalThis.LoadTime;
  const ext = LT.getExtensionApi(globalThis);
  const area = LT.getStorageArea(ext);
  const form = document.getElementById('form');
  const errorEl = document.getElementById('error');
  const statusEl = document.getElementById('status');

  function showError(msg) {
    errorEl.hidden = !msg;
    errorEl.textContent = msg || '';
    statusEl.hidden = true;
  }

  function showStatus(msg) {
    statusEl.hidden = !msg;
    statusEl.textContent = msg || '';
    errorEl.hidden = true;
  }

  function fill(settings) {
    document.getElementById('greenMaxMs').value = String(settings.greenMaxMs);
    document.getElementById('yellowMaxMs').value = String(settings.yellowMaxMs);
    document.getElementById('colorGreen').value = settings.colors.green;
    document.getElementById('colorYellow').value = settings.colors.yellow;
    document.getElementById('colorRed').value = settings.colors.red;
  }

  function readForm() {
    const greenMaxMs = Number(document.getElementById('greenMaxMs').value);
    const yellowMaxMs = Number(document.getElementById('yellowMaxMs').value);
    const invalid = LT.validateOptionsInput(greenMaxMs, yellowMaxMs);
    if (invalid.error) return invalid;
    const colors = {
      green: document.getElementById('colorGreen').value,
      yellow: document.getElementById('colorYellow').value,
      red: document.getElementById('colorRed').value
    };
    return {
      settings: LT.normalizeSettings({ greenMaxMs, yellowMaxMs, colors })
    };
  }

  fill(LT.normalizeSettings(null));

  if (area) {
    LT.storageGet(area, 'loadtimeSettings')
      .then((data) => {
        fill(LT.normalizeSettings(data && data.loadtimeSettings));
      })
      .catch(() => {
        showError('Einstellungen konnten nicht gelesen werden.');
      });
  }

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const result = readForm();
    if (result.error) {
      showError(result.error);
      return;
    }
    if (!area) {
      showError('Speichern fehlgeschlagen.');
      return;
    }
    LT.storageSet(area, { loadtimeSettings: result.settings })
      .then(() => {
        fill(result.settings);
        showStatus('Gespeichert.');
      })
      .catch(() => {
        showError('Speichern fehlgeschlagen.');
      });
  });
})();
