# LoadTime Overlay

Chrome-Extension: Overlay mit Ladezeiten pro Element (HTML, JavaScript, Datastar).

## Installation

1. Chrome öffnen: `chrome://extensions`
2. **Entwicklermodus** einschalten
3. **Entpackte Erweiterung laden** und diesen Ordner wählen:
   `C:\Users\49163\Desktop\Browser Plugin`
4. Hotkey prüfen unter `chrome://extensions/shortcuts`  
   Standard: **Ctrl+Shift+L** (macOS: Command+Shift+L)

## Demo

Im Ordner der Extension:

```bash
npm run demo
```

Dann [http://127.0.0.1:4173/](http://127.0.0.1:4173/) öffnen und den Hotkey drücken.

- Langsames Bild (`/slow.svg`, ~750ms) → rot
- Statischer Text → grün
- JS-Button fügt nach 280ms ein Element ein
- Datastar: `@get('/cart')` (~420ms) oder „Events simulieren“ (~410ms) → gelb

Filter **Grün / Gelb / Rot** sitzen in der dunklen Leiste oben links.

## Optionen

Auf der Extension-Karte **Details → Erweiterungsoptionen**: Schwellen (Standard 300ms / 500ms) und Farben.

## Tests

```bash
npm test
```

## Security Notes

- Die Extension speichert nur Schwellen und Farben in `chrome.storage.sync`. Keine Seitendaten, keine Telemetrie.
- Content Scripts laufen in der isolated world; das Overlay liegt in einem geschlossenen Shadow DOM.
- Es gibt keine `eval`-Nutzung, kein Debugger-API, keine Host-Permissions über die deklarierten Content-Script-Matches (`http`/`https`) hinaus.
- Options-Eingaben: Zahlen 0–600000, `greenMaxMs < yellowMaxMs`, Farben nur `#RRGGBB`.
- Der Demo-Server bindet ausschließlich `127.0.0.1` und liefert nur Dateien aus `demo/`.
