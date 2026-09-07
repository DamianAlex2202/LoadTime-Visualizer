(function () {
  'use strict';

  const LT = globalThis.LoadTime;
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
    if (!Number.isFinite(greenMaxMs) || !Number.isFinite(yellowMaxMs)) {
      return { error: 'Bitte gültige Millisekunden eingeben.' };
    }
    if (greenMaxMs < 0 || yellowMaxMs < 0 || greenMaxMs > 600000 || yellowMaxMs > 600000) {
      return { error: 'Schwellen müssen zwischen 0 und 600000 ms liegen.' };
    }
    if (greenMaxMs >= yellowMaxMs) {
      return { error: 'Grün muss kleiner als Gelb sein.' };
    }
    const colors = {
      green: document.getElementById('colorGreen').value,
      yellow: document.getElementById('colorYellow').value,
      red: document.getElementById('colorRed').value
    };
    return {
      settings: LT.normalizeSettings({ greenMaxMs, yellowMaxMs, colors })
    };
  }

  chrome.storage.sync.get('loadtimeSettings', (data) => {
    if (chrome.runtime.lastError) {
      showError('Einstellungen konnten nicht gelesen werden.');
      fill(LT.normalizeSettings(null));
      return;
    }
    fill(LT.normalizeSettings(data && data.loadtimeSettings));
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const result = readForm();
    if (result.error) {
      showError(result.error);
      return;
    }
    chrome.storage.sync.set({ loadtimeSettings: result.settings }, () => {
      if (chrome.runtime.lastError) {
        showError('Speichern fehlgeschlagen.');
        return;
      }
      fill(result.settings);
      showStatus('Gespeichert.');
    });
  });
})();
