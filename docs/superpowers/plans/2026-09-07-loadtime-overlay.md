# LoadTime Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Chrome MV3 extension that overlays per-element load/appear times (HTML, JS, Datastar) with a hotkey, color bands, and an options page.

**Architecture:** Content scripts at `document_start` record timings into `globalThis.LoadTime`; a closed Shadow DOM overlay renders label strips; a service worker toggles via `Ctrl+Shift+L`; options persist thresholds in `chrome.storage.sync`. Pure logic in `lib/` is unit-tested with `node --test`.

**Tech Stack:** Chrome Manifest V3, vanilla JS, Node.js built-in test runner, no bundler.

## Global Constraints

- Chrome only, Manifest V3
- Hotkey Ctrl+Shift+L (Command+Shift+L on macOS)
- Default bands: green `< 300ms`, yellow `< 500ms`, red `≥ 500ms`
- Label format: `name · 320ms` on a top strip
- Filter toolbar Grün/Gelb/Rot, all on by default
- Parents show max subtree time
- Live updates; measure even while overlay is off
- Permission: `storage` only
- No Firefox, no HAR export, no build step

---

### Task 1: Testable timing/color/label helpers

**Files:**
- Create: `lib/color.js`
- Create: `lib/label.js`
- Create: `lib/timing.js`
- Create: `lib/settings.js`
- Create: `test/color.test.js`
- Create: `test/label.test.js`
- Create: `test/timing.test.js`
- Create: `test/settings.test.js`
- Create: `package.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: `bandForDuration(ms, greenMaxMs, yellowMaxMs) → 'green'|'yellow'|'red'|null`
- Produces: `isBandVisible(band, filters) → boolean`
- Produces: `formatLabel(name, ms) → string`
- Produces: `nameFromUrl(url) → string`
- Produces: `nameFromElement(el) → string`
- Produces: `computeSubtreeMs(ownMs, childSubtreeMs) → number`
- Produces: `DEFAULT_SETTINGS`, `normalizeSettings(raw) → settings`

- [x] Write failing tests, then implement UMD-lite libs, then `node --test`

---

### Task 2: Chrome extension shell + measurement + overlay + options

**Files:**
- Create: `manifest.json`
- Create: `background.js`
- Create: `content/measure.js`
- Create: `content/overlay.js`
- Create: `content/index.js`
- Create: `options/options.html`
- Create: `options/options.js`
- Create: `options/options.css`

**Interfaces:**
- Consumes: `LoadTime.*` from Task 1
- Produces: `LoadTime.measure.start()`
- Produces: `LoadTime.overlay.toggle()` / `applySettings(settings)`
- Message: `{ type: 'LOADTIME_TOGGLE' }`

- [x] Implement MV3 wiring per spec

---

### Task 3: Demo page for HTML, JS, and Datastar

**Files:**
- Create: `demo/index.html`
- Create: `demo/server.mjs`
- Create: `README.md`

- [x] Local server on 127.0.0.1 with delayed image + Datastar fragment
