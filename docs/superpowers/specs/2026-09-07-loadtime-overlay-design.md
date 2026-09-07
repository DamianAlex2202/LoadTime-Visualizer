# LoadTime Overlay — Design

Date: 2026-09-07

## Problem

Developers need to see how long individual page elements take to load or appear, including HTML, JavaScript-inserted nodes, and Datastar morphs — without opening DevTools.

## Product

A Chrome Manifest V3 extension. A hotkey toggles a page overlay. Each measured element gets a DevTools-style label strip at its top edge: `name · 320ms`, colored by configurable thresholds. Parents show the slowest descendant. The overlay updates live.

## Decisions

- **Measure (hybrid):** Resource Timing duration when a request maps to an element. Otherwise time-to-appear from navigation start. Datastar uses `datastar-fetch` start→finished (fallback: mutation of the target).
- **Who gets a strip:** Every visible element that has a measurement. Parents included; subtree time = max(own, children).
- **Look:** Label strip on the top edge (name + milliseconds). Filter toolbar: Grün / Gelb / Rot, all on by default.
- **Hotkey:** Ctrl+Shift+L (macOS: Command+Shift+L), changeable in `chrome://extensions/shortcuts`.
- **Settings:** Chrome options page. Default thresholds: green `< 300ms`, yellow `< 500ms`, red `≥ 500ms`. Colors configurable. Stored in `chrome.storage.sync`.
- **Live:** Overlay stays on and refreshes for new resources, JS inserts, and Datastar patches.
- **Not in v1:** Firefox, HAR export, waterfall panel, element picker, DevTools panel.

## Architecture

- Service worker: command → message to the active tab.
- Content scripts at `document_start` (isolated world): measure always; overlay only when toggled.
- Overlay in a closed Shadow DOM on `document.documentElement` so page CSS cannot restyle it.
- Shared logic in `lib/*.js` (UMD-lite: `module.exports` for Node tests, `globalThis.LoadTime` in the page).
- Options page reads/writes `chrome.storage.sync`.

## Measurement rules

1. **Resource:** `PerformanceObserver` (`resource`). Map `name` to `img`/`script`/`link`/`video`/`audio`/`iframe`/`source` via `src`/`href`. `ownMs = duration` (or `responseEnd - startTime` if duration is 0). Label name = filename from URL.
2. **DOM/JS:** `MutationObserver` on `documentElement`. First time an `Element` is seen, `ownMs = performance.now()` (ms since navigation). Name = `#id` or `tag.class` or tag.
3. **Datastar:** Capture-phase listener for `datastar-fetch`. `started` stores `performance.now()` on the event target; `finished`/`error` sets `ownMs` to the delta and `source = datastar`. Mutations during an in-flight fetch inherit that duration when they have no better resource timing. Name prefers `#id`.
4. **Priority if several apply:** `datastar` > `resource` > `dom` (do not overwrite a better source with a weaker one).
5. **Parents:** After any change, walk ancestors and set `subtreeMs = max(ownMs, child.subtreeMs)`.
6. **Skip:** `script`, `style`, `link`, `meta`, `head`, `html`, the overlay host, and non-elements.

## Overlay rules

- Strips use `subtreeMs` (not only own time).
- Band: `ms < greenMaxMs` → green; `ms < yellowMaxMs` → yellow; else red.
- Toolbar toggles bands; hidden bands remove strips.
- Position via `getBoundingClientRect` + scroll/resize/`requestAnimationFrame` batching.
- Only intersecting elements (IntersectionObserver).
- Truncated names; full `name · Nms` plus source in `title` (hover).
- Host `pointer-events: none`; toolbar `pointer-events: auto`.

## Permissions

- `storage` only.
- Content scripts declared for `http://*/*` and `https://*/*` (no extra `host_permissions`, no `tabs`, no debugger).

## Demo

A local page plus a tiny static server with delayed image and delayed Datastar-style HTML so HTML, JS, and Datastar can be checked by hand.

## Testing

Node `node:test` for pure functions (bands, labels, subtree max, settings normalize). Manual check of the demo with the unpacked extension.

## Security

- Isolated world + closed Shadow DOM.
- No `eval`, no page-script injection, no remote extension code.
- Options inputs: finite numbers in `[0, 600000]`, `greenMaxMs < yellowMaxMs`, colors must match `#RRGGBB`.
- Demo server binds `127.0.0.1` only.
