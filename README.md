# LoadTime Overlay

Browser-Extension für **Chrome** und **Firefox**: Overlay mit Ladezeiten pro Element (HTML, JavaScript, Datastar).

## Installation

### Chrome / Chromium

1. `chrome://extensions` → Entwicklermodus an
2. **Entpackte Erweiterung laden** → diesen Ordner wählen (enthält `manifest.json`)
3. Hotkey unter `chrome://extensions/shortcuts` prüfen  
   Standard: **Ctrl+Shift+L** (macOS: Command+Shift+L)

### Firefox

1. `npm run pack` erzeugt `dist/firefox`
2. `about:debugging#/runtime/this-firefox` → **Temporäres Add-on laden**
3. `dist/firefox/manifest.json` wählen
4. Hotkey unter `about:addons` → Zahnrad → Erweiterungs-Tasten prüfen

Firefox-Add-ons sind nach einem Browser-Neustart wieder weg, solange sie nur temporär geladen sind.

## Demo

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

Chrome: Extension-Karte → **Erweiterungsoptionen**.  
Firefox: `about:addons` → LoadTime Overlay → Einstellungen.  
Schwellen Standard: 300ms / 500ms, Farben änderbar.

## Tests

Zuerst Playwright-Browser (einmalig):

```bash
npx playwright install chromium firefox
```

```bash
npm test            # Unit-Tests
npm run test:e2e    # E2E Chrome + Firefox + Demo-Server
npm run test:all    # beides
```

E2E lädt die Extension in Playwright-Chromium bzw. Playwright-Firefox, öffnet die Demo-Seite und prüft Overlay, Filter, JS-Insert und Datastar. Die Optionsseite wird in Chrome End-to-End geprüft; Firefox prüft zusätzlich, dass das temporäre Add-on mit Gecko-ID installiert wird.

## Security Notes

- Chrome: nur `storage`. Firefox zusätzlich `host_permissions` für `http`/`https`, damit Content Scripts injiziert werden.
- Isolated world; Overlay in einem offenen Shadow DOM (Seite kann das Overlay nicht per CSS umstylen).
- Kein `eval`, kein Debugger-API.
- Optionen: Zahlen 0–600000, Grün < Gelb, Farben nur `#RRGGBB`. Storage: `sync` falls vorhanden, sonst `local`.
- Demo-Server bindet ausschließlich `127.0.0.1` und liefert nur Dateien aus `demo/`.
