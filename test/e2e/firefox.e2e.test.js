'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { packExtension } = require('../../scripts/pack-extension.js');
const { startDemoServer, getFreePort } = require('./helpers/demo-server.js');
const { loadFirefoxAddon } = require('./helpers/firefox-addon.js');
const { runOverlayScenarios } = require('./helpers/overlay-scenarios.js');

const rootDir = path.join(__dirname, '..', '..');
const GECKO_ID = 'loadtime-visualizer@damianalex2202';

function firefoxPrefs() {
  return {
    'devtools.debugger.remote-enabled': true,
    'devtools.debugger.prompt-connection': false,
    'xpinstall.signatures.required': false,
    'extensions.autoDisableScopes': 0,
    'extensions.enabledScopes': 15,
    'extensions.webextensions.restrictedDomains': ''
  };
}

function readMozExtensionOrigin(userDataDir, addonId) {
  const prefsPath = path.join(userDataDir, 'prefs.js');
  if (!fs.existsSync(prefsPath)) return null;
  const text = fs.readFileSync(prefsPath, 'utf8');
  const match = text.match(/user_pref\("extensions\.webextensions\.uuids",\s*("(?:\\.|[^"\\])*")\s*\);/);
  if (!match) return null;
  const map = JSON.parse(JSON.parse(match[1]));
  const uuid = map[addonId];
  return uuid ? 'moz-extension://' + uuid : null;
}

async function waitForMozExtensionOrigin(userDataDir, addonId, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const origin = readMozExtensionOrigin(userDataDir, addonId);
    if (origin) return origin;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Could not resolve moz-extension UUID from prefs.js');
}

describe('Firefox E2E', { timeout: 120000 }, () => {
  let firefox;
  let demo;
  let firefoxDir;
  let tmp;

  before(async () => {
    ({ firefox } = require('playwright'));
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loadtime-firefox-'));
    firefoxDir = packExtension({ rootDir, outDir: path.join(tmp, 'dist') }).firefoxDir;
    demo = await startDemoServer(rootDir);
  });

  after(async () => {
    if (demo) await demo.stop();
  });

  it('toggles overlay, filters, JS insert, and Datastar on the demo page', async () => {
    const rdpPort = await getFreePort();
    const userDataDir = fs.mkdtempSync(path.join(tmp, 'profile-'));
    const context = await firefox.launchPersistentContext(userDataDir, {
      headless: true,
      args: ['-start-debugger-server', String(rdpPort)],
      firefoxUserPrefs: firefoxPrefs()
    });
    try {
      await loadFirefoxAddon(rdpPort, '127.0.0.1', firefoxDir, 20000);
      const page = context.pages()[0] || (await context.newPage());
      await runOverlayScenarios(page, demo.url);
    } finally {
      await context.close();
    }
  });

  it('installs the unpacked Firefox addon with a stable gecko id', async () => {
    const rdpPort = await getFreePort();
    const userDataDir = fs.mkdtempSync(path.join(tmp, 'profile-opt-'));
    const context = await firefox.launchPersistentContext(userDataDir, {
      headless: true,
      args: ['-start-debugger-server', String(rdpPort)],
      firefoxUserPrefs: firefoxPrefs()
    });
    try {
      const addon = await loadFirefoxAddon(rdpPort, '127.0.0.1', firefoxDir, 20000);
      assert.equal(addon.id, GECKO_ID);
      const origin = await waitForMozExtensionOrigin(userDataDir, GECKO_ID, 8000);
      assert.match(origin, /^moz-extension:\/\/[0-9a-f-]{36}$/i);
    } finally {
      await context.close();
    }
  });
});
